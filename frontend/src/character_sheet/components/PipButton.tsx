import { Tooltip } from "@mantine/core"
import { memo, useRef, useState, type CSSProperties } from "react"
import classes from "./pips.module.css"

type PipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
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
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const isInteractive = !!onClick && !hardDisabled
    const { delay, changed } = getPipStagger(index, firstChangingIndex, isFilling)
    const tooltipLabel = disabledReason || (xpCost !== undefined ? `${xpCost} XP` : undefined)

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={classes.pip}
                onClick={hardDisabled ? undefined : onClick}
                onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") setHovered(true)
                }}
                onPointerLeave={() => setHovered(false)}
                onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
                onBlur={() => setFocused(false)}
                disabled={hardDisabled}
                aria-label={label ? `${label} ${index + 1}` : undefined}
                aria-description={tooltipLabel}
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
            </button>
            {/* A sheet has hundreds of pips. Create a floating tooltip only when needed. */}
            {tooltipLabel && (hovered || focused) ? (
                <Tooltip
                    target={buttonRef}
                    label={tooltipLabel}
                    defaultOpened
                    events={{ hover: false, focus: false, touch: false }}
                    withArrow
                />
            ) : null}
        </>
    )
}

export default memo(PipButton)
