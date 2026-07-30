import { expect, test } from "@playwright/test"

// Reproduces the "Free" mode placeholder-flash symptom: the TopData inputs used to
// remount whenever `character[field]` changed externally (a churning `key` +
// `defaultValue`), which painted the placeholder for a frame before the value
// returned. The inputs are now controlled, so an external change updates the value
// in place without remounting the DOM node.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
        // Land straight in Free mode on the sheet.
        localStorage.setItem("characterSheetMode", JSON.stringify("free"))
    })
    await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
        })
    })
})

test("Free-mode name input syncs external changes without remounting or flashing its placeholder", async ({
    page
}) => {
    await page.goto("/sheet")

    const nameInput = page.getByPlaceholder("Unnamed Character")
    await expect(nameInput).toBeVisible()

    // Type a value, then wait for the debounced write to persist to localStorage.
    await nameInput.fill("Original Name")
    await expect(nameInput).toHaveValue("Original Name")
    await expect
        .poll(async () =>
            page.evaluate(() => JSON.parse(localStorage.getItem("character") ?? "{}").name)
        )
        .toBe("Original Name")
    await nameInput.blur()

    // Tag the live DOM node so we can detect a remount: a remount replaces the node
    // and loses the marker.
    await nameInput.evaluate((el) => el.setAttribute("data-remount-probe", "kept"))

    // Simulate an external character change (the kind bumping an attribute or loading
    // a character produces) by pushing a new character through Mantine's localStorage
    // sync event — exactly how the app propagates character updates in-tab.
    await page.evaluate(() => {
        const character = JSON.parse(localStorage.getItem("character") ?? "{}")
        const updated = { ...character, name: "External Name" }
        localStorage.setItem("character", JSON.stringify(updated))
        window.dispatchEvent(
            new CustomEvent("mantine-local-storage", {
                detail: { key: "character", value: updated }
            })
        )
    })

    // The controlled input reflects the external value...
    await expect(nameInput).toHaveValue("External Name")
    // ...the value is never blanked back to the placeholder...
    await expect(nameInput).not.toHaveValue("")
    // ...and the same DOM node is still there (no remount => no placeholder flash).
    await expect(nameInput).toHaveAttribute("data-remount-probe", "kept")
})
