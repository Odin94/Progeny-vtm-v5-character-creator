import { ActionIcon } from "@mantine/core"
import { useRef, useMemo } from "react"
import classes from "./PipButton.module.css"

type PipButtonProps = {
    filled?: boolean
    onClick?: () => void
    style?: React.CSSProperties
    index?: number
}

const PipButton = ({ filled = false, onClick, style, index = 0 }: PipButtonProps) => {
    const prevFilledRef = useRef(filled)
    const animationKeyRef = useRef(0)

    const { delay, animationKey } = useMemo(() => {
        const prevFilled = prevFilledRef.current
        const isFilling = filled && !prevFilled
        const isEmptying = !filled && prevFilled

        const delayScale = 2
        let delay = 0
        if (isFilling || isEmptying) {
            animationKeyRef.current += 1
            delay = isFilling ? index * delayScale : (4 - index) * delayScale
        }

        prevFilledRef.current = filled

        return {
            delay,
            animationKey: animationKeyRef.current,
        }
    }, [filled, index])

    return (
        <ActionIcon
            variant="subtle"
            color="grape"
            onClick={onClick}
            size="xs"
            className={onClick ? classes.button : `${classes.button} ${classes.buttonDisabled}`}
            style={style}
        >
            <div
                key={`pip-${filled}-${animationKey}-${delay}`}
                className={filled ? classes.fill : classes.empty}
                style={{ animationDelay: `${delay}s` }}
            />
        </ActionIcon>
    )
}

export default PipButton
