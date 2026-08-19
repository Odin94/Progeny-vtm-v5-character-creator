import { ActionIcon, Tooltip, useMantineTheme } from "@mantine/core"
import { useReducedMotion } from "framer-motion"
import { memo } from "react"
import { SheetOptions } from "../CharacterSheet"

type SimpleSquarePipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: React.CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
    options?: SheetOptions
    disabledReason?: string
}

const SimpleSquarePipButton = ({
    filled = false,
    onClick,
    style,
    options,
    disabledReason
}: SimpleSquarePipButtonProps) => {
    const theme = useMantineTheme()
    const shouldReduceMotion = useReducedMotion()
    const color = options?.primaryColor || "grape"
    const isDisabled = !!disabledReason

    const baseColor = theme.colors[color][6]
    const isInteractive = !!onClick && !isDisabled

    const buttonStyle: React.CSSProperties = {
        padding: 0,
        border: `2px solid ${baseColor}`,
        borderRadius: "4px",
        backgroundColor: filled ? baseColor : "transparent",
        cursor: isInteractive ? "pointer" : "default",
        transform: "scale(1)",
        transition:
            "background-color 140ms ease, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)",
        position: "relative",
        overflow: "hidden",
        ...style
    }

    const actionIcon = (
        <ActionIcon
            variant="transparent"
            color={color}
            onClick={isDisabled ? undefined : onClick}
            size="xs"
            style={buttonStyle}
            disabled={isDisabled}
            onPointerDown={(event) => {
                if (isInteractive && !shouldReduceMotion) {
                    event.currentTarget.style.transform = "scale(0.97)"
                }
            }}
            onPointerUp={(event) => {
                event.currentTarget.style.transform = "scale(1)"
            }}
            onPointerCancel={(event) => {
                event.currentTarget.style.transform = "scale(1)"
            }}
            onPointerLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)"
            }}
        />
    )

    const button = actionIcon

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
