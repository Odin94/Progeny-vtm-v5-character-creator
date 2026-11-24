import { ActionIcon, Tooltip } from "@mantine/core"
import { memo, type CSSProperties } from "react"
import { SheetOptions } from "../CharacterSheet"
import { getPipStagger } from "./PipButton"
import classes from "./pips.module.css"

export type SquarePipShape = "box" | "drop"

type SimpleSquarePipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
    options?: SheetOptions
    disabledReason?: string
    shape?: SquarePipShape
    groupEnd?: boolean
    label?: string
}

const DROP_PATH = "M9 1.2C9 1.2 1.6 9.6 1.6 14.6a7.4 7.4 0 0 0 14.8 0C16.4 9.6 9 1.2 9 1.2Z"

export const BloodDrop = () => (
    <span className={classes.drop} aria-hidden="true">
        <svg viewBox="0 0 18 23">
            <path className={classes.dropOutline} d={DROP_PATH} />
        </svg>
        <span className={classes.dropFill}>
            <svg viewBox="0 0 18 23">
                <defs>
                    <radialGradient id="pg-blood-drop" cx="35%" cy="55%" r="75%">
                        <stop offset="0%" style={{ stopColor: "var(--pg-blood-bright)" }} />
                        <stop offset="55%" style={{ stopColor: "var(--pg-blood)" }} />
                        <stop offset="100%" style={{ stopColor: "var(--pg-blood-deep)" }} />
                    </radialGradient>
                </defs>
                <path d={DROP_PATH} fill="url(#pg-blood-drop)" />
                <ellipse cx="6.2" cy="13.6" rx="1.5" ry="2.6" fill="rgba(255,255,255,0.45)" />
            </svg>
        </span>
    </span>
)

const SimpleSquarePipButton = ({
    filled = false,
    onClick,
    style,
    index = 0,
    firstChangingIndex,
    isFilling,
    disabledReason,
    shape = "box",
    groupEnd = false,
    label
}: SimpleSquarePipButtonProps) => {
    const isDisabled = !!disabledReason
    const isInteractive = !!onClick && !isDisabled
    const { delay, changed } = getPipStagger(index, firstChangingIndex, isFilling)

    const button = (
        <ActionIcon
            variant="transparent"
            className={classes.pip}
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            aria-label={label ? `${label} ${index + 1}` : undefined}
            aria-pressed={filled}
            data-shape={shape}
            data-filled={filled || undefined}
            data-interactive={isInteractive || undefined}
            data-just-changed={changed || undefined}
            data-group-end={groupEnd || undefined}
            style={{ "--pip-delay": `${delay}ms`, ...style } as CSSProperties}
        >
            {shape === "drop" ? (
                <BloodDrop />
            ) : (
                <span className={classes.box}>
                    <span className={classes.boxFill} />
                </span>
            )}
        </ActionIcon>
    )

    if (disabledReason) {
        return (
            <Tooltip label={disabledReason} withArrow>
                {button}
            </Tooltip>
        )
    }

    return button
}

export default memo(SimpleSquarePipButton)
