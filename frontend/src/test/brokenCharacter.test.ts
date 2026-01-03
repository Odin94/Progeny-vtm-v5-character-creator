import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { resolve } from "path"
import React from "react"
import { renderHook, act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MantineProvider } from "@mantine/core"
import { getEmptyCharacter } from "~/data/Character"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import BrokenSaveModal from "~/components/BrokenSaveModal"

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

describe("Broken Character Logic", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe("useCharacterLocalStorage with broken data", () => {
        it("should set broken character when JSON parsing fails", () => {
            const invalidJson = "not valid json{"
            localStorage.setItem("character", invalidJson)

            const { result } = renderHook(() => useCharacterLocalStorage())

            expect(result.current[0]).toEqual(getEmptyCharacter())
            expect(localStorage.getItem("character_broken_save")).toBe(JSON.stringify(invalidJson))
            expect(localStorage.getItem("character_broken_save_error")).toBeTruthy()
        })

        it("should set broken character when schema validation fails after compatibility patches", () => {
            const invalidCharacter = JSON.stringify({
                name: "Test",
                clan: "InvalidClan",
                attributes: { strength: "not a number" },
            })
            localStorage.setItem("character", invalidCharacter)

            const { result } = renderHook(() => useCharacterLocalStorage())

            expect(result.current[0]).toEqual(getEmptyCharacter())
            expect(localStorage.getItem("character_broken_save")).toBe(JSON.stringify(invalidCharacter))
            expect(localStorage.getItem("character_broken_save_error")).toBeTruthy()
        })

        it("should successfully parse valid character and not set broken character", () => {
            const validCharacter = getEmptyCharacter()
            validCharacter.name = "Valid Character"
            localStorage.setItem("character", JSON.stringify(validCharacter))

            const { result } = renderHook(() => useCharacterLocalStorage())

            expect(result.current[0].name).toBe("Valid Character")
            const { result: brokenHook } = renderHook(() => useBrokenCharacter())
            expect(brokenHook.current.brokenData).toBe("")
            expect(brokenHook.current.brokenError).toBe("")
            expect(brokenHook.current.hasBrokenCharacter).toBe(false)
        })

        it("should successfully parse character after applying compatibility patches", () => {
            const filePath = resolve(__dirname, "jsonExports", "progeny_1.0.0.json")
            const oldCharacter = readFileSync(filePath, "utf-8")
            localStorage.setItem("character", oldCharacter)

            const { result } = renderHook(() => useCharacterLocalStorage())

            expect(result.current[0].name).toBe("Guya")
            const { result: brokenHook } = renderHook(() => useBrokenCharacter())
            expect(brokenHook.current.brokenData).toBe("")
            expect(brokenHook.current.brokenError).toBe("")
            expect(brokenHook.current.hasBrokenCharacter).toBe(false)
        })
    })

    describe("Full flow: broken character to modal", () => {
        it("should open modal when broken character is set, allow download, and close on reset", async () => {
            const brokenData = '{"invalid": "character data"}'

            localStorage.setItem("character", brokenData)

            const { result: characterHook } = renderHook(() => useCharacterLocalStorage())

            expect(characterHook.current[0]).toEqual(getEmptyCharacter())

            const mockCreateObjectURL = vi.fn(() => "blob:mock-url")
            const mockRevokeObjectURL = vi.fn()

            global.URL.createObjectURL = mockCreateObjectURL
            global.URL.revokeObjectURL = mockRevokeObjectURL

            let createdLink: HTMLAnchorElement | null = null
            const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
                // @ts-expect-error - this is a mock
                createdLink = this as HTMLAnchorElement
            })

            const { result: brokenHook } = renderHook(() => useBrokenCharacter())
            expect(brokenHook.current.hasBrokenCharacter).toBe(true)
            expect(brokenHook.current.brokenData).toBe(brokenData)
            expect(brokenHook.current.brokenError).toBeTruthy()

            render(React.createElement(MantineProvider, {}, React.createElement(BrokenSaveModal)))

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            expect(screen.getByText("Character Data Error")).toBeDefined()
            expect(screen.getByText("Failed to load character from saved data")).toBeDefined()
            expect(screen.getByText("Download Broken Save Data")).toBeDefined()
            expect(screen.getByText("Reset to Empty Character")).toBeDefined()

            const downloadButton = screen.getByText("Download Broken Save Data")
            await act(async () => {
                await userEvent.click(downloadButton)
            })

            expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
            expect(linkClickSpy).toHaveBeenCalled()
            expect(createdLink).not.toBeNull()
            const link = createdLink!
            expect(link.download).toContain("broken_character_save_")
            expect(link.href).toBe("blob:mock-url")

            // Verify the blob was created with the correct type and content
            expect(mockCreateObjectURL.mock.calls.length).toBeGreaterThan(0)
            // @ts-expect-error - this is a mock
            const blobCall = mockCreateObjectURL.mock.calls[0][0] as unknown as Blob
            expect(blobCall).toBeDefined()
            expect(blobCall.type).toBe("application/json")

            // Verify blob content using FileReader
            const blobContent = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsText(blobCall)
            })
            expect(blobContent).toBe(brokenData)

            linkClickSpy.mockRestore()

            const resetButton = screen.getByText("Reset to Empty Character")
            await act(async () => {
                await userEvent.click(resetButton)
            })

            const { result: brokenHookAfterReset } = renderHook(() => useBrokenCharacter())
            expect(brokenHookAfterReset.current.hasBrokenCharacter).toBe(false)
            expect(brokenHookAfterReset.current.brokenData).toBe("")
            expect(brokenHookAfterReset.current.brokenError).toBe("")
        })
    })
})
