import { motion, useReducedMotion } from "framer-motion"
import { useMantineTheme } from "@mantine/core"

type DieProps = {
    value: number
    isRolling: boolean
    primaryColor: string
    animationDelay?: number
    seed?: number
    onClick?: () => void
    isSelected?: boolean
    isSelectable?: boolean
    ariaLabel?: string
}

const Die = ({
    value,
    isRolling,
    primaryColor,
    animationDelay = 0,
    seed = 0,
    onClick,
    isSelected = false,
    isSelectable = false,
    ariaLabel
}: DieProps) => {
    const theme = useMantineTheme()
    const shouldReduceMotion = useReducedMotion()
    const colorValue = primaryColor.startsWith("#")
        ? primaryColor
        : theme.colors[primaryColor]?.[6] || theme.colors.grape[6]

    const seededRandom = (offset: number = 0) => {
        const x = Math.sin(seed + offset) * 10000
        return x - Math.floor(x)
    }
    const containerWidth = 100
    const containerHeight = containerWidth
    const upperHeight = containerWidth * 0.5
    const lowerHeight = containerWidth * 0.12
    const internalWidth = upperHeight * 0.52
    const angle = 45
    const sideAngle = 360 / 5
    const translateZ = upperHeight * 0.34
    const translateY = lowerHeight * 0.29
    const translateLowerZ = -translateZ
    const translateLowerY = -translateY

    const getFaceTransform = (faceIndex: number) => {
        if (faceIndex % 2 === 0) {
            const angleMultiplier = faceIndex / 2
            return `rotateY(-${sideAngle * angleMultiplier}deg) translateZ(${translateZ}px) translateY(${translateY}px) rotateX(${angle}deg)`
        } else {
            const angleMultiplier = (faceIndex + 1) / 2
            return `rotateY(${sideAngle * angleMultiplier}deg) translateZ(${translateLowerZ}px) translateY(${translateLowerY}px) rotateZ(180deg) rotateY(180deg) rotateX(${angle}deg)`
        }
    }

    const faceIndex = value === 10 ? 9 : value - 1

    const contentStyle = {
        margin: "auto auto",
        position: "relative" as const,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        perspective: "1500px"
    }

    const dieStyle = {
        position: "absolute" as const,
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d" as const,
        cursor: isSelectable ? "pointer" : "default"
    }

    const selectionColor = isSelected ? "#ffd700" : colorValue
    const selectionGlow = isSelected
        ? "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))"
        : "drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))"

    const baseFaceStyle = {
        position: "absolute" as const,
        left: "50%",
        top: "0",
        margin: `0 -${internalWidth}px`,
        borderLeft: `${internalWidth}px solid transparent`,
        borderRight: `${internalWidth}px solid transparent`,
        borderBottom: `${upperHeight}px solid ${selectionColor}`,
        width: "0px",
        height: "0px",
        transformStyle: "preserve-3d" as const,
        backfaceVisibility: "hidden" as const,
        filter: selectionGlow
    }

    const faceAfterStyle = {
        content: '""',
        position: "absolute" as const,
        bottom: `-${upperHeight + lowerHeight}px`,
        left: `-${internalWidth}px`,
        borderLeft: `${internalWidth}px solid transparent`,
        borderRight: `${internalWidth}px solid transparent`,
        borderTop: `${lowerHeight}px solid ${selectionColor}`,
        width: "0px",
        height: "0px",
        filter: selectionGlow
    }

    const faceBeforeStyle = {
        position: "absolute" as const,
        top: `${upperHeight * 0.25}px`,
        left: `-${internalWidth}px`,
        color: "#fff",
        textShadow: "1px 1px 3px #000",
        fontSize: `${upperHeight * 0.6}px`,
        textAlign: "center" as const,
        lineHeight: `${upperHeight}px`,
        width: `${internalWidth * 2}px`,
        height: `${upperHeight}px`
    }

    const getFinalRotation = () => {
        if (faceIndex % 2 === 0) {
            const angleMultiplier = faceIndex / 2
            return {
                rotateX: -angle,
                rotateY: sideAngle * angleMultiplier
            }
        } else {
            const angleMultiplier = (faceIndex + 1) / 2
            return {
                rotateX: -(180 + angle),
                rotateY: -sideAngle * angleMultiplier
            }
        }
    }

    const finalRotation = getFinalRotation()
    const normalizeAngle = (angle: number) => {
        let normalized = angle % 360
        if (normalized < 0) normalized += 360
        return normalized
    }
    const getDieTransform = (
        x: number,
        y: number,
        scale: number,
        rotateX: number,
        rotateY: number,
        rotateZ: number = 0
    ) =>
        `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`

    if (isRolling) {
        const rollDuration = 1.5
        const endRotateX = normalizeAngle(finalRotation.rotateX)
        const endRotateY = normalizeAngle(finalRotation.rotateY)

        const startRotateX = seededRandom(1) * 360
        const startRotateY = seededRandom(2) * 360
        const finalRotateX = endRotateX + 1080 + seededRandom(3) * 360
        const finalRotateY = endRotateY + 2160 + seededRandom(4) * 720
        const reducedMotionTransform = getDieTransform(0, 0, 1, endRotateX, endRotateY)
        const rollingStartTransform = getDieTransform(
            (seededRandom(5) - 0.5) * 100,
            (seededRandom(6) - 0.5) * 100,
            1,
            startRotateX,
            startRotateY
        )
        const rollingEndTransform = getDieTransform(0, 0, 1, finalRotateX, finalRotateY)

        return (
            <div style={contentStyle}>
                <motion.div
                    initial={{
                        transform: shouldReduceMotion
                            ? reducedMotionTransform
                            : rollingStartTransform,
                        opacity: shouldReduceMotion ? 0 : 1
                    }}
                    animate={{
                        transform: shouldReduceMotion
                            ? reducedMotionTransform
                            : rollingEndTransform,
                        opacity: 1
                    }}
                    transition={
                        shouldReduceMotion
                            ? { duration: 0.12 }
                            : {
                                  duration: rollDuration,
                                  ease: [0.43, 0.13, 0.23, 0.96],
                                  delay: animationDelay
                              }
                    }
                    style={dieStyle}
                >
                    {Array.from({ length: 10 }, (_, i) => {
                        const displayValue = i === 9 ? "0" : (i + 1).toString()
                        const isLower = i % 2 !== 0
                        return (
                            <div
                                key={i}
                                style={{
                                    ...baseFaceStyle,
                                    top: isLower ? `${upperHeight}px` : "0",
                                    transform: getFaceTransform(i)
                                }}
                            >
                                <div style={faceBeforeStyle}>{displayValue}</div>
                                <div style={faceAfterStyle} />
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        )
    }

    const endRotateX = normalizeAngle(finalRotation.rotateX)
    const endRotateY = normalizeAngle(finalRotation.rotateY)
    const settledEndRotateX = endRotateX + (shouldReduceMotion ? 0 : 1080)
    const settledEndRotateY = endRotateY + (shouldReduceMotion ? 0 : 2160)
    const settledInitialTransform = shouldReduceMotion
        ? getDieTransform(0, 0, 1, endRotateX, endRotateY)
        : getDieTransform(0, 0, 0.9, finalRotation.rotateX - 180, finalRotation.rotateY - 180)
    const settledTransform = getDieTransform(0, 0, 1, settledEndRotateX, settledEndRotateY)
    const settledExitTransform = getDieTransform(
        0,
        0,
        shouldReduceMotion ? 1 : 0.9,
        settledEndRotateX,
        settledEndRotateY
    )
    const hoverTransform = getDieTransform(
        0,
        0,
        isSelectable ? 1.1 : 1.05,
        settledEndRotateX,
        settledEndRotateY
    )

    return (
        <div
            onClick={isSelectable ? onClick : undefined}
            aria-label={ariaLabel ?? `Die showing ${value === 10 ? "0" : value}`}
            aria-pressed={isSelectable ? isSelected : undefined}
            role={isSelectable ? "button" : undefined}
            tabIndex={isSelectable ? 0 : undefined}
            onKeyDown={
                isSelectable
                    ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              onClick?.()
                          }
                      }
                    : undefined
            }
            style={contentStyle}
        >
            <motion.div
                initial={{ opacity: 0, transform: settledInitialTransform }}
                animate={{
                    opacity: 1,
                    transform: settledTransform
                }}
                exit={{ opacity: 0, transform: settledExitTransform }}
                transition={
                    shouldReduceMotion
                        ? { duration: 0.12 }
                        : {
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                              duration: 0.5,
                              ease: "easeOut"
                          }
                }
                whileHover={shouldReduceMotion ? undefined : { transform: hoverTransform }}
                style={dieStyle}
            >
                {Array.from({ length: 10 }, (_, i) => {
                    const displayValue = i === 9 ? "0" : (i + 1).toString()
                    const isLower = i % 2 !== 0
                    return (
                        <div
                            key={i}
                            style={{
                                ...baseFaceStyle,
                                top: isLower ? `${upperHeight}px` : "0",
                                transform: getFaceTransform(i)
                            }}
                        >
                            <div style={faceBeforeStyle}>{displayValue}</div>
                            <div style={faceAfterStyle} />
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )
}

export default Die
