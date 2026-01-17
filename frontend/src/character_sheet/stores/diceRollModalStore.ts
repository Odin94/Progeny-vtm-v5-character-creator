import { create } from "zustand"
import type { DieResult } from "../components/diceRollModal/parts/DiceContainer"

type SetDiceFunction = {
    (dice: DieResult[]): void
    (updater: (prev: DieResult[]) => DieResult[]): void
}

type DiceRollModalStore = {
    dice: DieResult[]
    diceCount: number
    activeTab: string | null
    setDice: SetDiceFunction
    setDiceCount: (count: number) => void
    setActiveTab: (tab: string | null) => void
    reset: () => void
}

const initialState = {
    dice: [] as DieResult[],
    diceCount: 1,
    activeTab: "custom" as string | null,
}

export const useDiceRollModalStore = create<DiceRollModalStore>((set) => ({
    ...initialState,
    setDice: ((diceOrUpdater: DieResult[] | ((prev: DieResult[]) => DieResult[])) => {
        set((state) => ({
            dice: typeof diceOrUpdater === "function" ? diceOrUpdater(state.dice) : diceOrUpdater,
        }))
    }) as SetDiceFunction,
    setDiceCount: (count) => set({ diceCount: count }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    reset: () => set(initialState),
}))
