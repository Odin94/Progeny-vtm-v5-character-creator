import { expect, test } from "@playwright/test"

// The user the auth callback would have persisted after a successful sign-in.
const SIGNED_IN_USER = {
    id: "user-e2e",
    email: "ann@example.com",
    firstName: "Ann",
    isSuperadmin: false,
    nameTagEnabled: false,
    nameTagVisible: false,
    actorIsSuperadmin: false,
    impersonation: { active: false }
}

// Respond to /auth/me slowly so there is a real window in which the topbar would
// otherwise be showing its logged-out state while it refetches from scratch.
const mockSlowAuthMe = async (page: import("@playwright/test").Page) => {
    await page.route("**/api/auth/me", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(SIGNED_IN_USER)
        })
    })
}

// A seeded user represents a completed sign-in, so authenticated background work
// must receive the same success response as it would with the new session cookie.
const mockAuthenticatedRecentChanges = async (page: import("@playwright/test").Page) => {
    await page.route("**/api/recent-changes/deliver-latest", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ announcement: null, changes: [] })
        })
    })
}

test("the topbar Sign in link shows a pending label while the redirect is in flight", async ({
    page
}) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
    })
    // Anonymous user, so the topbar renders its "Sign in" link.
    await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
    })
    // Cancel the redirect to /auth/login so the page stays put and the pending
    // state the user now sees remains observable.
    let loginRequests = 0
    await page.route("**/api/auth/login**", async (route) => {
        loginRequests += 1
        await route.abort()
    })

    await page.goto("/features")

    const topbar = page.getByRole("banner")
    // noWaitAfter: the click starts a navigation we cancel, so do not block on it.
    await topbar
        .getByRole("link", { name: "Sign in", exact: true })
        .click({ noWaitAfter: true })

    // The click is now acknowledged: the label flips to a pending state instead
    // of sitting silent, and the plain "Sign in" link is gone.
    await expect(topbar.getByText("Signing in…", { exact: true })).toBeVisible()
    await expect(topbar.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0)
    await expect.poll(() => loginRequests).toBe(1)
})

test("without the sign-in seed, the topbar flashes its logged-out state", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
    })
    await mockSlowAuthMe(page)

    await page.goto("/features")

    // While /auth/me is in flight and nothing seeded the cache, the topbar shows
    // "Sign in" — the exact flash a returning-from-sign-in user sees.
    const topbar = page.getByRole("banner")
    await expect(topbar.getByRole("link", { name: "Sign in", exact: true })).toBeVisible()
})

test("the persisted sign-in seed shows the signed-in topbar immediately with a confirmation", async ({
    page
}) => {
    await page.addInitScript((user) => {
        localStorage.clear()
        sessionStorage.clear()
        // Mirror what auth.callback persists right before its full-document redirect.
        sessionStorage.setItem("auth:signInSeed", JSON.stringify(user))
        sessionStorage.setItem("auth:signInConfirm", "1")
    }, SIGNED_IN_USER)
    await mockSlowAuthMe(page)
    await mockAuthenticatedRecentChanges(page)

    await page.goto("/features")

    // Seeded from the callback response, the topbar is signed-in from the first
    // paint — no "Sign in" flash — even though /auth/me has not resolved yet.
    const topbar = page.getByRole("banner")
    await expect(topbar.getByRole("link", { name: "Account", exact: true })).toBeVisible()
    await expect(topbar.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0)

    // And the landing shows an explicit confirmation instead of a silent reload,
    // without putting account details on screen.
    await expect(page.getByText("Signed in", { exact: true })).toBeVisible()
    await expect(page.getByText("You're signed in.", { exact: true })).toBeVisible()
})
