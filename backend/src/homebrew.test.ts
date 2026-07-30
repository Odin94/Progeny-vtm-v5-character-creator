import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { eq, sql } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"

const workosMock = vi.hoisted(() => ({
    user: { id: "brew-author", email: "brew-author@progeny.invalid" }
}))

vi.mock("./config/workos.js", () => ({
    WORKOS_CLIENT_ID: "test-client-id",
    workos: {
        userManagement: {
            loadSealedSession: () => ({
                authenticate: async () => ({ authenticated: true, user: workosMock.user }),
                refresh: async () => ({ authenticated: false })
            })
        }
    }
}))

const AUTHOR_ID = "brew-author"
const ADMIN_ID = "brew-admin"
const RATER_ID = "brew-rater"
const COTERIE_ID = "brew-coterie"
const CHARACTER_ID = "brew-character"
const csrfHeaders = {
    cookie: "wos-session=fake; csrf-token=test-csrf",
    "x-csrf-token": "test-csrf"
}

const setUser = (id: string) => {
    workosMock.user = { id, email: `${id}@progeny.invalid` }
}

const createTables = async () => {
    const statements = [
        `CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY NOT NULL, email text NOT NULL UNIQUE, first_name text, last_name text, nickname text UNIQUE, preferences text, is_superadmin integer DEFAULT false NOT NULL, name_tag_enabled integer DEFAULT false NOT NULL, name_tag_visible integer DEFAULT false NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS characters (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, name text NOT NULL, data text NOT NULL, version integer DEFAULT 1 NOT NULL, character_version integer DEFAULT 0 NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS coteries (id text PRIMARY KEY NOT NULL, name text NOT NULL, owner_id text NOT NULL REFERENCES users(id) ON DELETE cascade, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS coterie_members (id text PRIMARY KEY NOT NULL, coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade, character_id text NOT NULL REFERENCES characters(id) ON DELETE cascade, created_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS coterie_player_memberships (id text PRIMARY KEY NOT NULL, coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, created_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS homebrew_collections (id text PRIMARY KEY NOT NULL, owner_id text NOT NULL REFERENCES users(id) ON DELETE cascade, name text NOT NULL, short_description text DEFAULT '' NOT NULL, description text DEFAULT '' NOT NULL, tags text DEFAULT '[]' NOT NULL, content_warning text DEFAULT '' NOT NULL, source_library_entry_id text, source_publication_id text, root_source_library_entry_id text, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS homebrew_items (id text PRIMARY KEY NOT NULL, collection_id text NOT NULL REFERENCES homebrew_collections(id) ON DELETE cascade, kind text NOT NULL, data text NOT NULL, sort_order integer DEFAULT 0 NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS coterie_homebrew_collections (id text PRIMARY KEY NOT NULL, coterie_id text NOT NULL REFERENCES coteries(id) ON DELETE cascade, collection_id text NOT NULL REFERENCES homebrew_collections(id) ON DELETE cascade, created_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS coterie_homebrew_collections_unique_idx ON coterie_homebrew_collections (coterie_id, collection_id)`,
        `CREATE TABLE IF NOT EXISTS homebrew_library_entries (id text PRIMARY KEY NOT NULL, original_collection_id text, author_id text REFERENCES users(id) ON DELETE set null, author_nickname text NOT NULL, active_publication_id text, created_at integer DEFAULT (unixepoch()) NOT NULL, unpublished_at integer)`,
        `CREATE TABLE IF NOT EXISTS homebrew_publications (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, version integer NOT NULL, snapshot text NOT NULL, approved_by_id text REFERENCES users(id) ON DELETE set null, approved_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS homebrew_publish_requests (id text PRIMARY KEY NOT NULL, collection_id text REFERENCES homebrew_collections(id) ON DELETE set null, requester_id text NOT NULL REFERENCES users(id) ON DELETE cascade, library_entry_id text REFERENCES homebrew_library_entries(id) ON DELETE set null, snapshot text NOT NULL, status text DEFAULT 'pending' NOT NULL, denial_message text, reviewed_by_id text REFERENCES users(id) ON DELETE set null, created_at integer DEFAULT (unixepoch()) NOT NULL, reviewed_at integer)`,
        `CREATE TABLE IF NOT EXISTS homebrew_ratings (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, rating integer NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS homebrew_ratings_unique_idx ON homebrew_ratings (library_entry_id, user_id)`,
        `CREATE TABLE IF NOT EXISTS homebrew_comments (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, body text NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`
    ]
    for (const statement of statements) await db.run(sql.raw(statement))
}

