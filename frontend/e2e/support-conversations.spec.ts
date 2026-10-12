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
    let ticketRequests = 0
    let hasTicket = false
    let extraUnread = 0
    let hasExtraTicket = false
    const messages: Array<Record<string, unknown>> = []
    const ticket = () => ({
        id: ticketId,
        status: "open",
        message_count: messages.length,
        last_message: messages.at(-1)?.content,
        last_message_at: messages.at(-1)?.created_at,
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
            ticketRequests += 1
            const tickets = hasTicket ? [ticket()] : []
            if (hasExtraTicket)
                tickets.push({
                    id: "other-ticket",
                    status: "open",
                    message_count: 1,
                    unread_count: extraUnread,
                    created_at: "2026-01-01T00:00:00Z",
                    last_message: "Older support response",
                    last_message_at: "2026-01-02T00:00:00Z"
                })
            data = { count: tickets.length, results: tickets }
        }
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) })
    })
    return {
        seedOtherUnreadTicket: () => {
            hasExtraTicket = true
            extraUnread = 1
        },
        readOtherTicket: () => {
            extraUnread = 0
        },
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
        get ticketRequests() {
            return ticketRequests
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

test("multiple-ticket dismissal survives reload and unchanged totals do not conceal a new reply", async ({
    page,
    context
}) => {
    test.setTimeout(45_000)
    const server = await supportServer(context)
    await startConversation(page)
    await close(page).click()
    server.seedOtherUnreadTicket()
    await page.reload()
    await expect(close(page)).toBeVisible()
    await expect(page.getByText("Older support response", { exact: true })).toBeVisible()
    await close(page).click()
    await page.reload()
    await expect(page.locator('button[aria-label="Open chat (1 unread)"]')).toHaveCount(1)
    await visibility(page, "visible")
    await expect(close(page)).toHaveCount(0)
    // Another tab reads the old reply while a new reply arrives elsewhere.
    // Total unread remains 1, but the ticket/reply version is different.
    server.readOtherTicket()
    server.reply("New reply despite unchanged total")
    await visibility(page, "visible")
    await expect(close(page)).toBeVisible()
    await expect(page.getByText("New reply despite unchanged total", { exact: true })).toBeVisible({
        timeout: 15_000
    })
})

test("a tab with no conversations discovers a first ticket created in another tab", async ({
    page,
    context
}) => {
    test.setTimeout(45_000)
    const server = await supportServer(context)
    await page.goto(fixture)
    await expect.poll(() => server.ticketRequests).toBeGreaterThanOrEqual(2)
    await visibility(page, "hidden")
    const other = await context.newPage()
    await startConversation(other)
    await visibility(other, "hidden")
    await expect(close(other)).toHaveCount(0)
    server.reply("Reply to the other tab's first conversation")
    await visibility(page, "visible")
    await expect(
        page.getByText("Reply to the other tab's first conversation", { exact: true })
    ).toBeVisible()
})
