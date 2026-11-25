import { expect, test } from "@playwright/test"
import legacyCharacter from "../src/test/jsonExports/v3.json" with { type: "json" }

const savedPowerNote = "Only if I can see the destination"

test("entry notes can be edited across sheet modes and survive a reload", async ({ page }) => {
    await page.addInitScript(
        ({ character, savedPowerNote }) => {
            if (sessionStorage.getItem("sheet-entry-notes-seeded")) return
            localStorage.setItem("characterSheetMode", JSON.stringify("play"))
            localStorage.setItem(
                "character",
                JSON.stringify({
                    ...character,
                    id: "",
                    customText: {
                        meritFlaws: {},
                        skillSpecialties: {},
                        disciplinePowers: { "official:celerity:Blink": savedPowerNote }
                    }
                })
            )
            sessionStorage.setItem("sheet-entry-notes-seeded", "true")
        },
        { character: legacyCharacter, savedPowerNote }
    )
    await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: {} }))
    await page.goto("/sheet")
    const cookieClose = page.getByTestId("cookie-banner-close")
    if (await cookieClose.isVisible()) await cookieClose.click()

    const powerNote = page.getByRole("textbox", { name: "Blink custom note" })
    const powerButton = page.getByRole("button", { name: "Edit Blink custom note" })
    await expect(page.getByText(savedPowerNote, { exact: true })).toBeVisible()
    await powerButton.click()
    await expect(powerNote).toBeFocused()
    await expect(powerNote).toHaveValue(savedPowerNote)
    await powerNote.fill("Use the rear entrance")
    await powerButton.click()
    await expect(powerNote).toHaveCount(0)

    const modes = page.locator(".mantine-SegmentedControl-innerLabel")
    await modes.filter({ hasText: /^XP$/ }).click()
    await page.getByRole("button", { name: "Edit Haven custom note" }).click()
    const meritNote = page.getByRole("textbox", { name: "Haven custom note" })
    await meritNote.fill("The spare key is with Mira")
    await meritNote.press("Enter")

    await modes.filter({ hasText: /^Free$/ }).click()
    await page.getByRole("button", { name: "Edit Known Blankbody custom note" }).click()
    const flawNote = page.getByRole("textbox", { name: "Known Blankbody custom note" })
    await flawNote.fill("Avoid the east gate")
    await flawNote.press("Escape")

    await page.reload()
    for (const note of [
        "Use the rear entrance",
        "The spare key is with Mira",
        "Avoid the east gate"
    ]) {
        await expect(page.getByText(note, { exact: true })).toBeVisible()
    }
})
