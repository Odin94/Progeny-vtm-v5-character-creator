import { ActionIcon, Tooltip, useMantineTheme } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
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
    disabledReason,
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
        ...style,
    }

    const actionIcon = (
        <motion.div whileHover={!isDisabled && onClick ? { scale: 1.15 } : undefined} style={{ display: "inline-block" }}>
            <ActionIcon
                variant="subtle"
                color={color}
                onClick={isDisabled ? undefined : onClick}
                size="xs"
                style={buttonStyle}
                disabled={isDisabled}
            >
                <motion.div
                    initial={false}
                    animate={{ scale: filled ? 1.3 : 0 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: delay,
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: baseColor,
                        borderRadius: "4px",
                    }}
                />
            </ActionIcon>
        </motion.div>
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

export default SimpleSquarePipButton
