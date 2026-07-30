import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const jsonResponse = (body: unknown) =>
    new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" }
    })

const createApiCharacter = (data: unknown = getEmptyCharacter()) => ({
    id: "character-1",
    name: "Pearl Auster",
    data,
    version: 1,
    characterVersion: 2,
    createdAt: "2026-07-30T20:00:00.000Z",
    updatedAt: "2026-07-30T20:05:00.000Z",
    shared: false
})

describe("character API validation", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("returns typed, validated characters", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([createApiCharacter()])))

        const { api } = await import("~/utils/api")
        const characters = await api.getCharacters()

        expect(characters[0]?.id).toBe("character-1")
        expect(characters[0]?.data.name).toBe("")
        expect(characters[0]?.characterVersion).toBe(2)
    })

    it("applies compatibility patches to stored character data", async () => {
        const legacyCharacter = { ...getEmptyCharacter() } as Record<string, unknown>
        delete legacyCharacter.characterVersion

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse(createApiCharacter(legacyCharacter)))
        )

        const { api } = await import("~/utils/api")
        const character = await api.getCharacter("character-1")

        expect(character.data.characterVersion).toBe(0)
    })

    it("rejects malformed character data", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse(createApiCharacter({ name: "Incomplete" })))
        )

        const { api } = await import("~/utils/api")

        await expect(api.getCharacter("character-1")).rejects.toThrow(
            "Invalid character data returned by the API"
        )
    })
})
