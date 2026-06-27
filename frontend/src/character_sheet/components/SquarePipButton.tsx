import { ActionIcon, Tooltip, useMantineTheme } from "@mantine/core"
import { useRef, useMemo } from "react"
import { motion } from "framer-motion"

type SquarePipButtonProps = {
    onClick?: () => void
    style?: React.CSSProperties
    damageState?: "none" | "superficial" | "aggravated"
    color?: string
    disabledReason?: string
}

// TODOdin: Consider highlighting clickable buttons or low-lighting non-clickable buttons
const SquarePipButton = ({
    onClick,
    style,
    damageState = "none",
    color = "grape",
    disabledReason
}: SquarePipButtonProps) => {
    const theme = useMantineTheme()
    const prevState = useRef(damageState)
    const keyCounter = useRef(0)
    const strokeColor = theme.colors[color][6]
    const isDisabled = !!disabledReason

    const { superficialKey, aggravatedKey } = useMemo(() => {
        const isNewSuperficial = damageState !== "none" && prevState.current === "none"
        const isNewAggravated = damageState === "aggravated" && prevState.current !== "aggravated"

        if (isNewSuperficial || isNewAggravated) {
            keyCounter.current += 1
        }

        prevState.current = damageState

        return {
            superficialKey: isNewSuperficial ? `superficial-${keyCounter.current}` : "superficial",
            aggravatedKey: isNewAggravated ? `aggravated-${keyCounter.current}` : "aggravated"
        }
    }, [damageState])

    const buttonStyle: React.CSSProperties = {
        padding: 0,
        border: `2px solid ${theme.colors[color][6]}`,
        borderRadius: "4px",
        backgroundColor: "transparent",
        cursor: onClick && !isDisabled ? "pointer" : "default",
        transition: "transform 0.2s ease",
        position: "relative",
        overflow: "visible",
        ...style
    }

    const pip = (
        <ActionIcon
            variant="subtle"
            color={color}
            onClick={isDisabled ? undefined : onClick}
            size="xs"
            style={buttonStyle}
            disabled={isDisabled}
            onMouseEnter={(e) => {
                if (onClick && !isDisabled) {
                    e.currentTarget.style.transform = "scale(1.15)"
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none"
                }}
            >
                {(damageState === "superficial" || damageState === "aggravated") && (
                    <motion.line
                        key={superficialKey}
                        x1="22"
                        y1="2"
                        x2="2"
                        y2="22"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                )}
                {damageState === "aggravated" && (
                    <motion.line
                        key={aggravatedKey}
                        x1="2"
                        y1="2"
                        x2="22"
                        y2="22"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                )}
            </svg>
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
