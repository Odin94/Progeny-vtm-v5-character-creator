import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        // Provide minimal env vars for CI environments without a .env file.
        // In local dev the real .env file takes precedence via dotenv.
        env: {
            WORKOS_API_KEY: "test-api-key",
            WORKOS_CLIENT_ID: "test-client-id",
            WORKOS_COOKIE_PASSWORD: "test-cookie-password-minimum-32-chars!",
            NODE_ENV: "test",
        },
    },
})
