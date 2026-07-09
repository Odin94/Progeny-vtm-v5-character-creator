import { expect, test } from "@playwright/test"

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

test("generation confirm stays reachable under a tall summary card on a short viewport", async ({
    page
}) => {
    // Deliberately short viewport so the tall generation-summary card would push a
    // non-sticky Confirm button below the fold.
    await page.setViewportSize({ width: 1000, height: 380 })
    await page.goto("/create#generation")
    await page.getByTestId("cookie-banner-close").click()

    const confirm = page.getByTestId("generation-confirm-button")
    await expect(confirm).toBeVisible()

    // Pick 10th gen -> tallest summary card (bonus XP + additional merits + additional flaws).
    await page.getByPlaceholder("Select your generation").click()
    await page.getByText("10th Gen - Ancilla").click()

    // The Confirm button must sit inside the viewport, not clipped below it.
    const box = await confirm.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
        expect(box.y + box.height).toBeLessThanOrEqual(380)
    }

    // And it must actually be clickable (advances to the predator-type step).
    await confirm.click()
    await expect(page).toHaveURL(/#predator-type$/)
})
