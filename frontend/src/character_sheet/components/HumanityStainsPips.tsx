import { Group } from "@mantine/core"
import { SheetOptions } from "../CharacterSheet"
import SquarePipButton from "./SquarePipButton"

type HumanityStainsPipsProps = {
    value: number
    maxLevel: number
    filledHumanity: number
    options?: SheetOptions
    humanityPipsRef?: React.RefObject<HTMLDivElement>
}

const HumanityStainsPips = ({ value, maxLevel, filledHumanity, options, humanityPipsRef }: HumanityStainsPipsProps) => {
    const getDisabledReason = (): string | undefined => {
        if (!options) {
            return "No options provided"
        }

        return undefined
    }

    const handlePipClick = (index: number) => {
        if (!options) return

        const { character, setCharacter } = options

        const reversedIndex = maxLevel - 1 - index
        const isFilled = reversedIndex < value
        const newValue = isFilled ? reversedIndex : reversedIndex + 1
        const clampedValue = Math.min(Math.max(0, newValue), maxLevel)

        setCharacter({
            ...character,
            ephemeral: {
                ...character.ephemeral,
                humanityStains: clampedValue,
            },
        })
    }

    const disabledReason = getDisabledReason()

    return (
        <Group gap={4} justify="flex-end" style={{ marginRight: "3px" }} >
            {
                Array.from({ length: maxLevel }, (_, index) => {
                    const reversedIndex = maxLevel - 1 - index
                    const isFilled = reversedIndex < value

                    return (
                        <SquarePipButton
                            key={index}
                            onClick={disabledReason ? undefined : () => handlePipClick(index)}
                            damageState={isFilled ? "superficial" : "none"}
                            color={options?.primaryColor || "grape"}
                        />
                    )
                })
            }
        </Group >
    )
}

export default HumanityStainsPips
