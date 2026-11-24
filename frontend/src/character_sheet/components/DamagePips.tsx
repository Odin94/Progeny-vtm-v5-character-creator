import { memo } from "react"
import SquarePipButton from "~/character_sheet/components/SquarePipButton"
import classes from "./pips.module.css"

type DamagePipsProps = {
    maxValue: number
    superficial: number
    aggravated: number
    onChange: (superficial: number, aggravated: number) => void
    color?: string
    disabledReason?: string
    label?: string
}

const DamagePips = ({
    maxValue,
    superficial,
    aggravated,
    onChange,
    color,
    disabledReason,
    label
}: DamagePipsProps) => {
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
        <div className={classes.track}>
            {Array.from({ length: maxValue }, (_, index) => {
                const pipState = getPipState(index)
                return (
                    <SquarePipButton
                        key={index}
                        onClick={() => handlePipClick(index)}
                        damageState={pipState}
                        groupEnd={(index + 1) % 5 === 0 && index < maxValue - 1}
                        color={color}
                        disabledReason={disabledReason}
                        label={label ? `${label} ${index + 1}` : undefined}
                    />
                )
            })}
        </div>
    )
}

export default memo(DamagePips, (previous, next) => {
    return (
        previous.maxValue === next.maxValue &&
        previous.superficial === next.superficial &&
        previous.aggravated === next.aggravated &&
        previous.onChange === next.onChange &&
        previous.color === next.color &&
        previous.disabledReason === next.disabledReason &&
        previous.label === next.label
    )
})
