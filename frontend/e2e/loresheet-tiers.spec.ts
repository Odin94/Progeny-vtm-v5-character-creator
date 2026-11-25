import { expect, test } from "@playwright/test"

test.use({ viewport: { width: 390, height: 820 }, reducedMotion: "reduce" })

test("a loresheet tier can be selected and unpicked across the card, and selected by keyboard", async ({
    page
}) => {
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({ status: 401, json: { error: "Unauthorized" } })
    )
    await page.goto("/create#merits")
    const dismiss = page.getByTestId("cookie-banner-close")
    if (await dismiss.isVisible()) await dismiss.click()
    await page.getByRole("tab", { name: "Loresheets" }).click()
    await page.getByRole("textbox", { name: "Search loresheets" }).fill("Theo Bell")
    const overview = page.getByRole("button", { name: /Theo Bell/ })
    await overview.press("Enter")
    await expect(page.getByRole("heading", { name: "Theo Bell" })).toBeFocused()
    const tier = page.locator('[data-type="merit"]').filter({ hasText: "Rebel Cell" })

    await tier.click({ position: { x: 150, y: 22 } })
    await expect(tier).toHaveAttribute("data-picked", "true")
    await tier.click({ position: { x: 150, y: 22 } })
    await expect(tier).not.toHaveAttribute("data-picked", "true")

    const action = tier.getByRole("button", { name: "Rebel Cell, 1 dot" })
    await action.focus()
    await page.keyboard.press("Space")
    await expect(action).toHaveAttribute("aria-pressed", "true")
    await expect(action).toBeFocused()
    await page.keyboard.press("Space")
    await expect(action).toHaveAttribute("aria-pressed", "false")
    await expect(action).toBeFocused()

    await page.getByRole("button", { name: "Back", exact: true }).first().click()
    await expect(overview).toBeFocused()

    await page.getByRole("textbox", { name: "Search loresheets" }).clear()
    const furtherDown = page.getByRole("button", { name: /Convention of Thorns/ })
    await furtherDown.click()
    await page.getByRole("button", { name: "Back", exact: true }).first().press("Enter")
    await expect(furtherDown).toBeFocused()
    await expect(furtherDown).toBeInViewport({ ratio: 0.65 })
})
