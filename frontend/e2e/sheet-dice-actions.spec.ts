import { expect, test } from "@playwright/test"
import savedCharacter from "../src/test/jsonExports/v3.json" with { type: "json" }

test.use({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
})

test.beforeEach(async ({ page }) => {
    const character = {
        ...savedCharacter,
        id: "",
        ephemeral: { ...savedCharacter.ephemeral, hunger: 1 },
        skillSpecialties: [{ skill: "athletics", name: "Climbing" }]
    }
    await page.addInitScript((data) => {
        localStorage.setItem("character", JSON.stringify(data))
        localStorage.setItem("use-legacy-dice", "false")
    }, character)
    await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: {} }))
    await page.goto("/sheet")
    await page.getByTestId("cookie-banner-close").click()
})

test("padded modifier rows toggle through their native checkboxes", async ({ page }) => {
    await page.getByText("Strength", { exact: true }).click()
    await page.getByText("Athletics", { exact: true }).click()
    for (const name of [/Blood Surge/, /^Climbing$/]) {
        const checkbox = page.getByRole("checkbox", { name })
        const row = page.locator(".mantine-Checkbox-root").filter({ has: checkbox }).first()
        const bounds = await row.boundingBox()
        if (!bounds) throw new Error("Modifier row is outside the viewport")
        await page.mouse.click(bounds.x + bounds.width - 4, bounds.y + 4)
        await expect(checkbox).toBeChecked()
        await page.mouse.click(bounds.x + 4, bounds.y + 4)
        await expect(checkbox).not.toBeChecked()
        await checkbox.press("Space")
        await expect(checkbox).toBeChecked()
    }
})

test("right-clicking a 3D die shows an on-screen menu with sort and remove actions", async ({
    page
}) => {
    await page.getByRole("button", { name: "Open dice roller" }).click()
    const controls = page.getByTestId("vampire-dice-controls")
    await controls.getByRole("button", { name: "Roll Dice", exact: true }).click()
    const clearButton = controls.getByRole("button", { name: "Remove dice" })
    await expect(clearButton).toBeEnabled({ timeout: 15_000 })
    await controls.getByRole("button", { name: "Sort dice" }).click()

    const hungerDie = page
        .getByTestId("vampire-dice-arena")
        .getByRole("button", { name: /hunger die 1/i })
    await expect(hungerDie).toBeVisible()
    // Hunger dice cannot be selected for rerolls but still support the right-click menu.
    await hungerDie.click({ button: "right", force: true })
    const menu = page.getByRole("menu", { name: "Die actions" })
    await expect(menu).toBeInViewport()
    await expect(menu.getByRole("menuitem", { name: "Sort dice" })).toBeEnabled()
    await menu.getByRole("menuitem", { name: "Remove dice" }).click()
    await expect(hungerDie).toHaveCount(0)
    await expect(clearButton).toBeDisabled()
})
