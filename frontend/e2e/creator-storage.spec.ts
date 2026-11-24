import { expect, test, type Page } from "@playwright/test"
import type { Character } from "../src/data/Character"

const readLocalCharacter = (page: Page): Promise<Character> =>
    page.evaluate(() => JSON.parse(localStorage.getItem("character")!))

test("retains a paid sheet power when confirming creator choices in another tab", async ({
    page,
    context
}) => {
    await context.route("**/api/auth/me", (route) =>
        route.fulfill({ status: 401, json: { error: "Unauthorized" } })
    )

    await page.goto("/features")
    await page.evaluate(async () => {
        // Load the app's real character and power fixtures through the Vite test server.
        const modelPath = "/src/data/Character.ts"
        const powersPath = "/src/data/Disciplines.ts"
        const { getEmptyCharacter }: typeof import("../src/data/Character") = await import(
            modelPath
        )
        const { disciplines }: typeof import("../src/data/Disciplines") = await import(powersPath)
        const empty = getEmptyCharacter()
        const character: Character = {
            ...empty,
            name: "A returning Toreador",
            clan: "Toreador",
            availableDisciplineNames: ["auspex", "celerity", "presence"],
            generation: 10,
            generationBonusXp: 35,
            experience: 45,
            bloodPotency: 3,
            humanity: 6,
            ephemeral: { ...empty.ephemeral, experienceSpent: 23 },
            predatorType: {
                ...empty.predatorType,
                name: "Consensualist",
                pickedDiscipline: "auspex",
                pickedPowerId: "official:auspex:Heightened Senses"
            },
            disciplines: [
                disciplines.celerity.powers[0],
                disciplines.presence.powers[0],
                disciplines.presence.powers[1],
                disciplines.auspex.powers[0]
            ],
            disciplineLevels: {
                "official:celerity": 1,
                "official:presence": 2,
                "official:auspex": 1
            }
        }
        localStorage.setItem("character", JSON.stringify(character))
        localStorage.setItem("characterSheetMode", JSON.stringify("xp"))
    })

    await page.goto("/create#disciplines")
    await page.getByTestId("cookie-banner-close").click()
    const confirm = page.getByTestId("disciplines-confirm-button")
    await expect(confirm).toBeEnabled()

    const sheet = await context.newPage()
    await sheet.goto("/sheet")
    const auspex = sheet.locator('[class*="_discipline_"]').filter({
        has: sheet.getByRole("heading", { name: "Auspex", exact: true })
    })
    await auspex.getByRole("button", { name: /Add power/ }).click()
    await sheet.getByRole("dialog").getByText("Sense the Unseen", { exact: true }).click()
    await expect
        .poll(async () => (await readLocalCharacter(sheet)).ephemeral.experienceSpent)
        .toBe(33)

    await confirm.click()
    const confirmed = await readLocalCharacter(page)
    expect(confirmed.disciplines.map((power) => power.name)).toContain("Sense the Unseen")
    expect(confirmed.predatorType.pickedPowerId).toBe("official:auspex:Heightened Senses")
    expect(confirmed.ephemeral.experienceSpent).toBe(33)

    await sheet.getByRole("radiogroup").getByText("Free", { exact: true }).click()
    const generation = sheet.getByLabel("Generation", { exact: true })
    await generation.fill("13")
    await generation.press("Tab")
    await expect
        .poll(() => readLocalCharacter(sheet))
        .toMatchObject({
            generation: 13,
            generationBonusXp: 15,
            experience: 25,
            bloodPotency: confirmed.bloodPotency,
            humanity: confirmed.humanity,
            ephemeral: { experienceSpent: 33 }
        })
})
