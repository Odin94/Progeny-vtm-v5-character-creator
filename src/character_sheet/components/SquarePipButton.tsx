import { ActionIcon, useMantineTheme } from "@mantine/core"
import { useRef, useMemo } from "react"
import classes from "./SquarePipButton.module.css"

type SquarePipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: React.CSSProperties
    damageState?: "none" | "superficial" | "aggravated"
}

// TODOdin: Consider highlighting clickable buttons or low-lighting non-clickable buttons
const SquarePipButton = ({ onClick, style, damageState = "none", filled = false }: SquarePipButtonProps) => {
    const theme = useMantineTheme()
    const prevState = useRef(damageState)
    const keyCounter = useRef(0)
    const lineLength = Math.sqrt(Math.pow(22 - 2, 2) + Math.pow(22 - 2, 2))
    const strokeColor = theme.colors.grape[6]

    const { superficialKey, aggravatedKey } = useMemo(() => {
        const isNewSuperficial = damageState !== "none" && prevState.current === "none"
        const isNewAggravated = damageState === "aggravated" && prevState.current !== "aggravated"

        if (isNewSuperficial || isNewAggravated) {
            keyCounter.current += 1
        }

        prevState.current = damageState

        return {
            superficialKey: isNewSuperficial ? `superficial-${keyCounter.current}` : "superficial",
            aggravatedKey: isNewAggravated ? `aggravated-${keyCounter.current}` : "aggravated",
        }
    }, [damageState])

    const buttonClassName = onClick
        ? filled
            ? `${classes.button} ${classes.buttonFilled}`
            : classes.button
        : `${classes.button} ${classes.buttonDisabled}`

    return (
        <ActionIcon
            variant="subtle"
            color="grape"
            onClick={onClick}
            size="xs"
            className={buttonClassName}
            style={
                {
                    ...style,
                    "--line-length": `${lineLength}px`,
                } as React.CSSProperties & { "--line-length": string }
            }
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                className={classes.svg}
            >
                {(damageState === "superficial" || damageState === "aggravated") && (
                    <line key={superficialKey} x1="22" y1="2" x2="2" y2="22" className={classes.drawingLine} />
                )}
                {damageState === "aggravated" && <line key={aggravatedKey} x1="2" y1="2" x2="22" y2="22" className={classes.drawingLine} />}
            </svg>
        </ActionIcon>
    )
}

export default SquarePipButton
