import { Group } from "@mantine/core"
import SquarePipButton from "~/character_sheet/components/SquarePipButton"

type DamagePipsProps = {
    maxValue: number
    superficial: number
    aggravated: number
    onChange: (superficial: number, aggravated: number) => void
}

const DamagePips = ({ maxValue, superficial, aggravated, onChange }: DamagePipsProps) => {
    const getPipState = (pipIndex: number): "none" | "superficial" | "aggravated" => {
        const pipNumber = pipIndex + 1
        if (pipNumber <= aggravated) {
            return "aggravated"
        }
        if (pipNumber <= superficial) {
            return "superficial"
        }
        return "none"
    }

    const handlePipClick = (pipIndex: number) => {
        const pipNumber = pipIndex + 1
        let newSuperficial = superficial
        let newAggravated = aggravated

        if (pipNumber === superficial + 1) {
            newSuperficial += 1
        } else if (pipNumber === superficial) {
            if (aggravated === superficial) {
                newAggravated -= 1
                newSuperficial -= 1
            } else if (aggravated === pipNumber - 1) {
                newAggravated += 1
            } else {
                newSuperficial -= 1
            }
        } else if (pipNumber === aggravated + 1) {
            newAggravated += 1
        } else if (pipNumber === aggravated) {
            newAggravated -= 1
        }

        onChange(newSuperficial, newAggravated)
    }

    return (
        <Group gap={4}>
            {Array.from({ length: maxValue }, (_, index) => {
                const pipState = getPipState(index)
                return (
                    <SquarePipButton
                        key={index}
                        onClick={() => handlePipClick(index)}
                        damageState={pipState}
                        style={(index + 1) % 5 === 0 && index < maxValue - 1 ? { marginRight: 8 } : undefined}
                    />
                )
            })}
        </Group>
    )
}

export default DamagePips
