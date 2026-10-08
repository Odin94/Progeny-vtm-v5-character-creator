import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildApp } from "./app.js"
import { env } from "./config/env.js"

const payment = {
    verification_token: "test-kofi-token",
    message_id: "payment-1",
    email: "Supporter+Dice@example.com",
    amount: "3.00",
    type: "Donation"
}
const originalFilters = {
    groups: [
        {
            properties: [
                { key: "email", type: "person", operator: "exact", value: ["existing@example.com"] }
            ],
            rollout_percentage: 100
        }
    ],
    payloads: { true: "preserve-me" }
}
const flag = { key: "vampire-3d-dice", active: true, version: 5, filters: originalFilters }

describe("Ko-fi crystal dice webhook", () => {
    let app: Awaited<ReturnType<typeof buildApp>>
    const savedToken = env.KO_FI_VERIFICATION_TOKEN
    const savedApiKey = env.POSTHOG_MANAGEMENT_API_KEY
    const upstream = vi.fn<typeof fetch>()

    beforeEach(async () => {
        env.KO_FI_VERIFICATION_TOKEN = "test-kofi-token"
        env.POSTHOG_MANAGEMENT_API_KEY = "test-management-key"
        upstream.mockReset()
        vi.stubGlobal("fetch", upstream)
        app = await buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
        env.KO_FI_VERIFICATION_TOKEN = savedToken
        env.POSTHOG_MANAGEMENT_API_KEY = savedApiKey
        vi.unstubAllGlobals()
    })

    const send = (payload: unknown = payment) =>
        app.inject({
            method: "POST",
            url: "/webhooks/ko-fi",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            payload: new URLSearchParams({ data: JSON.stringify(payload) }).toString()
        })

    it("accepts real form encoding without CSRF and preserves existing flag rules", async () => {
        upstream.mockResolvedValueOnce(Response.json(flag)).mockResolvedValueOnce(Response.json({}))
        const response = await send()
        expect(response.statusCode).toBe(200)
        const update = JSON.parse(upstream.mock.calls[1][1]!.body as string)
        expect(update.version).toBe(5)
        expect(update.original_flag.filters).toEqual(originalFilters)
        expect(update.filters.payloads).toEqual(originalFilters.payloads)
        expect(update.filters.groups[0]).toEqual(originalFilters.groups[0])
        const condition = update.filters.groups[1]
        expect(condition.rollout_percentage).toBe(100)
        expect(condition.properties[0].value).toBe("(?i)^supporter\\+dice@example\\.com$")
        // Verify escaping/anchoring prevents plus/dot regex metacharacters broadening access.
        const pattern = new RegExp(condition.properties[0].value.slice(4), "i")
        expect(pattern.test(payment.email)).toBe(true)
        expect(pattern.test("supporterrrdice@exampleXcom")).toBe(false)
        expect(pattern.test(`prefix${payment.email}`)).toBe(false)
    })

    it("does not write another rule for a repeated delivery", async () => {
        upstream.mockResolvedValueOnce(
            Response.json({
                ...flag,
                filters: {
                    groups: [
                        {
                            properties: [
                                {
                                    key: "email",
                                    type: "person",
                                    operator: "regex",
                                    value: "(?i)^supporter\\+dice@example\\.com$"
                                }
                            ],
                            rollout_percentage: 100
                        }
                    ]
                }
            })
        )
        expect((await send()).statusCode).toBe(200)
        expect(upstream).toHaveBeenCalledTimes(1)
    })

    it("re-reads after a concurrent update and preserves the other donation", async () => {
        const otherDonor = {
            properties: [
                { key: "email", type: "person", operator: "exact", value: "other@example.com" }
            ],
            rollout_percentage: 100
        }
        upstream
            .mockResolvedValueOnce(Response.json(flag))
            .mockResolvedValueOnce(Response.json({}, { status: 409 }))
            .mockResolvedValueOnce(
                Response.json({
                    ...flag,
                    version: 6,
                    filters: { ...originalFilters, groups: [...originalFilters.groups, otherDonor] }
                })
            )
            .mockResolvedValueOnce(Response.json({}))
        expect((await send()).statusCode).toBe(200)
        const update = JSON.parse(upstream.mock.calls[3][1]!.body as string)
        expect(update.version).toBe(6)
        expect(update.filters.groups[1]).toEqual(otherDonor)
    })

    it.each(["", "wrong-token", "x".repeat(100)])(
        "rejects an invalid verification token before calling PostHog (%s)",
        async (token) => {
            expect([400, 401]).toContain(
                (await send({ ...payment, verification_token: token })).statusCode
            )
            expect(upstream).not.toHaveBeenCalled()
        }
    )

    it.each(["0", "-3", "NaN"])(
        "does not grant an invalid/nonpositive payment (%s)",
        async (amount) => {
            expect((await send({ ...payment, amount })).statusCode).toBe(400)
            expect(upstream).not.toHaveBeenCalled()
        }
    )

    it("rejects malformed JSON without reflecting sensitive fields", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/webhooks/ko-fi",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            payload: "data=%7Bbad-json"
        })
        expect(response.statusCode).toBe(400)
        expect(response.body).not.toContain("bad-json")
        expect(upstream).not.toHaveBeenCalled()
    })

    it("fails closed when not configured", async () => {
        env.KO_FI_VERIFICATION_TOKEN = undefined
        expect((await send()).statusCode).toBe(503)
        expect(upstream).not.toHaveBeenCalled()
    })

    it("returns retryable failure instead of acknowledging a failed grant", async () => {
        upstream.mockResolvedValueOnce(Response.json({}, { status: 403 }))
        expect((await send()).statusCode).toBe(503)
        expect(upstream).toHaveBeenCalledTimes(1)
    })

    it("never updates a wrong or disabled flag", async () => {
        upstream.mockResolvedValueOnce(Response.json({ ...flag, key: "another-flag" }))
        expect((await send()).statusCode).toBe(503)
        expect(upstream).toHaveBeenCalledTimes(1)
    })

    it("keeps CSRF protection on other mutation routes", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/characters?webhook=ko-fi",
            payload: {}
        })
        expect(response.statusCode).toBe(403)
        expect(upstream).not.toHaveBeenCalled()
    })
})
