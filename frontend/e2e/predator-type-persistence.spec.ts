import { expect, test, type Page } from "@playwright/test"

// The step navigation (AsideBar) is only shown above the 1400px small-screen breakpoint, so use a
// wide viewport to exercise back-navigation between generator steps.
test.use({ viewport: { width: 1500, height: 1000 } })

// Regression coverage for predator-type rework loss: the picker's in-progress selection used to
// live in component-local state and was thrown away whenever another step was shown, and re-opening
// an already-confirmed type re-seeded the modal from the first option instead of the stored choice.

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

async function reachPredatorTypeAsBrujah(page: Page) {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await expect(page.getByTestId("clan-picker-heading")).toBeVisible()
    await page.getByTestId("clan-brujah-card").click()

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
}

// Scene Queen's bonus disciplines are [dominate (default), potence], so picking Potence is a
// choice that differs from the seeded default — the tell-tale that state was or wasn't preserved.
async function openSceneQueen(page: Page) {
    await page.getByTestId("predator-type-scene-queen-card").click()
    await expect(page.getByTestId("predator-type-confirm-button")).toBeVisible()
}

test("in-progress predator type selection survives leaving and returning to the step", async ({
    page
}) => {
    await reachPredatorTypeAsBrujah(page)

    // Configure Scene Queen, moving the bonus discipline off its default, then leave without
    // confirming — exactly the "jump back to skills mid-configuration" flow that used to reset it.
    await openSceneQueen(page)
    await page.locator(".mantine-SegmentedControl-innerLabel", { hasText: "Potence" }).click()
    await expect(page.locator('input[value="potence"]')).toBeChecked()
    await page.getByRole("button", { name: "Back" }).click()

    await page.getByTestId("generator-step-skills").click()
    await expect(page).toHaveURL(/#skills$/)
    await page.getByTestId("generator-step-predator-type").click()
    await expect(page).toHaveURL(/#predator-type$/)

    // Re-opening the card shows the in-progress Potence pick, not the reset-to-Dominate default.
    await openSceneQueen(page)
    await expect(page.locator('input[value="potence"]')).toBeChecked()
})

test("skipping a predator type keeps sidebar navigation to Basics available", async ({ page }) => {
    await reachPredatorTypeAsBrujah(page)

    await page.getByTestId("predator-type-skip-button").click()
    await expect(page).toHaveURL(/#basics$/)

    const savedPredatorType = await page.evaluate(
        () => JSON.parse(localStorage.getItem("character") ?? "{}").predatorType
    )
    expect(savedPredatorType).toMatchObject({
        name: "",
        pickedDiscipline: "",
        pickedSpecialties: [],
        pickedMeritsAndFlaws: []
    })

    await page.getByTestId("generator-step-predator-type").click()
    await expect(page).toHaveURL(/#predator-type$/)
    await expect(page.getByTestId("generator-step-basics")).toBeEnabled()
    await page.getByTestId("generator-step-basics").click()
    await expect(page).toHaveURL(/#basics$/)
})

test("a skipped predator type does not block discipline confirmation", async ({ page }) => {
    await reachPredatorTypeAsBrujah(page)

    await page.getByTestId("predator-type-skip-button").click()
    await page.getByTestId("basics-confirm-button").click()
    await expect(page).toHaveURL(/#disciplines$/)
    await expect(page.getByText(/1 from your predator type/)).toHaveCount(0)

    await page.getByTestId("discipline-celerity-accordion").click()
    await page.getByTestId("take-power-cat's-grace-button").click()
    await page.getByTestId("take-power-rapid-reflexes-button").click()
    await page.getByTestId("discipline-presence-accordion").click()
    await page.getByTestId("take-power-awe-button").click()
    await expect(page.getByTestId("disciplines-confirm-button")).toBeEnabled()

    await page.getByTestId("disciplines-confirm-button").click()
    await expect(page).toHaveURL(/#touchstones$/)
})

test("re-opening a confirmed predator type seeds the stored choices, not defaults", async ({
    page
}) => {
    await reachPredatorTypeAsBrujah(page)

    // Confirm Scene Queen with Potence as the bonus discipline.
    await openSceneQueen(page)
    await page.locator(".mantine-SegmentedControl-innerLabel", { hasText: "Potence" }).click()
    await page.getByTestId("predator-type-confirm-button").click()
    await expect(page).toHaveURL(/#basics$/)

    const storedDiscipline = await page.evaluate(
        () => JSON.parse(localStorage.getItem("character") ?? "{}").predatorType?.pickedDiscipline
    )
    expect(storedDiscipline).toBe("potence")

    // Return to the step and re-open the confirmed type: the modal reflects the stored Potence
    // pick rather than the first option, so re-confirming won't silently clear downstream picks.
    await page.getByTestId("generator-step-predator-type").click()
    await expect(page).toHaveURL(/#predator-type$/)
    await openSceneQueen(page)
    await expect(page.locator('input[value="potence"]')).toBeChecked()

    await page.getByTestId("predator-type-confirm-button").click()
    const storedDisciplineAfter = await page.evaluate(
        () => JSON.parse(localStorage.getItem("character") ?? "{}").predatorType?.pickedDiscipline
    )
    expect(storedDisciplineAfter).toBe("potence")
})
