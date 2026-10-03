import React from "react"
import { render, act } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const state = vi.hoisted(() => ({
    character: null as any,
    sidebar: null as any,
    importer: null as any,
    confirm: null as any,
    fileRead: vi.fn(),
    update: vi.fn(),
    generator: null as any,
    get: vi.fn(),
    client: null as any,
    navigate: vi.fn()
}))
vi.mock("@mantine/core", () => {
    const container = ({ children }: any) => <>{children}</>
    return {
        AppShell: Object.assign(container, {
            Header: container,
            Navbar: container,
            Aside: container,
            Main: container
        }),
        BackgroundImage: container,
        useComputedColorScheme: () => "dark"
    }
})
vi.mock("@mantine/hooks", () => ({
    useLocalStorage: () => ["clan", vi.fn()],
    useMediaQuery: () => false,
    useViewportSize: () => ({ height: 800, width: 1200 })
}))
vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }))
vi.mock("@tanstack/react-query", async (original) => ({
    ...(await original<any>()),
    useQueryClient: () => state.client
}))
vi.mock("@tanstack/react-router", () => ({
    useNavigate: () => state.navigate,
    useLocation: () => ({ pathname: "/create", hash: "#clan" })
}))
vi.mock("~/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }))
vi.mock("~/hooks/useCharacters", () => ({
    useCharacters: () => ({ data: [{ id: "B", shared: false, canEdit: true }] })
}))
vi.mock("~/hooks/useCharacterLocalStorage", () => ({
    useCharacterLocalStorage: () => [
        state.character,
        (next: any) => {
            state.character = typeof next === "function" ? next(state.character) : next
        }
    ]
}))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { get: state.get } }))
vi.mock("~/sidebar/Sidebar", () => ({
    default: (props: any) => {
        state.sidebar = props
        return null
    }
}))
vi.mock("~/components/LoadModal", async (original) => {
    const actual = await original<any>()
    return {
        ...actual,
        default: (props: any) => {
            state.importer = props
            return <actual.default {...props} />
        }
    }
})
vi.mock("~/components/ConfirmActionModal", () => ({
    default: (props: any) => {
        state.confirm = props
        return null
    }
}))
vi.mock("~/generator/utils", async (original) => ({
    ...(await original<any>()),
    getUploadFile: state.fileRead
}))
vi.mock("~/components/RenderProfiler", () => ({ default: ({ children }: any) => <>{children}</> }))
vi.mock("~/components/NameCharacterBeforeSwitchModal", () => ({ default: () => null }))
vi.mock("~/components/SharedCharacterCreatorModal", () => ({ default: () => null }))
vi.mock("~/generator/Generator", () => ({
    default: (props: any) => {
        state.generator = props
        return null
    }
}))
vi.mock("~/sidebar/AsideBar", () => ({ default: () => null }))
vi.mock("~/topbar/Topbar", () => ({ default: () => null }))

vi.mock("~/utils/api", () => ({
    api: {
        getCharacter: async (id: string) => ({ id, characterVersion: 1, canEdit: true }),
        updateCharacter: state.update
    }
}))

import CreatorPage from "~/pages/CreatorPage"
import { QueryClient } from "@tanstack/react-query"

it("keeps a later imported draft when an earlier Creator target fetch finishes", async () => {
    state.client = new QueryClient()
    state.client.setQueryData(["auth", "me"], { id: "alice" })
    state.character = getEmptyCharacter()
    let resolve!: (response: any) => void
    state.get.mockReturnValue(
        new Promise((r) => {
            resolve = r
        })
    )
    render(<CreatorPage />)
    let pending!: Promise<void>
    await act(async () => {
        pending = state.sidebar.onLoadSavedCharacter("B")
        await Promise.resolve()
    })
    expect(state.get).toHaveBeenCalledWith("B")
    await act(async () => {
        state.importer.setCharacter({ ...getEmptyCharacter(), name: "Imported C" })
    })
    expect(state.character.name).toBe("Imported C")
    await act(async () => {
        resolve({ data: { ...getEmptyCharacter(), name: "Remote B" } })
        await pending
    })
    expect(state.character.name).toBe("Imported C")
})

it("does not replace the local draft with a retired account target load", async () => {
    state.get.mockReset()
    state.client = new QueryClient()
    state.client.setQueryData(["auth", "me"], { id: "alice" })
    state.character = getEmptyCharacter()
    let resolve!: (response: any) => void
    state.get.mockReturnValue(
        new Promise((r) => {
            resolve = r
        })
    )
    render(<CreatorPage />)
    let pending!: Promise<void>
    await act(async () => {
        pending = state.sidebar.onLoadSavedCharacter("B")
        await Promise.resolve()
    })
    state.client.setQueryData(["auth", "me"], null)
    await act(async () => {
        resolve({ data: { ...getEmptyCharacter(), name: "Retired Alice Character" } })
        await pending
    })
    expect(state.character.name).toBe("")
})

