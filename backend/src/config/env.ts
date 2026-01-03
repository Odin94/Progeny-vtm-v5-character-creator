import { z } from "zod"

const envSchema = z.object({
  // WorkOS
  WORKOS_API_KEY: z.string().min(1, "WORKOS_API_KEY is required"),
  WORKOS_CLIENT_ID: z.string().min(1, "WORKOS_CLIENT_ID is required"),

  // Server
  PORT: z.string().regex(/^\d+$/).transform(Number).default("3001"),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // PostHog (optional)
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default("https://app.posthog.com").optional(),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  try {
    // Parse with defaults for optional fields
    const parsed = envSchema.parse({
      ...process.env,
      POSTHOG_HOST: process.env.POSTHOG_HOST || "https://app.posthog.com",
    })
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n")
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

export const env = loadEnv()
