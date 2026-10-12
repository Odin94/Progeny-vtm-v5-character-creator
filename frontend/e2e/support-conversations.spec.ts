import { expect, test, type BrowserContext, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

declare global {
    interface Window {
        supportTest: { posthog: { conversations: { getCurrentTicketId(): string | null } } }
    }
}

const require = createRequire(import.meta.url)
const conversationBundle = readFileSync(require.resolve("posthog-js/dist/conversations.js"), "utf8")
const fixture = "/e2e/fixtures/support-conversations.html"
const ticketId = "support-browser-test-ticket"

// Real SDK/widget rendering, persistence, polling, and read acknowledgements;
// only server responses are controlled so this never touches customer tickets.
const supportServer = async (context: BrowserContext) => {
    let unread = 0
    let readRequests = 0
    let hasTicket = false
    const messages: Array<Record<string, unknown>> = []
    const ticket = () => ({
        id: ticketId,
        status: "open",
        message_count: messages.length,
        unread_count: unread,
        created_at: "2026-01-01T00:00:00Z"
    })
    await context.route("https://support-widget.invalid/**", async (route) => {
        const pathname = new URL(route.request().url()).pathname
        if (pathname.endsWith("/conversations.js")) {
            await route.fulfill({ contentType: "application/javascript", body: conversationBundle })
            return
        }
        let data: unknown = {}
        if (pathname.endsWith("/widget/message")) {
            hasTicket = true
            data = {
                ticket_id: ticketId,
                message_id: "request",
                ticket_status: "open",
                unread_count: 0,
                created_at: "2026-01-01T00:00:00Z"
            }
        } else if (pathname.endsWith("/read")) {
            readRequests += 1
            unread = 0
            data = { success: true, unread_count: 0 }
        } else if (pathname.includes("/widget/messages/")) {
            data = {
                ticket_id: ticketId,
                ticket_status: "open",
                messages,
                unread_count: unread,
                has_more: false
            }
        } else if (pathname.endsWith("/widget/tickets")) {
            data = { count: hasTicket ? 1 : 0, results: hasTicket ? [ticket()] : [] }
        }
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) })
    })
    return {
        reply: (content: string) => {
            messages.push({
                id: `reply-${messages.length}`,
                content,
                author_type: "human",
                author_name: "Odin",
                is_private: false,
                created_at: new Date().toISOString()
            })
            unread += 1
        },
        get unread() {
            return unread
        },
        get readRequests() {
            return readRequests
        }
    }
}

const visibility = (page: Page, state: "hidden" | "visible") =>
    page.evaluate((state) => {
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state })
        document.dispatchEvent(new Event("visibilitychange"))
    }, state)
const close = (page: Page) =>
    page
        .locator("#ph-conversations-widget-container")
        .getByRole("button", { name: "Close", exact: true })
const startConversation = async (page: Page) => {
    await page.goto(fixture)
    await page.locator("#open").click()
    await expect(close(page)).toBeVisible()
    await page.locator("#send").click()
    await expect
        .poll(() =>
            page.evaluate(() => window.supportTest.posthog.conversations.getCurrentTicketId())
        )
        .toBe(ticketId)
}

test("live widget auto-opens replies, restores an open panel, and preserves dismissal", async ({
    page,
    context
}) => {
    test.setTimeout(45_000)
    const server = await supportServer(context)
    await startConversation(page)
    await close(page).click()
    server.reply("First support reply")
    await expect(page.getByText("First support reply", { exact: true })).toBeVisible({
        timeout: 20_000
    })
    await page.reload()
    await expect(close(page)).toBeVisible()
    await close(page).click()
    await expect(close(page)).toHaveCount(0)
    // No new response: unrelated app DOM updates must not reopen it.
    await page.locator("body").evaluate((body) => body.append(document.createElement("p")))
    await expect(close(page)).toHaveCount(0)
    server.reply("Reply while away")
    await page.reload()
    await expect(page.getByText("Reply while away", { exact: true })).toBeVisible()
})

test("background panels and background reloads do not acknowledge replies before return", async ({
    page,
    context
}) => {
    test.setTimeout(45_000)
    const server = await supportServer(context)
    await startConversation(page)
    await visibility(page, "hidden")
    await expect(close(page)).toHaveCount(0)
    server.reply("Background reply")
    await expect(page.locator('button[aria-label="Open chat (1 unread)"]')).toHaveCount(1, {
        timeout: 20_000
    })
    expect(server.unread).toBe(1)
    expect(server.readRequests).toBe(0)
    await visibility(page, "visible")
    await expect(page.getByText("Background reply", { exact: true })).toBeVisible()
    await expect.poll(() => server.unread).toBe(0)
    const readsBeforeReload = server.readRequests
    // Reproduce a tab loading hidden while the SDK persisted an open panel.
    await page.addInitScript(() =>
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => "hidden"
        })
    )
    server.reply("Reply on background reload")
    await page.reload()
    await expect(page.locator('button[aria-label="Open chat (1 unread)"]')).toHaveCount(1)
    expect(server.unread).toBe(1)
    expect(server.readRequests).toBe(readsBeforeReload)
    await visibility(page, "visible")
    await expect(page.getByText("Reply on background reload", { exact: true })).toBeVisible()
    await expect.poll(() => server.unread).toBe(0)
})
