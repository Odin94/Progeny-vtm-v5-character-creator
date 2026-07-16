import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { createHash } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"

const workosMock = vi.hoisted(() => ({
    user: {
        id: "coterie-owner",
        email: "coterie-owner@progeny.invalid",
        firstName: "Coterie",
        lastName: "Owner"
    }
}))

vi.mock("./config/workos.js", () => ({
    WORKOS_CLIENT_ID: "test-client-id",
    workos: {
        userManagement: {
            loadSealedSession: () => ({
                authenticate: async () => ({
                    authenticated: true,
                    user: workosMock.user
                }),
                refresh: async () => ({ authenticated: false })
            })
        }
    }
}))

const OWNER_ID = "coterie-owner"
const MEMBER_ID = "coterie-member"
const OTHER_ID = "coterie-other"
const NO_NICKNAME_ID = "coterie-no-nickname"
const COTERIE_ID = "test-coterie"
const OWNER_CHARACTER_ID = "owner-character"
const MEMBER_CHARACTER_ID = "member-character"
const OTHER_CHARACTER_ID = "other-character"
const TEST_USER_IDS = [OWNER_ID, MEMBER_ID, OTHER_ID, NO_NICKNAME_ID]

const csrfHeaders = {
    cookie: "wos-session=fake; csrf-token=test-csrf",
    "x-csrf-token": "test-csrf"
}

const setWorkosUser = (id: string) => {
    workosMock.user = {
        id,
        email: `${id}@progeny.invalid`,
        firstName: "Test",
        lastName: "User"
    }
}

const assertSafeTestDatabase = () => {
    if (process.env.NODE_ENV !== "test" || process.env.DATABASE_URL !== ":memory:") {
        throw new Error(
            "Refusing to run coterie tests outside NODE_ENV=test with DATABASE_URL=:memory:"
        )
    }
}

