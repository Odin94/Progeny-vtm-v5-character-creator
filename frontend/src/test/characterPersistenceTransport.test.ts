import { QueryClient } from "@tanstack/react-query"
import { afterEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

afterEach(() => vi.unstubAllGlobals())

it.each(["character", "membership"] as const)(
    "does not dispatch %s work under a different account after CSRF initialization",
    async (operation) => {
        vi.resetModules()
        let resolveHealth!: (response: Response) => void
        const health = new Promise<Response>((resolve) => {
            resolveHealth = resolve
        })
        const draft = { ...getEmptyCharacter(), name: "Alice's draft" }
        const fetchMock = vi
            .fn()
            .mockReturnValueOnce(health)
            .mockResolvedValue(
                new Response(
                    JSON.stringify({
                        id: "created",
                        name: draft.name,
                        data: draft,
                        version: 1,
                        characterVersion: 1,
                        createdAt: "2026-10-03",
                        updatedAt: "2026-10-03"
                    })
                )
            )
        vi.stubGlobal("fetch", fetchMock)
        const { characterPersistence } = await import("~/modules/characterPersistence")
        const { coterieMembership } = await import("~/modules/coterieMembership")
        const client = new QueryClient()
        client.setQueryData(["auth", "me"], { id: "alice" })
        const pending =
            operation === "character"
                ? characterPersistence(client).save(draft, { owned: false })
                : coterieMembership(client).run({
                      type: "createInvite",
                      coterieId: "alice-coterie"
                  })
        client.setQueryData(["auth", "me"], { id: "bob" })
        resolveHealth(new Response("{}", { headers: { "X-CSRF-Token": "token" } }))
        await expect(pending).rejects.toThrow("account changed")
        expect(fetchMock).toHaveBeenCalledTimes(1)
    }
)

it("does not revive retired account work when the same account signs back in", async () => {
    vi.resetModules()
    let resolveHealth!: (response: Response) => void
    const fetchMock = vi.fn().mockImplementation(
        () =>
            new Promise<Response>((resolve) => {
                resolveHealth = resolve
            })
    )
    vi.stubGlobal("fetch", fetchMock)
    const { characterPersistence } = await import("~/modules/characterPersistence")
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    const retired = characterPersistence(client)
    const pending = retired.save(
        { ...getEmptyCharacter(), name: "Retired draft" },
        { owned: false }
    )
    client.setQueryData(["auth", "me"], { id: "bob" })
    characterPersistence(client)
    client.setQueryData(["auth", "me"], { id: "alice" })
    expect(characterPersistence(client)).not.toBe(retired)
    resolveHealth(new Response("{}", { headers: { "X-CSRF-Token": "token" } }))
    await expect(pending).rejects.toThrow("account changed")
    expect(fetchMock).toHaveBeenCalledTimes(1)
})
