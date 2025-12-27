import { Group } from "@mantine/core"
import PipButton from "./PipButton"

type PipsProps = {
    level: number
    maxLevel?: number
    minLevel?: number
    onLevelChange?: (level: number) => void
}

const Pips = ({ level, maxLevel = 5, minLevel = 0, onLevelChange }: PipsProps) => {
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
                    onClick={onLevelChange ? () => handlePipClick(index) : undefined}
                    style={(index + 1) % 5 === 0 && index < maxLevel - 1 ? { marginRight: 8 } : undefined}
                />
            ))}
        </Group>
    )
}

export default Pips
