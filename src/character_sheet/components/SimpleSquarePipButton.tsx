import { ActionIcon, useMantineTheme } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import classes from "./SquarePipButton.module.css"

type SimpleSquarePipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: React.CSSProperties
    index?: number
    firstChangingIndex?: number | null
    isFilling?: boolean
}

const SimpleSquarePipButton = ({
    filled = false,
    onClick,
    style,
    index = 0,
    firstChangingIndex = null,
    isFilling: isFillingProp = false,
}: SimpleSquarePipButtonProps) => {
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

    useEffect(() => {
        prevFilledRef.current = filled
    }, [filled])

    return (
        <ActionIcon
            variant="subtle"
            color="grape"
            onClick={onClick}
            size="xs"
            className={onClick ? classes.button : `${classes.button} ${classes.buttonDisabled}`}
            style={style}
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
                    backgroundColor: theme.colors.grape[6],
                    borderRadius: "4px",
                }}
            />
        </ActionIcon>
    )
}

export default SimpleSquarePipButton
