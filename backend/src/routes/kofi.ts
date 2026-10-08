import type { FastifyInstance } from "fastify"
import { timingSafeEqual } from "node:crypto"
import { env } from "../config/env.js"
import { kofiEnvelopeSchema, kofiPaymentSchema } from "../schemas/kofi.js"
import { grantKofiCrystalAccess } from "../utils/kofiCrystalAccess.js"
import { zodToFastifySchema } from "../utils/schema.js"

export async function kofiRoutes(fastify: FastifyInstance) {
    // Encapsulated parser: other API routes continue to accept their existing formats.
    fastify.addContentTypeParser(
        "application/x-www-form-urlencoded",
        { parseAs: "string" },
        (_request, body, done) => {
            const form = new URLSearchParams(body as string)
            const values = form.getAll("data")
            done(null, { data: values.length === 1 ? values[0] : "" })
        }
    )

    fastify.post<{ Body: { data: string } }>(
        "/webhooks/ko-fi",
        {
            bodyLimit: 64_000,
            config: { rateLimit: { max: 100, timeWindow: "1 minute" } },
            schema: { body: zodToFastifySchema(kofiEnvelopeSchema) }
        },
        async (request, reply) => {
            if (!env.KO_FI_VERIFICATION_TOKEN || !env.POSTHOG_MANAGEMENT_API_KEY) {
                return reply.code(503).send({ error: "Ko-fi integration not configured" })
            }
            let input: unknown
            try {
                input = JSON.parse(request.body.data)
            } catch {
                return reply.code(400).send({ error: "Invalid payment payload" })
            }
            const parsed = kofiPaymentSchema.safeParse(input)
            if (!parsed.success) return reply.code(400).send({ error: "Invalid payment payload" })
            const payment = parsed.data
            const expected = Buffer.from(env.KO_FI_VERIFICATION_TOKEN)
            const supplied = Buffer.from(payment.verification_token)
            if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
                return reply.code(401).send({ error: "Invalid verification token" })
            }
            const amount = Number(payment.amount)
            if (!Number.isFinite(amount) || amount <= 0) {
                return reply.code(400).send({ error: "Payment amount must be positive" })
            }
            try {
                await grantKofiCrystalAccess(payment.email)
            } catch {
                // Do not log tokens, donor emails or upstream response bodies.
                request.log.error("Ko-fi crystal dice grant failed; payment should be retried")
                return reply.code(503).send({ error: "Unable to grant access; retry payment" })
            }
            return { status: "ok" }
        }
    )
}
