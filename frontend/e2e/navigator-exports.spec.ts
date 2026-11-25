import { readFile } from "node:fs/promises"
import { expect, test } from "@playwright/test"
import type { Character } from "../src/data/Character"

test("the quick navigator exports the active character from outside the sheet", async ({
    page
}) => {
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({ status: 401, json: { error: "Unauthorized" } })
    )
    await page.goto("/features")
    await page.evaluate(async () => {
        const path = "/src/data/Character.ts"
        const { getEmptyCharacter }: typeof import("../src/data/Character") = await import(path)
        const character: Character = {
            ...getEmptyCharacter(),
            name: "Palette Test",
            clan: "Brujah",
            humanity: 3,
            maxHealth: 8,
            willpower: 6,
            bloodPotency: 2
        }
        localStorage.setItem("character", JSON.stringify(character))
    })

    for (const [query, label, filename] of [
        ["pdf", "Download PDF", "progeny_Palette Test.pdf"],
        ["native json", "Download character JSON", "progeny_Palette Test.json"],
        ["foundry json", "Export Foundry VTT JSON", "foundry_wod5e_Palette Test.json"],
        ["inconnu json", "Export Inconnu JSON", "inconnu_Palette Test.json"],
        [
            "discord text",
            "Download Inconnu Discord commands",
            "inconnu_Palette Test_discord_commands_progeny.txt"
        ]
    ]) {
        await page.keyboard.press("ControlOrMeta+k")
        const search = page.getByRole("textbox", { name: "Search pages and exports" })
        await search.fill(query)
        await expect(page.getByRole("button", { name: label })).toBeVisible()
        const downloadPromise = page.waitForEvent("download")
        await search.press("Enter")
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe(filename)
        const content = await readFile(await download.path())
        if (query === "pdf") expect(content.toString("ascii", 0, 5)).toBe("%PDF-")
        if (query === "native json") {
            expect(JSON.parse(content.toString())).toMatchObject({
                name: "Palette Test",
                humanity: 3,
                maxHealth: 8,
                willpower: 6,
                bloodPotency: 2
            })
        }
    }

    await page.goto("/sheet")
    const menu = page.getByRole("button", { name: "Open character sheet menu" })
    await menu.click()
    const nativeDownload = page.waitForEvent("download")
    await page.getByRole("button", { name: /^Save file/ }).click()
    const nativeJson = JSON.parse(await readFile(await (await nativeDownload).path(), "utf8"))
    expect(nativeJson).toMatchObject({ humanity: 3, maxHealth: 8, willpower: 6, bloodPotency: 2 })

    await menu.click()
    await page.getByRole("button", { name: /^Export Foundry/ }).click()
    const foundryDownload = page.waitForEvent("download")
    await page
        .locator(".sheet-menu__export-card")
        .filter({ hasText: "Foundry WoD5E VTT" })
        .getByRole("button", { name: "Export JSON" })
        .click()
    const foundryJson = JSON.parse(await readFile(await (await foundryDownload).path(), "utf8"))
    expect(foundryJson.system.humanity.value).toBe(3)
})

test("a character export explains when no local draft is available", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({ status: 401, json: { error: "Unauthorized" } })
    )
    await page.goto("/features")
    await page.keyboard.press("ControlOrMeta+k")
    const search = page.getByRole("textbox", { name: "Search pages and exports" })
    await search.fill("export json")
    await search.press("Enter")
    await expect(page.getByText("No character to export")).toBeVisible()
})
