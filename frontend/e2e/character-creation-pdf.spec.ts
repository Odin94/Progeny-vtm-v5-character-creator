import { expect, test, type Locator, type Page } from "@playwright/test"

const characterName = "Evelyn Cross"

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

test("creates a Brujah character and downloads the PDF sheet", async ({ page }) => {
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

    await page.getByTestId("predator-type-sandman-card").click()
    await page.getByTestId("predator-type-confirm-button").click()

    await page.getByTestId("basic-full-name-input").fill(characterName)
    await page.getByTestId("basic-sire-input").fill("Mara Voss")
    await page.getByTestId("basic-ambition-input").fill("Break the baron's grip on the city")
    await page.getByTestId("basic-desire-input").fill("Protect tonight's informant")
    await page
        .getByTestId("basic-description-input")
        .fill("A sharp-eyed Brujah courier with a battered leather jacket.")
    await page.getByTestId("basics-confirm-button").click()

    await takePower(page, "POTENCE", "Lethal Body")
    await takePower(page, "POTENCE", "Prowess")
    await takePower(page, "PRESENCE", "Awe")
    await takePower(page, "AUSPEX", "Heightened Senses")
    await page.getByTestId("disciplines-confirm-button").click()

    await page.getByTestId("touchstone-0-name-input").fill("Jonah Reyes")
    await page.getByTestId("touchstone-0-conviction-input").fill("Never abandon the vulnerable")
    await page
        .getByTestId("touchstone-0-description-input")
        .fill("A street medic who still believes Evelyn can help.")
    await page.getByTestId("touchstones-confirm-button").click()

    await page.getByTestId("merits-confirm-button").click()

    await expect(page.getByTestId("final-character-name")).toHaveText(characterName)
    const downloadPromise = page.waitForEvent("download")
    await page.getByTestId("final-download-pdf-button").click()
    const download = await downloadPromise
    const downloadedPath = await download.path()

    expect(download.suggestedFilename()).toBe(`progeny_${characterName}.pdf`)
    expect(downloadedPath).not.toBeNull()
    if (downloadedPath) {
        await expectPdfDownload(downloadedPath)
    }
})

async function pickButtons(page: Page, names: string[]) {
    for (const name of names) {
        await page.getByTestId(`${buttonType(name)}-${slug(name)}-button`).click()
    }
}

async function takePower(page: Page, disciplineName: string, powerName: string) {
    const card = powerCard(page, powerName)
    if (!(await card.isVisible())) {
        await page.getByTestId(`discipline-${slug(disciplineName)}-accordion`).click()
    }
    await card.getByTestId(`take-power-${slug(powerName)}-button`).click()
}

function powerCard(page: Page, powerName: string): Locator {
    return page.getByTestId(`power-card-${slug(powerName)}`)
}

function buttonType(name: string) {
    return ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"].includes(name)
        ? "attribute"
        : "skill"
}

function slug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-")
}

async function expectPdfDownload(downloadedPath: string) {
    const { readFile } = await import("node:fs/promises")
    const bytes = await readFile(downloadedPath)

    expect(bytes.length).toBeGreaterThan(100_000)
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF")
}
