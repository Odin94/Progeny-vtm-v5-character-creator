import { expect, test, type Page } from "@playwright/test"

// Regression coverage for the attribute/skill pickers losing their selections
// when the user navigates back to an already-completed step. The step remounts
// (key={selectedStep}), so the pickers must rehydrate their local state from the
// saved character instead of showing a blank slate.

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

const attributeNames = ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"]

const balancedSkillNames = [
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
]

test("keeps attribute selections when navigating back to the attributes step", async ({ page }) => {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await page.getByTestId("clan-brujah-card").click()

    await expect(page).toHaveURL(/#attributes/)
    for (const name of attributeNames) {
        await page.getByTestId(`attribute-${slug(name)}-button`).click()
    }

    // Completing attributes advances to the skills step.
    await expect(page).toHaveURL(/#skills/)

    // Going back must show the previously-picked attributes, not a blank slate.
    await page.goBack()
    await expect(page).toHaveURL(/#attributes/)
    await expect(page.getByTestId("attribute-reset-button")).toBeVisible()

    // The reset control lets the user clear picks without the deselect dance.
    await page.getByTestId("attribute-reset-button").click()
    await expect(page.getByTestId("attribute-reset-button")).toBeHidden()
})

test("keeps skill distribution and selections when navigating back to the skills step", async ({
    page
}) => {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await page.getByTestId("clan-brujah-card").click()

    for (const name of attributeNames) {
        await page.getByTestId(`attribute-${slug(name)}-button`).click()
    }

    await expect(page).toHaveURL(/#skills/)
    await page.getByTestId("skill-distribution-balanced-button").click()
    for (const name of balancedSkillNames) {
        await page.getByTestId(`skill-${slug(name)}-button`).click()
    }
    await page.getByTestId("skill-specialty-confirm-button").click()

    // Completing skills advances to the generation step.
    await expect(page).toHaveURL(/#generation/)

    // Going back must restore the chosen distribution and skill picks.
    await page.goBack()
    await expect(page).toHaveURL(/#skills/)
    await expect(page.getByTestId("skill-reset-button")).toBeVisible()
    // Distribution was restored, so the skill buttons are enabled (not gated).
    await expect(page.getByTestId(`skill-${slug("Athletics")}-button`)).toBeEnabled()
})

function slug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-")
}
