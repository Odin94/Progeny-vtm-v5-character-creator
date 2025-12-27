import { Group } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import SimpleSquarePipButton from "./SimpleSquarePipButton"

type SquarePipsProps = {
    value: number
    setValue: (value: number) => void
    maxLevel?: number
    groupSize?: number
    color?: string
}

const SquarePips = ({ value, setValue, maxLevel = 5, groupSize, color = "grape" }: SquarePipsProps) => {
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

    const handlePipClick = (index: number) => {
        const newValue = index + 1 === value ? index : index + 1
        setValue(Math.min(Math.max(0, newValue), maxLevel))
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
                    style={groupSize && (index + 1) % groupSize === 0 && index < maxLevel - 1 ? { marginRight: 8 } : undefined}
                    color={color}
                />
            ))}
        </Group>
    )
}

export default SquarePips
