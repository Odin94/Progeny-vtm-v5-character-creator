import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Profiler, useState } from "react"
import { afterEach, expect, it, vi } from "vitest"
import CoterieCharacterSummaryGrid from "~/components/CoterieCharacterSummaryGrid"
import UserProfileSection from "~/pages/sections/UserProfileSection"
import CharactersSection from "~/pages/sections/CharactersSection"
import Sidebar from "~/sidebar/Sidebar"
import HomebrewLibraryDetailsPage from "~/pages/HomebrewLibraryDetailsPage"
import HomebrewDetailsPage from "~/pages/HomebrewDetailsPage"
import HomebrewLibraryPage from "~/pages/HomebrewLibraryPage"
import { attributesKeySchema } from "~/data/Attributes"
import { skillsKeySchema } from "~/data/Skills"
import { characterSchema, getEmptyCharacter } from "~/data/Character"
import { createEmptyHomebrewItem } from "~/data/Homebrew"
import { api } from "~/utils/api"

vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({
        user: { id: "reader", impersonation: { active: false } },
        isAuthenticated: true,
        signIn: vi.fn()
    })
}))
vi.mock("~/hooks/useCharacters", () => ({ useCharacters: () => ({ data: [], isLoading: false }) }))
const homebrewFixture = vi.hoisted(() => ({ collection: null as unknown }))
vi.mock("~/hooks/useHomebrew", () => ({
    useHomebrewCollections: () => ({ data: [] }),
    useHomebrewCollection: () => ({ data: homebrewFixture.collection }),
    useCreateHomebrewCollection: () => ({}),
    useUpdateHomebrewCollection: () => ({})
}))
vi.mock("~/components/AppTopbar", () => ({ default: () => <nav>Topbar</nav> }))
vi.mock("@tanstack/react-router", () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>
}))
vi.mock("~/utils/api", () => ({
    api: {
        getHomebrewLibraryDetail: vi.fn(),
        getHomebrewLibrary: vi.fn(async () => []),
        getHomebrewPublishRequests: vi.fn(async () => [])
    }
}))
vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)
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
const measure = (
    name: string,
    mount: React.ReactNode,
    edit: (i: number) => void,
    iterations = 20
) => {
    const metrics = { commits: 0, actualDurationMs: 0 }
    render(
        <MantineProvider>
            <Profiler
                id={name}
                onRender={(_id, _phase, duration) => {
                    metrics.commits++
                    metrics.actualDurationMs += duration
                }}
            >
                {mount}
            </Profiler>
        </MantineProvider>
    )
    metrics.commits = 0
    metrics.actualDurationMs = 0
    const start = performance.now()
    for (let i = 0; i < iterations; i++) act(() => edit(i))
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: name,
                iterations,
                ...metrics,
                wallTimeMs: performance.now() - start
            }) +
            "\n"
    )
}
it("profiles real creator sidebar summaries during basic text edits", () => {
    let update: (name: string) => void = () => {}
    const initial = getEmptyCharacter()
    initial.attributes.strength = 3
    initial.skills.athletics = 2
    initial.touchstones = [{ name: "Example", conviction: "Protect others" }]
    const Harness = () => {
        const [character, setCharacter] = useState(initial)
        update = (name) => setCharacter((c) => ({ ...c, name }))
        return (
            <Sidebar
                character={character}
                onLoadFromFile={() => {}}
                onLoadSavedCharacter={async () => {}}
                onCreateCharacter={async () => {}}
            />
        )
    }
    const attributesParse = vi.spyOn(attributesKeySchema, "parse"),
        skillsParse = vi.spyOn(skillsKeySchema, "parse")
    measure("creator-sidebar-name", <Harness />, (i) => update(`Benchmark ${i}`))
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: "creator-summary-key-parses",
                attributes: attributesParse.mock.calls.length - 9,
                skills: skillsParse.mock.calls.length - 27
            }) +
            "\n"
    )
    attributesParse.mockRestore()
    skillsParse.mockRestore()
    expect(screen.getAllByText(/Benchmark 19/).length).toBeGreaterThan(0)
})
it("profiles mounted published collection during comment typing", async () => {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } }
    })
    const snapshot = {
        id: "fixture",
        name: "Fixture rules",
        shortDescription: "Rules",
        description: "",
        tags: [],
        contentWarning: "",
        items: Array.from({ length: 60 }, (_, i) => ({
            ...createEmptyHomebrewItem("merit"),
            id: `item-${i}`,
            name: `Rule ${i}`,
            summary: "A representative rule",
            description: "Rule details"
        }))
    }
    client.setQueryData(["homebrew", "library", "detail", "fixture"], {
        id: "fixture",
        version: 1,
        authorId: "author",
        authorNickname: "Author",
        snapshot,
        source: null,
        ratingCount: 0,
        averageRating: 0,
        comments: []
    })
    measure(
        "library-detail-comment",
        <QueryClientProvider client={client}>
            <HomebrewLibraryDetailsPage collectionId="fixture" />
        </QueryClientProvider>,
        (i) => fireEvent.change(screen.getByRole("textbox"), { target: { value: `Comment ${i}` } })
    )
    expect(screen.getByDisplayValue("Comment 19")).toBeInTheDocument()
})
it("measures actual library query calls during a search burst", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
        <MantineProvider>
            <QueryClientProvider client={client}>
                <HomebrewLibraryPage />
            </QueryClientProvider>
        </MantineProvider>
    )
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
    })
    vi.mocked(api.getHomebrewLibrary).mockClear()
    for (const value of ["v", "va", "vam", "vamp", "vampi", "vampir", "vampire"]) {
        fireEvent.change(screen.getByLabelText("Search"), { target: { value } })
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
        })
    }
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350))
    })
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: "library-search-burst",
                keystrokes: 7,
                requests: vi.mocked(api.getHomebrewLibrary).mock.calls.length
            }) +
            "\n"
    )
    expect(vi.mocked(api.getHomebrewLibrary).mock.calls.at(-1)?.[0]?.query).toBe("vampire")
})

