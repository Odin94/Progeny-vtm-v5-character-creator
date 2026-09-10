import { expect, test } from "@playwright/test"

test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true })

test("specialties can be selected and saved with touch on a phone viewport", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
    })
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({ status: 401, json: { error: "Unauthorized" } })
    )
    await page.goto("/create")
    await page.getByTestId("cookie-banner-close").tap()
    await page.getByTestId("clan-brujah-card").tap()
    for (const attribute of ["strength", "manipulation", "dexterity", "charisma", "wits"]) {
        await page.getByTestId(`attribute-${attribute}-button`).tap()
    }
    await page.getByTestId("skill-distribution-specialist-button").tap()
    for (const skill of [
        "athletics",
        "academics",
        "craft",
        "performance",
        "science",
        "brawl",
        "drive",
        "stealth",
        "survival",
        "animal-ken"
    ]) {
        await page.getByTestId(`skill-${skill}-button`).tap()
    }
    const dialog = page.getByRole("dialog", { name: "Skill Specialties" })
    await expect(dialog).toBeVisible()
    await page.getByRole("combobox", { name: "Free specialty skill" }).tap()
    await page.getByRole("option", { name: "Athletics", exact: true }).tap()
    await page.getByRole("textbox", { name: "Free specialty name" }).fill("Climbing")
    for (const [skill, specialty] of [
        ["Academics", "History"],
        ["Craft", "Sculpture"],
        ["Performance", "Violin"],
        ["Science", "Biology"]
    ]) {
        await page.getByRole("textbox", { name: `${skill} specialty`, exact: true }).fill(specialty)
    }
    // Outside touch must preserve the open form, including on a short screen with four bonuses.
    await page.touchscreen.tap(2, 2)
    await expect(dialog).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Free specialty name" })).toHaveValue("Climbing")
    await page.getByTestId("skill-specialty-confirm-button").tap()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByTestId("generation-confirm-button")).toBeVisible()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("character") ?? "{}"))
    expect(saved.skills["animal ken"]).toBe(1)
    expect(saved.skillSpecialties).toEqual([
        { skill: "athletics", name: "climbing" },
        { skill: "academics", name: "history" },
        { skill: "craft", name: "sculpture" },
        { skill: "performance", name: "violin" },
        { skill: "science", name: "biology" }
    ])
})
