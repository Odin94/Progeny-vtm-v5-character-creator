import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { eq, sql } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"

const workosMock = vi.hoisted(() => ({
    user: {
        id: "recent-changes-admin",
        email: "recent-changes-admin@progeny.invalid",
        firstName: "Admin",
        lastName: "User"
    }
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

const ADMIN_ID = "recent-changes-admin"
const USER_ID = "recent-changes-user"
const OTHER_USER_ID = "recent-changes-other-user"
const csrfHeaders = {
    cookie: "wos-session=fake; csrf-token=test-csrf",
    "x-csrf-token": "test-csrf"
}

const setWorkosUser = (id: string, email: string) => {
    workosMock.user = { id, email, firstName: "Test", lastName: "User" }
}

const assertSafeTestDatabase = () => {
    if (process.env.NODE_ENV !== "test" || process.env.DATABASE_URL !== ":memory:") {
        throw new Error("Refusing to run recent changes tests outside the in-memory test database")
    }
}

describe("recent changes", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        assertSafeTestDatabase()
        await db.run(
            sql.raw(`CREATE TABLE IF NOT EXISTS users (
                id text PRIMARY KEY NOT NULL,
                email text NOT NULL UNIQUE,
                first_name text,
                last_name text,
                nickname text UNIQUE,
                preferences text,
                is_superadmin integer DEFAULT false NOT NULL,
                name_tag_enabled integer DEFAULT false NOT NULL,
                name_tag_visible integer DEFAULT false NOT NULL,
                created_at integer DEFAULT (unixepoch()) NOT NULL,
                updated_at integer DEFAULT (unixepoch()) NOT NULL
            )`)
        )
        await db.run(
            sql.raw(`CREATE TABLE IF NOT EXISTS recent_changes (
                id text PRIMARY KEY NOT NULL,
                title text NOT NULL,
                body text NOT NULL,
                image_url text,
                status text DEFAULT 'draft' NOT NULL,
                created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
                published_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
                published_at integer,
                created_at integer DEFAULT (unixepoch()) NOT NULL,
                updated_at integer DEFAULT (unixepoch()) NOT NULL
            )`)
        )
        await db.run(
            sql.raw(`CREATE TABLE IF NOT EXISTS recent_change_deliveries (
                id text PRIMARY KEY NOT NULL,
                user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recent_change_id text NOT NULL REFERENCES recent_changes(id) ON DELETE CASCADE,
                delivered_at integer DEFAULT (unixepoch()) NOT NULL,
                UNIQUE(user_id, recent_change_id)
            )`)
        )
        app = await buildApp()
        await app.ready()
    })

    beforeEach(async () => {
        setWorkosUser(ADMIN_ID, "recent-changes-admin@progeny.invalid")
        await db.delete(schema.recentChangeDeliveries)
        await db.delete(schema.recentChanges)
        await db.delete(schema.users).where(eq(schema.users.id, ADMIN_ID))
        await db.delete(schema.users).where(eq(schema.users.id, USER_ID))
        await db.delete(schema.users).where(eq(schema.users.id, OTHER_USER_ID))
        await db.insert(schema.users).values([
            {
                id: ADMIN_ID,
                email: "recent-changes-admin@progeny.invalid",
                isSuperadmin: true
            },
            { id: USER_ID, email: "recent-changes-user@progeny.invalid" },
            { id: OTHER_USER_ID, email: "recent-changes-other-user@progeny.invalid" }
        ])
    })

    afterAll(async () => {
        await app.close()
    })

    it("delivers only the latest published change once per user", async () => {
        await db.insert(schema.recentChanges).values([
            {
                id: "old-change",
                title: "Older update",
                body: "Old body",
                status: "published",
                publishedAt: new Date("2026-01-01T00:00:00.000Z")
            },
            {
                id: "latest-change",
                title: "Latest update",
                body: "Latest body",
                status: "published",
                publishedAt: new Date("2026-02-01T00:00:00.000Z")
            }
        ])
        setWorkosUser(USER_ID, "recent-changes-user@progeny.invalid")

        const history = await app.inject({
            method: "GET",
            url: "/recent-changes/history",
            headers: csrfHeaders
        })
        expect(history.json().changes.map((change: { id: string }) => change.id)).toEqual([
            "old-change",
            "latest-change"
        ])

        const firstDelivery = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(firstDelivery.statusCode).toBe(200)
        expect(firstDelivery.json().announcement).toMatchObject({ id: "latest-change" })
        expect(firstDelivery.json().changes.map((change: { id: string }) => change.id)).toEqual([
            "old-change",
            "latest-change"
        ])

        const repeatedDelivery = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(repeatedDelivery.statusCode).toBe(200)
        expect(repeatedDelivery.json()).toEqual({ announcement: null, changes: [] })

        setWorkosUser(OTHER_USER_ID, "recent-changes-other-user@progeny.invalid")
        const otherUserDelivery = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(otherUserDelivery.json().announcement).toMatchObject({ id: "latest-change" })
    })

    it("keeps drafts private until a superadmin publishes them", async () => {
        const createDraft = await app.inject({
            method: "POST",
            url: "/admin/recent-changes",
            headers: csrfHeaders,
            payload: {
                title: "New feature",
                body: "It is ready.",
                imageUrl: "https://example.com/new-feature.jpg"
            }
        })
        expect(createDraft.statusCode).toBe(201)
        expect(createDraft.json()).toMatchObject({
            status: "draft",
            imageUrl: "https://example.com/new-feature.jpg"
        })

        setWorkosUser(USER_ID, "recent-changes-user@progeny.invalid")
        const beforePublish = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(beforePublish.json()).toEqual({ announcement: null, changes: [] })

        setWorkosUser(ADMIN_ID, "recent-changes-admin@progeny.invalid")
        const publish = await app.inject({
            method: "POST",
            url: `/admin/recent-changes/${createDraft.json().id}/publish`,
            headers: csrfHeaders
        })
        expect(publish.statusCode).toBe(200)
        expect(publish.json()).toMatchObject({ status: "published", title: "New feature" })

        setWorkosUser(USER_ID, "recent-changes-user@progeny.invalid")
        const afterPublish = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(afterPublish.json().announcement).toMatchObject({ title: "New feature" })
    })

    it("removes soft-deleted updates from delivery and history before permanent deletion", async () => {
        await db.insert(schema.recentChanges).values({
            id: "deleted-change",
            title: "Removed update",
            body: "This should not be visible.",
            status: "published",
            publishedAt: new Date("2026-03-01T00:00:00.000Z")
        })

        const softDelete = await app.inject({
            method: "POST",
            url: "/admin/recent-changes/deleted-change/delete",
            headers: csrfHeaders
        })
        expect(softDelete.statusCode).toBe(200)
        expect(softDelete.json()).toMatchObject({ status: "deleted" })

        setWorkosUser(USER_ID, "recent-changes-user@progeny.invalid")
        const history = await app.inject({
            method: "GET",
            url: "/recent-changes/history",
            headers: csrfHeaders
        })
        expect(history.json()).toEqual({ changes: [] })

        const delivery = await app.inject({
            method: "POST",
            url: "/recent-changes/deliver-latest",
            headers: csrfHeaders
        })
        expect(delivery.json()).toEqual({ announcement: null, changes: [] })

        setWorkosUser(ADMIN_ID, "recent-changes-admin@progeny.invalid")
        const permanentlyDelete = await app.inject({
            method: "DELETE",
            url: "/admin/recent-changes/deleted-change",
            headers: csrfHeaders
        })
        expect(permanentlyDelete.statusCode).toBe(204)

        const adminChanges = await app.inject({
            method: "GET",
            url: "/admin/recent-changes",
            headers: csrfHeaders
        })
        expect(adminChanges.json()).toEqual({ changes: [] })
    })
})
