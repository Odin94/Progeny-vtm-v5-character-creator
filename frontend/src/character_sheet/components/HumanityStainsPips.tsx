import { Group } from "@mantine/core"
import { memo } from "react"
import { SheetOptions } from "../CharacterSheet"
import SquarePipButton from "./SquarePipButton"

type HumanityStainsPipsProps = {
    value: number
    maxLevel: number
    filledHumanity: number
    options?: SheetOptions
    humanityPipsRef?: React.RefObject<HTMLDivElement>
}

const HumanityStainsPips = ({
    value,
    maxLevel,
    filledHumanity,
    options,
    humanityPipsRef
}: HumanityStainsPipsProps) => {
    const getDisabledReason = (): string | undefined => {
        if (!options) {
            return "No options provided"
        }

        if (!options.canEdit) {
            return options.editDisabledReason
        }

        return undefined
    }

    const handlePipClick = (index: number) => {
        if (!options) return

        const { setCharacter } = options

        const reversedIndex = maxLevel - 1 - index
        const isFilled = reversedIndex < value
        const newValue = isFilled ? reversedIndex : reversedIndex + 1
        const clampedValue = Math.min(Math.max(0, newValue), maxLevel)

        setCharacter((current) => ({
            ...current,
            ephemeral: {
                ...current.ephemeral,
                humanityStains: clampedValue
            }
        }))
    }

    const disabledReason = getDisabledReason()

    return (
        <Group gap={4} justify="flex-end" style={{ marginRight: "3px" }}>
            {Array.from({ length: maxLevel }, (_, index) => {
                const reversedIndex = maxLevel - 1 - index
                const isFilled = reversedIndex < value

                return (
                    <SquarePipButton
                        key={index}
                        onClick={disabledReason ? undefined : () => handlePipClick(index)}
                        damageState={isFilled ? "superficial" : "none"}
                        color={options?.primaryColor || "grape"}
                        disabledReason={disabledReason}
                    />
                )
            })}
        </Group>
    )
}

export default memo(HumanityStainsPips, (previous, next) => {
    return (
        previous.value === next.value &&
        previous.maxLevel === next.maxLevel &&
        previous.filledHumanity === next.filledHumanity &&
        previous.humanityPipsRef === next.humanityPipsRef &&
        previous.options?.primaryColor === next.options?.primaryColor &&
        previous.options?.canEdit === next.options?.canEdit &&
        previous.options?.editDisabledReason === next.options?.editDisabledReason &&
        previous.options?.setCharacter === next.options?.setCharacter
    )
})
