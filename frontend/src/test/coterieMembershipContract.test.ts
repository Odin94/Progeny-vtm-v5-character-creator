import { describe, expect, it, vi } from "vitest"
import type { CoterieResponse } from "~/utils/api"
import { createCoterieMembership, membershipCommandKey } from "~/modules/coterieMembership"

const setup = (coterie?: Partial<CoterieResponse>) => {
    let href = "https://progeny.test/me?coterieInvite=token#characters"
    const transport = {
        createInvite: vi.fn().mockResolvedValue({
            id: "invite",
            token: "secret token",
            createdAt: "today",
            expiresAt: "tomorrow"
        }),
        revokeInvite: vi.fn().mockResolvedValue(undefined),
        acceptInvite: vi.fn().mockResolvedValue({ coterie: { id: "coterie" } }),
        removePlayer: vi.fn().mockResolvedValue(undefined),
        addCharacter: vi.fn().mockResolvedValue({}),
        removeCharacter: vi.fn().mockResolvedValue(undefined)
    }
    const refresh = vi.fn()
    const module = createCoterieMembership(transport, {
        coterie: () => coterie as CoterieResponse | undefined,
        refresh,
        location: () => href,
        replaceLocation: (url) => {
            href = new URL(url, href).toString()
        }
    })
    return {
        module,
        transport,
        refresh,
        href: () => href,
        navigate: (url: string) => {
            href = url
        }
    }
}

describe("coterie membership contract", () => {
    it("coalesces duplicate submissions and exposes pending/error/retry through its interface", async () => {
        const { module, transport, refresh } = setup()
        let reject!: (error: Error) => void
        transport.removePlayer.mockReturnValueOnce(
            new Promise((_resolve, r) => {
                reject = r
            })
        )
        const command = {
            type: "removePlayer" as const,
            coterieId: "coterie",
            membershipId: "player"
        }
        const first = module.run(command)
        expect(module.run(command)).toBe(first)
        expect(module.snapshot().pending.has(membershipCommandKey(command))).toBe(true)
        reject(new Error("Forbidden"))
        await expect(first).rejects.toThrow("Forbidden")
        expect(module.snapshot().pending.size).toBe(0)
        expect(module.snapshot().errors.get(membershipCommandKey(command))).toEqual(
            new Error("Forbidden")
        )
        expect(refresh).not.toHaveBeenCalled()
        await module.run(command)
        expect(module.snapshot().errors.size).toBe(0)
        expect(refresh).toHaveBeenCalledWith(["coteries", "coterieVitals", "characters"])
    })
    it("rejects known forbidden owner operations before transport", async () => {
        const { module, transport } = setup({ canManageInvites: false, canManagePlayers: false })
        await expect(module.run({ type: "createInvite", coterieId: "coterie" })).rejects.toThrow(
            "owner"
        )
        await expect(
            module.run({ type: "revokeInvite", coterieId: "coterie", inviteId: "invite" })
        ).rejects.toThrow("owner")
        await expect(
            module.run({ type: "removePlayer", coterieId: "coterie", membershipId: "player" })
        ).rejects.toThrow("owner")
        expect(transport.createInvite).not.toHaveBeenCalled()
        expect(transport.revokeInvite).not.toHaveBeenCalled()
        expect(transport.removePlayer).not.toHaveBeenCalled()
    })
    it("never removes the coterie owner, even if manage permission is true", async () => {
        const { module, transport } = setup({
            canManagePlayers: true,
            players: [
                {
                    membershipId: "owner",
                    isOwner: true,
                    nickname: null,
                    showNameTag: false,
                    joinedAt: "today"
                }
            ]
        })
        await expect(
            module.run({ type: "removePlayer", coterieId: "coterie", membershipId: "owner" })
        ).rejects.toThrow("cannot be removed")
        expect(transport.removePlayer).not.toHaveBeenCalled()
    })
    it("owns one-time bearer links and forgets them after revocation", async () => {
        const { module } = setup()
        await module.run({ type: "createInvite", coterieId: "coterie" })
        expect(
            new URL(module.snapshot().inviteUrls.get("coterie")!).searchParams.get("coterieInvite")
        ).toBe("secret token")
        await module.run({ type: "revokeInvite", coterieId: "coterie", inviteId: "invite" })
        expect(module.snapshot().inviteUrls.size).toBe(0)
    })
    it.each([true, false])(
        "consumes an invite once and removes only its token from the URL (success=%s)",
        async (success) => {
            const { module, transport, href, refresh } = setup()
            expect(module.claimInvite("token")).toBe(true)
            expect(module.claimInvite("token")).toBe(false)
            if (!success) transport.acceptInvite.mockRejectedValue(new Error("Expired"))
            await module.run({ type: "acceptInvite", token: "token" }).catch(() => undefined)
            expect(href()).toBe("https://progeny.test/me#characters")
            if (success)
                expect(refresh).toHaveBeenCalledWith(["coteries", "coterieVitals", "characters"])
            else expect(refresh).not.toHaveBeenCalled()
        }
    )
    it("does not remove a different invite opened during acceptance", async () => {
        const { module, transport, href, navigate } = setup()
        let resolve!: (value: unknown) => void
        transport.acceptInvite.mockReturnValueOnce(
            new Promise((r) => {
                resolve = r
            })
        )
        const pending = module.run({ type: "acceptInvite", token: "token" })
        navigate("https://progeny.test/me?coterieInvite=next-token")
        resolve({ coterie: { id: "coterie" } })
        await pending
        expect(href()).toContain("next-token")
    })
    it.each(["addCharacter", "removeCharacter"] as const)(
        "refreshes membership and vitals reads after %s",
        async (type) => {
            const { module, refresh } = setup()
            await module.run({ type, coterieId: "coterie", characterId: "character" })
            expect(refresh).toHaveBeenCalledWith(["coteries", "coterieVitals", "characters"])
        }
    )
    it("does not reveal a generated link after its dialog was dismissed during generation", async () => {
        const { module, transport } = setup()
        let resolve!: (value: unknown) => void
        transport.createInvite.mockReturnValueOnce(
            new Promise((r) => {
                resolve = r
            })
        )
        const pending = module.run({ type: "createInvite", coterieId: "coterie" })
        module.forgetInvite("coterie")
        resolve({ id: "invite", token: "secret", createdAt: "today", expiresAt: "tomorrow" })
        await pending
        expect(module.snapshot().inviteUrls.size).toBe(0)
    })
    it("does not publish membership changes or consume a URL after the account changed", async () => {
        const { transport, refresh } = setup()
        let account = "first"
        let resolve!: (value: unknown) => void
        const replaceLocation = vi.fn()
        const module = createCoterieMembership(
            transport,
            {
                coterie: () => undefined,
                refresh,
                location: () => "https://progeny.test/me?coterieInvite=token",
                replaceLocation
            },
            () => account === "first"
        )
        transport.acceptInvite.mockReturnValueOnce(
            new Promise((r) => {
                resolve = r
            })
        )
        const pending = module.run({ type: "acceptInvite", token: "token" })
        account = "second"
        resolve({ coterie: { id: "coterie" } })
        await expect(pending).rejects.toThrow("account changed")
        expect(refresh).not.toHaveBeenCalled()
        expect(replaceLocation).not.toHaveBeenCalled()
    })
})
