import { expect, test } from "@playwright/test"

import legacyCharacter from "../src/test/jsonExports/v3.json" with { type: "json" }

test("a short roller keeps a settled row of legacy dice fully visible", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 640 })
    const character = {
        ...legacyCharacter,
        id: "",
        attributes: { ...legacyCharacter.attributes, strength: 3 },
        ephemeral: { hunger: 3 }
    }
    await page.addInitScript((character) => {
        localStorage.setItem("character", JSON.stringify(character))
        localStorage.setItem("use-legacy-dice", "true")
        localStorage.setItem("characterSheetMode", JSON.stringify("play"))
    }, character)
    await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: {} }))
    await page.goto("/sheet")
    const cookieClose = page.getByTestId("cookie-banner-close")
    if (await cookieClose.isVisible()) await cookieClose.click()

    await page.getByText("Strength", { exact: true }).click()
    // Always land a 1 so the tallest result state (with its reroll controls) is reproducible.
    await page.evaluate(() => {
        const randomValues = crypto.getRandomValues.bind(crypto)
        crypto.getRandomValues = (values) => {
            if (values instanceof Uint32Array && values.length === 1) {
                values[0] = 0
                return values
            }
            return randomValues(values)
        }
    })
    const roller = page.getByRole("dialog", { name: "Dice roller" })
    await roller.getByRole("button", { name: "Roll 3 dice", exact: true }).click()
    await expect(roller.getByText("Bestial failure", { exact: true })).toBeVisible()

    const board = roller.getByTestId("dice-results-scroll-area")
    await expect
        .poll(() => board.evaluate((element) => element.clientHeight))
        .toBe(
            await board
                .getByTestId("dice-results-content")
                .evaluate((element) => element.clientHeight)
        )
})
