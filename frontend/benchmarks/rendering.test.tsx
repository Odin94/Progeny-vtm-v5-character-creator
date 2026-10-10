import { MantineProvider } from "@mantine/core"
import { act, cleanup, render } from "@testing-library/react"
import { Profiler, type ProfilerOnRenderCallback } from "react"
import { afterEach, expect, it, vi } from "vitest"
import RouseCheckButton from "~/character_sheet/components/RouseCheckButton"
import RemorseTestButton from "~/character_sheet/components/RemorseTestButton"
import { useSessionChatStore } from "~/character_sheet/stores/sessionChatStore"
import { getEmptyCharacter } from "~/data/Character"
import { characterSchema } from "~/data/Character"
import { useCharacterLocalStorage, type SetCharacter } from "~/hooks/useCharacterLocalStorage"
import Attributes from "~/character_sheet/sections/Attributes"
import Skills from "~/character_sheet/sections/Skills"
import BottomData from "~/character_sheet/sections/BottomData"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"

const rowMetrics = vi.hoisted(() => ({ renders: 0 }))
vi.mock("~/character_sheet/components/Pips", async (importOriginal) => {
    const original = await importOriginal<typeof import("~/character_sheet/components/Pips")>()
    return {
        default: (props: React.ComponentProps<typeof original.default>) => {
            if (props.field?.startsWith("attributes.") || props.field?.startsWith("skills."))
                rowMetrics.renders += 1
            return <original.default {...props} />
        }
    }
})

Object.defineProperty(window, "matchMedia", {
    value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn()
    }))
})

afterEach(cleanup)

it("measures real dice controls receiving unrelated chat updates", () => {
    const character = getEmptyCharacter()
    const setCharacter = vi.fn()
    const iterations = 100
    const metrics = { commits: 0, actualDurationMs: 0 }
    const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
        metrics.commits += 1
        metrics.actualDurationMs += actualDuration
    }
    render(
        <MantineProvider>
            <Profiler id="dice-controls" onRender={onRender}>
                <RouseCheckButton
                    character={character}
                    setCharacter={setCharacter}
                    primaryColor="grape"
                />
                <RemorseTestButton
                    character={character}
                    setCharacter={setCharacter}
                    primaryColor="grape"
                />
            </Profiler>
        </MantineProvider>
    )
    metrics.commits = 0
    metrics.actualDurationMs = 0
    const started = performance.now()
    for (let index = 0; index < iterations; index += 1) {
        act(() => {
            useSessionChatStore.setState({ messages: [], participants: [] })
        })
    }
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: "dice-controls-unrelated-chat-updates",
                iterations,
                ...metrics,
                wallTimeMs: performance.now() - started
            }) +
            "\n"
    )
    // Also exercise the subscribed connection fields, so a selector that never
    // refreshes the controls cannot accidentally pass the performance check.
    const beforeConnectionChange = metrics.commits
    act(() =>
        useSessionChatStore.setState({ connectionStatus: "connected", sessionId: "benchmark" })
    )
    expect(metrics.commits).toBeGreaterThan(beforeConnectionChange)
    act(() => useSessionChatStore.setState({ connectionStatus: "disconnected", sessionId: null }))
})

it("measures persisted name, hunger and XP edits with real sheet sections", () => {
    localStorage.clear()
    let update: SetCharacter
    const preferences = { colorTheme: null, backgroundImage: null }
    const onUpdatePreferences = vi.fn()
    let mode: SheetOptions["mode"] = "free"
    const metrics = { commits: 0, actualDurationMs: 0 }
    const onRender: ProfilerOnRenderCallback = (_id, _phase, duration) => {
        metrics.commits += 1
        metrics.actualDurationMs += duration
    }
    const Harness = () => {
        const [character, setCharacter] = useCharacterLocalStorage()
        update = setCharacter
        const options: SheetOptions = {
            character,
            setCharacter,
            mode,
            primaryColor: "grape",
            canEdit: true,
            preferences,
            onUpdatePreferences
        }
        return (
            <>
                <output>{character.name}</output>
                <Attributes options={options} />
                <Skills options={options} />
                <BottomData options={options} />
            </>
        )
    }
    render(
        <MantineProvider>
            <Profiler id="sheet-edits" onRender={onRender}>
                <Harness />
            </Profiler>
        </MantineProvider>
    )
    const parse = vi.spyOn(characterSchema, "parse")
    for (const scenario of ["name", "hunger", "xp", "xp-mode"] as const) {
        mode = scenario === "xp-mode" ? "xp" : "free"
        // Commit a mode change before measuring the field edits.
        act(() => update!((character) => ({ ...character, name: "Benchmark 29" })))
        metrics.commits = 0
        metrics.actualDurationMs = 0
        rowMetrics.renders = 0
        parse.mockClear()
        const started = performance.now()
        for (let index = 0; index < 30; index += 1) {
            act(() => {
                update!((character) =>
                    scenario === "name"
                        ? { ...character, name: `Benchmark ${index}` }
                        : scenario === "xp" || scenario === "xp-mode"
                          ? { ...character, experience: index }
                          : {
                                ...character,
                                ephemeral: { ...character.ephemeral, hunger: index % 6 }
                            }
                )
            })
        }
        process.stdout.write(
            "PERFORMANCE " +
                JSON.stringify({
                    scenario: `sheet-${scenario}-edits`,
                    iterations: 30,
                    ...metrics,
                    statRowRenders: rowMetrics.renders,
                    schemaParses: parse.mock.calls.length,
                    wallTimeMs: performance.now() - started
                }) +
                "\n"
        )
        expect(JSON.parse(localStorage.getItem("character")!).name).toBe("Benchmark 29")
    }
    parse.mockRestore()
})
