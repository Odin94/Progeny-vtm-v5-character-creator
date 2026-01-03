import { useState } from "react"
import { SelectableMeritsAndFlaws } from "../data/PredatorType"

export type PointState = {
    subPointStates: {
        selectedPoints: number
        maxLevel: number
    }[]
    totalPoints: number
}

export type PointStateReturnValue = {
    pointStates: PointState[]
    updatePointStates: (selectedPoints: number, pointStateIndex: number, subPointStateIndex: number) => void
    setFromSelectableMeritsAndFlaws: (selectableMeritsAndFlaws: SelectableMeritsAndFlaws[]) => void
}

const usePointStates = (selectableMeritsAndFlaws: SelectableMeritsAndFlaws[]): PointStateReturnValue => {
    const initialPointStates: PointState[] = []
    for (const selectable of selectableMeritsAndFlaws) {
        initialPointStates.push({
            subPointStates: selectable.options.map((option) => ({ selectedPoints: 0, maxLevel: option.maxLevel })),
            totalPoints: selectable.totalPoints,
        })
    }
    const [pointStates, setPointStates] = useState<PointState[]>(initialPointStates)

    const updatePointStates = (selectedPoints: number, pointStateIndex: number, subPointStateIndex: number) => {
        const updatedPointStates = [...pointStates]
        const pointState = updatedPointStates[pointStateIndex]
        const subPointStates = updatedPointStates[pointStateIndex].subPointStates
        const subPointState = updatedPointStates[pointStateIndex].subPointStates[subPointStateIndex]

        const spentPoints =
            subPointStates.reduce((acc, cur) => {
                return acc + cur.selectedPoints
            }, 0) - subPointState.selectedPoints

        if (selectedPoints > subPointState.maxLevel) return
        if (spentPoints + selectedPoints > pointState.totalPoints) return

        subPointState.selectedPoints = selectedPoints

        setPointStates(updatedPointStates)
    }

    const setFromSelectableMeritsAndFlaws = (selectableMeritsAndFlaws: SelectableMeritsAndFlaws[]) => {
        const initialPointStates: PointState[] = []
        for (const selectable of selectableMeritsAndFlaws) {
            initialPointStates.push({
                subPointStates: selectable.options.map((option) => ({ selectedPoints: 0, maxLevel: option.maxLevel })),
                totalPoints: selectable.totalPoints,
            })
        }

        setPointStates(initialPointStates)
    }

    return { pointStates, updatePointStates, setFromSelectableMeritsAndFlaws }
}

export default usePointStates
