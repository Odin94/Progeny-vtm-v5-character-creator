import { describe, expect, it } from "vitest"
import { customDisciplineSchema, sanitizeCustomDisciplineLogoUrl } from "~/data/Disciplines"

describe("custom discipline logo URLs", () => {
    it("keeps http and https logo URLs", () => {
        expect(sanitizeCustomDisciplineLogoUrl(" https://example.com/logo.png ")).toBe(
            "https://example.com/logo.png"
        )
        expect(sanitizeCustomDisciplineLogoUrl("http://example.com/logo.svg")).toBe(
            "http://example.com/logo.svg"
        )
    })

    it("removes non-web URL schemes", () => {
        expect(sanitizeCustomDisciplineLogoUrl("javascript:alert(1)")).toBe("")
        expect(
            sanitizeCustomDisciplineLogoUrl(
                "data:image/svg+xml,<svg><script>alert(1)</script></svg>"
            )
        ).toBe("")
        expect(sanitizeCustomDisciplineLogoUrl("file:///C:/secret.png")).toBe("")
    })

    it("normalizes unsafe schema input to an empty logo", () => {
        const parsed = customDisciplineSchema.parse({
            name: "Chronomancy",
            summary: "Time tricks",
            logo: "javascript:alert(1)"
        })

        expect(parsed.logo).toBe("")
    })
})
