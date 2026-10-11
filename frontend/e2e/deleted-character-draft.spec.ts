import { expect, test } from "@playwright/test"

for (const action of ["restore", "delete"] as const) {
    test(`missing saved character: ${action} recovers the active local draft`, async ({ page }) => {
        const creates: any[] = []
        let restored: any
        await page.route("https://info.odin-matthias.com/**", (route) => route.abort())
        await page.route("**/api/**", async (route) => {
            const path = new URL(route.request().url()).pathname.replace(/^\/api/, "")
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
                    actorIsSuperadmin: false,
                    impersonation: { active: false }
                })
            if (path === "/characters/deleted")
                return respond({ error: "Character not found" }, 404)
            if (path === "/characters" && route.request().method() === "POST") {
                const payload = route.request().postDataJSON()
                creates.push(payload)
                restored = {
                    id: "restored",
                    name: payload.name,
                    data: { ...payload.data, id: "restored", characterVersion: 1 },
                    version: payload.version,
                    characterVersion: 1,
                    createdAt: "2026-10-11",
                    updatedAt: "2026-10-11",
                    canEdit: true,
                    shared: false
                }
                return respond(restored)
            }
            if (path === "/characters/restored") return respond(restored)
            if (path === "/characters") return respond(restored ? [restored] : [])
            if (path === "/recent-changes/deliver-latest")
                return respond({ announcement: null, changes: [] })
            if (path === "/preferences") return respond({})
            return respond([])
        })
        await page.goto("/features")
        await page.evaluate(async () => {
            const modulePath = "/src/data/Character.ts"
            const { getEmptyCharacter } = await import(modulePath)
            localStorage.setItem(
                "character",
                JSON.stringify({
                    ...getEmptyCharacter(),
                    id: "deleted",
                    name: "Recovery test",
                    characterVersion: 8,
                    notes: "Keep these notes"
                })
            )
        })
        await page.goto("/")
        const dialog = page.getByRole("dialog", { name: "Saved character is missing" })
        await expect(dialog).toBeVisible({ timeout: 15_000 })
        await dialog
            .getByRole("button", {
                name: action === "restore" ? "Restore character" : "Delete local draft",
                exact: true
            })
            .click()
        await expect(dialog).toHaveCount(0)
        if (action === "restore") {
            expect(creates).toHaveLength(1)
            expect(creates[0].data).toMatchObject({
                id: "",
                characterVersion: 0,
                notes: "Keep these notes"
            })
            expect(
                await page.evaluate(() => JSON.parse(localStorage.getItem("character")!))
            ).toMatchObject({ id: "restored", notes: "Keep these notes" })
        } else {
            expect(creates).toHaveLength(0)
            expect(await page.evaluate(() => localStorage.getItem("character"))).toBeNull()
        }
    })
}
