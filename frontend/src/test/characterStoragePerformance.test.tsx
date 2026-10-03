import { act, renderHook } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { characterSchema, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"

beforeEach(() => localStorage.clear())

it("does not validate internal edits again while preserving external storage validation", () => {
    const { result, rerender } = renderHook(() => useCharacterLocalStorage())
    const parse = vi.spyOn(characterSchema, "parse")
    act(() => result.current[1]((character) => ({ ...character, name: "Edited locally" })))
    rerender()
    expect(parse).not.toHaveBeenCalled()
    expect(result.current[0].name).toBe("Edited locally")
    const externalCharacter = { ...getEmptyCharacter(), name: "Edited in another tab" }
    const serialized = JSON.stringify(externalCharacter)
    act(() => {
        localStorage.setItem("character", serialized)
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: "character",
                newValue: serialized,
                storageArea: localStorage
            })
        )
    })
    expect(parse).toHaveBeenCalledTimes(1)
    expect(result.current[0].name).toBe("Edited in another tab")
    expect(result.current[0].version).toBe(schemaVersion)
    parse.mockRestore()
})

it("shares the latest snapshot between mounted consumers and merges sequential updates", () => {
    const first = renderHook(() => useCharacterLocalStorage())
    const second = renderHook(() => useCharacterLocalStorage())
    act(() => {
        first.result.current[1]((character) => ({ ...character, name: "Latest name" }))
        second.result.current[1]((character) => ({ ...character, experience: 42 }))
    })
    expect(first.result.current[0]).toMatchObject({ name: "Latest name", experience: 42 })
    expect(second.result.current[0]).toBe(first.result.current[0])
    expect(JSON.parse(localStorage.getItem("character")!)).toMatchObject({
        name: "Latest name",
        experience: 42
    })
})

it("merges an external storage change and a local updater in the same batch", () => {
    const { result } = renderHook(() => useCharacterLocalStorage())
    const serialized = JSON.stringify({ ...getEmptyCharacter(), name: "External name" })
    act(() => {
        localStorage.setItem("character", serialized)
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: "character",
                newValue: serialized,
                storageArea: localStorage
            })
        )
        result.current[1]((character) => ({ ...character, experience: 12 }))
    })
    expect(result.current[0]).toMatchObject({ name: "External name", experience: 12 })
})

it("does not resurrect the previous snapshot after external deletion or invalid data", () => {
    const { result } = renderHook(() => useCharacterLocalStorage())
    for (const newValue of [null, "invalid JSON"]) {
        act(() => result.current[1]((character) => ({ ...character, name: "Previous name" })))
        act(() => {
            if (newValue === null) localStorage.removeItem("character")
            else localStorage.setItem("character", newValue)
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: "character",
                    newValue,
                    storageArea: localStorage
                })
            )
            result.current[1]((character) => ({ ...character, experience: 21 }))
        })
        expect(result.current[0]).toMatchObject({ name: getEmptyCharacter().name, experience: 21 })
    }
})