const createTables = async () => {
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS users (
            id text PRIMARY KEY NOT NULL,
            email text NOT NULL UNIQUE,
            first_name text,
            last_name text,
            nickname text UNIQUE,
            preferences text,
            is_superadmin integer DEFAULT false NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            updated_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS characters (
            id text PRIMARY KEY NOT NULL,
            user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            name text NOT NULL,
            data text NOT NULL,
            version integer DEFAULT 1 NOT NULL,
            character_version integer DEFAULT 0 NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            updated_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS coteries (
            id text PRIMARY KEY NOT NULL,
            name text NOT NULL,
            owner_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            updated_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS coterie_members (
            id text PRIMARY KEY NOT NULL,
            coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade,
            character_id text NOT NULL REFERENCES characters(id) ON DELETE cascade,
            created_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS coterie_player_memberships (
            id text PRIMARY KEY NOT NULL,
            coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade,
            user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            created_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS coterie_player_memberships_unique_idx
            ON coterie_player_memberships (coterie_id, user_id)`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS coterie_invites (
            id text PRIMARY KEY NOT NULL,
            coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade,
            token_hash text NOT NULL UNIQUE,
            created_by_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            expires_at integer NOT NULL,
            revoked_at integer
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS coterie_note_versions (
            id text PRIMARY KEY NOT NULL,
            coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade,
            user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            content text NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
}

const cleanup = async () => {
    await db
        .delete(schema.coterieNoteVersions)
        .where(eq(schema.coterieNoteVersions.coterieId, COTERIE_ID))
    await db.delete(schema.coterieInvites).where(eq(schema.coterieInvites.coterieId, COTERIE_ID))
    await db
        .delete(schema.coteriePlayerMemberships)
        .where(eq(schema.coteriePlayerMemberships.coterieId, COTERIE_ID))
    await db.delete(schema.coterieMembers).where(eq(schema.coterieMembers.coterieId, COTERIE_ID))
    await db.delete(schema.coteries).where(eq(schema.coteries.id, COTERIE_ID))

    for (const characterId of [OWNER_CHARACTER_ID, MEMBER_CHARACTER_ID, OTHER_CHARACTER_ID]) {
        await db.delete(schema.characters).where(eq(schema.characters.id, characterId))
    }

    for (const userId of TEST_USER_IDS) {
        await db.delete(schema.users).where(eq(schema.users.id, userId))
    }
}

const seedBaseData = async () => {
    await db.insert(schema.users).values([
        {
            id: OWNER_ID,
            email: `${OWNER_ID}@progeny.invalid`,
            nickname: "Owner"
        },
        {
            id: MEMBER_ID,
            email: `${MEMBER_ID}@progeny.invalid`,
            nickname: "Member"
        },
        {
            id: OTHER_ID,
            email: `${OTHER_ID}@progeny.invalid`,
            nickname: "Other"
        },
        {
            id: NO_NICKNAME_ID,
            email: `${NO_NICKNAME_ID}@progeny.invalid`
        }
    ])

    await db.insert(schema.characters).values([
        {
            id: OWNER_CHARACTER_ID,
            userId: OWNER_ID,
            name: "Owner Character",
            data: JSON.stringify({
                name: "Owner Character",
                player: "Owner",
                maxHealth: 7,
                willpower: 6,
                humanity: 7,
                ephemeral: {
                    superficialDamage: 2,
                    aggravatedDamage: 1,
                    hunger: 2,
                    superficialWillpowerDamage: 1,
                    aggravatedWillpowerDamage: 1,
                    humanityStains: 1
                }
            }),
            version: 1,
            characterVersion: 0
        },
        {
            id: MEMBER_CHARACTER_ID,
            userId: MEMBER_ID,
            name: "Member Character",
            data: JSON.stringify({
                name: "Member Character",
                player: "Character Sheet Player",
                maxHealth: 6,
                willpower: 5,
                humanity: 6,
                ephemeral: {
                    superficialDamage: 1,
                    aggravatedDamage: 0,
                    hunger: 3,
                    superficialWillpowerDamage: 1,
                    aggravatedWillpowerDamage: 0,
                    humanityStains: 2
                }
            }),
            version: 1,
            characterVersion: 0
        },
        {
            id: OTHER_CHARACTER_ID,
            userId: OTHER_ID,
            name: "Other Character",
            data: JSON.stringify({
                name: "Other Character",
                player: "Other",
                maxHealth: 5,
                willpower: 4,
                humanity: 5,
                ephemeral: {
                    superficialDamage: 0,
                    aggravatedDamage: 0,
                    hunger: 1,
                    superficialWillpowerDamage: 0,
                    aggravatedWillpowerDamage: 0,
                    humanityStains: 0
                }
            }),
            version: 1,
            characterVersion: 0
        }
    ])

    await db.insert(schema.coteries).values({
        id: COTERIE_ID,
        name: "Test Coterie",
        ownerId: OWNER_ID
    })

    await db.insert(schema.coteriePlayerMemberships).values({
        id: "owner-membership",
        coterieId: COTERIE_ID,
        userId: OWNER_ID
    })

    await db.insert(schema.coterieMembers).values({
        id: "owner-character-membership",
        coterieId: COTERIE_ID,
        characterId: OWNER_CHARACTER_ID
    })
}

const createInvite = async (app: Awaited<ReturnType<typeof buildApp>>) => {
    setWorkosUser(OWNER_ID)
    const response = await app.inject({
        method: "POST",
        url: `/coteries/${COTERIE_ID}/invites`,
        headers: csrfHeaders
    })

    expect(response.statusCode).toBe(201)

    const invite = response.json() as { id: string; token: string }
    expect(invite.token).toMatch(/^[A-Za-z0-9]{48}$/)
    return invite
}

describe("coterie invites and membership permissions", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        assertSafeTestDatabase()
        await createTables()
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await cleanup()
        await app.close()
    })

    beforeEach(async () => {
        setWorkosUser(OWNER_ID)
        await cleanup()
        await seedBaseData()
    })

    it("updates and shares lightweight live vitals with every coterie participant", async () => {
        const ownerVitalsResponse = await app.inject({
            method: "GET",
            url: "/coteries/vitals",
            headers: csrfHeaders
        })
        expect(ownerVitalsResponse.statusCode).toBe(200)
        expect(ownerVitalsResponse.json()).toEqual([
            expect.objectContaining({
                coterieId: COTERIE_ID,
                characterId: OWNER_CHARACTER_ID,
                maxHealth: 7,
                superficialDamage: 2,
                aggravatedDamage: 1,
                hunger: 2,
                currentWillpower: 4,
                willpower: 6,
                superficialWillpowerDamage: 1,
                aggravatedWillpowerDamage: 1,
                humanity: 7,
                humanityStains: 1
            })
        ])

        const updateResponse = await app.inject({
            method: "PATCH",
            url: `/characters/${OWNER_CHARACTER_ID}/vitals`,
            headers: csrfHeaders,
            payload: {
                maxHealth: 8,
                willpower: 7,
                humanity: 6,
                ephemeral: {
                    superficialDamage: 3,
                    aggravatedDamage: 2,
                    hunger: 4,
                    superficialWillpowerDamage: 2,
                    aggravatedWillpowerDamage: 1,
                    humanityStains: 3
                }
            }
        })
        expect(updateResponse.statusCode).toBe(200)
        expect(updateResponse.json().characterVersion).toBe(1)

        const refreshedOwnerVitalsResponse = await app.inject({
            method: "GET",
            url: "/coteries/vitals",
            headers: csrfHeaders
        })
        expect(refreshedOwnerVitalsResponse.json()).toEqual([
            expect.objectContaining({
                characterId: OWNER_CHARACTER_ID,
                maxHealth: 8,
                superficialDamage: 3,
                aggravatedDamage: 2,
                hunger: 4,
                currentWillpower: 4,
                willpower: 7,
                superficialWillpowerDamage: 2,
                aggravatedWillpowerDamage: 1,
                humanity: 6,
                humanityStains: 3,
                characterVersion: 1
            })
        ])

        const invite = await createInvite(app)
        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: invite.token }
        })
        expect(acceptResponse.statusCode).toBe(200)

        const addCharacterResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/characters`,
            headers: csrfHeaders,
            payload: { characterId: MEMBER_CHARACTER_ID }
        })
        expect(addCharacterResponse.statusCode).toBe(201)

        const memberVitalsResponse = await app.inject({
            method: "GET",
            url: "/coteries/vitals",
            headers: csrfHeaders
        })
        expect(memberVitalsResponse.statusCode).toBe(200)
        expect(
            (memberVitalsResponse.json() as Array<{ characterId: string }>).map(
                ({ characterId }) => characterId
            )
        ).toEqual(expect.arrayContaining([OWNER_CHARACTER_ID, MEMBER_CHARACTER_ID]))

        const forbiddenUpdateResponse = await app.inject({
            method: "PATCH",
            url: `/characters/${OWNER_CHARACTER_ID}/vitals`,
            headers: csrfHeaders,
            payload: {
                maxHealth: 6,
                willpower: 6,
                humanity: 6,
                ephemeral: {
                    superficialDamage: 0,
                    aggravatedDamage: 0,
                    hunger: 1,
                    superficialWillpowerDamage: 0,
                    aggravatedWillpowerDamage: 0,
                    humanityStains: 0
                }
            }
        })
        expect(forbiddenUpdateResponse.statusCode).toBe(403)

        setWorkosUser(OTHER_ID)
        const unrelatedUserResponse = await app.inject({
            method: "GET",
            url: "/coteries/vitals",
            headers: csrfHeaders
        })
        expect(unrelatedUserResponse.statusCode).toBe(200)
        expect(unrelatedUserResponse.json()).toEqual([])
    })

    it("lists newest invite links first with stable same-second ordering", async () => {
        const olderInvite = await createInvite(app)
        const newerInvite = await createInvite(app)
        const sharedCreatedAt = new Date("2026-01-01T00:00:00.000Z")

        await db
            .update(schema.coterieInvites)
            .set({
                createdAt: sharedCreatedAt,
                expiresAt: new Date("2099-01-31T00:00:00.000Z")
            })
            .where(eq(schema.coterieInvites.id, olderInvite.id))

        await db
            .update(schema.coterieInvites)
            .set({
                createdAt: sharedCreatedAt,
                expiresAt: new Date("2099-02-01T00:00:00.000Z")
            })
            .where(eq(schema.coterieInvites.id, newerInvite.id))

        const response = await app.inject({
            method: "GET",
            url: `/coteries/${COTERIE_ID}/invites`,
            headers: csrfHeaders
        })

        expect(response.statusCode).toBe(200)
        const invites = response.json() as Array<{ id: string }>
        expect(invites.map((invite) => invite.id)).toEqual([newerInvite.id, olderInvite.id])
    })

    it("keeps the deprecated path-token invite endpoint compatible", async () => {
        const invite = await createInvite(app)
        const legacyToken = "legacy_token-with-url-safe-characters-1234567890"
        const legacyTokenHash = createHash("sha256").update(legacyToken).digest("hex")
        await db
            .update(schema.coterieInvites)
            .set({ tokenHash: legacyTokenHash })
            .where(eq(schema.coterieInvites.id, invite.id))

        setWorkosUser(MEMBER_ID)
        const response = await app.inject({
            method: "POST",
            url: `/coterie-invites/${legacyToken}/accept`,
            headers: csrfHeaders
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers.deprecation).toBe("true")
        expect(response.headers.link).toBe('</coterie-invites/accept>; rel="successor-version"')
        expect(response.json().coterie.id).toBe(COTERIE_ID)
    })

    it("accepts active invites, including nickname-less users, and rejects unavailable invites", async () => {
        const selfInvite = await createInvite(app)
        const selfAcceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: selfInvite.token }
        })
        expect(selfAcceptResponse.statusCode).toBe(409)
        expect(selfAcceptResponse.json().error).toBe("Already coterie owner")

        const activeInvite = await createInvite(app)

        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: activeInvite.token }
        })

        expect(acceptResponse.statusCode).toBe(200)
        expect(acceptResponse.json().coterie.id).toBe(COTERIE_ID)

        const memberMembership = await db.query.coteriePlayerMemberships.findFirst({
            where: eq(schema.coteriePlayerMemberships.userId, MEMBER_ID)
        })
        expect(memberMembership?.coterieId).toBe(COTERIE_ID)

        const revokedInvite = await createInvite(app)
        const revokeResponse = await app.inject({
            method: "DELETE",
            url: `/coteries/${COTERIE_ID}/invites/${revokedInvite.id}`,
            headers: csrfHeaders
        })
        expect(revokeResponse.statusCode).toBe(204)

        setWorkosUser(OTHER_ID)
        const revokedAcceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: revokedInvite.token }
        })
        expect(revokedAcceptResponse.statusCode).toBe(404)

        const expiredInvite = await createInvite(app)
        await db
            .update(schema.coterieInvites)
            .set({ expiresAt: new Date(Date.now() - 60_000) })
            .where(eq(schema.coterieInvites.id, expiredInvite.id))

        setWorkosUser(OTHER_ID)
        const expiredAcceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: expiredInvite.token }
        })
        expect(expiredAcceptResponse.statusCode).toBe(404)

        const noNicknameInvite = await createInvite(app)
        setWorkosUser(NO_NICKNAME_ID)
        const noNicknameAcceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: noNicknameInvite.token }
        })
        expect(noNicknameAcceptResponse.statusCode).toBe(200)

        setWorkosUser(OWNER_ID)
        const ownerCoterieResponse = await app.inject({
            method: "GET",
            url: `/coteries/${COTERIE_ID}`,
            headers: csrfHeaders
        })
        expect(ownerCoterieResponse.statusCode).toBe(200)
        const nicknameLessPlayer = (
            ownerCoterieResponse.json() as {
                players: Array<{ nickname: string }>
            }
        ).players.find((player) => player.nickname === "cot")
        expect(nicknameLessPlayer).toBeDefined()
        expect(JSON.stringify(ownerCoterieResponse.json())).not.toContain(
            `${NO_NICKNAME_ID}@progeny.invalid`
        )
    })

    it("enforces character add and remove permissions for players and owners", async () => {
        const invite = await createInvite(app)

        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: invite.token }
        })
        expect(acceptResponse.statusCode).toBe(200)

        const addOwnCharacterResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/characters`,
            headers: csrfHeaders,
            payload: { characterId: MEMBER_CHARACTER_ID }
        })
        expect(addOwnCharacterResponse.statusCode).toBe(201)

        const coteriesResponse = await app.inject({
            method: "GET",
            url: "/coteries",
            headers: csrfHeaders
        })
        expect(coteriesResponse.statusCode).toBe(200)
        const [joinedCoterie] = coteriesResponse.json() as Array<{
            members: Array<{ characterId: string; playerNickname: string | null }>
        }>
        expect(
            joinedCoterie.members.find((member) => member.characterId === MEMBER_CHARACTER_ID)
                ?.playerNickname
        ).toBe("Member")

        const addOtherCharacterResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/characters`,
            headers: csrfHeaders,
            payload: { characterId: OTHER_CHARACTER_ID }
        })
        expect(addOtherCharacterResponse.statusCode).toBe(403)

        const removeOwnerCharacterResponse = await app.inject({
            method: "DELETE",
            url: `/coteries/${COTERIE_ID}/characters/${OWNER_CHARACTER_ID}`,
            headers: csrfHeaders
        })
        expect(removeOwnerCharacterResponse.statusCode).toBe(403)

        const removeOwnCharacterResponse = await app.inject({
            method: "DELETE",
            url: `/coteries/${COTERIE_ID}/characters/${MEMBER_CHARACTER_ID}`,
            headers: csrfHeaders
        })
        expect(removeOwnCharacterResponse.statusCode).toBe(204)

        await db.insert(schema.coterieMembers).values({
            id: "member-character-membership-again",
            coterieId: COTERIE_ID,
            characterId: MEMBER_CHARACTER_ID
        })

        setWorkosUser(OWNER_ID)
        const ownerRemoveMemberCharacterResponse = await app.inject({
            method: "DELETE",
            url: `/coteries/${COTERIE_ID}/characters/${MEMBER_CHARACTER_ID}`,
            headers: csrfHeaders
        })
        expect(ownerRemoveMemberCharacterResponse.statusCode).toBe(204)

        await db.insert(schema.coterieMembers).values({
            id: "member-character-membership-third",
            coterieId: COTERIE_ID,
            characterId: MEMBER_CHARACTER_ID
        })

        const membership = await db.query.coteriePlayerMemberships.findFirst({
            where: eq(schema.coteriePlayerMemberships.userId, MEMBER_ID)
        })
        expect(membership).toBeDefined()

        const removePlayerResponse = await app.inject({
            method: "DELETE",
            url: `/coteries/${COTERIE_ID}/players/${membership!.id}`,
            headers: csrfHeaders
        })
        expect(removePlayerResponse.statusCode).toBe(204)

        const removedMembership = await db.query.coteriePlayerMemberships.findFirst({
            where: eq(schema.coteriePlayerMemberships.userId, MEMBER_ID)
        })
        expect(removedMembership).toBeUndefined()

        const removedCharacterMembership = await db.query.coterieMembers.findFirst({
            where: eq(schema.coterieMembers.characterId, MEMBER_CHARACTER_ID)
        })
        expect(removedCharacterMembership).toBeUndefined()
    })

    it("preserves immediately deleted private coterie notes", async () => {
        const originalContent = "A critical coterie clue. ".repeat(20)
        const saveResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: originalContent }
        })
        expect(saveResponse.statusCode).toBe(200)

        const deleteResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "" }
        })
        expect(deleteResponse.statusCode).toBe(200)
        expect(deleteResponse.json().createdNewVersion).toBe(true)
        expect(deleteResponse.json().current.content).toBe("")
        expect(deleteResponse.json().versions).toHaveLength(2)
        expect(deleteResponse.json().versions[1].content).toBe(originalContent)

        const originalVersionId = deleteResponse.json().versions[1].id as string
        const restoreResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/notes/versions/${originalVersionId}/restore`,
            headers: csrfHeaders
        })
        expect(restoreResponse.statusCode).toBe(200)
        expect(restoreResponse.json().current.content).toBe(originalContent)

        const duplicateRestoreResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/notes/versions/${originalVersionId}/restore`,
            headers: csrfHeaders
        })
        expect(duplicateRestoreResponse.statusCode).toBe(200)
        expect(duplicateRestoreResponse.json().createdNewVersion).toBe(false)
        expect(duplicateRestoreResponse.json().versions).toHaveLength(3)
    })

    it("keeps private coterie notes per user and caps substantial old versions at ten historical entries", async () => {
        const ownerSaveResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "First private owner note" }
        })
        expect(ownerSaveResponse.statusCode).toBe(200)
        expect(ownerSaveResponse.json().versions).toHaveLength(1)

        const otherUserResponse = await app.inject({
            method: "GET",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders
        })
        expect(otherUserResponse.statusCode).toBe(200)
        expect(otherUserResponse.json().current.content).toBe("First private owner note")

        setWorkosUser(OTHER_ID)
        const forbiddenResponse = await app.inject({
            method: "GET",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders
        })
        expect(forbiddenResponse.statusCode).toBe(403)

        const invite = await createInvite(app)
        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: "/coterie-invites/accept",
            headers: csrfHeaders,
            payload: { token: invite.token }
        })
        expect(acceptResponse.statusCode).toBe(200)

        const memberNotesResponse = await app.inject({
            method: "GET",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders
        })
        expect(memberNotesResponse.statusCode).toBe(200)
        expect(memberNotesResponse.json().current).toBeNull()

        const memberSaveResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "Member-only note" }
        })
        expect(memberSaveResponse.statusCode).toBe(200)
        expect(memberSaveResponse.json().current.content).toBe("Member-only note")

        setWorkosUser(OWNER_ID)
        const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000)
        await db
            .update(schema.coterieNoteVersions)
            .set({ createdAt: oldTimestamp })
            .where(eq(schema.coterieNoteVersions.userId, OWNER_ID))

        const tinyEditResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "First private owner note!" }
        })
        expect(tinyEditResponse.statusCode).toBe(200)
        expect(tinyEditResponse.json().versions).toHaveLength(1)
        expect(tinyEditResponse.json().createdNewVersion).toBe(false)

        const substantialEditResponse = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/notes`,
            headers: csrfHeaders,
            payload: {
                content: "First private owner note, but now the prince has demanded a new favor."
            }
        })
        expect(substantialEditResponse.statusCode).toBe(200)
        expect(substantialEditResponse.json().versions).toHaveLength(2)
        expect(substantialEditResponse.json().createdNewVersion).toBe(true)

        const previousVersion = substantialEditResponse.json().versions[1]
        const restoreResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/notes/versions/${previousVersion.id}/restore`,
            headers: csrfHeaders
        })
        expect(restoreResponse.statusCode).toBe(200)
        expect(restoreResponse.json().createdNewVersion).toBe(true)
        expect(restoreResponse.json().current.content).toBe(previousVersion.content)
        expect(restoreResponse.json().versions).toHaveLength(3)

        for (let index = 0; index < 10; index += 1) {
            await db
                .update(schema.coterieNoteVersions)
                .set({ createdAt: oldTimestamp })
                .where(eq(schema.coterieNoteVersions.userId, OWNER_ID))

            const response = await app.inject({
                method: "PUT",
                url: `/coteries/${COTERIE_ID}/notes`,
                headers: csrfHeaders,
                payload: {
                    content: `Version ${index} adds enough different words to trigger a new note snapshot.`
                }
            })
            expect(response.statusCode).toBe(200)
        }

        const ownerVersions = await db.query.coterieNoteVersions.findMany({
            where: eq(schema.coterieNoteVersions.userId, OWNER_ID)
        })
        expect(ownerVersions).toHaveLength(11)
    })
})
