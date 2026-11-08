import { expect, test, type Page } from "@playwright/test"
import legacyCharacter from "../src/test/jsonExports/v3.json" with { type: "json" }
import { predatorCollection } from "../src/test/fixtures/homebrewPredator"

test.use({ viewport: { width: 1500, height: 1000 } })

test.beforeEach(async ({ page }) => {
    await page.addInitScript((character) => {
        if (localStorage.getItem("predator-qa-seeded")) return
        localStorage.clear()
        sessionStorage.clear()
        localStorage.setItem(
            "character",
            JSON.stringify({
                ...character,
                id: "",
                predatorType: {
                    name: "",
                    pickedDiscipline: "",
                    pickedSpecialties: [],
                    pickedMeritsAndFlaws: []
                },
                disciplines: [],
                rituals: []
            })
        )
        localStorage.setItem("predator-qa-seeded", "true")
    }, legacyCharacter)
    let collection = structuredClone(predatorCollection)
    await page.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname
        let data: unknown = []
        if (path === "/api/auth/me")
            data = {
                id: "qa-user",
                email: "qa@progeny.invalid",
                nickname: "QA",
                isSuperadmin: false,
                actorIsSuperadmin: false,
                impersonation: { active: false }
            }
        else if (path === "/api/auth/preferences") data = {}
        else if (path === "/api/homebrew/collections") data = [collection]
        else if (path === "/api/homebrew/collections/night-arts") {
            if (route.request().method() === "PUT")
                collection = { ...collection, ...route.request().postDataJSON() }
            data = collection
        }
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(data)
        })
    })
})
const stored = (page: Page) =>
    page.evaluate(() => JSON.parse(localStorage.getItem("character") ?? "{}"))
const openPredator = async (page: Page) => {
    await page.goto("/create#predator-type")
    const cookieClose = page.getByTestId("cookie-banner-close")
    if (await cookieClose.isVisible()) await cookieClose.click()
    await page.getByTestId("predator-type-homebrew:night-arts:night-stalker-card").click()
}
const chooseGrant = async (page: Page) => {
    await page.locator(".mantine-Radio-radio").first().check()
}
const chooseClanPowers = async (page: Page) => {
    await page.getByTestId("discipline-celerity-accordion").click()
    await page.getByTestId("take-power-cat's-grace-button").click()
    await page.getByTestId("take-power-rapid-reflexes-button").click()
    await page.getByTestId("discipline-presence-accordion").click()
    await page.getByTestId("take-power-awe-button").click()
}

test("official bonus disciplines include homebrew powers and grants survive reload and skip", async ({
    page
}) => {
    await openPredator(page)
    await expect(page.getByTestId("predator-type-confirm-button")).toBeDisabled()
    await chooseGrant(page)
    await page.getByTestId("predator-type-confirm-button").click()
    expect(await stored(page)).toMatchObject({
        skills: { stealth: 2 },
        humanity: 6,
        bloodPotency: 2,
        predatorType: {
            name: "Night Stalker",
            pickedDiscipline: "auspex",
            pickedSpecialties: [{ skill: "stealth", name: "Stalking" }]
        }
    })
    await page.getByTestId("basics-confirm-button").click()
    await chooseClanPowers(page)
    await page.getByTestId("discipline-auspex-accordion").click()
    await page.getByTestId("take-power-midnight-echoes-button").click()
    await page.getByTestId("disciplines-confirm-button").click()
    await page.reload()
    expect((await stored(page)).disciplines).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                name: "Midnight Echoes",
                homebrewSource: {
                    itemId: "echoes",
                    collectionId: "night-arts",
                    collectionName: "Night Arts"
                }
            })
        ])
    )
    await page.getByTestId("generator-step-predator-type").click()
    await page.getByTestId("predator-type-homebrew:night-arts:night-stalker-card").click()
    await page.getByTestId("predator-type-confirm-button").click()
    expect((await stored(page)).skills.stealth).toBe(2)
    expect((await stored(page)).disciplines).toHaveLength(4)
    await page.getByTestId("generator-step-predator-type").click()
    await page.getByTestId("predator-type-skip-button").click()
    expect(await stored(page)).toMatchObject({
        skills: { stealth: 0 },
        humanity: 7,
        bloodPotency: 1,
        disciplines: [],
        predatorType: { name: "" }
    })
    expect((await stored(page)).predatorType.homebrew).toBeUndefined()
})