it("a pending import cannot replace the character loaded by a later explicit action", async () => {
    state.get.mockReset()
    state.client = new QueryClient()
    state.client.setQueryData(["auth", "me"], { id: "alice" })
    state.character = getEmptyCharacter()
    let finishRead!: (value: string) => void
    state.fileRead.mockReturnValue(
        new Promise((resolve) => {
            finishRead = resolve
        })
    )
    state.get.mockResolvedValue({ data: { ...getEmptyCharacter(), name: "Remote B" } })
    render(<CreatorPage />)
    await act(async () => {
        state.sidebar.onLoadFromFile(new File(["{}"], "character.json"))
    })
    let pendingImport!: Promise<void>
    await act(async () => {
        pendingImport = state.confirm.onConfirm()
        await Promise.resolve()
    })
    await act(async () => {
        state.confirm.onClose()
    })
    await act(async () => {
        await state.sidebar.onLoadSavedCharacter("B")
    })
    expect(state.character).toMatchObject({ id: "B", name: "Remote B" })
    await act(async () => {
        finishRead(
            "data:application/json;base64," +
                btoa(JSON.stringify({ ...getEmptyCharacter(), name: "Earlier import A" }))
        )
        await pendingImport
    })
    expect(state.character).toMatchObject({ id: "B", name: "Remote B" })
})

it("temporarily freezes generator editing throughout a foreground switch and restores it afterward", async () => {
    state.get.mockReset()
    state.update.mockReset()
    state.client = new QueryClient()
    state.client.setQueryData(["auth", "me"], { id: "alice" })
    state.character = {
        ...getEmptyCharacter(),
        id: "B",
        name: "Current",
        description: "initial",
        characterVersion: 1
    }
    let finish!: (result: any) => void
    state.update.mockReturnValue(
        new Promise((resolve) => {
            finish = resolve
        })
    )
    state.get.mockResolvedValue({ data: { ...getEmptyCharacter(), name: "Target" } })
    const { container } = render(<CreatorPage />)
    let pending!: Promise<void>
    await act(async () => {
        pending = state.sidebar.onLoadSavedCharacter("C")
        await Promise.resolve()
        await Promise.resolve()
    })
    expect(state.update).toHaveBeenCalledOnce()
    expect(container.querySelector("[inert]")).not.toBeNull()
    await act(async () => {
        state.generator.setCharacter({ ...state.character, description: "edit while save pending" })
    })
    expect(state.character.description).toBe("initial")
    await act(async () => {
        finish({ id: "B", characterVersion: 2 })
        await pending
    })
    expect(state.character.name).toBe("Target")
    expect(state.update.mock.calls.at(-1)?.[1].data.description).toBe("initial")
    expect(container.querySelector("[inert]")).toBeNull()
    await act(async () => {
        state.generator.setCharacter({ ...state.character, description: "edit after switch" })
    })
    expect(state.character.description).toBe("edit after switch")
})

it("restores editing after a foreground switch save fails without replacing the current draft", async () => {
    state.get.mockReset()
    state.update.mockReset()
    state.client = new QueryClient()
    state.client.setQueryData(["auth", "me"], { id: "alice" })
    state.character = {
        ...getEmptyCharacter(),
        id: "B",
        name: "Current",
        description: "initial",
        characterVersion: 1
    }
    let fail!: (error: Error) => void
    state.update.mockReturnValue(
        new Promise((_, reject) => {
            fail = reject
        })
    )
    const { container } = render(<CreatorPage />)
    let pending!: Promise<void>
    await act(async () => {
        pending = state.sidebar.onLoadSavedCharacter("C")
        await Promise.resolve()
        await Promise.resolve()
    })
    expect(container.querySelector("[inert]")).not.toBeNull()
    const rejected = expect(pending).rejects.toThrow("Unavailable")
    await act(async () => {
        fail(new Error("Unavailable"))
        await rejected
    })
    expect(state.get).not.toHaveBeenCalled()
    expect(state.character.name).toBe("Current")
    expect(container.querySelector("[inert]")).toBeNull()
    await act(async () => {
        state.generator.setCharacter({ ...state.character, description: "edit after failure" })
    })
    expect(state.character.description).toBe("edit after failure")
})
