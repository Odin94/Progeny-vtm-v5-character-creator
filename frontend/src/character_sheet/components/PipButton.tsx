import { ActionIcon, Tooltip } from "@mantine/core"
import { memo, type CSSProperties } from "react"
import { SheetOptions } from "../CharacterSheet"
import classes from "./pips.module.css"

type PipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
    options?: SheetOptions
    disabledReason?: string
    // A hard lock (e.g. viewing someone else's character) — the pip is truly disabled.
    // A soft block (mode/XP rules on your own character) stays clickable so the click can
    // surface the reason inline instead of dead-ending on a hover-only tooltip.
    hardDisabled?: boolean
    xpCost?: number
    instant?: boolean
    /** Ends a group of five, so long tracks read as 5 + 5. */
    groupEnd?: boolean
    label?: string
}

// Neighbouring pips that change in the same click fill one after another.
const STAGGER_MS = 35
const MAX_STAGGER_STEPS = 6

export const getPipStagger = (
    index: number,
    firstChangingIndex: number | null | undefined,
    isFilling: boolean | undefined
): { delay: number; changed: boolean } => {
    if (firstChangingIndex === null || firstChangingIndex === undefined) {
        return { delay: 0, changed: false }
    }
    const steps = isFilling ? index - firstChangingIndex : firstChangingIndex - index
    if (steps < 0) return { delay: 0, changed: false }
    return { delay: Math.min(steps, MAX_STAGGER_STEPS) * STAGGER_MS, changed: true }
}

const PipButton = ({
    filled = false,
    onClick,
    style,
    index = 0,
    firstChangingIndex,
    isFilling,
    disabledReason,
    hardDisabled = false,
    xpCost,
    instant = false,
    groupEnd = false,
    label
}: PipButtonProps) => {
    const isInteractive = !!onClick && !hardDisabled && !disabledReason
    const { delay, changed } = getPipStagger(index, firstChangingIndex, isFilling)

    const button = (
        <ActionIcon
            variant="transparent"
            className={classes.pip}
            onClick={hardDisabled ? undefined : onClick}
            disabled={hardDisabled}
            aria-label={label ? `${label} ${index + 1}` : undefined}
            aria-pressed={filled}
            data-filled={filled || undefined}
            data-interactive={isInteractive || undefined}
            data-just-changed={changed || undefined}
            data-instant={instant || undefined}
            data-group-end={groupEnd || undefined}
            style={{ "--pip-delay": `${delay}ms`, ...style } as CSSProperties}
        >
            <span className={classes.bead}>
                <span className={classes.fill} />
            </span>
        </ActionIcon>
    )

    const tooltipLabel = disabledReason || (xpCost !== undefined ? `${xpCost} XP` : undefined)

    if (tooltipLabel) {
        return (
            <Tooltip label={tooltipLabel} withArrow>
                {button}
            </Tooltip>
        )
    }

    return button
}

export default memo(PipButton)
