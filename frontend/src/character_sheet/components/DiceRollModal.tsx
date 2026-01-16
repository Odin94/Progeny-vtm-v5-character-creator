import { ActionIcon, Button, Group, Stack, Text, Box } from "@mantine/core"
import { IconMinus, IconPlus, IconX } from "@tabler/icons-react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { Character } from "~/data/Character"
import successIcon from "~/resources/diceResults/success.svg"
import criticalIcon from "~/resources/diceResults/critical.svg"
import bloodSuccessIcon from "~/resources/diceResults/blood-success.svg"
import bloodCriticalIcon from "~/resources/diceResults/blood-critical.svg"
import bestialFailureIcon from "~/resources/diceResults/bestial-failure.svg"

type DiceRollModalProps = {
    opened: boolean
    onClose: () => void
    primaryColor: string
    character?: Character
}

type DieResult = {
    id: number
    value: number
    isRolling: boolean
    isBloodDie: boolean
}

// TODOdin:
// * Boring mode - no fancy animations
// * Show results as success/failure
// * Crits & bestials
// * Selecting dice pool from sheet
// * Reading and updating hunger / rouse rolls
// * Maybe use icons on dice for bestial & crit
// * Roll history
// * Share rolls with your session live

const DiceRollModal = ({ opened, onClose, primaryColor, character }: DiceRollModalProps) => {
    const [dice, setDice] = useState<DieResult[]>([])
    const [diceCount, setDiceCount] = useState(1)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    
    const hunger = character?.ephemeral?.hunger ?? 0

    useEffect(() => {
        if (!opened) {
            setDice([])
            setDiceCount(1)
            x.set(0)
            y.set(0)
        }
    }, [opened, x, y])

    const rollDie = (): number => {
        return Math.floor(Math.random() * 10) + 1
    }

    const rollDice = () => {
        const bloodDiceCount = Math.min(hunger, diceCount)
        const regularDiceCount = diceCount - bloodDiceCount
        
        if (dice.length > 0) {
            setDice([])
            setTimeout(() => {
                const newDice: DieResult[] = Array.from({ length: diceCount }, (_, i) => ({
                    id: Date.now() + i,
                    value: 0,
                    isRolling: true,
                    isBloodDie: i < bloodDiceCount,
                }))
                setDice(newDice)

                setTimeout(() => {
                    setDice((prev) =>
                        prev.map((die) => ({
                            ...die,
                            value: rollDie(),
                            isRolling: false,
                        }))
                    )
                }, 1500)
            }, 500)
        } else {
            const newDice: DieResult[] = Array.from({ length: diceCount }, (_, i) => ({
                id: Date.now() + i,
                value: 0,
                isRolling: true,
                isBloodDie: i < bloodDiceCount,
            }))
            setDice(newDice)

            setTimeout(() => {
                setDice((prev) =>
                    prev.map((die) => ({
                        ...die,
                        value: rollDie(),
                        isRolling: false,
                    }))
                )
            }, 1500)
        }
    }

    const addDie = () => {
        if (diceCount < 10) {
            setDiceCount(diceCount + 1)
        }
    }

    const removeDie = () => {
        if (diceCount > 1) {
            setDiceCount(diceCount - 1)
        }
    }

    const calculateSuccesses = useMemo(() => {
        if (dice.length === 0 || dice.some((d) => d.isRolling)) {
            return { totalSuccesses: 0, results: [] }
        }

        const results: Array<{ type: "success" | "critical" | "blood-success" | "blood-critical" | "bestial-failure"; value: number }> = []
        const tens: DieResult[] = []
        const bloodTens: DieResult[] = []
        let totalSuccesses = 0

        dice.forEach((die) => {
            if (die.isBloodDie && die.value === 1) {
                results.push({ type: "bestial-failure", value: die.value })
            } else if (die.value >= 6) {
                if (die.value === 10) {
                    if (die.isBloodDie) {
                        bloodTens.push(die)
                    } else {
                        tens.push(die)
                    }
                } else {
                    if (die.isBloodDie) {
                        results.push({ type: "blood-success", value: die.value })
                    } else {
                        results.push({ type: "success", value: die.value })
                    }
                    totalSuccesses += 1
                }
            }
        })

        const regularCritPairs = Math.floor(tens.length / 2)
        const bloodCritPairs = Math.floor(bloodTens.length / 2)
        const remainingRegularTens = tens.length % 2
        const remainingBloodTens = bloodTens.length % 2

        for (let i = 0; i < regularCritPairs; i++) {
            results.push({ type: "critical", value: 10 })
            totalSuccesses += 4
        }

        for (let i = 0; i < bloodCritPairs; i++) {
            results.push({ type: "blood-critical", value: 10 })
            totalSuccesses += 4
        }

        if (remainingRegularTens > 0) {
            results.push({ type: "success", value: 10 })
            totalSuccesses += 1
        }

        if (remainingBloodTens > 0) {
            results.push({ type: "blood-success", value: 10 })
            totalSuccesses += 1
        }

        return { totalSuccesses, results }
    }, [dice])

    if (!opened) return null

    return (
        <div
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2000,
                pointerEvents: "none",
            }}
        >
            <motion.div
                drag
                dragMomentum={false}
                dragConstraints={
                    typeof window !== "undefined"
                        ? {
                              left: -window.innerWidth / 2 + 200,
                              right: window.innerWidth / 2 - 200,
                              top: -window.innerHeight / 2 + 200,
                              bottom: window.innerHeight / 2 - 200,
                          }
                        : undefined
                }
                style={{
                    x,
                    y,
                    pointerEvents: "auto",
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    minWidth: "400px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${primaryColor}`,
                    cursor: "move",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
            >
                <Group justify="flex-end" mb="md">
                    <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                        <IconX size={20} />
                    </ActionIcon>
                </Group>

                <Stack gap="lg">
                    <Group justify="center" gap="md">
                        <Button variant="subtle" onClick={removeDie} color={primaryColor} disabled={diceCount <= 1}>
                            <IconMinus size={18} />
                        </Button>
                        <Text fw={600} fz="lg">
                            {diceCount} {diceCount === 1 ? "Die" : "Dice"}
                        </Text>
                        <Button variant="subtle" onClick={addDie} color={primaryColor}>
                            <IconPlus size={18} />
                        </Button>
                    </Group>

                    <Button size="lg" color={primaryColor} onClick={rollDice} disabled={dice.some((d) => d.isRolling)} fullWidth>
                        {dice.some((d) => d.isRolling) ? "Rolling..." : "Roll Dice"}
                    </Button>

                    <Group justify="center" gap="md" style={{ minHeight: "250px", flexWrap: "wrap", position: "relative" }}>
                        <AnimatePresence>
                            {dice.map((die, index) => {
                                const seed = die.id % 1000
                                const random = () => {
                                    const x = Math.sin(seed) * 10000
                                    return x - Math.floor(x)
                                }
                                const randomOffset = random() > 0.5 ? 800 : -800
                                const randomY = (random() - 0.5) * 400
                                const randomRotation = random() * 360
                                const randomDelay = index * 0.1 + random() * 0.2
                                const randomStiffness = 100 + random() * 50
                                const randomDamping = 15 + random() * 10
                                const randomDuration = 0.8 + random() * 0.4

                                return (
                                    <motion.div
                                        key={die.id}
                                        initial={{
                                            x: (random() - 0.5) * 2000 + randomOffset,
                                            y: randomY,
                                            opacity: 0,
                                            scale: 0.3,
                                            rotateZ: randomRotation,
                                        }}
                                        animate={{
                                            x: 0,
                                            y: 0,
                                            opacity: 1,
                                            scale: 1,
                                            rotateZ: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.3,
                                            x: (random() - 0.5) * 2000 + randomOffset,
                                            y: randomY,
                                            rotateZ: randomRotation,
                                            transition: {
                                                duration: 0.4,
                                                ease: "easeIn",
                                                delay: index * 0.05,
                                            },
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: randomStiffness,
                                            damping: randomDamping,
                                            delay: randomDelay,
                                            duration: randomDuration,
                                        }}
                                        style={{ display: "inline-block" }}
                                    >
                                        <Die
                                            value={die.value}
                                            isRolling={die.isRolling}
                                            primaryColor={die.isBloodDie ? "#c03f3f" : primaryColor}
                                            animationDelay={randomDelay}
                                            seed={seed}
                                        />
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </Group>

                    {dice.length > 0 && !dice.some((d) => d.isRolling) ? (
                        <Box
                            style={{
                                border: `1px solid ${primaryColor}`,
                                borderRadius: "8px",
                                padding: "1rem",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <Stack gap="sm">
                                <Text fw={700} fz="md" c={primaryColor}>
                                    Successes:
                                </Text>
                                {calculateSuccesses.results.length > 0 ? (
                                    <>
                                        <Group gap="xs" wrap="wrap">
                                            {calculateSuccesses.results.map((result, index) => {
                                                let iconSrc: string
                                                switch (result.type) {
                                                    case "success":
                                                        iconSrc = successIcon
                                                        break
                                                    case "critical":
                                                        iconSrc = criticalIcon
                                                        break
                                                    case "blood-success":
                                                        iconSrc = bloodSuccessIcon
                                                        break
                                                    case "blood-critical":
                                                        iconSrc = bloodCriticalIcon
                                                        break
                                                    case "bestial-failure":
                                                        iconSrc = bestialFailureIcon
                                                        break
                                                }
                                                return (
                                                    <img
                                                        key={index}
                                                        src={iconSrc}
                                                        alt={result.type}
                                                        style={{ width: "40px", height: "40px" }}
                                                    />
                                                )
                                            })}
                                        </Group>
                                        <Text fw={600} fz="lg">
                                            Total Successes: {calculateSuccesses.totalSuccesses}
                                        </Text>
                                    </>
                                ) : (
                                    <Text c="dimmed">No successes</Text>
                                )}
                            </Stack>
                        </Box>
                    ) : null}
                </Stack>
            </motion.div>
        </div>
    )
}

type DieProps = {
    value: number
    isRolling: boolean
    primaryColor: string
    animationDelay?: number
    seed?: number
}

const Die = ({ value, isRolling, primaryColor, animationDelay = 0, seed = 0 }: DieProps) => {
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

    const faceNum = value === 10 ? 0 : value - 1

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
        cursor: "pointer",
    }

    const baseFaceStyle = {
        position: "absolute" as const,
        left: "50%",
        top: "0",
        margin: `0 -${internalWidth}px`,
        borderLeft: `${internalWidth}px solid transparent`,
        borderRight: `${internalWidth}px solid transparent`,
        borderBottom: `${upperHeight}px solid ${primaryColor}`,
        width: "0px",
        height: "0px",
        transformStyle: "preserve-3d" as const,
        backfaceVisibility: "hidden" as const,
        filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))",
    }

    const faceAfterStyle = {
        content: '""',
        position: "absolute" as const,
        bottom: `-${upperHeight + lowerHeight}px`,
        left: `-${internalWidth}px`,
        borderLeft: `${internalWidth}px solid transparent`,
        borderRight: `${internalWidth}px solid transparent`,
        borderTop: `${lowerHeight}px solid ${primaryColor}`,
        width: "0px",
        height: "0px",
        filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))",
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
                whileHover={{ scale: 1.05 }}
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

export default DiceRollModal
