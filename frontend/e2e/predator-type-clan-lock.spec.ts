import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
    })
    await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
        })
    })
})

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-")
const buttonType = (name: string) =>
    ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"].includes(name)
        ? "attribute"
        : "skill"

async function pickButtons(page: Page, names: string[]) {
    for (const name of names) {
        await page.getByTestId(`${buttonType(name)}-${slug(name)}-button`).click()
    }
}

test("Ventrue-locked predator types stay legible and openable", async ({ page }) => {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await expect(page.getByTestId("clan-picker-heading")).toBeVisible()
    await page.getByTestId("clan-ventrue-card").click()

    await pickButtons(page, ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"])
    await page.getByTestId("skill-distribution-balanced-button").click()
    await pickButtons(page, [
        "Athletics",
        "Brawl",
        "Intimidation",
        "Awareness",
        "Insight",
        "Drive",
        "Firearms",
        "Melee",
        "Stealth",
        "Persuasion",
        "Streetwise",
        "Subterfuge",
        "Investigation",
        "Occult",
        "Technology"
    ])
    await page.getByTestId("skill-specialty-confirm-button").click()
    await page.getByTestId("generation-confirm-button").click()

    // On the predator-type step for Ventrue: Bagger + Farmer are excluded.
    const bagger = page.getByTestId("predator-type-bagger-card")
    await expect(bagger).toBeVisible()
    await expect(bagger).toContainText("Locked for Ventrue")
    await expect(bagger).toContainText("switch clans to unlock")

    // The card is no longer a dead end — clicking it opens the modal (preview).
    await bagger.click()
    const confirm = page.getByTestId("predator-type-confirm-button")
    await expect(confirm).toBeVisible()
    await expect(page.getByText(/can't take the Bagger/)).toBeVisible()
    await expect(confirm).toBeDisabled()

    // A non-excluded card still confirms normally.
    await page.keyboard.press("Escape")
    const alleycat = page.getByTestId("predator-type-alleycat-card")
    await alleycat.click()
    await expect(page.getByTestId("predator-type-confirm-button")).toBeEnabled()
})

test("Thin-blood characters cannot select or confirm a predator type", async ({ page }) => {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await page.getByTestId("clan-thin-blood-card").click()
    await pickButtons(page, ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"])
    await page.getByTestId("skill-distribution-balanced-button").click()
    await pickButtons(page, [
        "Athletics",
        "Brawl",
        "Intimidation",
        "Awareness",
        "Insight",
        "Drive",
        "Firearms",
        "Melee",
        "Stealth",
        "Persuasion",
        "Streetwise",
        "Subterfuge",
        "Investigation",
        "Occult",
        "Technology"
    ])
    await page.getByTestId("skill-specialty-confirm-button").click()
    await page.getByTestId("generation-confirm-button").click()

    await expect(page).toHaveURL(/#predator-type$/)
    await expect(page.getByText("Thin-bloods do not have a predator type")).toBeVisible()
    await expect(page.getByTestId("predator-type-alleycat-card")).toHaveCount(0)
    await expect(page.getByTestId("predator-type-confirm-button")).toHaveCount(0)

    await page.getByTestId("thin-blood-predator-type-continue-button").click()
    await expect(page).toHaveURL(/#basics$/)

    const savedPredatorTypeName = await page.evaluate(() => {
        const savedCharacter = JSON.parse(localStorage.getItem("character") ?? "{}")
        return savedCharacter.predatorType?.name
    })
    expect(savedPredatorTypeName).toBe("")
})
