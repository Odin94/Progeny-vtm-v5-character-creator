import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { sql, eq } from "drizzle-orm"
import { buildApp } from "./app.js"
import { db, schema } from "./db/index.js"
import { expireImpersonationSessionForTests } from "./middleware/impersonation.js"
import { clearUserActivityForTests } from "./middleware/userActivity.js"

const workosMock = vi.hoisted(() => ({
    user: {
        id: "test-admin",
        email: "test-superadmin@progeny.invalid",
        firstName: "Admin",
        lastName: "User"
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

const ADMIN_ID = "test-admin"
const TARGET_ID = "test-target"
const OTHER_ID = "test-other"
const ADMIN_EMAIL = "test-superadmin@progeny.invalid"
const TARGET_EMAIL = "test-target@progeny.invalid"
const OTHER_EMAIL = "test-other@progeny.invalid"
const TEST_USER_IDS = [ADMIN_ID, TARGET_ID, OTHER_ID]
const TEST_USER_EMAILS = [ADMIN_EMAIL, TARGET_EMAIL, OTHER_EMAIL]

const csrfHeaders = {
    cookie: "wos-session=fake; csrf-token=test-csrf",
    "x-csrf-token": "test-csrf"
}

const setWorkosUser = (id: string, email: string) => {
    workosMock.user = {
        id,
        email,
        firstName: id === ADMIN_ID ? "Admin" : "Regular",
        lastName: "User"
    }
}

const assertSafeTestDatabase = () => {
    if (process.env.NODE_ENV !== "test" || process.env.DATABASE_URL !== ":memory:") {
        throw new Error(
            "Refusing to run superadmin tests outside NODE_ENV=test with DATABASE_URL=:memory:"
        )
    }
}

const cleanupTestUsers = async () => {
    for (const userId of TEST_USER_IDS) {
        await db
            .delete(schema.impersonationSessions)
            .where(eq(schema.impersonationSessions.superadminUserId, userId))
        await db
            .delete(schema.impersonationSessions)
            .where(eq(schema.impersonationSessions.impersonatedUserId, userId))
        await db.delete(schema.users).where(eq(schema.users.id, userId))
    }

    for (const email of TEST_USER_EMAILS) {
        await db.delete(schema.users).where(eq(schema.users.email, email))
    }
}

const cookieHeaderWith = (setCookieHeader: string | string[] | undefined) => {
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""]
    const impersonationCookie = headers
        .find((header) => header.startsWith("impersonation-session="))
        ?.split(";")[0]

    return `${csrfHeaders.cookie}; ${impersonationCookie}`
}

describe("superadmin impersonation", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        assertSafeTestDatabase()

        await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS users (
            id text PRIMARY KEY NOT NULL,
            email text NOT NULL UNIQUE,
            first_name text,
            last_name text,
            nickname text UNIQUE,
            preferences text,
            is_superadmin integer DEFAULT false NOT NULL,
            created_at integer DEFAULT (unixepoch()) NOT NULL,
            updated_at integer DEFAULT (unixepoch()) NOT NULL
        )`))
        await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS impersonation_sessions (
            id text PRIMARY KEY NOT NULL,
            superadmin_user_id text NOT NULL REFERENCES users(id),
            impersonated_user_id text NOT NULL REFERENCES users(id),
            started_at integer NOT NULL DEFAULT (unixepoch()),
            expires_at integer NOT NULL,
            ended_at integer,
            ended_reason text,
            audit_log text NOT NULL DEFAULT '[]'
        )`))

        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await cleanupTestUsers()
        await app.close()
    })

    beforeEach(async () => {
        setWorkosUser(ADMIN_ID, ADMIN_EMAIL)
        clearUserActivityForTests()

        await cleanupTestUsers()

        await db.insert(schema.users).values([
            {
                id: ADMIN_ID,
                email: ADMIN_EMAIL,
                firstName: "Admin",
                lastName: "User",
                isSuperadmin: true
            },
            {
                id: TARGET_ID,
                email: TARGET_EMAIL,
                firstName: "Target",
                lastName: "User"
            },
            {
                id: OTHER_ID,
                email: OTHER_EMAIL,
                firstName: "Other",
                lastName: "User"
            }
        ])
    })

    it("rejects admin routes for non-superadmins", async () => {
        setWorkosUser(TARGET_ID, TARGET_EMAIL)

        const response = await app.inject({
            method: "GET",
            url: "/admin/users",
            headers: csrfHeaders
        })

        expect(response.statusCode).toBe(403)
    })

    it("lists users and toggles superadmin status", async () => {
        const listResponse = await app.inject({
            method: "GET",
            url: "/admin/users?query=target",
            headers: csrfHeaders
        })
        expect(listResponse.statusCode).toBe(200)
        expect(listResponse.json().users).toHaveLength(1)
        expect(listResponse.json().users[0].id).toBe(TARGET_ID)

        const toggleResponse = await app.inject({
            method: "PATCH",
            url: `/admin/users/${TARGET_ID}/superadmin`,
            headers: csrfHeaders,
            payload: { isSuperadmin: true }
        })
        expect(toggleResponse.statusCode).toBe(200)
        expect(toggleResponse.json().isSuperadmin).toBe(true)
    })

    it("shows users active after recent authenticated activity", async () => {
        setWorkosUser(TARGET_ID, TARGET_EMAIL)
        await app.inject({
            method: "GET",
            url: "/admin/users",
            headers: csrfHeaders
        })

        setWorkosUser(ADMIN_ID, ADMIN_EMAIL)
        const listResponse = await app.inject({
            method: "GET",
            url: "/admin/users?query=target",
            headers: csrfHeaders
        })

        expect(listResponse.statusCode).toBe(200)
        expect(listResponse.json().users[0]).toMatchObject({
            id: TARGET_ID,
            isActive: true
        })
        expect(listResponse.json().users[0].lastActiveAt).toEqual(expect.any(String))
    })

    it("starts and stops impersonation", async () => {
        const startResponse = await app.inject({
            method: "POST",
            url: "/admin/impersonation",
            headers: csrfHeaders,
            payload: { userId: TARGET_ID }
        })
        expect(startResponse.statusCode).toBe(201)

        const impersonationCookie = cookieHeaderWith(startResponse.headers["set-cookie"])
        const meResponse = await app.inject({
            method: "GET",
            url: "/auth/me",
            headers: { cookie: impersonationCookie }
        })
        expect(meResponse.statusCode).toBe(200)
        expect(meResponse.json().id).toBe(TARGET_ID)
        expect(meResponse.json().impersonation.active).toBe(true)
        expect(meResponse.json().impersonation.actorUser.id).toBe(ADMIN_ID)

        const stopResponse = await app.inject({
            method: "POST",
            url: "/admin/impersonation/stop",
            headers: {
                cookie: impersonationCookie,
                "x-csrf-token": "test-csrf"
            }
        })
        expect(stopResponse.statusCode).toBe(200)
        expect(stopResponse.json().stopped).toBe(true)
    })

    it("expires impersonation sessions after the in-memory TTL", async () => {
        const startResponse = await app.inject({
            method: "POST",
            url: "/admin/impersonation",
            headers: csrfHeaders,
            payload: { userId: TARGET_ID }
        })
        const sessionId = startResponse.json().sessionId
        expireImpersonationSessionForTests(sessionId)

        const meResponse = await app.inject({
            method: "GET",
            url: "/auth/me",
            headers: { cookie: cookieHeaderWith(startResponse.headers["set-cookie"]) }
        })

        expect(meResponse.statusCode).toBe(200)
        expect(meResponse.json().id).toBe(ADMIN_ID)
        expect(meResponse.json().impersonation.active).toBe(false)

        const session = await db.query.impersonationSessions.findFirst({
            where: eq(schema.impersonationSessions.id, sessionId)
        })
        expect(session?.endedReason).toBe("expired")
    })

    it("appends concurrent mutating REST calls to the impersonation audit log", async () => {
        const startResponse = await app.inject({
            method: "POST",
            url: "/admin/impersonation",
            headers: csrfHeaders,
            payload: { userId: TARGET_ID }
        })
        const sessionId = startResponse.json().sessionId
        const cookie = cookieHeaderWith(startResponse.headers["set-cookie"])

        const [redResponse, greyResponse] = await Promise.all([
            app.inject({
                method: "PUT",
                url: "/auth/preferences",
                headers: {
                    cookie,
                    "x-csrf-token": "test-csrf"
                },
                payload: { colorTheme: "red" }
            }),
            app.inject({
                method: "PUT",
                url: "/auth/preferences",
                headers: {
                    cookie,
                    "x-csrf-token": "test-csrf"
                },
                payload: { colorTheme: "blue" }
            })
        ])

        expect(redResponse.statusCode).toBe(200)
        expect(greyResponse.statusCode).toBe(200)

        const session = await db.query.impersonationSessions.findFirst({
            where: eq(schema.impersonationSessions.id, sessionId)
        })
        const auditLog = JSON.parse(session!.auditLog)
        expect(
            auditLog.filter((entry: { url?: string }) => entry.url === "/auth/preferences")
        ).toHaveLength(2)
    })
})
