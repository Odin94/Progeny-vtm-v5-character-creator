import { ActionIcon, useMantineTheme } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import { motion } from "framer-motion"

type PipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: React.CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
    color?: string
}

const PipButton = ({
    filled = false,
    onClick,
    style,
    index = 0,
    firstChangingIndex = null,
    isFilling: isFillingProp = false,
    color = "grape",
}: PipButtonProps) => {
    const theme = useMantineTheme()
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

    // Update the ref AFTER the render is complete (needed for delay to work)
    useEffect(() => {
        prevFilledRef.current = filled
    }, [filled])

    const buttonStyle: React.CSSProperties = {
        padding: 0,
        border: `2px solid ${theme.colors[color][6]}`,
        borderRadius: "50%",
        backgroundColor: "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease",
        position: "relative",
        overflow: "visible",
        ...style,
    }

    return (
        <ActionIcon
            variant="subtle"
            color={color}
            onClick={onClick}
            size="xs"
            style={buttonStyle}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = "scale(1.15)"
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
            }}
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
                    backgroundColor: theme.colors[color][6],
                    borderRadius: "50%",
                }}
            />
        </ActionIcon>
    )
}

export default PipButton
