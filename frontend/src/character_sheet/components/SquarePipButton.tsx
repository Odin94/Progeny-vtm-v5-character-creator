import { ActionIcon, Tooltip } from "@mantine/core"
import type { CSSProperties } from "react"
import classes from "./pips.module.css"

type SquarePipButtonProps = {
    onClick?: () => void
    style?: CSSProperties
    damageState?: "none" | "superficial" | "aggravated"
    color?: string
    disabledReason?: string
    groupEnd?: boolean
    label?: string
}

const colorVars = (color?: string): CSSProperties | undefined =>
    color
        ? ({
              "--pip-color": `var(--mantine-color-${color}-6)`,
              "--pip-bright": `var(--mantine-color-${color}-3)`,
              "--pip-deep": `var(--mantine-color-${color}-9)`,
              "--pip-rim": `color-mix(in srgb, var(--mantine-color-${color}-4) 62%, transparent)`
          } as CSSProperties)
        : undefined

/** A damage box: empty, superficial (one slash) or aggravated (filled with a cross). */
const SquarePipButton = ({
    onClick,
    style,
    damageState = "none",
    color,
    disabledReason,
    groupEnd = false,
    label
}: SquarePipButtonProps) => {
    const isDisabled = !!disabledReason
    const isInteractive = !!onClick && !isDisabled

    const pip = (
        <ActionIcon
            variant="transparent"
            className={classes.pip}
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            aria-label={label ? `${label}: ${damageState}` : undefined}
            data-interactive={isInteractive || undefined}
            data-group-end={groupEnd || undefined}
            style={{ ...colorVars(color), ...style }}
        >
            <span className={classes.box} data-state={damageState}>
                <span className={classes.boxFill} />
                <span className={classes.slash} />
                <span className={classes.slash} data-second />
            </span>
        </ActionIcon>
    )

    return disabledReason ? (
        <Tooltip label={disabledReason} withArrow>
            <span style={{ display: "inline-flex" }}>{pip}</span>
        </Tooltip>
    ) : (
        pip
    )
}

export default SquarePipButton
