import { Group } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import PipButton from "./PipButton"

type PipsProps = {
    level: number
    maxLevel?: number
    minLevel?: number
    onLevelChange?: (level: number) => void
    color?: string
}

const Pips = ({ level, maxLevel = 5, minLevel = 0, onLevelChange, color = "grape" }: PipsProps) => {
    const prevLevelRef = useRef(level)

    const { firstChangingIndex, isFilling } = useMemo(() => {
        const prevLevel = prevLevelRef.current
        const filling = level > prevLevel
        const emptying = level < prevLevel

        if (filling) {
            return { firstChangingIndex: prevLevel, isFilling: true }
        } else if (emptying) {
            return { firstChangingIndex: prevLevel - 1, isFilling: false }
        }

        return { firstChangingIndex: null, isFilling: false }
    }, [level])

    useEffect(() => {
        prevLevelRef.current = level
    }, [level])

    const handlePipClick = (index: number) => {
        if (onLevelChange) {
            const newLevel = index + 1 === level ? index : index + 1
            onLevelChange(Math.min(Math.max(minLevel, newLevel), maxLevel))
        }
    }

    return (
        <Group gap={4}>
            {Array.from({ length: maxLevel }, (_, index) => (
                <PipButton
                    key={index}
                    index={index}
                    filled={index < level}
                    firstChangingIndex={firstChangingIndex}
                    isFilling={isFilling}
                    onClick={onLevelChange ? () => handlePipClick(index) : undefined}
                    style={(index + 1) % 5 === 0 && index < maxLevel - 1 ? { marginRight: 8 } : undefined}
                    color={color}
                />
            ))}
        </Group>
    )
}

export default Pips
