import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" })
        })
    )
})

const exportPdf = async (page: import("@playwright/test").Page, delayMs = 0) => {
    await page.evaluate(async (delayMs) => {
        // Exercise the real lazy template/font loading and PDF generator.
        const { getBasicTestCharacter } = await import("/src/test/testUtils.ts")
        const { downloadCharacterSheet } = await import("/src/generator/pdfCreator.ts")
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
        await downloadCharacterSheet(getBasicTestCharacter())
    }, delayMs)
}

test("downloads the generated PDF in a regular browser", async ({ page }) => {
    await page.goto("/create")
    const pendingDownload = page.waitForEvent("download")
    await exportPdf(page)
    const download = await pendingDownload
    expect(download.suggestedFilename()).toBe("progeny_Test Vampire.pdf")
    const path = await download.path()
    const { readFile } = await import("node:fs/promises")
    const bytes = await readFile(path!)
    expect(bytes.length).toBeGreaterThan(100_000)
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF")
})

test("offers the generated file for sharing from a fresh tap in the Google iOS app", async ({
    page
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 (iPad; CPU OS 26_6_1 like Mac OS X) GSA/444.2 Mobile/15E148 Safari/604.1"
        })
        Object.defineProperty(navigator, "canShare", { value: () => true })
        Object.defineProperty(navigator, "share", {
            value: async ({ files }: { files: File[] }) => {
                const file = files[0]
                document.documentElement.dataset.pdfShare = JSON.stringify({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    active: navigator.userActivation.isActive
                })
            }
        })
    })
    await page.goto("/create")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByTestId("cookie-banner-close").click()
    // Let the initial evaluation activation expire before generating the file.
    await exportPdf(page, 6_000)
    await expect(page.getByText("Your PDF is ready")).toBeVisible()
    expect(await page.locator("html").getAttribute("data-pdf-share")).toBeNull()
    await page.screenshot({ path: "/tmp/progeny-file-save-prompt.png", animations: "disabled" })
    await page.getByRole("button", { name: "Save or share PDF" }).click()
    const result = JSON.parse((await page.locator("html").getAttribute("data-pdf-share"))!)
    expect(result).toMatchObject({
        name: "progeny_Test Vampire.pdf",
        type: "application/pdf",
        active: true
    })
    expect(result.size).toBeGreaterThan(100_000)
    await expect(page.getByRole("status")).toHaveText(
        "PDF shared. You can share it again or close this message."
    )
    await expect(page).toHaveURL(/\/create/)
})

for (const [format, type, filename, content] of [
    ["recovery-json", "application/json", "recovery.json", '{"raw":"preserve exactly"}'],
    ["inconnu-commands", "text/plain", "commands.txt", "/character name:Test\n/health 5"]
] as const) {
    test(`downloads ${format} with original bytes and MIME type`, async ({ page }) => {
        await page.goto("/create")
        const pending = page.waitForEvent("download")
        await page.evaluate(
            async ({ format, type, filename, content }) => {
                const modulePath = "/src/utils/fileDownload.ts"
                const { downloadFile } = await import(modulePath)
                await downloadFile(
                    { filename, format, source: "generator" },
                    () => new Blob([content], { type })
                )
            },
            { format, type, filename, content }
        )
        const download = await pending
        expect(download.suggestedFilename()).toBe(filename)
        const { readFile } = await import("node:fs/promises")
        expect(await readFile((await download.path())!, "utf8")).toBe(content)
    })
}

test("shares synchronous iOS JSON with the original tap and no extra save prompt", async ({
    page
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "userAgent", { value: "iPad GSA/444.2 Safari/604.1" })
        Object.defineProperty(navigator, "canShare", { value: () => true })
        Object.defineProperty(navigator, "share", {
            value: async ({ files }: { files: File[] }) => {
                document.documentElement.dataset.sharedFile = JSON.stringify({
                    name: files[0].name,
                    type: files[0].type,
                    active: navigator.userActivation.isActive
                })
            }
        })
    })
    await page.goto("/create")
    await page.evaluate(async () => {
        const modulePath = "/src/generator/utils.ts"
        const fixturePath = "/src/test/testUtils.ts"
        const { downloadJson } = await import(modulePath)
        const { getBasicTestCharacter } = await import(fixturePath)
        const button = document.createElement("button")
        button.textContent = "Export test JSON"
        button.onclick = () => {
            void downloadJson(getBasicTestCharacter(), undefined, "generator")
        }
        document.body.append(button)
    })
    await page.getByRole("button", { name: "Export test JSON" }).click()
    const shared = JSON.parse((await page.locator("html").getAttribute("data-shared-file"))!)
    expect(shared).toMatchObject({
        name: "progeny_Test Vampire.json",
        type: "application/json",
        active: true
    })
    await expect(page.getByText("Your file is ready")).toHaveCount(0)
})
