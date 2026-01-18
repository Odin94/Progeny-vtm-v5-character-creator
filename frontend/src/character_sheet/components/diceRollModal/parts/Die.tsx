import { Badge } from "@mantine/core"
import { motion } from "framer-motion"
import { useMantineTheme } from "@mantine/core"
import { vtmRed } from "~/character_sheet/utils/style"

type DieProps = {
    value: number
    isRolling: boolean
    primaryColor: string
    animationDelay?: number
    seed?: number
    onClick?: () => void
    isSelected?: boolean
    isSelectable?: boolean
    isMobile?: boolean
    isBloodDie?: boolean
}

const Die = ({ value, isRolling, primaryColor, animationDelay = 0, seed = 0, onClick, isSelected = false, isSelectable = false, isMobile = false, isBloodDie = false }: DieProps) => {
    const theme = useMantineTheme()
    const colorValue = primaryColor.startsWith("#") ? primaryColor : theme.colors[primaryColor]?.[6] || theme.colors.grape[6]

    if (isMobile) {
        const displayValue = value === 10 ? "0" : value.toString()
        const dieColor = isBloodDie ? vtmRed : colorValue

        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                whileTap={isSelectable ? { scale: 0.9 } : undefined}
                onClick={isSelectable ? onClick : undefined}
                style={{ cursor: isSelectable ? "pointer" : "default" }}
            >
                <Badge
                    size="xl"
                    radius="xl"
                    variant="filled"
                    color={dieColor}
                    style={{
                        width: "50px",
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 700,
                        border: isSelected ? "3px solid #ffd700" : "2px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: isSelected ? "0 0 12px rgba(255, 215, 0, 0.8)" : "0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    {displayValue}
                </Badge>
            </motion.div>
        )
    }
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

    const getFaceTransform = (faceNum: number) => {
        if (faceNum % 2 === 0) {
            const angleMultiplier = faceNum / 2
            return `rotateY(-${sideAngle * angleMultiplier}deg) translateZ(${translateZ}px) translateY(${translateY}px) rotateX(${angle}deg)`
        } else {
            const angleMultiplier = (faceNum + 1) / 2
            return `rotateY(${sideAngle * angleMultiplier}deg) translateZ(${translateLowerZ}px) translateY(${translateLowerY}px) rotateZ(180deg) rotateY(180deg) rotateX(${angle}deg)`
        }
    }

    const faceNum = value === 10 ? 9 : value - 1

    const contentStyle = {
        margin: "auto auto",
        position: "relative" as const,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        perspective: "1500px",
    }

    const dieStyle = {
        position: "absolute" as const,
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d" as const,
        cursor: isSelectable ? "pointer" : "default",
    }

    const selectionColor = isSelected ? "#ffd700" : colorValue
    const selectionGlow = isSelected ? "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))" : "drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))"

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
        filter: selectionGlow,
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
        filter: selectionGlow,
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
        height: `${upperHeight}px`,
    }

    const getFinalRotation = () => {
        if (faceNum % 2 === 0) {
            const angleMultiplier = faceNum / 2
            return {
                rotateX: -angle,
                rotateY: sideAngle * angleMultiplier,
            }
        } else {
            const angleMultiplier = (faceNum + 1) / 2
            return {
                rotateX: -(180 + angle),
                rotateY: -sideAngle * angleMultiplier,
            }
        }
    }

    const finalRotation = getFinalRotation()
    const normalizeAngle = (angle: number) => {
        let normalized = angle % 360
        if (normalized < 0) normalized += 360
        return normalized
    }

    if (isRolling) {
        const rollDuration = 1.5
        const endRotateX = normalizeAngle(finalRotation.rotateX)
        const endRotateY = normalizeAngle(finalRotation.rotateY)

        const startRotateX = seededRandom(1) * 360
        const startRotateY = seededRandom(2) * 360
        const finalRotateX = endRotateX + 1080 + seededRandom(3) * 360
        const finalRotateY = endRotateY + 2160 + seededRandom(4) * 720

        return (
            <div style={contentStyle}>
                <motion.div
                    initial={{
                        rotateX: startRotateX,
                        rotateY: startRotateY,
                        x: (seededRandom(5) - 0.5) * 100,
                        y: (seededRandom(6) - 0.5) * 100,
                    }}
                    animate={{
                        rotateX: finalRotateX,
                        rotateY: finalRotateY,
                        x: 0,
                        y: 0,
                    }}
                    transition={{
                        duration: rollDuration,
                        ease: [0.43, 0.13, 0.23, 0.96],
                        delay: animationDelay,
                    }}
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
                                    transform: getFaceTransform(i),
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

    return (
        <div style={contentStyle}>
            <motion.div
                initial={{ scale: 0, rotateX: finalRotation.rotateX - 180, rotateY: finalRotation.rotateY - 180 }}
                animate={{
                    scale: 1,
                    rotateX: normalizeAngle(finalRotation.rotateX) + 1080,
                    rotateY: normalizeAngle(finalRotation.rotateY) + 2160,
                    rotateZ: 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    duration: 0.5,
                    ease: "easeOut",
                }}
                whileHover={isSelectable ? { scale: 1.1 } : { scale: 1.05 }}
                onClick={isSelectable ? onClick : undefined}
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
                                transform: getFaceTransform(i),
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
