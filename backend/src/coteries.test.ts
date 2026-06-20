import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
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
}

const cleanup = async () => {
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
            data: JSON.stringify({ name: "Owner Character", player: "Owner" }),
            version: 1,
            characterVersion: 0
        },
        {
            id: MEMBER_CHARACTER_ID,
            userId: MEMBER_ID,
            name: "Member Character",
            data: JSON.stringify({ name: "Member Character", player: "Member" }),
            version: 1,
            characterVersion: 0
        },
        {
            id: OTHER_CHARACTER_ID,
            userId: OTHER_ID,
            name: "Other Character",
            data: JSON.stringify({ name: "Other Character", player: "Other" }),
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

    return response.json() as { id: string; token: string }
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

    it("accepts active invites and rejects revoked, expired, and no-nickname joins", async () => {
        const selfInvite = await createInvite(app)
        const selfAcceptResponse = await app.inject({
            method: "POST",
            url: `/coterie-invites/${selfInvite.token}/accept`,
            headers: csrfHeaders
        })
        expect(selfAcceptResponse.statusCode).toBe(409)
        expect(selfAcceptResponse.json().error).toBe("Already coterie owner")

        const activeInvite = await createInvite(app)

        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: `/coterie-invites/${activeInvite.token}/accept`,
            headers: csrfHeaders
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
            url: `/coterie-invites/${revokedInvite.token}/accept`,
            headers: csrfHeaders
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
            url: `/coterie-invites/${expiredInvite.token}/accept`,
            headers: csrfHeaders
        })
        expect(expiredAcceptResponse.statusCode).toBe(404)

        const noNicknameInvite = await createInvite(app)
        setWorkosUser(NO_NICKNAME_ID)
        const noNicknameAcceptResponse = await app.inject({
            method: "POST",
            url: `/coterie-invites/${noNicknameInvite.token}/accept`,
            headers: csrfHeaders
        })
        expect(noNicknameAcceptResponse.statusCode).toBe(400)
        expect(noNicknameAcceptResponse.json().error).toBe("Nickname required")
    })

    it("enforces character add and remove permissions for players and owners", async () => {
        const invite = await createInvite(app)

        setWorkosUser(MEMBER_ID)
        const acceptResponse = await app.inject({
            method: "POST",
            url: `/coterie-invites/${invite.token}/accept`,
            headers: csrfHeaders
        })
        expect(acceptResponse.statusCode).toBe(200)

        const addOwnCharacterResponse = await app.inject({
            method: "POST",
            url: `/coteries/${COTERIE_ID}/characters`,
            headers: csrfHeaders,
            payload: { characterId: MEMBER_CHARACTER_ID }
        })
        expect(addOwnCharacterResponse.statusCode).toBe(201)

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
})
