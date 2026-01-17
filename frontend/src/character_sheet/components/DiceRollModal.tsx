import { ActionIcon, Button, Group, Stack, Text, Box, Tabs, Badge, Checkbox } from "@mantine/core"
import { IconMinus, IconPlus, IconX, IconRotateClockwise } from "@tabler/icons-react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { Character } from "~/data/Character"
import successIcon from "~/resources/diceResults/success.svg"
import criticalIcon from "~/resources/diceResults/critical.svg"
import bloodSuccessIcon from "~/resources/diceResults/blood-success.svg"
import bloodCriticalIcon from "~/resources/diceResults/blood-critical.svg"
import bestialFailureIcon from "~/resources/diceResults/bestial-failure.svg"
import { SelectedDicePool } from "../CharacterSheet"
import { upcase } from "~/generator/utils"

type DiceRollModalProps = {
    opened: boolean
    onClose: () => void
    primaryColor: string
    character?: Character
    selectedDicePool: SelectedDicePool
    setSelectedDicePool: (pool: SelectedDicePool) => void
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

const DiceRollModal = ({ opened, onClose, primaryColor, character, selectedDicePool, setSelectedDicePool }: DiceRollModalProps) => {
    const [dice, setDice] = useState<DieResult[]>([])
    const [diceCount, setDiceCount] = useState(1)
    const [activeTab, setActiveTab] = useState<string | null>("custom")
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    
    const hunger = character?.ephemeral?.hunger ?? 0

    const selectedPoolDiceCount = useMemo(() => {
        if (!character || !selectedDicePool.attribute) return 0
        const attributeValue = character.attributes[selectedDicePool.attribute] || 0
        let skillOrDisciplineValue = 0
        let specialtyBonus = 0
        
        if (selectedDicePool.skill) {
            skillOrDisciplineValue = character.skills[selectedDicePool.skill] || 0
            specialtyBonus = selectedDicePool.selectedSpecialties.length
        } else if (selectedDicePool.discipline) {
            const disciplinePowers = character.disciplines.filter(p => p.discipline === selectedDicePool.discipline)
            skillOrDisciplineValue = disciplinePowers.length
        }
        
        const bloodSurgeBonus = selectedDicePool.bloodSurge ? 2 : 0
        
        return attributeValue + skillOrDisciplineValue + specialtyBonus + bloodSurgeBonus
    }, [character, selectedDicePool])
    
    const skillSpecialties = useMemo(() => {
        if (!character || !selectedDicePool.skill) return []
        return character.skillSpecialties.filter(s => s.skill === selectedDicePool.skill && s.name !== "")
    }, [character, selectedDicePool.skill])

    useEffect(() => {
        if (!opened) {
            setDice([])
            setDiceCount(1)
            setActiveTab("custom")
            x.set(0)
            y.set(0)
        }
    }, [opened, x, y])

    useEffect(() => {
        if (selectedDicePool.attribute && (selectedDicePool.skill || selectedDicePool.discipline)) {
            setActiveTab("selected")
        }
    }, [selectedDicePool])

    const rollDie = (): number => {
        return Math.floor(Math.random() * 10) + 1
    }

    const rollDice = () => {
        const countToUse = activeTab === "selected" ? selectedPoolDiceCount : diceCount
        const bloodDiceCount = Math.min(hunger, countToUse)
        const regularDiceCount = countToUse - bloodDiceCount
        
        if (dice.length > 0) {
            setDice([])
            setTimeout(() => {
                const newDice: DieResult[] = Array.from({ length: countToUse }, (_, i) => ({
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
            const newDice: DieResult[] = Array.from({ length: countToUse }, (_, i) => ({
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
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    width: "610px",
                    height: "880px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${primaryColor}`,
                    cursor: "move",
                    display: "flex",
                    flexDirection: "column",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
            >
                <Group justify="center" mb="md" style={{ position: "relative", paddingRight: "40px" }}>
                    <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} style={{ width: "100%" }}>
                        <Tabs.List grow>
                            <Tabs.Tab value="custom">Custom</Tabs.Tab>
                            <Tabs.Tab value="selected">Selected Pool</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                    <ActionIcon 
                        variant="subtle" 
                        color="gray" 
                        onClick={onClose}
                        style={{ 
                            position: "absolute", 
                            right: 0,
                            top: 0,
                            zIndex: 10,
                            pointerEvents: "auto"
                        }}
                    >
                        <IconX size={20} />
                    </ActionIcon>
                </Group>

                <Stack gap="lg" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                    {activeTab === "custom" ? (
                        <Group justify="center" gap="md">
                            <Button variant="subtle" onClick={removeDie} color={primaryColor} disabled={diceCount <= 1}>
                                <IconMinus size={18} />
                            </Button>
                            <Text fw={600} fz="lg">
                                {diceCount} {diceCount === 1 ? "Die" : "Dice"}
                            </Text>
                            <Button variant="subtle" onClick={() => setDiceCount(diceCount + 1)} color={primaryColor}>
                                <IconPlus size={18} />
                            </Button>
                        </Group>
                    ) : (
                        <Box
                            style={{
                                border: `1px solid ${primaryColor}`,
                                borderRadius: "8px",
                                padding: "1rem",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                            }}
                        >
                            <Stack gap="sm">
                                <Group justify="space-between" align="center">
                                    <Text fw={700} fz="md" c={primaryColor}>
                                        Selected Dice Pool:
                                    </Text>
                                    {(selectedDicePool.attribute || selectedDicePool.skill || selectedDicePool.discipline) ? (
                                        <ActionIcon
                                            variant="subtle"
                                            color={primaryColor}
                                            onClick={() => setSelectedDicePool({ attribute: null, skill: null, discipline: null, selectedSpecialties: [], bloodSurge: false })}
                                            title="Reset dice pool"
                                        >
                                            <IconRotateClockwise size={18} />
                                        </ActionIcon>
                                    ) : null}
                                </Group>
                                <Group gap="xs">
                                    {selectedDicePool.attribute ? (
                                        <Badge variant="light" color={primaryColor} size="lg">
                                            {upcase(selectedDicePool.attribute)}: {character?.attributes[selectedDicePool.attribute] || 0}
                                        </Badge>
                                    ) : (
                                        <Text c="dimmed" size="sm">No attribute selected</Text>
                                    )}
                                    {selectedDicePool.skill ? (
                                        <Badge variant="light" color={primaryColor} size="lg">
                                            {upcase(selectedDicePool.skill)}: {character?.skills[selectedDicePool.skill] || 0}
                                        </Badge>
                                    ) : selectedDicePool.discipline ? (
                                        <Badge variant="light" color={primaryColor} size="lg">
                                            {upcase(selectedDicePool.discipline)}: {character?.disciplines.filter(p => p.discipline === selectedDicePool.discipline).length || 0}
                                        </Badge>
                                    ) : (
                                        <Text c="dimmed" size="sm">No skill/discipline selected</Text>
                                    )}
                                </Group>
                                {skillSpecialties.length > 0 && selectedDicePool.skill ? (
                                    <Stack gap="xs" mt="sm">
                                        <Text fw={600} fz="sm" c={primaryColor}>
                                            Specialties (+1 die each):
                                        </Text>
                                        <Group gap="xs">
                                            {skillSpecialties.map((specialty) => (
                                                <Checkbox
                                                    key={specialty.name}
                                                    label={specialty.name}
                                                    checked={selectedDicePool.selectedSpecialties.includes(specialty.name)}
                                                    onChange={(e) => {
                                                        if (e.currentTarget.checked) {
                                                            setSelectedDicePool({
                                                                ...selectedDicePool,
                                                                selectedSpecialties: [...selectedDicePool.selectedSpecialties, specialty.name],
                                                            })
                                                        } else {
                                                            setSelectedDicePool({
                                                                ...selectedDicePool,
                                                                selectedSpecialties: selectedDicePool.selectedSpecialties.filter(s => s !== specialty.name),
                                                            })
                                                        }
                                                    }}
                                                    color={primaryColor}
                                                />
                                            ))}
                                        </Group>
                                    </Stack>
                                ) : null}
                                <Checkbox
                                    label="Blood Surge (+2 dice)"
                                    checked={selectedDicePool.bloodSurge}
                                    onChange={(e) => {
                                        setSelectedDicePool({
                                            ...selectedDicePool,
                                            bloodSurge: e.currentTarget.checked,
                                        })
                                    }}
                                    color={primaryColor}
                                    mt="sm"
                                />
                                <Text fw={600} fz="lg" mt="xs">
                                    Total Dice: {selectedPoolDiceCount}
                                </Text>
                            </Stack>
                        </Box>
                    )}

                    <Button
                        size="lg"
                        color={primaryColor}
                        onClick={rollDice}
                        disabled={dice.some((d) => d.isRolling) || (activeTab === "selected" && selectedPoolDiceCount === 0)}
                        fullWidth
                    >
                        {dice.some((d) => d.isRolling) ? "Rolling..." : "Roll Dice"}
                    </Button>

                    <Group justify="center" gap="md" style={{ height: "480px", flexWrap: "wrap", position: "relative", overflow: "hidden", alignItems: "center", flexShrink: 0 }}>
                        <AnimatePresence mode="wait">
                            {dice.map((die, index) => {
                                const seed = die.id % 1000
                                const random = () => {
                                    const x = Math.sin(seed) * 10000
                                    return x - Math.floor(x)
                                }
                                
                                const containerWidth = 562
                                const containerHeight = 250
                                const dieSize = 100
                                const gap = 10
                                const maxDicePerRow = Math.max(1, Math.floor((containerWidth - dieSize) / (dieSize + gap)))
                                const row = Math.floor(index / maxDicePerRow)
                                const col = index % maxDicePerRow
                                const totalRows = Math.ceil(dice.length / maxDicePerRow)
                                
                                const totalWidth = Math.min(dice.length, maxDicePerRow) * (dieSize + gap) - gap
                                const totalHeight = totalRows * (dieSize + gap) - gap
                                
                                const startX = (containerWidth - totalWidth) / 2
                                const startY = (containerHeight - totalHeight) / 2
                                
                                const finalX = (startX + col * (dieSize + gap) + dieSize / 2) - containerWidth / 2 - 30
                                const finalY = (startY + row * (dieSize + gap) + dieSize / 2) - containerHeight / 2 - 30
                                
                                const randomOffset = random() > 0.5 ? 800 : -800
                                const randomOffsetX = (random() - 0.5) * 2000 + randomOffset
                                const randomOffsetY = (random() - 0.5) * 400
                                const randomRotationZ = random() * 360
                                const randomDelay = index * 0.1 + random() * 0.2
                                const randomStiffness = 100 + random() * 50
                                const randomDamping = 15 + random() * 10
                                const randomDuration = 0.8 + random() * 0.4
                                
                                return (
                                    <motion.div
                                        key={die.id}
                                        initial={{
                                            x: finalX + randomOffsetX,
                                            y: finalY + randomOffsetY,
                                            opacity: 0,
                                            scale: 0.3,
                                            rotateZ: randomRotationZ,
                                        }}
                                        animate={{
                                            x: finalX,
                                            y: finalY,
                                            opacity: 1,
                                            scale: 1,
                                            rotateZ: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.3,
                                            x: finalX + randomOffsetX,
                                            y: finalY + randomOffsetY,
                                            rotateZ: randomRotationZ,
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
                                        style={{ 
                                            display: "inline-block",
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                        }}
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
                                height: "150px",
                                display: "flex",
                                flexDirection: "column",
                                flexShrink: 0,
                                marginTop: "auto",
                            }}
                        >
                            <Stack gap="sm" style={{ flex: 1 }}>
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
