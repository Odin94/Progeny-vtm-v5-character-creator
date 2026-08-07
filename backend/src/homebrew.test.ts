import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { eq, sql } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"
import { HOMEBREW_STORAGE_LIMIT_BYTES, HOMEBREW_STORAGE_LIMIT_MESSAGE } from "./utils/homebrew.js"

const workosMock = vi.hoisted(() => ({
    user: { id: "brew-author", email: "brew-author@progeny.invalid" }
}))

const trackerMock = vi.hoisted(() => ({
    trackEvent: vi.fn(async () => undefined)
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

vi.mock("./utils/tracker.js", () => trackerMock)

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

const cookieHeaderWith = (setCookieHeader: string | string[] | undefined) => {
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""]
    const impersonationCookie = headers
        .find((header) => header.startsWith("impersonation-session="))
        ?.split(";")[0]
    return `${csrfHeaders.cookie}; ${impersonationCookie}`
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
        `CREATE TABLE IF NOT EXISTS user_homebrew_collections (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, collection_id text NOT NULL REFERENCES homebrew_collections(id) ON DELETE cascade, created_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS user_homebrew_collections_unique_idx ON user_homebrew_collections (user_id, collection_id)`,
        `CREATE TABLE IF NOT EXISTS homebrew_library_entries (id text PRIMARY KEY NOT NULL, original_collection_id text, author_id text REFERENCES users(id) ON DELETE set null, author_nickname text NOT NULL, active_publication_id text, created_at integer DEFAULT (unixepoch()) NOT NULL, unpublished_at integer)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS homebrew_library_entries_original_collection_author_idx ON homebrew_library_entries (original_collection_id, author_id)`,
        `CREATE TABLE IF NOT EXISTS homebrew_publications (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, version integer NOT NULL, snapshot text NOT NULL, approved_by_id text REFERENCES users(id) ON DELETE set null, approved_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS homebrew_publish_requests (id text PRIMARY KEY NOT NULL, collection_id text REFERENCES homebrew_collections(id) ON DELETE set null, requester_id text NOT NULL REFERENCES users(id) ON DELETE cascade, library_entry_id text REFERENCES homebrew_library_entries(id) ON DELETE set null, snapshot text NOT NULL, status text DEFAULT 'pending' NOT NULL, denial_message text, reviewed_by_id text REFERENCES users(id) ON DELETE set null, created_at integer DEFAULT (unixepoch()) NOT NULL, reviewed_at integer)`,
        `CREATE TABLE IF NOT EXISTS homebrew_ratings (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, rating integer NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS homebrew_ratings_unique_idx ON homebrew_ratings (library_entry_id, user_id)`,
        `CREATE TABLE IF NOT EXISTS homebrew_comments (id text PRIMARY KEY NOT NULL, library_entry_id text NOT NULL REFERENCES homebrew_library_entries(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, body text NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS impersonation_sessions (id text PRIMARY KEY NOT NULL, superadmin_user_id text NOT NULL REFERENCES users(id), impersonated_user_id text NOT NULL REFERENCES users(id), started_at integer NOT NULL DEFAULT (unixepoch()), expires_at integer NOT NULL, ended_at integer, ended_reason text, audit_log text NOT NULL DEFAULT '[]')`
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
        trackerMock.trackEvent.mockClear()
        for (const table of [
            schema.impersonationSessions,
            schema.homebrewComments,
            schema.homebrewRatings,
            schema.homebrewPublishRequests,
            schema.homebrewPublications,
            schema.homebrewLibraryEntries,
            schema.coterieHomebrewCollections,
            schema.userHomebrewCollections,
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

    const publishCollection = async () => {
        const collection = await createCollection()
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        setUser(ADMIN_ID)
        const approved = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${submitted.json().id as string}`,
            headers: csrfHeaders,
            payload: { decision: "approve" }
        })
        expect(approved.statusCode, approved.body).toBe(200)
        return approved.json().libraryEntryId as string
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

    it("tracks each newly created Homebrew item by type", async () => {
        const collection = await createCollection()

        expect(trackerMock.trackEvent).toHaveBeenCalledWith(
            "homebrew_item_created",
            { itemType: "discipline", collectionItemCount: 2 },
            AUTHOR_ID,
            expect.anything()
        )
        expect(trackerMock.trackEvent).toHaveBeenCalledWith(
            "homebrew_item_created",
            { itemType: "power", collectionItemCount: 2 },
            AUTHOR_ID,
            expect.anything()
        )

        trackerMock.trackEvent.mockClear()
        const updated = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${collection.id}`,
            headers: csrfHeaders,
            payload: {
                name: "Night Arts",
                shortDescription: "Strange powers for a nocturnal chronicle.",
                description: "An original collection.",
                tags: ["gothic"],
                contentWarning: "Body horror",
                items: [
                    {
                        id: collection.items[0]!.id,
                        kind: "discipline",
                        name: "Noctis",
                        summary: "Shape the living dark.",
                        description: "",
                        logo: ""
                    },
                    {
                        id: collection.items[1]!.id,
                        kind: "power",
                        name: "Drink the Moon",
                        summary: "Draw strength from moonlight.",
                        description: "",
                        discipline: "Noctis",
                        level: 1,
                        dicePool: "Resolve + Noctis",
                        rouseChecks: 1,
                        amalgamPrerequisites: []
                    },
                    {
                        id: "homebrew-merit",
                        kind: "merit",
                        name: "Moonlit Favor",
                        summary: "A supernatural ally owes you a boon.",
                        description: "",
                        costs: [1],
                        excludes: []
                    }
                ]
            }
        })

        expect(updated.statusCode, updated.body).toBe(200)
        expect(trackerMock.trackEvent).toHaveBeenCalledTimes(1)
        expect(trackerMock.trackEvent).toHaveBeenCalledWith(
            "homebrew_item_created",
            { itemType: "merit", collectionItemCount: 3 },
            AUTHOR_ID,
            expect.anything()
        )
    })

    it("enables a collection for every character in its owner's account", async () => {
        const collection = await createCollection()

        const enable = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${collection.id}/account-enabled`,
            headers: csrfHeaders,
            payload: { enabled: true }
        })
        expect(enable.statusCode, enable.body).toBe(200)

        const collections = await app.inject({
            method: "GET",
            url: "/homebrew/collections",
            headers: csrfHeaders
        })
        expect(collections.json()[0]).toMatchObject({
            id: collection.id,
            enabledForAccount: true
        })

        const context = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/homebrew`,
            headers: csrfHeaders
        })
        expect(context.statusCode, context.body).toBe(200)
        expect(context.json()[0]).toMatchObject({ id: collection.id, coteries: [] })

        const disable = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${collection.id}/account-enabled`,
            headers: csrfHeaders,
            payload: { enabled: false }
        })
        expect(disable.statusCode, disable.body).toBe(200)

        const disabledContext = await app.inject({
            method: "GET",
            url: `/characters/${CHARACTER_ID}/homebrew`,
            headers: csrfHeaders
        })
        expect(disabledContext.json()).toEqual([])
    })

    it("rejects a collection save that would exceed the account Homebrew storage limit", async () => {
        await db.insert(schema.homebrewCollections).values({
            id: "at-storage-limit",
            ownerId: AUTHOR_ID,
            name: "At the limit",
            description: "x".repeat(HOMEBREW_STORAGE_LIMIT_BYTES),
            shortDescription: "",
            tags: "[]",
            contentWarning: ""
        })
        const storedSize = await db
            .select({ size: sql<number>`length(${schema.homebrewCollections.description})` })
            .from(schema.homebrewCollections)
            .where(eq(schema.homebrewCollections.id, "at-storage-limit"))
        expect(storedSize[0]?.size).toBe(HOMEBREW_STORAGE_LIMIT_BYTES)

        const response = await app.inject({
            method: "POST",
            url: "/homebrew/collections",
            headers: csrfHeaders,
            payload: {
                name: "One collection too many bytes",
                shortDescription: "",
                description: "",
                tags: [],
                contentWarning: "",
                items: []
            }
        })

        expect(response.statusCode, response.body).toBe(413)
        expect(response.json()).toEqual({ error: HOMEBREW_STORAGE_LIMIT_MESSAGE })
        const collections = await db.query.homebrewCollections.findMany({
            where: eq(schema.homebrewCollections.ownerId, AUTHOR_ID)
        })
        expect(collections).toHaveLength(1)
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

    it("resolves the author name from the users table so nickname changes are reflected", async () => {
        const libraryEntryId = await publishCollection()

        await db
            .update(schema.users)
            .set({ nickname: "Renamed Brewer" })
            .where(eq(schema.users.id, AUTHOR_ID))

        setUser(AUTHOR_ID)
        const detail = await app.inject({
            method: "GET",
            url: `/homebrew/library/${libraryEntryId}`
        })
        expect(detail.statusCode).toBe(200)
        expect(detail.json().authorNickname).toBe("Renamed Brewer")

        const list = await app.inject({ method: "GET", url: "/homebrew/library" })
        expect(list.statusCode).toBe(200)
        const summary = (list.json() as Array<{ id: string; authorNickname: string }>).find(
            (entry) => entry.id === libraryEntryId
        )
        expect(summary?.authorNickname).toBe("Renamed Brewer")
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

    it("claims a pending publish request only once", async () => {
        const collection = await createCollection()
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: collection.id, shareAcknowledged: true }
        })
        const requestId = submitted.json().id as string

        setUser(ADMIN_ID)
        const approvals = await Promise.all([
            app.inject({
                method: "POST",
                url: `/admin/homebrew/publish-requests/${requestId}`,
                headers: csrfHeaders,
                payload: { decision: "approve" }
            }),
            app.inject({
                method: "POST",
                url: `/admin/homebrew/publish-requests/${requestId}`,
                headers: csrfHeaders,
                payload: { decision: "approve" }
            })
        ])

        expect(approvals.map(({ statusCode }) => statusCode).sort()).toEqual([200, 404])
        const publications = await db.select().from(schema.homebrewPublications)
        const entries = await db.select().from(schema.homebrewLibraryEntries)
        expect(publications).toHaveLength(1)
        expect(entries).toHaveLength(1)
    })

    it("rejects library mutations after a collection is unpublished", async () => {
        const libraryEntryId = await publishCollection()
        setUser(AUTHOR_ID)
        const unpublished = await app.inject({
            method: "POST",
            url: `/homebrew/library/${libraryEntryId}/unpublish`,
            headers: csrfHeaders
        })
        expect(unpublished.statusCode).toBe(200)

        setUser(RATER_ID)
        const attempts = await Promise.all([
            app.inject({
                method: "POST",
                url: `/homebrew/library/${libraryEntryId}/rating`,
                headers: csrfHeaders,
                payload: { rating: 5 }
            }),
            app.inject({
                method: "POST",
                url: `/homebrew/library/${libraryEntryId}/comments`,
                headers: csrfHeaders,
                payload: { body: "A late comment" }
            })
        ])
        expect(attempts.map(({ statusCode }) => statusCode)).toEqual([404, 404])
    })

    it("does not grant superadmin library actions while impersonating", async () => {
        const libraryEntryId = await publishCollection()
        setUser(AUTHOR_ID)
        const comment = await app.inject({
            method: "POST",
            url: `/homebrew/library/${libraryEntryId}/comments`,
            headers: csrfHeaders,
            payload: { body: "Author comment" }
        })
        expect(comment.statusCode).toBe(201)

        setUser(ADMIN_ID)
        const start = await app.inject({
            method: "POST",
            url: "/admin/impersonation",
            headers: csrfHeaders,
            payload: { userId: RATER_ID }
        })
        expect(start.statusCode, start.body).toBe(201)
        const impersonatingHeaders = {
            cookie: cookieHeaderWith(start.headers["set-cookie"]),
            "x-csrf-token": "test-csrf"
        }

        const attempts = await Promise.all([
            app.inject({
                method: "DELETE",
                url: `/homebrew/library/${libraryEntryId}/comments/${comment.json().id as string}`,
                headers: impersonatingHeaders
            }),
            app.inject({
                method: "POST",
                url: `/homebrew/library/${libraryEntryId}/unpublish`,
                headers: impersonatingHeaders
            })
        ])
        expect(attempts.map(({ statusCode }) => statusCode)).toEqual([404, 404])
    })

    it("preserves explicit Homebrew Discipline references", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/homebrew/collections",
            headers: csrfHeaders,
            payload: {
                name: "Referenced Arts",
                shortDescription: "",
                description: "",
                tags: [],
                contentWarning: "",
                items: [
                    {
                        id: "local-discipline",
                        kind: "discipline",
                        name: "Noctis",
                        summary: "",
                        description: "",
                        logo: ""
                    },
                    {
                        id: "local-power",
                        kind: "power",
                        name: "Drink the Moon",
                        summary: "",
                        description: "",
                        discipline: "Noctis",
                        disciplineRef: {
                            type: "homebrew",
                            name: "Noctis",
                            itemId: "local-discipline"
                        },
                        level: 1,
                        dicePool: "",
                        rouseChecks: 0,
                        amalgamPrerequisites: []
                    },
                    {
                        id: "local-ceremony",
                        kind: "ceremony",
                        name: "Call the Moon's Shade",
                        summary: "",
                        description: "",
                        discipline: "oblivion",
                        disciplineRef: { type: "official", name: "oblivion" },
                        level: 1,
                        dicePool: "",
                        rouseChecks: 1,
                        amalgamPrerequisites: [],
                        requiredTime: "One hour",
                        ingredients: "Moonlit vitae",
                        prerequisitePowers: ["Ashes to Ashes"]
                    }
                ]
            }
        })
        expect(response.statusCode, response.body).toBe(201)
        expect(response.json().items[1].disciplineRef).toEqual({
            type: "homebrew",
            name: "Noctis",
            itemId: response.json().items[0].id
        })
        expect(response.json().items[2].prerequisitePowers).toEqual(["Ashes to Ashes"])

        const renamed = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${response.json().id as string}`,
            headers: csrfHeaders,
            payload: {
                ...response.json(),
                items: response
                    .json()
                    .items.map((item: Record<string, unknown>, index: number) =>
                        index === 0 ? { ...item, name: "Umbra" } : item
                    )
            }
        })
        expect(renamed.statusCode, renamed.body).toBe(200)
        expect(renamed.json().items[1]).toMatchObject({
            discipline: "Umbra",
            disciplineRef: { name: "Umbra", itemId: renamed.json().items[0].id }
        })

        const invalid = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${response.json().id as string}`,
            headers: csrfHeaders,
            payload: {
                ...renamed.json(),
                items: [
                    renamed.json().items[0],
                    {
                        ...renamed.json().items[1],
                        disciplineRef: {
                            type: "homebrew",
                            name: "Noctis",
                            itemId: "missing-discipline"
                        }
                    }
                ]
            }
        })
        expect(invalid.statusCode).toBe(400)
        expect(invalid.json()).toMatchObject({
            error: "Homebrew Discipline references must target an item in this collection",
            issues: [
                {
                    message: "Homebrew Discipline references must target an item in this collection",
                    path: ["items", 1, "disciplineRef"]
                }
            ]
        })

        const duplicateIds = await app.inject({
            method: "PUT",
            url: `/homebrew/collections/${response.json().id as string}`,
            headers: csrfHeaders,
            payload: {
                ...renamed.json(),
                items: renamed.json().items.map((item: Record<string, unknown>) => ({
                    ...item,
                    id: "duplicate-item"
                }))
            }
        })
        expect(duplicateIds.statusCode).toBe(400)
    })

    it("returns the original publication provenance for copied collections", async () => {
        const sourceEntryId = await publishCollection()
        setUser(RATER_ID)
        const copied = await app.inject({
            method: "POST",
            url: `/homebrew/library/${sourceEntryId}/copy`,
            headers: csrfHeaders
        })
        expect(copied.statusCode, copied.body).toBe(201)
        const submitted = await app.inject({
            method: "POST",
            url: "/homebrew/publish-requests",
            headers: csrfHeaders,
            payload: { collectionId: copied.json().id, shareAcknowledged: true }
        })
        expect(submitted.statusCode, submitted.body).toBe(201)

        setUser(ADMIN_ID)
        const approved = await app.inject({
            method: "POST",
            url: `/admin/homebrew/publish-requests/${submitted.json().id as string}`,
            headers: csrfHeaders,
            payload: { decision: "approve" }
        })
        const detail = await app.inject({
            method: "GET",
            url: `/homebrew/library/${approved.json().libraryEntryId as string}`
        })
        expect(detail.statusCode, detail.body).toBe(200)
        expect(detail.json().source).toMatchObject({
            entryId: sourceEntryId,
            version: 1,
            name: "Night Arts",
            authorNickname: "Brewer",
            available: true
        })
    })
})
