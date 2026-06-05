import { create } from "zustand"
import type { DieResult } from "../components/diceRollModal/parts/DiceContainer"

type SetDiceFunction = {
    (dice: DieResult[]): void
    (updater: (prev: DieResult[]) => DieResult[]): void
}

type DiceRollModalStore = {
    opened: boolean
    dice: DieResult[]
    diceCount: number
    activeTab: string | null
    open: () => void
    openSelectedPool: () => void
    close: () => void
    setDice: SetDiceFunction
    setDiceCount: (count: number) => void
    setActiveTab: (tab: string | null) => void
    reset: () => void
}

const initialState = {
    opened: false,
    dice: [] as DieResult[],
    diceCount: 1,
    activeTab: "custom" as string | null
}

export const useDiceRollModalStore = create<DiceRollModalStore>((set) => ({
    ...initialState,
    open: () => set((state) => (state.opened ? state : { opened: true })),
    openSelectedPool: () =>
        set((state) =>
            state.opened && state.activeTab === "selected"
                ? state
                : { opened: true, activeTab: "selected" }
        ),
    close: () => set((state) => (state.opened ? { opened: false } : state)),
    setDice: ((diceOrUpdater: DieResult[] | ((prev: DieResult[]) => DieResult[])) => {
        set((state) => ({
            dice: typeof diceOrUpdater === "function" ? diceOrUpdater(state.dice) : diceOrUpdater
        }))
    }) as SetDiceFunction,
    setDiceCount: (count) => set({ diceCount: count }),
    setActiveTab: (tab) => set((state) => (state.activeTab === tab ? state : { activeTab: tab })),
    reset: () => set(initialState)
}))
