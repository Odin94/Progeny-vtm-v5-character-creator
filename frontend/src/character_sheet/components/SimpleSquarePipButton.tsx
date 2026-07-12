import { ActionIcon, Tooltip, useMantineTheme } from "@mantine/core"
import { memo, useEffect, useMemo, useRef } from "react"
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
    index = 0,
    firstChangingIndex = null,
    isFilling: isFillingProp = false,
    options,
    disabledReason
}: SimpleSquarePipButtonProps) => {
    const theme = useMantineTheme()
    const color = options?.primaryColor || "grape"
    const isDisabled = !!disabledReason
    const prevFilledRef = useRef(filled)

    const { delay } = useMemo(() => {
        const prevFilled = prevFilledRef.current
        const isFilling = filled && !prevFilled
        const isEmptying = !filled && prevFilled

        const delayScale = 0.05
        let delay = 0

        if ((isFilling || isEmptying) && firstChangingIndex !== null) {
            if (isFillingProp) {
                delay = (index - firstChangingIndex) * delayScale
            } else {
                delay = (firstChangingIndex - index) * delayScale
            }
        }

        return { delay }
    }, [filled, index, firstChangingIndex, isFillingProp])

    useEffect(() => {
        prevFilledRef.current = filled
    }, [filled])

    const baseColor = theme.colors[color][6]

    const buttonStyle: React.CSSProperties = {
        padding: 0,
        border: `2px solid ${baseColor}`,
        borderRadius: "4px",
        backgroundColor: "transparent",
        cursor: onClick && !isDisabled ? "pointer" : "default",
        transition: "transform 0.2s ease",
        position: "relative",
        overflow: "visible",
        ...style
    }

    const actionIcon = (
        <ActionIcon
            variant="subtle"
            color={color}
            onClick={isDisabled ? undefined : onClick}
            size="xs"
            style={buttonStyle}
            disabled={isDisabled}
            onMouseEnter={(event) => {
                if (onClick && !isDisabled) event.currentTarget.style.transform = "scale(1.15)"
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)"
            }}
        >
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: baseColor,
                    borderRadius: "4px",
                    transform: filled ? "scale(1.3)" : "scale(0)",
                    transition: `transform 0.3s ease-out ${delay}s`,
                    pointerEvents: "none"
                }}
            />
        </ActionIcon>
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
