import { Group } from "@mantine/core"
import SquarePipButton from "./SquarePipButton"

type SquarePipsProps = {
    value: number
    setValue: (value: number) => void
    maxLevel?: number
    groupSize?: number
}

const SquarePips = ({ value, setValue, maxLevel = 5, groupSize }: SquarePipsProps) => {
    const handlePipClick = (index: number) => {
        const newValue = index + 1 === value ? index : index + 1
        setValue(Math.min(Math.max(0, newValue), maxLevel))
    }

    return (
        <Group gap={4}>
            {Array.from({ length: maxLevel }, (_, index) => (
                <SquarePipButton
                    key={index}
                    filled={index < value}
                    onClick={() => handlePipClick(index)}
                    style={groupSize && (index + 1) % groupSize === 0 && index < maxLevel - 1 ? { marginRight: 8 } : undefined}
                />
            ))}
        </Group>
    )
}

export default SquarePips
