import { z } from "zod"

export const kofiEnvelopeSchema = z.object({ data: z.string().min(1).max(64_000) })

export const kofiPaymentSchema = z.object({
    verification_token: z.string().min(1),
    message_id: z.string().min(1).max(200),
    email: z.email().max(254),
    amount: z.string().regex(/^\d+(\.\d+)?$/),
    type: z.enum(["Donation", "Subscription", "Shop Order", "Commission"])
})
