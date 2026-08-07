import { expect, test } from "@playwright/test"

// Reproduces the "dead pip click" symptom on the character sheet: in XP mode a blocked
// pip click (here: not enough XP) used to no-op silently, with the only explanation
// hidden behind a hover tooltip. The pip now stays clickable and the reason is shown
// inline the moment it is clicked — no hover required.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
        // Land straight in XP mode on the sheet (fresh character => 0 XP available).
        localStorage.setItem("characterSheetMode", JSON.stringify("xp"))
    })
    await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
        })
    })
})

test("blocked pip click surfaces the reason inline without hovering", async ({ page }) => {
    await page.goto("/sheet")

    const strengthRow = page
        .locator(".mantine-Group-root")
        .filter({ has: page.getByText("Strength", { exact: true }) })
        .first()
    await expect(strengthRow).toBeVisible()

    // No reason is shown until the user actually clicks a blocked pip.
    await expect(page.getByText(/Insufficient XP/)).toHaveCount(0)

    // Click the second pip (raise Strength 1 -> 2). With 0 XP this is unaffordable.
    const pips = strengthRow.getByRole("button")
    await pips.nth(1).click()

    // The explanation appears inline (persistently, not just on hover).
    await expect(page.getByText(/Insufficient XP/).first()).toBeVisible()
})

test("adding a skill specialty drops straight into naming it", async ({ page }) => {
    // Free mode has no XP gate, so the add always succeeds.
    await page.addInitScript(() => localStorage.setItem("characterSheetMode", JSON.stringify("free")))
    await page.goto("/sheet")

    const athleticsRow = page
        .locator(".mantine-Group-root")
        .filter({ has: page.getByText("Athletics", { exact: true }) })
        .first()
    await expect(athleticsRow).toBeVisible()

    // Click the "+" badge to add a specialty.
    await athleticsRow.getByText("+", { exact: true }).click()

    // A focused text input appears immediately — no empty "New Specialty" badge to click twice.
    const input = athleticsRow.locator("input")
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()

    await input.fill("Parkour")
    await input.press("Enter")
    // The row keeps a hidden overflow-measurement copy first; the visible badge is last.
    await expect(athleticsRow.getByText("Parkour").last()).toBeVisible()
})
