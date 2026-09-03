import { and, desc, eq, inArray } from "drizzle-orm"
import { db, schema } from "../db/index.js"

const shouldShowNameTag = (user: { nameTagEnabled: boolean; nameTagVisible: boolean }) =>
    user.nameTagEnabled && user.nameTagVisible

const getCoterieNickname = (user: { nickname: string | null; firstName: string | null; nameTagEnabled: boolean; nameTagVisible: boolean } | null | undefined) => {
    const nickname = user?.nickname?.trim()
    if (nickname) return nickname
    return user && shouldShowNameTag(user) ? user.firstName?.trim() || null : null
}

const withoutOwnerId = <T extends { ownerId: string }>(coterie: T) => {
    const { ownerId: _, ...safeCoterie } = coterie
    return safeCoterie
}

const parseCharacter = (character: typeof schema.characters.$inferSelect, currentUserId: string) => {
    const { userId, ...characterWithoutUserId } = character
    return { ...characterWithoutUserId, data: JSON.parse(character.data), ownedByCurrentUser: userId === currentUserId }
}

const getPlayerRoster = async (coterie: typeof schema.coteries.$inferSelect) => {
    const memberships = await db.query.coteriePlayerMemberships.findMany({
        where: eq(schema.coteriePlayerMemberships.coterieId, coterie.id),
        with: { user: true }
    })
    const roster: Array<{ membershipId: string | null; nickname: string | null; showNameTag: boolean; isOwner: boolean; joinedAt: Date }> = memberships.map((membership) => ({
        membershipId: membership.id,
        nickname: getCoterieNickname(membership.user),
        showNameTag: shouldShowNameTag(membership.user),
        isOwner: membership.userId === coterie.ownerId,
        joinedAt: membership.createdAt
    }))
    if (!memberships.some((membership) => membership.userId === coterie.ownerId)) {
        const owner = await db.query.users.findFirst({ where: eq(schema.users.id, coterie.ownerId) })
        roster.unshift({ membershipId: null, nickname: getCoterieNickname(owner), showNameTag: owner ? shouldShowNameTag(owner) : false, isOwner: true, joinedAt: coterie.createdAt })
    }
    return roster
}

export const getCoterieAccess = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({ where: eq(schema.coteries.id, coterieId) })
    if (!coterie) return null
    const isOwner = coterie.ownerId === userId
    const playerMembership = isOwner ? null : await db.query.coteriePlayerMemberships.findFirst({
        where: and(eq(schema.coteriePlayerMemberships.coterieId, coterieId), eq(schema.coteriePlayerMemberships.userId, userId))
    })
    return { coterie, isOwner, hasAccess: isOwner || !!playerMembership }
}

export const requireOwnedCoterie = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({ where: eq(schema.coteries.id, coterieId) })
    if (!coterie) return { coterie: null, errorCode: 404 as const, error: "Coterie not found" }
    if (coterie.ownerId !== userId) return { coterie, errorCode: 403 as const, error: "Forbidden: You can only manage your own coteries" }
    return { coterie, errorCode: null, error: null }
}

export const buildCoterieResponse = async (coterie: typeof schema.coteries.$inferSelect, userId: string, isOwner: boolean) => {
    const players = await getPlayerRoster(coterie)
    const characterMembers = await db.query.coterieMembers.findMany({
        where: eq(schema.coterieMembers.coterieId, coterie.id), with: { character: true }
    })
    const characterOwnerIds = Array.from(new Set(characterMembers.map((member) => member.character?.userId).filter((id): id is string => !!id)))
    const characterOwners = characterOwnerIds.length ? await db.select({ id: schema.users.id, nickname: schema.users.nickname, firstName: schema.users.firstName, nameTagEnabled: schema.users.nameTagEnabled, nameTagVisible: schema.users.nameTagVisible }).from(schema.users).where(inArray(schema.users.id, characterOwnerIds)) : []
    const identityByUserId = new Map(characterOwners.map((owner) => [owner.id, { nickname: getCoterieNickname(owner), showNameTag: shouldShowNameTag(owner) }]))
    return {
        ...withoutOwnerId(coterie), owned: isOwner, canEdit: isOwner, canManageInvites: isOwner, canManagePlayers: isOwner, playerCount: players.length,
        members: characterMembers.filter((member) => member.character).map((member) => ({
            id: member.id, characterId: member.characterId, createdAt: member.createdAt,
            playerNickname: identityByUserId.get(member.character!.userId)?.nickname ?? null,
            showPlayerNameTag: identityByUserId.get(member.character!.userId)?.showNameTag ?? false,
            character: parseCharacter(member.character!, userId)
        })),
        players: isOwner ? players : undefined
    }
}

export const parseCharacterVitals = (data: string) => {
    try {
        const character = JSON.parse(data) as { maxHealth?: unknown; willpower?: unknown; humanity?: unknown; ephemeral?: Record<string, unknown> }
        const maxHealth = typeof character.maxHealth === "number" ? character.maxHealth : null
        const willpower = typeof character.willpower === "number" ? character.willpower : null
        const humanity = typeof character.humanity === "number" ? character.humanity : null
        const ephemeral = character.ephemeral
        const superficialDamage = typeof ephemeral?.superficialDamage === "number" ? ephemeral.superficialDamage : null
        const aggravatedDamage = typeof ephemeral?.aggravatedDamage === "number" ? ephemeral.aggravatedDamage : null
        const hunger = typeof ephemeral?.hunger === "number" ? ephemeral.hunger : null
        const superficialWillpowerDamage = typeof ephemeral?.superficialWillpowerDamage === "number" ? ephemeral.superficialWillpowerDamage : null
        const aggravatedWillpowerDamage = typeof ephemeral?.aggravatedWillpowerDamage === "number" ? ephemeral.aggravatedWillpowerDamage : null
        const humanityStains = typeof ephemeral?.humanityStains === "number" ? ephemeral.humanityStains : null
        if (maxHealth === null || willpower === null || humanity === null || superficialDamage === null || aggravatedDamage === null || hunger === null || superficialWillpowerDamage === null || aggravatedWillpowerDamage === null || humanityStains === null) return null
        return { maxHealth, superficialDamage, aggravatedDamage, hunger, willpower, superficialWillpowerDamage, aggravatedWillpowerDamage, humanity, humanityStains, currentWillpower: Math.max(willpower - superficialWillpowerDamage - aggravatedWillpowerDamage, 0) }
    } catch { return null }
}
