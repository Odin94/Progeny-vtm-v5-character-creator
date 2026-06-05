import { Group } from "@mantine/core"
import { memo, useRef, useMemo, useEffect } from "react"
import SimpleSquarePipButton from "./SimpleSquarePipButton"
import { SheetOptions } from "../CharacterSheet"
import { Character } from "~/data/Character"

type SquarePipsProps = {
    value: number
    setValue?: (value: number) => void
    maxLevel?: number
    groupSize?: number
    options?: SheetOptions
    field?: string
}

const SquarePips = ({
    value,
    setValue,
    maxLevel = 5,
    groupSize,
    options,
    field
}: SquarePipsProps) => {
    const prevValueRef = useRef(value)

    const { firstChangingIndex, isFilling } = useMemo(() => {
        const prevValue = prevValueRef.current
        const filling = value > prevValue
        const emptying = value < prevValue

        if (filling) {
            return { firstChangingIndex: prevValue, isFilling: true }
        } else if (emptying) {
            return { firstChangingIndex: prevValue - 1, isFilling: false }
        }

        return { firstChangingIndex: null, isFilling: false }
    }, [value])

    useEffect(() => {
        prevValueRef.current = value
    }, [value])

    const getDisabledReason = (_index: number): string | undefined => {
        if (!options || !field) {
            if (!setValue) return "No options or field provided"
            return undefined
        }

        const { mode } = options
        if (mode === "play" && field !== "ephemeral.hunger") {
            return "Editing is disabled in Play mode"
        }

        return undefined
    }

    const handlePipClick = (index: number) => {
        const newValue = index + 1 === value ? index : index + 1
        const clampedValue = Math.min(Math.max(0, newValue), maxLevel)

        // TODOdin: All of this is terrible and needs refactoring
        if (setValue) {
            setValue(clampedValue)
            return
        }

        if (!options || !field) return

        const { mode, setCharacter } = options

        if (mode === "play" && field !== "ephemeral.hunger") {
            return
        }

        setCharacter((character) => {
            const update: Partial<Character> = {}
            if (field === "humanity") {
                update.humanity = clampedValue
            } else if (field === "ephemeral.hunger") {
                update.ephemeral = {
                    ...character.ephemeral,
                    hunger: clampedValue
                }
            } else if (field) {
                update[field as keyof Character] = clampedValue as never
            }
            return {
                ...character,
                ...update
            }
        })
    }

    return (
        <Group gap={4}>
            {Array.from({ length: maxLevel }, (_, index) => (
                <SimpleSquarePipButton
                    key={index}
                    index={index}
                    filled={index < value}
                    firstChangingIndex={firstChangingIndex}
                    isFilling={isFilling}
                    onClick={() => handlePipClick(index)}
                    style={
                        groupSize && (index + 1) % groupSize === 0 && index < maxLevel - 1
                            ? { marginRight: 8 }
                            : undefined
                    }
                    options={options}
                    disabledReason={getDisabledReason(index)}
                />
            ))}
        </Group>
    )
}

const getMemoCharacterKey = (options?: SheetOptions): string => {
    if (!options) return ""
    return [options.mode, options.primaryColor].join("|")
}

export default memo(SquarePips, (prev, next) => {
    return (
        prev.value === next.value &&
        prev.maxLevel === next.maxLevel &&
        prev.groupSize === next.groupSize &&
        prev.field === next.field &&
        prev.setValue === next.setValue &&
        getMemoCharacterKey(prev.options) === getMemoCharacterKey(next.options)
    )
})
