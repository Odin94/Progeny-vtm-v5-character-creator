import { Button, Stack } from "@mantine/core"
import { motion, useMotionValue } from "framer-motion"
import { useEffect, useMemo, useRef } from "react"
import { Character } from "~/data/Character"
import posthog from "posthog-js"
import { useCharacterSheetStore } from "../../stores/characterSheetStore"
import { useDiceRollModalStore } from "../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import CustomDicePoolControls from "./parts/CustomDicePoolControls"
import DiceContainer, { type DieResult } from "./parts/DiceContainer"
import ModalHeader from "./parts/ModalHeader"
import SelectedDicePoolDisplay from "./parts/SelectedDicePoolDisplay"
import SuccessResults from "./parts/SuccessResults"

type DiceRollModalProps = {
    opened: boolean
    onClose: () => void
    primaryColor: string
    character?: Character
}

// TODOdin:
// * Boring mode - no fancy animations
// * Add discipline stats that affect attributes
// * Crits & bestials
// * Selecting dice pool from sheet
// * Reading and updating hunger / rouse rolls
// * Maybe use icons on dice for bestial & crit
// * Roll history
// * Share rolls with your session live

const DiceRollModal = ({ opened, onClose, primaryColor, character }: DiceRollModalProps) => {
    const { selectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            selectedDicePool: state.selectedDicePool,
        }))
    )
    const { dice, setDice, diceCount, activeTab, setActiveTab, reset: resetModal } = useDiceRollModalStore(
        useShallow((state) => ({
            dice: state.dice,
            setDice: state.setDice,
            diceCount: state.diceCount,
            activeTab: state.activeTab,
            setActiveTab: state.setActiveTab,
            reset: state.reset,
        }))
    )
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const lastRollTrackedRef = useRef<number>(0)
    
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
            resetModal()
            x.set(0)
            y.set(0)
            lastRollTrackedRef.current = 0
        }
    }, [opened, resetModal, x, y])

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

    useEffect(() => {
        if (dice.length > 0 && !dice.some((d) => d.isRolling) && calculateSuccesses.totalSuccesses >= 0) {
            const currentRollId = dice[0]?.id || 0
            if (currentRollId !== lastRollTrackedRef.current) {
                lastRollTrackedRef.current = currentRollId
                
                try {
                    if (activeTab === "custom") {
                        posthog.capture("dice-roll-custom", {
                            dice_count: diceCount,
                            total_successes: calculateSuccesses.totalSuccesses,
                            blood_dice_count: dice.filter((d) => d.isBloodDie).length,
                            regular_dice_count: dice.filter((d) => !d.isBloodDie).length,
                            has_criticals: calculateSuccesses.results.some((r) => r.type === "critical" || r.type === "blood-critical"),
                            has_bestial_failure: calculateSuccesses.results.some((r) => r.type === "bestial-failure"),
                        })
                    } else {
                        const poolData: Record<string, string | number | boolean | string[]> = {
                            attribute: selectedDicePool.attribute || "",
                            skill: selectedDicePool.skill || "",
                            discipline: selectedDicePool.discipline || "",
                            blood_surge: selectedDicePool.bloodSurge,
                            specialties: selectedDicePool.selectedSpecialties,
                            total_successes: calculateSuccesses.totalSuccesses,
                            dice_count: selectedPoolDiceCount,
                            blood_dice_count: dice.filter((d) => d.isBloodDie).length,
                            regular_dice_count: dice.filter((d) => !d.isBloodDie).length,
                            has_criticals: calculateSuccesses.results.some((r) => r.type === "critical" || r.type === "blood-critical"),
                            has_bestial_failure: calculateSuccesses.results.some((r) => r.type === "bestial-failure"),
                        }
                        posthog.capture("dice-roll-selected-pool", poolData)
                    }
                } catch (error) {
                    console.warn("PostHog dice roll tracking failed:", error)
                }
            }
        }
    }, [dice, calculateSuccesses, activeTab, diceCount, selectedDicePool, selectedPoolDiceCount])

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
                <ModalHeader
                    primaryColor={primaryColor}
                    onClose={onClose}
                />

                <Stack gap="lg" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                    {activeTab === "custom" ? (
                        <CustomDicePoolControls primaryColor={primaryColor} />
                    ) : (
                        <SelectedDicePoolDisplay
                            character={character}
                            primaryColor={primaryColor}
                            skillSpecialties={skillSpecialties}
                        />
                    )}

                    <Button
                        size="lg"
                        color={primaryColor}
                        onClick={rollDice}
                        disabled={dice.some((d) => d.isRolling) || (activeTab === "selected" && selectedPoolDiceCount === 0)}
                        fullWidth
                        style={{ flexShrink: 0 }}
                    >
                        {dice.some((d) => d.isRolling) 
                            ? "Rolling..." 
                            : activeTab === "selected" 
                                ? `Roll ${selectedPoolDiceCount} ${selectedPoolDiceCount === 1 ? "die" : "dice"}`
                                : "Roll Dice"}
                    </Button>

                    <DiceContainer
                        primaryColor={primaryColor}
                    />

                    {dice.length > 0 && !dice.some((d) => d.isRolling) ? (
                        <SuccessResults
                            results={calculateSuccesses.results}
                            totalSuccesses={calculateSuccesses.totalSuccesses}
                            primaryColor={primaryColor}
                        />
                    ) : null}
                </Stack>
            </motion.div>
        </div>
    )
}


export default DiceRollModal
