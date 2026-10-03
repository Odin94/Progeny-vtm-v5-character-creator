import { chromium } from "@playwright/test"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { resolve } from "node:path"
const [base = "http://127.0.0.1:5341", output = "browser-results.json", fixturePath] =
    process.argv.slice(2)
const fixture = JSON.parse(await readFile(fixturePath, "utf8"))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
await context.routeWebSocket(/.*/, (ws) => ws.close()) // Chat is intentionally offline in this HTTP fixture audit.
const rows = [],
    errors = []
const routes = [
    "/",
    "/create",
    "/sheet",
    "/me",
    "/coteries/fixture",
    "/homebrew",
    "/homebrew/new",
    "/homebrew/fixture",
    "/homebrew/library",
    "/homebrew/library/fixture",
    "/admin",
    "/admin?tab=homebrew-review",
    "/admin?tab=recent-changes",
    "/features",
    "/features/character-creation",
    "/features/character-sheet",
    "/features/account-and-multiple-characters",
    "/features/coteries",
    "/features/credits-and-contact",
    "/auth/callback?code=fixture&state=fixture",
    ...fixture.steps.map((step) => `/create#${step}`)
]
await mkdir(resolve(output + ".screenshots"), { recursive: true })
for (const route of routes) {
    const page = await context.newPage()
    page.on("pageerror", (error) => errors.push({ route, message: error.message }))
    await page.route("**/*", (r) => {
        const u = new URL(r.request().url())
        if (u.origin === base) r.continue()
        else r.fulfill({ status: 404, body: "External services disabled for fixture audit" })
    })
    await page.goto(base + route)
    await page.waitForTimeout(700)
    const sample = await page.evaluate(() => ({
        title: document.title,
        headings: [...document.querySelectorAll("h1,h2,h3")].map((e) => e.textContent),
        body: document.body.innerText.slice(0, 700),
        jsBytes: performance
            .getEntriesByType("resource")
            .filter((e) => e.name.endsWith(".js"))
            .reduce((sum, e) => sum + e.decodedBodySize, 0),
        fixture: window.__PERFORMANCE_FIXTURE__ === true
    }))
    if (!sample.body || !sample.fixture) throw new Error("Fixture page failed: " + route)
    const shot = resolve(output + ".screenshots", route.replaceAll(/[^a-z0-9]/gi, "_") + ".png")
    await page.screenshot({ path: shot, fullPage: true })
    rows.push({ route, finalUrl: page.url(), ...sample, screenshot: shot })
    await page.close()
}
await writeFile(
    output,
    JSON.stringify(
        {
            methodology:
                "Production builds, synthetic authenticated HTTP fixtures (60 account characters, six coterie members, 60 homebrew rules); live chat deliberately offline; 700ms settle per full navigation; resource decoded JS bytes, no latency headline.",
            rows,
            errors
        },
        null,
        2
    )
)
await browser.close()
if (errors.length) throw new Error(JSON.stringify(errors))
console.log(JSON.stringify({ routes: rows.length, errors: errors.length, output }))
