import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import CharacterSheet from "~/character_sheet/CharacterSheet"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
import { getBasicTestCharacter } from "./testUtils"

const mocks = vi.hoisted(() => ({
    has3dDice: true,
    skills: vi.fn(() => null),
    preferences: { colorTheme: null, backgroundImage: null },
    updatePreferences: vi.fn()
}))
vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({ isAuthenticated: false, isLoading: false })
}))
vi.mock("~/hooks/useCharacters", () => ({ useCharacters: () => ({}), useCharacter: () => ({}) }))
vi.mock("~/hooks/useVampireDiceFeatureFlag", () => ({
    useVampireDiceFeatureFlag: () => mocks.has3dDice
}))
vi.mock("~/hooks/useUserPreferences", () => ({
    useUserPreferences: () => ({
        preferences: mocks.preferences,
        updatePreferences: mocks.updatePreferences
    })
}))
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))
vi.mock("~/character_sheet/components/diceRollModal/threeDice/warmup", () => ({
    scheduleDiceWarmup: () => () => {}
}))
vi.mock("~/character_sheet/sections/Skills", () => ({ default: mocks.skills }))
vi.mock("~/character_sheet/sections/Attributes", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/BottomData", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/Disciplines", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/MeritsAndFlaws", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/TheBlood", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/TopData", () => ({ default: () => null }))
vi.mock("~/character_sheet/sections/Touchstones", () => ({ default: () => null }))
vi.mock("~/character_sheet/components/CharacterSheetMenu", () => ({ default: () => null }))
vi.mock("~/character_sheet/components/CharacterNotesControl", () => ({ default: () => null }))
vi.mock("~/character_sheet/components/ChatWindow", () => ({ default: () => null }))

vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
}))
vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)
beforeEach(() => {
    mocks.has3dDice = true
    localStorage.removeItem("use-legacy-dice")
    useDiceRollModalStore.getState().reset()
    vi.clearAllMocks()
})

it("gives users without the feature flag default 3D dice and hides crystal dice", () => {
    mocks.has3dDice = false
    render(<CharacterSheet character={getBasicTestCharacter()} setCharacter={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Open dice roller" }))
    expect(screen.getByRole("button", { name: "Dice rolling settings" })).toBeInTheDocument()
    expect(screen.getByTestId("vampire-dice-controls")).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: "Vampire dice style" })).not.toBeInTheDocument()
    const sort = screen.getByRole("button", { name: "Sort dice" })
    const settings = screen.getByRole("button", { name: "Dice rolling settings" })
    expect(sort.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it("lets eligible users switch to legacy dice, remembers it, and lets them switch back", async () => {
    const props = { character: getBasicTestCharacter(), setCharacter: vi.fn() }
    const view = render(<CharacterSheet {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Open dice roller" }))
    fireEvent.click(screen.getByRole("button", { name: "Dice rolling settings" }))
    fireEvent.click(await screen.findByLabelText(/Use legacy dice roller/))
    expect(screen.queryByRole("radiogroup", { name: "Vampire dice style" })).not.toBeInTheDocument()
    expect(localStorage.getItem("use-legacy-dice")).toBe("true")
    await act(async () => view.unmount())
    render(<CharacterSheet {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Open dice roller" }))
    fireEvent.click(screen.getByRole("button", { name: "Dice rolling settings" }))
    const legacySwitch = await screen.findByLabelText(/Use legacy dice roller/)
    expect(legacySwitch).toBeChecked()
    fireEvent.click(legacySwitch)
    expect(screen.getByRole("radiogroup", { name: "Vampire dice style" })).toBeInTheDocument()
    expect(localStorage.getItem("use-legacy-dice")).toBe("false")
})

it("opens and closes the roller without rerendering sheet sections or creating WebGL", () => {
    render(<CharacterSheet character={getBasicTestCharacter()} setCharacter={vi.fn()} />)
    const renders = mocks.skills.mock.calls.length
    fireEvent.click(screen.getByRole("button", { name: "Open dice roller" }))
    expect(screen.getByTestId("vampire-dice-controls")).toBeInTheDocument()
    expect(mocks.skills).toHaveBeenCalledTimes(renders)
    expect(document.querySelector("canvas")).toBeNull()
    act(() => useDiceRollModalStore.getState().close())
    expect(screen.queryByTestId("vampire-dice-controls")).not.toBeInTheDocument()
    expect(mocks.skills).toHaveBeenCalledTimes(renders)
})
