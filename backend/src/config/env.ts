import { z } from "zod"
import { config } from "dotenv"
import { resolve } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, "../../.env") })

const envSchema = z.object({
    // WorkOS
    WORKOS_API_KEY: z.string().min(1, "WORKOS_API_KEY is required"),
    WORKOS_CLIENT_ID: z.string().min(1, "WORKOS_CLIENT_ID is required"),

    // Server
    PORT: z.string().regex(/^\d+$/).transform(Number).default(3001),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BACKEND_URL: z.url().optional(),
    FRONTEND_URL: z.url().default("http://localhost:3000"),

    // PostHog (optional)
    POSTHOG_API_KEY: z.string().optional(),
    POSTHOG_HOST: z.url().default("https://eu.i.posthog.com").optional(),

    // WorkOS AuthKit Session
    WORKOS_COOKIE_PASSWORD: z.string().min(32, "WORKOS_COOKIE_PASSWORD must be at least 32 characters"),

    // SSL (optional, for HTTPS)
    SSL_CERT_PATH: z.string().optional(),
    SSL_KEY_PATH: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
    try {
        // Parse with defaults for optional fields
        const parsed = envSchema.parse({
            ...process.env,
            POSTHOG_HOST: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
        })
        return parsed
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n")
            throw new Error(`Environment validation failed:\n${missingVars}`)
        }
        throw error
    }
}

export const env = loadEnv()
