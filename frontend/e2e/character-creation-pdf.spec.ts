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

    await expect(page.getByRole("heading", { name: /pick your clan/i })).toBeVisible()
    await page.getByText("Brujah", { exact: true }).click()

    await pickButtons(page, ["Strength", "Manipulation", "Dexterity", "Charisma", "Wits"])

    await page.getByRole("button", { name: "Balanced" }).click()
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
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()

    await page.getByRole("button", { name: "Confirm" }).click()

    await page.getByText("Sandman", { exact: true }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()

    await page.getByLabel("Full name").fill(characterName)
    await page.getByLabel("Sire").fill("Mara Voss")
    await page.getByLabel("Long term ambition").fill("Break the baron's grip on the city")
    await page.getByLabel("Short term desire").fill("Protect tonight's informant")
    await page
        .getByLabel("Description & appearance")
        .fill("A sharp-eyed Brujah courier with a battered leather jacket.")
    await page.getByRole("button", { name: "Confirm" }).click()

    await takePower(page, "POTENCE", "Lethal Body")
    await takePower(page, "POTENCE", "Prowess")
    await takePower(page, "PRESENCE", "Awe")
    await takePower(page, "AUSPEX", "Heightened Senses")
    await page.getByRole("button", { name: "Confirm" }).click()

    await page.getByLabel("Touchstone Name").fill("Jonah Reyes")
    await page.getByLabel("Conviction").fill("Never abandon the vulnerable")
    await page.getByLabel("Description").fill("A street medic who still believes Evelyn can help.")
    await page.getByRole("button", { name: "Confirm" }).click()

    await page.getByRole("button", { name: "Confirm" }).click()

    await expect(page.getByRole("heading", { name: characterName })).toBeVisible()
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: /download pdf/i }).click()
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
        await page.getByRole("button", { name }).click()
    }
}

async function takePower(page: Page, disciplineName: string, powerName: string) {
    await page.getByRole("button", { name: new RegExp(disciplineName, "i") }).click()
    await powerCard(page, powerName).getByRole("button", { name: "Take" }).click()
}

function powerCard(page: Page, powerName: string): Locator {
    return page
        .locator("div")
        .filter({ has: page.getByText(powerName, { exact: true }) })
        .filter({ has: page.getByRole("button", { name: "Take" }) })
        .first()
}

async function expectPdfDownload(downloadedPath: string) {
    const { readFile } = await import("node:fs/promises")
    const bytes = await readFile(downloadedPath)

    expect(bytes.length).toBeGreaterThan(100_000)
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF")
}
