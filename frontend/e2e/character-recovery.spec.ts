import { expect, test } from "@playwright/test"

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    test.describe(`character recovery at ${viewport.width}px`, () => {
        test.use({ viewport })
        test.beforeEach(async ({ page }) => {
            await page.route("**/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"Unauthorized"}' }))
            // Tests must not send synthetic incidents or recordings to production analytics.
            await page.route("https://info.odin-matthias.com/**", route => route.abort())
            await page.goto("/")
            const cookieClose = page.getByTestId("cookie-banner-close")
            if (await cookieClose.isVisible()) await cookieClose.click()
        })

        test("previews and confirms selective repair, keeps backup, and survives reload", async ({ page }, testInfo) => {
            const original = await page.evaluate(async () => {
                const modulePath = "/src/data/Character.ts"
                const { getEmptyCharacter } = await import(modulePath)
                const character = getEmptyCharacter()
                character.name = "Browser recovery test"
                character.notes = "Preserve private notes"
                character.attributes.strength = "invalid"
                character.attributes.dexterity = 4
                character.flaws = [
                    { name: "Valid flaw", level: 1, type: "flaw", summary: "Keep", excludes: [] },
                    { name: "Invalid flaw", level: -1, type: "flaw", summary: "Remove", excludes: [] }
                ]
                const raw = JSON.stringify(character)
                localStorage.setItem("character", raw)
                return raw
            })
            await page.reload()
            await expect(page.getByRole("dialog", { name: "Character Data Error" })).toBeVisible()
            await page.getByRole("button", { name: "Preview automatic repair" }).click()
            await expect(page.getByText("Automatic repair may cause partial data loss")).toBeVisible()
            await expect(page.getByText("Flaw: Invalid flaw will be removed")).toBeVisible()
            await expect(page.getByText('Attributes → Strength will be reset from "invalid" to 1')).toBeVisible()
            await page.screenshot({ path: testInfo.outputPath("repair-preview.png"), fullPage: true })
            expect(await page.evaluate(() => JSON.parse(localStorage.getItem("character_broken_save")!))).toBe(original)
            await page.getByRole("button", { name: "Cancel repair" }).click()
            await expect(page.getByRole("button", { name: "Confirm repair and load character" })).toHaveCount(0)
            await page.getByRole("button", { name: "Preview automatic repair" }).click()
            await page.getByRole("button", { name: "Confirm repair and load character" }).click()
            await expect(page.getByRole("dialog", { name: "Character Data Error" })).toHaveCount(0)
            await page.reload()
            await expect(page.getByRole("dialog", { name: "Character Data Error" })).toHaveCount(0)
            const stored = await page.evaluate(() => ({ character: JSON.parse(localStorage.getItem("character")!), recovery: JSON.parse(localStorage.getItem("character_recovery_saves")!) }))
            expect(stored.character.attributes.strength).toBe(1)
            expect(stored.character.attributes.dexterity).toBe(4)
            expect(stored.character.notes).toBe("Preserve private notes")
            expect(stored.character.flaws.map((flaw: { name: string }) => flaw.name)).toEqual(["Valid flaw"])
            expect(stored.recovery[0].data).toBe(original)
        })

        test("valid characters load unchanged without showing recovery", async ({ page }) => {
            const expected = await page.evaluate(async () => {
                const modulePath = "/src/data/Character.ts"
                const { getEmptyCharacter } = await import(modulePath)
                const character = getEmptyCharacter()
                character.name = "Valid custom character"
                character.notes = "Keep notes"
                character.attributes.strength = 5
                character.flaws = [{ name: "Ingrained Discipline", level: 0, type: "flaw", summary: "Custom text", excludes: ["Custom exclusion"] }]
                localStorage.setItem("character", JSON.stringify(character))
                return character
            })
            await page.reload()
            await expect(page.getByRole("dialog", { name: "Character Data Error" })).toHaveCount(0)
            expect(await page.evaluate(() => JSON.parse(localStorage.getItem("character")!))).toEqual(expected)
            expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem("character_broken_save") || '""'))).toBe(false)
        })
    })
}
