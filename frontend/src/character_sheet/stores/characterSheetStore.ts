import { create } from "zustand"
import { AttributesKey } from "~/data/Attributes"
import { SkillsKey } from "~/data/Skills"
import { DisciplineName } from "~/data/NameSchemas"

export type SelectedDicePool = {
    attribute: AttributesKey | null
    skill: SkillsKey | null
    discipline: DisciplineName | null
    selectedSpecialties: string[]
    bloodSurge: boolean
}

type CharacterSheetStore = {
    selectedDicePool: SelectedDicePool
    setSelectedDicePool: (pool: SelectedDicePool) => void
    resetSelectedDicePool: () => void
    updateSelectedDicePool: (updates: Partial<SelectedDicePool>) => void
}

const defaultDicePool: SelectedDicePool = {
    attribute: null,
    skill: null,
    discipline: null,
    selectedSpecialties: [],
    bloodSurge: false,
}

export const useCharacterSheetStore = create<CharacterSheetStore>((set) => ({
    selectedDicePool: defaultDicePool,
    setSelectedDicePool: (pool) => set({ selectedDicePool: pool }),
    resetSelectedDicePool: () => set({ selectedDicePool: defaultDicePool }),
    updateSelectedDicePool: (updates) =>
        set((state) => ({
            selectedDicePool: { ...state.selectedDicePool, ...updates },
        })),
}))
