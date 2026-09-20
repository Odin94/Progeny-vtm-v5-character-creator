import { MantineProvider } from "@mantine/core"
import { render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync } from "fs"
import { resolve } from "path"
import React, { act } from "react"
import { fileURLToPath } from "url"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CharacterRecoveryDownloads from "~/components/CharacterRecoveryDownloads"
import posthog from "posthog-js"
import BrokenSaveModal from "~/components/BrokenSaveModal"
import { getEmptyCharacter } from "~/data/Character"
import { CHARACTER_RECOVERY_KEY, useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn(),
        captureException: vi.fn(),
        get_explicit_consent_status: vi.fn(() => "denied")
    }
}))

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)

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
        dispatchEvent: vi.fn()
    }))
})

describe("Broken Character Logic", () => {
    beforeEach(() => {
        localStorage.clear()
        vi.mocked(posthog.capture).mockClear()
        vi.mocked(URL.createObjectURL).mockClear()
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
                attributes: { strength: "not a number" }
            })
            localStorage.setItem("character", invalidCharacter)

            const { result } = renderHook(() => useCharacterLocalStorage())

            expect(result.current[0]).toEqual(getEmptyCharacter())
            expect(localStorage.getItem("character_broken_save")).toBe(
                JSON.stringify(invalidCharacter)
            )
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

    it("retains separate recovery copies across multiple resets", () => {
        for (const data of ["first broken save", "second broken save", "first broken save"]) {
            localStorage.setItem("character_broken_save", JSON.stringify(data))
            localStorage.setItem("character_broken_save_error", JSON.stringify("parse error"))
            const { result, unmount } = renderHook(() => useBrokenCharacter())
            act(() => result.current.clearBrokenCharacter())
            unmount()
        }
        expect(
            JSON.parse(localStorage.getItem(CHARACTER_RECOVERY_KEY)!).map(
                (save: { data: string }) => save.data
            )
        ).toEqual(["first broken save", "second broken save"])
    })

    it("keeps the broken save if browser storage cannot preserve the recovery copy", () => {
        localStorage.setItem("character_broken_save", JSON.stringify("original save"))
        localStorage.setItem("character_broken_save_error", JSON.stringify("parse error"))
        const { result } = renderHook(() => useBrokenCharacter())
        const setItem = Storage.prototype.setItem
        const storageSpy = vi
            .spyOn(Storage.prototype, "setItem")
            .mockImplementation(function (this: Storage, key, value) {
                if (key === CHARACTER_RECOVERY_KEY)
                    throw new DOMException("Storage full", "QuotaExceededError")
                setItem.call(this, key, value)
            })
        try {
            expect(() => act(() => result.current.clearBrokenCharacter())).toThrow("Storage full")
            expect(result.current.hasBrokenCharacter).toBe(true)
            expect(JSON.parse(localStorage.getItem("character_broken_save")!)).toBe("original save")
        } finally {
            storageSpy.mockRestore()
        }
    })

    it("downloads an archived recovery copy from the account page without modifying it", async () => {
        const original = '{"name":"Recovery draft","unexpected":"keep this too"}'
        localStorage.setItem(
            CHARACTER_RECOVERY_KEY,
            JSON.stringify([
                { savedAt: "2026-09-17T12:00:00.000Z", data: original, error: "validation error" }
            ])
        )
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
        const { unmount } = render(
            React.createElement(
                MantineProvider,
                {},
                React.createElement(CharacterRecoveryDownloads)
            )
        )
        try {
            await userEvent.click(screen.getByRole("button", { name: /Download recovery copy/ }))
            const blob = vi.mocked(URL.createObjectURL).mock.lastCall![0] as Blob
            const content = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsText(blob)
            })
            expect(content).toBe(original)
            expect(clickSpy).toHaveBeenCalledOnce()
            expect(JSON.parse(localStorage.getItem(CHARACTER_RECOVERY_KEY)!)[0].data).toBe(original)
        } finally {
            clickSpy.mockRestore()
            unmount()
        }
    })

    describe("automatic repair", () => {
        const makeBrokenSave = () => {
            const valid = {
                name: "Keep this flaw",
                level: 1,
                type: "flaw",
                summary: "Keep",
                excludes: []
            }
            return JSON.stringify({
                ...getEmptyCharacter(),
                name: "Repair me",
                id: "saved-character-id",
                attributes: { ...getEmptyCharacter().attributes, strength: "bad", dexterity: 4 },
                flaws: [valid, { ...valid, name: "Ingrained Discipline", level: -1 }]
            })
        }
        const openBrokenSave = (raw: string) => {
            localStorage.setItem("character", raw)
            renderHook(() => useCharacterLocalStorage())
            render(React.createElement(MantineProvider, {}, React.createElement(BrokenSaveModal)))
        }

        it("shows each repair change immediately and leaves data untouched until auto-repair", async () => {
            const original = makeBrokenSave()
            openBrokenSave(original)
            const before = localStorage.getItem("character")
            expect(
                screen.getByText("Automatic repair may cause partial data loss")
            ).toBeInTheDocument()
            expect(
                screen.getByText("Flaw: Ingrained Discipline will be removed")
            ).toBeInTheDocument()
            expect(
                screen.getByText('Attributes → Strength will be reset from "bad" to 1')
            ).toBeInTheDocument()
            expect(localStorage.getItem("character")).toBe(before)
            expect(posthog.capture).toHaveBeenCalledWith(
                "character_repair_suggested",
                expect.objectContaining({ change_count: 2 })
            )
            expect(
                vi
                    .mocked(posthog.capture)
                    .mock.calls.some(([event]) => event === "character_repair_applied")
            ).toBe(false)
            expect(JSON.parse(localStorage.getItem("character_broken_save")!)).toBe(original)

            await userEvent.click(screen.getByRole("button", { name: "Auto-repair" }))
            const repaired = JSON.parse(localStorage.getItem("character")!)
            const suggestions = vi
                .mocked(posthog.capture)
                .mock.calls.filter(([event]) => event === "character_repair_suggested")
            expect(posthog.capture).toHaveBeenCalledWith(
                "character_repair_applied",
                expect.objectContaining({
                    repair_id: suggestions.at(-1)![1]!.repair_id,
                    change_count: 2
                })
            )
            expect(repaired.name).toBe("Repair me")
            expect(repaired.id).toBe("saved-character-id")
            expect(repaired.attributes.strength).toBe(1)
            expect(repaired.attributes.dexterity).toBe(4)
            expect(repaired.flaws.map((flaw: { name: string }) => flaw.name)).toEqual([
                "Keep this flaw"
            ])
            expect(JSON.parse(localStorage.getItem(CHARACTER_RECOVERY_KEY)!)[0].data).toBe(original)
            expect(JSON.parse(localStorage.getItem("character_broken_save")!)).toBe("")
        })

        it("keeps the recovery dialog open if the repaired character cannot be persisted", async () => {
            const original = makeBrokenSave()
            openBrokenSave(original)
            const setItem = Storage.prototype.setItem
            const spy = vi
                .spyOn(Storage.prototype, "setItem")
                .mockImplementation(function (this: Storage, key, value) {
                    if (key === "character")
                        throw new DOMException("Storage full", "QuotaExceededError")
                    setItem.call(this, key, value)
                })
            try {
                await userEvent.click(screen.getByRole("button", { name: "Auto-repair" }))
                expect(
                    screen.getByText(/Could not save the repair and its recovery copy/)
                ).toBeInTheDocument()
                expect(
                    vi
                        .mocked(posthog.capture)
                        .mock.calls.some(([event]) => event === "character_repair_applied")
                ).toBe(false)
                expect(JSON.parse(localStorage.getItem("character_broken_save")!)).toBe(original)
                expect(JSON.parse(localStorage.getItem(CHARACTER_RECOVERY_KEY)!)[0].data).toBe(
                    original
                )
            } finally {
                spy.mockRestore()
            }
        })

        it("updates the automatic repair preview if the broken save changes", async () => {
            openBrokenSave(makeBrokenSave())
            const { result } = renderHook(() => useBrokenCharacter())
            act(() =>
                result.current.setBrokenCharacter(
                    JSON.stringify({ ...getEmptyCharacter(), name: 42 }),
                    "new error"
                )
            )
            expect(screen.getByRole("button", { name: "Auto-repair" })).toBeEnabled()
        })

        it("offers download without auto-repair for unreadable JSON", () => {
            openBrokenSave("invalid JSON{")
            expect(screen.queryByRole("button", { name: "Auto-repair" })).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: "Download Broken Save Data" })).toBeEnabled()
        })
    })

    describe("Full flow: broken character to modal", () => {
        it("should open modal when broken character is set and allow download", async () => {
            const brokenData = '{"invalid": "character data"}'

            localStorage.setItem("character", brokenData)

            const { result: characterHook } = renderHook(() => useCharacterLocalStorage())

            expect(characterHook.current[0]).toEqual(getEmptyCharacter())

            const mockCreateObjectURL = URL.createObjectURL as ReturnType<typeof vi.fn>

            let createdLink: HTMLAnchorElement | null = null
            const linkClickSpy = vi
                .spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(function () {
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

            expect(screen.getByRole("dialog", { name: "Character Data Error" })).toBeDefined()
            expect(screen.getByText("Failed to load character from saved data")).toBeDefined()

            const downloadButton = screen.getByRole("button", {
                name: /download broken save data/i
            })
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
            expect(
                screen.queryByRole("button", { name: /reset to empty character/i })
            ).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: "Cookie preferences" })).toBeEnabled()
        })
    })
})