test("homebrew bonus disciplines and custom specialties persist on the sheet", async ({ page }) => {
    await openPredator(page)
    await chooseGrant(page)
    await page.locator(".mantine-SegmentedControl-innerLabel", { hasText: "Investigation" }).click()
    await page.getByPlaceholder("Which patterns?").fill("Night routes")
    await page.locator(".mantine-SegmentedControl-innerLabel", { hasText: "Noctis" }).click()
    await page.getByTestId("predator-type-confirm-button").click()
    await page.getByTestId("basics-confirm-button").click()
    await chooseClanPowers(page)
    await page.getByTestId("discipline-noctis-accordion").click()
    await page.getByTestId("take-power-night-sight-button").click()
    await page.getByTestId("disciplines-confirm-button").click()
    await page.goto("/sheet")
    await expect(page.getByText("Night Sight", { exact: true })).toBeVisible()
    await expect(page.getByText("Night routes", { exact: true })).toBeVisible()
    await expect(page.getByText("Marked", { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText("Night Sight", { exact: true })).toBeVisible()
    expect((await stored(page)).disciplineLevels["homebrew:night-arts:noctis"]).toBe(1)
    await page.locator(".mantine-SegmentedControl-innerLabel", { hasText: /^Free$/ }).click()
    await page.getByRole("combobox", { name: "Select a predator type", exact: true }).click()
    await page.getByRole("option", { name: "Night Stalker — Night Arts", exact: true }).click()
    await expect(page.getByPlaceholder("Which patterns?")).toHaveValue("Night routes")
    await expect(page.locator('input[value="homebrew:noctis"]')).toBeChecked()
})

test("authors a predator type with inline validation and saves the collection", async ({
    page
}) => {
    await page.goto("/homebrew/night-arts")
    await page.getByRole("button", { name: "Add Predator Type", exact: true }).click()
    await page.getByRole("button", { name: "Save predator type", exact: true }).click()
    await expect(page.getByText("Name is required.", { exact: true })).toBeVisible()
    await page
        .getByRole("textbox", { name: "Predator type name", exact: true })
        .fill("Moon Listener")
    await page
        .getByRole("textbox", { name: "Short summary", exact: true })
        .last()
        .fill("Listen for the sleepless")
    await page.getByRole("textbox", { name: "Humanity change", exact: true }).fill("1")
    await page.getByRole("textbox", { name: "Blood Potency change", exact: true }).fill("1")
    await page.getByRole("button", { name: "Add specialty choice", exact: true }).click()
    await page.getByRole("textbox", { name: "Specialty 1 name", exact: true }).fill("Eavesdropping")
    await page
        .getByRole("combobox", { name: "Bonus Discipline choices", exact: true })
        .fill("auspex")
    await page.getByRole("option", { name: "auspex (Official)", exact: true }).click()
    await page
        .getByRole("combobox", { name: "Bonus Discipline choices", exact: true })
        .press("Escape")
    await page.getByRole("button", { name: "Add skill grant", exact: true }).click()
    await page.getByRole("textbox", { name: "Skill dots 1", exact: true }).fill("2")
    await page.getByRole("button", { name: "Add Merit or Flaw grant", exact: true }).click()
    await page
        .getByRole("textbox", { name: "Merit or Flaw name", exact: true })
        .fill("Moon Contacts")
    await page.getByRole("button", { name: "Save predator type", exact: true }).click()
    await expect(
        page.getByRole("button", { name: "Edit Moon Listener", exact: true })
    ).toBeVisible()
    await expect(page.getByText("Rule added", { exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole("button", { name: "Edit Moon Listener", exact: true }).click()
    await expect(page.getByRole("textbox", { name: "Humanity change", exact: true })).toHaveValue(
        "1"
    )
    await expect(page.getByRole("textbox", { name: "Skill dots 1", exact: true })).toHaveValue("2")
    await expect(
        page.getByRole("textbox", { name: "Merit or Flaw name", exact: true })
    ).toHaveValue("Moon Contacts")
})
