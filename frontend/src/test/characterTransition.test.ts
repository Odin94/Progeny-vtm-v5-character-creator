import { QueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { beforeEach, expect, it, vi } from "vitest"
import { characterPersistence, createCharacterPersistence } from "~/modules/characterPersistence"
import { transitionCharacter } from "~/modules/characterTransition"

vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())

it("resolves a current coordinator when an existing click handler runs after account replacement", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    const captured = characterPersistence(client)
    const operation = vi.fn(async () => {})
    const click = () => transitionCharacter(client, operation)
    client.setQueryData(["auth", "me"], null)
    characterPersistence(client)
    client.setQueryData(["auth", "me"], { id: "alice" })
    const current = characterPersistence(client)
    expect(await captured.transition(operation)).toBe(false)
    expect(operation).not.toHaveBeenCalled()
    expect(await click()).toBe(true)
    expect(operation).toHaveBeenCalledExactlyOnceWith(expect.any(Function), current)
    expect(notifications.show).not.toHaveBeenCalled()
})

it("shows busy feedback, preserves the pending operation, and lets the user retry", async () => {
    const client = new QueryClient()
    const persistence = characterPersistence(client)
    let finish!: () => void
    const pending = persistence.transition(
        () =>
            new Promise<void>((resolve) => {
                finish = resolve
            })
    )
    const operation = vi.fn(async () => {})
    expect(await transitionCharacter(client, operation)).toBe(false)
    expect(operation).not.toHaveBeenCalled()
    expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
            title: "Character operation in progress",
            message: expect.stringContaining("try again")
        })
    )
    expect(persistence.transitionSnapshot()).toBe(true)
    finish()
    await pending
    expect(await transitionCharacter(client, operation)).toBe(true)
    expect(operation).toHaveBeenCalledTimes(1)
})

it("reports session refusal without executing old account work", async () => {
    const transport = { get: vi.fn(), create: vi.fn(), update: vi.fn() }
    const persistence = createCharacterPersistence(transport, vi.fn(), () => false)
    const operation = vi.fn()
    const refused = vi.fn()
    expect(await persistence.transition(operation, refused)).toBe(false)
    expect(refused).toHaveBeenCalledExactlyOnceWith("session")
    expect(operation).not.toHaveBeenCalled()
})

it("does not let account replacement during a transition pass its replacement guard", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    let finish!: () => void
    let guard!: () => boolean
    const pending = transitionCharacter(client, async (isCurrent) => {
        guard = isCurrent
        await new Promise<void>((resolve) => {
            finish = resolve
        })
    })
    client.setQueryData(["auth", "me"], { id: "bob" })
    characterPersistence(client)
    expect(guard()).toBe(false)
    finish()
    expect(await pending).toBe(false)
    expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
            title: "Account changed",
            message: expect.stringContaining("Try again")
        })
    )
})

it("does not report a successful draft replacement as an account cancellation", async () => {
    const client = new QueryClient()
    await transitionCharacter(client, async (_isCurrent, persistence) => {
        persistence.startDraft()
    })
    expect(notifications.show).not.toHaveBeenCalled()
})
