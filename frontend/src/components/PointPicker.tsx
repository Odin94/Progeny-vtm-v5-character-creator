import { UnstyledButton } from "@mantine/core"
import { IconDroplet, IconX } from "@tabler/icons-react"
import { IconButton } from "~/components/ui"
import classes from "./PointPicker.module.css"

type PointPickerProps = {
    points: number
    setPoints: (n: number) => void
    maxLevel?: number
    displayCount?: number
}

/** Blood-drop dot picker. Clicking the current top dot removes it; the ✕ clears all. */
const PointPicker = ({
    points,
    setPoints,
    maxLevel: maxPoints,
    displayCount
}: PointPickerProps) => {
    const count = maxPoints ?? 5
    const slots = displayCount ?? count

    return (
        <div className={classes.root}>
            <IconButton
                label="Clear"
                size="sm"
                icon={<IconX size={14} />}
                onClick={() => setPoints(0)}
            />
            {Array.from({ length: slots }).map((_, i) => {
                const pos = i + 1
                const isActive = pos <= points
                const isClickable = pos <= count

                return (
                    <UnstyledButton
                        key={i}
                        className={classes.drop}
                        data-active={isActive || undefined}
                        data-placeholder={!isClickable || undefined}
                        tabIndex={isClickable ? undefined : -1}
                        aria-hidden={!isClickable || undefined}
                        aria-label={`${pos} ${pos === 1 ? "dot" : "dots"}`}
                        aria-pressed={isActive}
                        onClick={() => isClickable && setPoints(pos === points ? pos - 1 : pos)}
                    >
                        <IconDroplet size={18} stroke={2} />
                    </UnstyledButton>
                )
            })}
        </div>
    )
}

export default PointPicker
