import { expect, test } from "@playwright/test"

for (const scenario of [
    "shared",
    "owned-with-broken-list",
    "owned-with-conflict",
    "unknown"
] as const) {
    test(`${scenario}: saving preserves ownership and supports explicit copies`, async ({
        page
    }) => {
        let saved: any
        let original: any
        const creates: any[] = []
        const updates: any[] = []
        const envelope = (data: any, shared: boolean) => ({
            id: data.id,
            name: data.name,
            data,
            version: data.version,
            characterVersion: 0,
            createdAt: "2026-09-01T00:00:00Z",
            updatedAt: "2026-09-01T00:00:00Z",
            shared,
            canEdit: !shared,
            ownerId: shared ? "other-owner" : "viewer"
        })
        await page.route("https://info.odin-matthias.com/**", (route) => route.abort())
        await page.route("**/api/**", async (route) => {
            const path = new URL(route.request().url()).pathname.replace(/^\/api/, "")
            const method = route.request().method()
            const respond = (body: unknown, status = 200) =>
                route.fulfill({
                    status,
                    contentType: "application/json",
                    headers: { "X-CSRF-Token": "test-token" },
                    body: JSON.stringify(body)
                })
            if (path === "/auth/me")
                return respond({
                    id: "viewer",
                    email: "test@example.com",
                    isSuperadmin: false,
                    nameTagEnabled: false,
                    nameTagVisible: false,
                    actorIsSuperadmin: false,
                    impersonation: { active: false }
                })
            if (path === "/characters" && method === "POST") {
                const body = route.request().postDataJSON()
                creates.push(body)
                saved = envelope({ ...body.data, id: "owned-copy" }, false)
                return respond(saved)
            }
            if (path === "/characters" && method === "GET") {
                if (scenario.startsWith("owned-"))
                    return respond({ error: "List unavailable" }, 500)
                return respond([
                    ...(original && scenario === "shared" ? [envelope(original, true)] : []),
                    ...(saved ? [saved] : [])
                ])
            }
            if (path === "/characters/source") {
                if (scenario === "unknown") return respond({ error: "Not found" }, 404)
                if (method === "PUT") {
                    updates.push(route.request().postDataJSON())
                    return respond(envelope(original, false))
                }
                return respond(
                    envelope(
                        {
                            ...original,
                            characterVersion: scenario === "owned-with-conflict" ? 2 : 0
                        },
                        scenario === "shared"
                    )
                )
            }
            if (path === "/characters/owned-copy") return respond(saved)
            if (path === "/recent-changes/deliver-latest")
                return respond({ announcement: null, changes: [] })
            if (path === "/preferences") return respond({})
            return respond([])
        })
        await page.goto("/features")
        original = await page.evaluate(async () => {
            const modulePath = "/src/data/Character.ts"
            const { getEmptyCharacter } = await import(modulePath)
            const data = {
                ...getEmptyCharacter(),
                id: "source",
                name: "Ownership test",
                notes: "Keep these notes"
            }
            localStorage.setItem("character", JSON.stringify(data))
            return data
        })
        if (scenario === "unknown") {
            await page.goto("/sheet")
            await expect(page.getByRole("radio", { name: "Free", exact: true })).toBeEnabled()
        }
        await page.goto("/me")
        await page.getByRole("button", { name: "Save Current Character", exact: true }).click()
        if (scenario.startsWith("owned-")) {
            if (scenario === "owned-with-conflict") {
                await expect(
                    page.getByRole("dialog").getByText("Version Conflict", { exact: true })
                ).toBeVisible()
                expect(updates).toHaveLength(0)
                await page.getByRole("button", { name: "Overwrite DB version" }).click()
            }
            await expect.poll(() => updates.length).toBe(1)
            expect(creates).toHaveLength(0)
            await expect(
                page.getByRole("dialog", { name: "Save character", exact: true })
            ).toHaveCount(0)
        } else {
            const modal = page.getByRole("dialog", { name: "Save character", exact: true })
            await expect(modal).toBeVisible()
            expect(creates).toHaveLength(0)
            await modal.getByRole("button", { name: "OK", exact: true }).click()
            expect(creates).toHaveLength(0)
            await page.getByRole("button", { name: "Save Current Character", exact: true }).click()
            await modal.getByRole("button", { name: "Save as copy", exact: true }).click()
            await expect(modal).toHaveCount(0)
            await expect.poll(() => creates.length).toBe(1)
            expect(updates).toHaveLength(0)
            expect(creates[0].data).toMatchObject({
                id: "",
                characterVersion: 0,
                notes: "Keep these notes"
            })
            expect(
                await page.evaluate(() => JSON.parse(localStorage.getItem("character")!).id)
            ).toBe("owned-copy")
        }
        await page.goto("/sheet")
        await expect(page.getByRole("radio", { name: "Free", exact: true })).toBeEnabled()
    })
}