describe("Homebrew collections and library", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        await createTables()
        app = await buildApp()
        await app.ready()
    })

    beforeEach(async () => {
        for (const table of [
            schema.homebrewComments,
            schema.homebrewRatings,
            schema.homebrewPublishRequests,
            schema.homebrewPublications,
            schema.homebrewLibraryEntries,
            schema.coterieHomebrewCollections,
            schema.homebrewItems,
            schema.homebrewCollections,
            schema.coterieMembers,
            schema.coteries,
            schema.characters,
            schema.users
        ]) {
            await db.delete(table)
        }

        await db.insert(schema.users).values([
            { id: AUTHOR_ID, email: `${AUTHOR_ID}@progeny.invalid`, nickname: "Brewer" },
            {
                id: ADMIN_ID,
                email: `${ADMIN_ID}@progeny.invalid`,
                nickname: "Curator",
                isSuperadmin: true
            },
            { id: RATER_ID, email: `${RATER_ID}@progeny.invalid`, nickname: "Rater" }
        ])
        await db.insert(schema.characters).values({
            id: CHARACTER_ID,
            userId: AUTHOR_ID,
            name: "Homebrew Character",
            data: "{}"
        })
        await db.insert(schema.coteries).values({
            id: COTERIE_ID,
            ownerId: AUTHOR_ID,
            name: "Homebrew Coterie"
        })
        await db.insert(schema.coterieMembers).values({
            id: "brew-member",
            coterieId: COTERIE_ID,
            characterId: CHARACTER_ID
        })
        setUser(AUTHOR_ID)
    })

    afterAll(async () => app.close())

    const createCollection = async () => {
        const response = await app.inject({
            method: "POST",
            url: "/homebrew/collections",
            headers: csrfHeaders,
            payload: {
                name: "Night Arts",
                shortDescription: "Strange powers for a nocturnal chronicle.",
                description: "An original collection.",
                tags: ["gothic"],
                contentWarning: "Body horror",
                items: [
                    {
                        kind: "discipline",
                        name: "Noctis",
                        summary: "Shape the living dark.",
                        description: "",
                        logo: ""
                    },
                    {
                        kind: "power",
                        name: "Drink the Moon",
                        summary: "Draw strength from moonlight.",
                        description: "",
                        discipline: "Noctis",
                        level: 1,
                        dicePool: "Resolve + Noctis",
                        rouseChecks: 1,
                        amalgamPrerequisites: []
                    }
                ]
            }
        })
        expect(response.statusCode, response.body).toBe(201)
        return response.json() as { id: string; items: Array<{ id: string }> }
    }

    it("scopes an owner's live collection to characters in an enabled coterie", async () => {
        const collection = await createCollection()
        const attach = await app.inject({
            method: "PUT",
            url: `/coteries/${COTERIE_ID}/homebrew`,
            headers: csrfHeaders,
            payload: { collectionIds: [collection.id] }
        })
        expect(attach.statusCode).toBe(200)

        const context = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/homebrew`,
            headers: csrfHeaders
        })
        expect(context.statusCode).toBe(200)
        expect(context.json()[0]).toMatchObject({
            id: collection.id,
            name: "Night Arts",
            coteries: [{ id: COTERIE_ID, name: "Homebrew Coterie" }]
        })
        expect(context.json()[0].items).toHaveLength(2)
    })

    it("publishes an immutable snapshot through superadmin review", async () => {
        const collection = await createCollection()
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        expect(submitted.statusCode).toBe(201)
        const requestId = submitted.json().id as string

        setUser(ADMIN_ID)
        const approved = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${requestId}`,
            headers: csrfHeaders,
            payload: { decision: "approve" }
        })
        expect(approved.statusCode).toBe(200)
        const libraryEntryId = approved.json().libraryEntryId as string

        setUser(AUTHOR_ID)
        const privateCollection = await db.query.homebrewCollections.findFirst({
            where: eq(schema.homebrewCollections.id, collection.id)
        })
        expect(privateCollection).toBeDefined()
        await db
            .update(schema.homebrewCollections)
            .set({ name: "Changed privately" })
            .where(eq(schema.homebrewCollections.id, collection.id))

        const detail = await app.inject({
            method: "GET",
            url: `/homebrew/library/${libraryEntryId}`
        })
        expect(detail.statusCode).toBe(200)
        expect(detail.json().snapshot.name).toBe("Night Arts")
    })

    it("allows other users to rate but rejects self-rating", async () => {
        const collection = await createCollection()
        setUser(ADMIN_ID)
        const published = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        expect(published.statusCode).toBe(404)

        setUser(AUTHOR_ID)
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        const requestId = submitted.json().id as string
        setUser(ADMIN_ID)
        const approved = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${requestId}`,
            headers: csrfHeaders,
            payload: { decision: "approve" }
        })
        const libraryEntryId = approved.json().libraryEntryId as string

        setUser(RATER_ID)
        const rating = await app.inject({
            method: "POST",
            url: `/homebrew/library/${libraryEntryId}/rating`,
            headers: csrfHeaders,
            payload: { rating: 5 }
        })
        expect(rating.statusCode).toBe(200)

        setUser(AUTHOR_ID)
        const selfRating = await app.inject({
            method: "POST",
            url: `/homebrew/library/${libraryEntryId}/rating`,
            headers: csrfHeaders,
            payload: { rating: 5 }
        })
        expect(selfRating.statusCode).toBe(400)
    })

    it("enforces the rolling five-request limit", async () => {
        const collection = await createCollection()
        await db.insert(schema.homebrewPublishRequests).values(
            [1, 2, 3, 4, 5].map((index) => ({
                id: `recent-request-${index}`,
                collectionId: collection.id,
                requesterId: AUTHOR_ID,
                snapshot: JSON.stringify({ name: `Snapshot ${index}`, items: [] }),
                status: "withdrawn" as const,
                createdAt: new Date(Date.now() - index * 60_000)
            }))
        )

        const response = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })

        expect(response.statusCode).toBe(429)
    })

    it("shows a required denial message to the requester", async () => {
        const collection = await createCollection()
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        const requestId = submitted.json().id as string

        setUser(ADMIN_ID)
        const missingMessage = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${requestId}`,
            headers: csrfHeaders,
            payload: { decision: "deny" }
        })
        expect(missingMessage.statusCode).toBe(400)

        const denied = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${requestId}`,
            headers: csrfHeaders,
            payload: { decision: "deny", message: "Please replace the copied sourcebook text." }
        })
        expect(denied.statusCode, denied.body).toBe(200)

        setUser(AUTHOR_ID)
        const requests = await app.inject({
            method: "GET",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders
        })
        expect(requests.json()[0]).toMatchObject({
            status: "denied",
            denialMessage: "Please replace the copied sourcebook text."
        })
    })
})