it("profiles coterie character summaries while editing private notes", () => {
    const members = Array.from({ length: 6 }, (_, i) => ({
        id: `member-${i}`,
        characterId: `character-${i}`,
        createdAt: "2026-10-03",
        character: {
            id: `character-${i}`,
            name: `Vampire ${i}`,
            data: { ...getEmptyCharacter(), name: `Vampire ${i}` },
            version: 1,
            createdAt: "2026-10-03",
            updatedAt: "2026-10-03"
        }
    }))
    const vitals = {}
    let update: (value: string) => void = () => {}
    const Harness = () => {
        const [note, setNote] = useState("")
        update = setNote
        return (
            <>
                <textarea value={note} onChange={() => {}} />
                <CoterieCharacterSummaryGrid members={members} vitalsByCharacterId={vitals} />
            </>
        )
    }
    const parse = vi.spyOn(characterSchema, "safeParse")
    measure("coterie-notes-with-six-summaries", <Harness />, (i) => update(`Notes ${i}`))
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: "coterie-notes-schema-parses",
                parses: parse.mock.calls.length - 6
            }) +
            "\n"
    )
    parse.mockRestore()
    expect(screen.getByDisplayValue("Notes 19")).toBeInTheDocument()
})

it("profiles the account profile form beside sixty real character rows", () => {
    const character = getEmptyCharacter(),
        user = {
            nickname: "Player",
            email: "fixture@example.invalid",
            nameTagEnabled: false,
            nameTagVisible: false
        }
    const userCharacters = Array.from({ length: 60 }, (_, i) => ({
        id: `account-${i}`,
        name: `Character ${i}`,
        data: { ...character, name: `Character ${i}` },
        version: 1,
        characterVersion: 0,
        createdAt: "2026-10-03",
        updatedAt: "2026-10-03"
    }))
    const callback = vi.fn()
    let parentRenders = 0
    const Harness = () => {
        const [nicknameValue, setNicknameValue] = useState(user.nickname)
        parentRenders++
        return (
            <>
                <UserProfileSection
                    user={user}
                    isEditingNickname
                    nicknameValue={nicknameValue}
                    setNicknameValue={setNicknameValue}
                    setIsEditingNickname={callback}
                    isUpdatingProfile={false}
                    redColorValue="red"
                    handleSaveNickname={callback}
                    handleCancelNickname={callback}
                    handleNameTagToggle={callback}
                />
                <CharactersSection
                    userCharacters={userCharacters}
                    character={character}
                    isLoading={false}
                    hasLoadError={false}
                    onRetry={callback}
                    showSaveCurrentButton={false}
                    isSavingCharacter={false}
                    isAnyOperationInFlight={false}
                    loadingCharacterId={null}
                    setCreateCharacterModalOpened={callback}
                    handleSaveCurrentCharacter={callback}
                    handleLoadFromFile={callback}
                    handleLoadCharacter={callback}
                    handleShareCharacter={callback}
                    handleShowSummary={callback}
                    handleSaveJson={callback}
                    handleDownloadPdf={callback}
                    handleDeleteCharacter={callback}
                    handleUnshareCharacter={callback}
                />
            </>
        )
    }
    measure("account-nickname-with-sixty-rows", <Harness />, (i) =>
        fireEvent.change(screen.getByPlaceholderText("Enter nickname"), {
            target: { value: `Nickname ${i}` }
        })
    )
    process.stdout.write(
        "PERFORMANCE " +
            JSON.stringify({
                scenario: "account-nickname-parent-renders",
                renders: parentRenders - 1
            }) +
            "\n"
    )
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(screen.getByDisplayValue("Nickname 19")).toBeInTheDocument()
})

it("profiles collection metadata typing beside sixty editable rule cards", () => {
    homebrewFixture.collection = {
        id: "fixture",
        name: "Fixture collection",
        shortDescription: "Summary",
        description: "",
        tags: [],
        contentWarning: "",
        items: Array.from({ length: 60 }, (_, i) => ({
            ...createEmptyHomebrewItem("merit"),
            id: `edit-item-${i}`,
            name: `Editable rule ${i}`
        }))
    }
    measure("homebrew-editor-metadata", <HomebrewDetailsPage collectionId="fixture" />, (i) =>
        fireEvent.change(screen.getByLabelText(/^Collection name/), {
            target: { value: `Collection ${i}` }
        })
    )
    expect(screen.getByDisplayValue("Collection 19")).toBeInTheDocument()
})
