import { createRequire } from "node:module"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { db, schema } from "./db/index.js"
import { buildApp } from "./app.js"

const auth = vi.hoisted(() => ({ userId: "concurrency-owner" }))
vi.mock("./config/workos.js", () => ({
    WORKOS_CLIENT_ID: "test-client-id",
    workos: {
        userManagement: {
            loadSealedSession: () => ({
                authenticate: async () => ({
                    authenticated: auth.userId !== "unauthorized",
                    user: { id: auth.userId, email: `${auth.userId}@example.invalid` }
                }),
                refresh: async () => ({ authenticated: false })
            })
        }
    }
}))
vi.mock("./utils/tracker.js", () => ({ trackEvent: vi.fn(async () => undefined) }))
const headers = {
    host: "localhost",
    "x-forwarded-for": "127.0.0.1",
    cookie: "wos-session=fake; csrf-token=test-csrf",
    "x-csrf-token": "test-csrf"
}
let app: Awaited<ReturnType<typeof buildApp>>
let characterId: string
let wsUrl: string
const require = createRequire(import.meta.url)
const WebSocket = createRequire(require.resolve("@fastify/websocket"))("ws")
const connect = async (cookie = true) => {
    const socket = new WebSocket(wsUrl, { headers: cookie ? headers : {} })
    await new Promise<void>((resolve, reject) => {
        socket.once("open", resolve)
        socket.once("error", reject)
    })
    return socket
}
const receive = (socket: { once: Function }) =>
    new Promise<any>((resolve) =>
        socket.once("message", (data: Buffer) => resolve(JSON.parse(data.toString())))
    )

beforeAll(async () => {
    if (process.env.NODE_ENV !== "test" || process.env.DATABASE_URL !== ":memory:")
        throw new Error("Tests require an in-memory database")
    migrate(db, { migrationsFolder: "src/db/migrations" })
    await db.insert(schema.users).values([
        { id: "concurrency-owner", email: "owner@example.invalid" },
        { id: "concurrency-reader", email: "reader@example.invalid" }
    ])
    app = await buildApp()
    await app.ready()
    wsUrl =
        (await app.listen({ port: 0, host: "127.0.0.1" })).replace("http:", "ws:") +
        "/ws/characters"
    const response = await app.inject({
        method: "POST",
        url: "/characters",
        headers,
        payload: { name: "Test", data: { name: "Test", notes: "base" }, version: 11 }
    })
    expect(response.statusCode).toBe(201)
    characterId = response.json().id
    await db.insert(schema.characterShares).values({
        id: "concurrency-share",
        characterId,
        sharedWithUserId: "concurrency-reader",
        sharedById: "concurrency-owner"
    })
})
afterAll(async () => {
    await app?.close()
})

describe("character save concurrency and socket transport", () => {
    it("requires a revision and refuses a stale whole-document save", async () => {
        const save = (characterVersion: number, notes: string) =>
            app.inject({
                method: "PUT",
                url: `/characters/${characterId}`,
                headers,
                payload: { characterVersion, data: { name: "Test", notes }, version: 11 }
            })
        expect(
            (
                await app.inject({
                    method: "PUT",
                    url: `/characters/${characterId}`,
                    headers,
                    payload: { data: { notes: "unconditional" } }
                })
            ).statusCode
        ).toBe(400)
        expect((await save(0, "newer note")).statusCode).toBe(200)
        expect((await save(0, "stale note")).statusCode).toBe(409)
        const saved = await app.inject({ url: `/characters/${characterId}`, headers })
        expect(saved.json().data.notes).toBe("newer note")
        expect(saved.json().data.characterVersion).toBe(1)
    })
    it("authenticates an actual socket and validates updates with the REST revision contract", async () => {
        auth.userId = "concurrency-owner"
        const socket = await connect()
        let response = receive(socket)
        socket.send(JSON.stringify({ type: "subscribe", characterId }))
        expect(await response).toMatchObject({ type: "subscribed", characterId })
        response = receive(socket)
        socket.send(
            JSON.stringify({
                type: "character_update",
                characterId,
                characterVersion: 1,
                data: { name: "Test", notes: "socket saved" },
                version: 11
            })
        )
        expect(await response).toMatchObject({ type: "update_confirmed", characterVersion: 2 })
        response = receive(socket)
        socket.send(
            JSON.stringify({
                type: "character_update",
                characterId,
                characterVersion: 1,
                data: { notes: "stale" },
                version: 11
            })
        )
        expect(await response).toMatchObject({ status: 409 })
        response = receive(socket)
        socket.send(
            JSON.stringify({
                type: "character_update",
                characterId,
                characterVersion: 2,
                data: { name: 123 },
                version: -1
            })
        )
        expect(await response).toMatchObject({ status: 400 })
        response = receive(socket)
        socket.send(JSON.stringify({ type: "unsubscribe", characterId }))
        expect(await response).toMatchObject({ type: "unsubscribed" })
        socket.close()
        const saved = await app.inject({ url: `/characters/${characterId}`, headers })
        expect(saved.json().data.notes).toBe("socket saved")
        expect(saved.json().characterVersion).toBe(2)
    })
    it("lets shared readers subscribe but blocks their updates", async () => {
        auth.userId = "concurrency-reader"
        const socket = await connect()
        let response = receive(socket)
        socket.send(JSON.stringify({ type: "subscribe", characterId }))
        expect(await response).toMatchObject({ type: "subscribed" })
        response = receive(socket)
        socket.send(
            JSON.stringify({
                type: "character_update",
                characterId,
                characterVersion: 2,
                data: { notes: "reader edit" }
            })
        )
        expect((await response).error).toContain("Forbidden")
        socket.close()
    })
    it("closes unauthorized sockets with policy violation", async () => {
        auth.userId = "unauthorized"
        const socket = await connect(false)
        const code = await new Promise((resolve) => socket.once("close", resolve))
        expect(code).toBe(1008)
        auth.userId = "concurrency-owner"
    })
})
