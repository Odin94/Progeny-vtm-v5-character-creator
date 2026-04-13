import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { buildApp } from "./app.js"

describe("GET /health", () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it("returns 200 with status ok", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/health",
        })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ status: "ok" })
    })
})
