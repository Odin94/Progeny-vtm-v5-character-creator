import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { and, eq, sql } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"

const workosMock = vi.hoisted(() => ({
    user: {
        id: "notes-owner",
        email: "notes-owner@progeny.invalid",
        firstName: "Notes",
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

const OWNER_ID = "notes-owner"
const SHARED_USER_ID = "notes-shared-user"
const OTHER_USER_ID = "notes-other-user"
const CHARACTER_ID = "notes-character"
const SHARE_ID = "notes-character-share"

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
            "Refusing to run character notes tests outside NODE_ENV=test with DATABASE_URL=:memory:"
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
        sql.raw(`CREATE TABLE IF NOT EXISTS character_shares (
            id text PRIMARY KEY NOT NULL,
            character_id text NOT NULL REFERENCES characters(id) ON DELETE cascade,
            shared_with_user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            shared_by_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            created_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
    await db.run(
        sql.raw(`CREATE TABLE IF NOT EXISTS character_note_versions (
            id text PRIMARY KEY NOT NULL,
            character_id text NOT NULL REFERENCES characters(id) ON DELETE cascade,
            user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
            content text NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL
        )`)
    )
}

const cleanup = async () => {
    await db
        .delete(schema.characterNoteVersions)
        .where(eq(schema.characterNoteVersions.characterId, CHARACTER_ID))
    await db.delete(schema.characterShares).where(eq(schema.characterShares.id, SHARE_ID))
    await db.delete(schema.characters).where(eq(schema.characters.id, CHARACTER_ID))
    for (const userId of [OWNER_ID, SHARED_USER_ID, OTHER_USER_ID]) {
        await db.delete(schema.users).where(eq(schema.users.id, userId))
    }
}

const seedBaseData = async () => {
    await db.insert(schema.users).values([
        { id: OWNER_ID, email: `${OWNER_ID}@progeny.invalid` },
        { id: SHARED_USER_ID, email: `${SHARED_USER_ID}@progeny.invalid` },
        { id: OTHER_USER_ID, email: `${OTHER_USER_ID}@progeny.invalid` }
    ])
    await db.insert(schema.characters).values({
        id: CHARACTER_ID,
        userId: OWNER_ID,
        name: "Notes Character",
        data: JSON.stringify({ name: "Notes Character" })
    })
    await db.insert(schema.characterShares).values({
        id: SHARE_ID,
        characterId: CHARACTER_ID,
        sharedWithUserId: SHARED_USER_ID,
        sharedById: OWNER_ID
    })
}

describe("character private notes", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        assertSafeTestDatabase()
        await createTables()
        app = await buildApp()
        await app.ready()
    })

    beforeEach(async () => {
        await cleanup()
        await seedBaseData()
        setWorkosUser(OWNER_ID)
    })

    afterAll(async () => {
        await cleanup()
        await app.close()
    })

    it("keeps notes private per account for owned and shared character access", async () => {
        const emptyResponse = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders
        })
        expect(emptyResponse.statusCode).toBe(200)
        expect(emptyResponse.json()).toEqual({ current: null, versions: [] })

        const ownerSave = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "The owner's private clue." }
        })
        expect(ownerSave.statusCode).toBe(200)
        expect(ownerSave.json().current.content).toBe("The owner's private clue.")

        setWorkosUser(SHARED_USER_ID)
        const sharedEmptyResponse = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders
        })
        expect(sharedEmptyResponse.statusCode).toBe(200)
        expect(sharedEmptyResponse.json()).toEqual({ current: null, versions: [] })

        const sharedSave = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "The viewer's separate private clue." }
        })
        expect(sharedSave.statusCode).toBe(200)

        setWorkosUser(OWNER_ID)
        const ownerReload = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders
        })
        expect(ownerReload.json().current.content).toBe("The owner's private clue.")

        setWorkosUser(OTHER_USER_ID)
        const forbiddenResponse = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders
        })
        expect(forbiddenResponse.statusCode).toBe(403)
    })

    it("preserves immediately deleted content and avoids duplicate restores", async () => {
        const originalContent = "A critical private clue. ".repeat(20)
        const saveResponse = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: originalContent }
        })
        expect(saveResponse.statusCode).toBe(200)

        const deleteResponse = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "" }
        })
        expect(deleteResponse.statusCode).toBe(200)
        expect(deleteResponse.json().createdNewVersion).toBe(true)
        expect(deleteResponse.json().current.content).toBe("")
        expect(deleteResponse.json().versions).toHaveLength(2)
        expect(deleteResponse.json().versions[1].content).toBe(originalContent)

        const undoResponse = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: originalContent }
        })
        expect(undoResponse.statusCode).toBe(200)
        expect(undoResponse.json().createdNewVersion).toBe(false)
        expect(undoResponse.json().versions).toHaveLength(1)

        const secondDeleteResponse = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "" }
        })
        const originalVersionId = secondDeleteResponse.json().versions[1].id as string
        const restoreResponse = await app.inject({
            method: "POST",
            url: `/characters/${CHARACTER_ID}/notes/versions/${originalVersionId}/restore`,
            headers: csrfHeaders
        })
        expect(restoreResponse.statusCode).toBe(200)
        expect(restoreResponse.json().createdNewVersion).toBe(true)
        expect(restoreResponse.json().current.content).toBe(originalContent)
        expect(restoreResponse.json().versions).toHaveLength(3)

        const duplicateRestoreResponse = await app.inject({
            method: "POST",
            url: `/characters/${CHARACTER_ID}/notes/versions/${originalVersionId}/restore`,
            headers: csrfHeaders
        })
        expect(duplicateRestoreResponse.statusCode).toBe(200)
        expect(duplicateRestoreResponse.json().createdNewVersion).toBe(false)
        expect(duplicateRestoreResponse.json().versions).toHaveLength(3)
    })

    it("creates, caps, and restores substantial historical versions", async () => {
        for (let index = 0; index < 12; index += 1) {
            const latest = await db.query.characterNoteVersions.findFirst({
                where: and(
                    eq(schema.characterNoteVersions.characterId, CHARACTER_ID),
                    eq(schema.characterNoteVersions.userId, OWNER_ID)
                ),
                orderBy: (versions, { desc }) => [desc(versions.createdAt)]
            })

            if (latest) {
                await db
                    .update(schema.characterNoteVersions)
                    .set({ createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 - index * 1000) })
                    .where(eq(schema.characterNoteVersions.id, latest.id))
            }

            const saveResponse = await app.inject({
                method: "PUT",
                url: `/characters/${CHARACTER_ID}/notes`,
                headers: csrfHeaders,
                payload: {
                    content: `Version ${index}: clue-${index} plan-${index} debt-${index} boon-${index} suspect-${index} detail-${index}`
                }
            })
            expect(saveResponse.statusCode).toBe(200)
        }

        const versions = await db.query.characterNoteVersions.findMany({
            where: and(
                eq(schema.characterNoteVersions.characterId, CHARACTER_ID),
                eq(schema.characterNoteVersions.userId, OWNER_ID)
            )
        })
        expect(versions).toHaveLength(11)

        const versionToRestore = versions.find((version) => version.content.includes("Version 5"))
        const nextVersionToRestore = versions.find((version) =>
            version.content.includes("Version 6")
        )
        expect(versionToRestore).toBeDefined()
        expect(nextVersionToRestore).toBeDefined()

        const restoreResponse = await app.inject({
            method: "POST",
            url: `/characters/${CHARACTER_ID}/notes/versions/${versionToRestore!.id}/restore`,
            headers: csrfHeaders
        })
        expect(restoreResponse.statusCode).toBe(200)
        expect(restoreResponse.json().current.content).toBe(versionToRestore!.content)
        expect(restoreResponse.json().versions).toHaveLength(11)

        const nextRestoreResponse = await app.inject({
            method: "POST",
            url: `/characters/${CHARACTER_ID}/notes/versions/${nextVersionToRestore!.id}/restore`,
            headers: csrfHeaders
        })
        expect(nextRestoreResponse.statusCode).toBe(200)

        const reloadedResponse = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders
        })
        expect(reloadedResponse.json().current.content).toBe(nextVersionToRestore!.content)
    })

    it("rejects notes larger than 200 KB", async () => {
        const response = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "x".repeat(200 * 1024 + 1) }
        })

        expect(response.statusCode).toBe(413)

        setWorkosUser(OTHER_USER_ID)
        const forbiddenResponse = await app.inject({
            method: "PUT",
            url: `/characters/${CHARACTER_ID}/notes`,
            headers: csrfHeaders,
            payload: { content: "x".repeat(200 * 1024 + 1) }
        })
        expect(forbiddenResponse.statusCode).toBe(403)
    })
})
