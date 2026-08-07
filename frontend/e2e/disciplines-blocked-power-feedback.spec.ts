import { expect, test, type Page } from "@playwright/test"

// Reproduces the disciplines-step symptom: on desktop, clicking a greyed-out "Take"
// used to no-op silently — the reason the power was blocked lived only in a hover
// tooltip. The reason now renders inline on the card for every screen size, so it is
// visible without hovering. Also verifies that level-3 clan cards (unreachable by the
// 2-per-discipline cap) are no longer rendered in the clan accordion.

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

async function reachDisciplinesStep(page: Page) {
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").click()

    await page.getByTestId("clan-gangrel-card").click()

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

    // Predator type: Alleycat has no exclusive merits, so a specialty pick is enough.
    await page.getByTestId("predator-type-alleycat-card").click()
    await page.getByText("Intimidation: Stickups").click()
    await page.getByTestId("predator-type-confirm-button").click()

    // Basics has no required fields.
    await page.getByTestId("basics-confirm-button").click()

    await expect(page).toHaveURL(/#disciplines$/)
}

test("a blocked power shows its reason inline on desktop without hovering", async ({ page }) => {
    await reachDisciplinesStep(page)

    // Open the Animalism clan accordion.
    await page.getByTestId("discipline-animalism-accordion").click()

    // Atavism is Animalism level 2. With no lower pick it is blocked — and the reason is
    // rendered inline, visible immediately (no hover on the Take button required).
    const atavismBlocked = page.getByTestId("take-power-atavism-blocked")
    await expect(atavismBlocked).toBeVisible()
    await expect(atavismBlocked).toContainText("Pick 1 lower-level Animalism power first")
})

test("level-3 clan cards are not rendered where the per-discipline cap makes them untakeable", async ({
    page
}) => {
    await reachDisciplinesStep(page)

    await page.getByTestId("discipline-animalism-accordion").click()

    // A level-1 / level-2 Animalism power is shown...
    await expect(page.getByTestId("power-card-atavism")).toBeVisible()
    // ...but a level-3 Animalism power (unreachable as a clan pick) is not.
    await expect(page.getByTestId("power-card-animal-succulence")).toHaveCount(0)
})
