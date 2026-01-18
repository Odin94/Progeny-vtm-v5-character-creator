import { Button, Group, Stack, Text, useMantineTheme } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { AnimatePresence, motion, useMotionValue } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { Character } from "~/data/Character"
import posthog from "posthog-js"
import RouseCheckButton from "../RouseCheckButton"
import { useCharacterSheetStore } from "../../stores/characterSheetStore"
import { useDiceRollModalStore } from "../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import { globals } from "~/globals"
import CustomDicePoolControls from "./parts/CustomDicePoolControls"
import DiceContainer, { type DieResult } from "./parts/DiceContainer"
import ModalHeader from "./parts/ModalHeader"
import SelectedDicePoolDisplay from "./parts/SelectedDicePoolDisplay"
import SuccessResults from "./parts/SuccessResults"
import { getApplicableDisciplinePowers } from "../../utils/disciplinePowerMatcher"

type DiceRollModalProps = {
    opened: boolean
    onClose: () => void
    primaryColor: string
    character?: Character
    setCharacter?: (character: Character) => void
}

// TODOdin:
// * Boring mode - no fancy animations
// * Selecting dice pool from sheet
// * Maybe use icons on dice for bestial & crit
// * Roll history
// * Share rolls with your session live

const DiceRollModal = ({ opened, onClose, primaryColor, character, setCharacter }: DiceRollModalProps) => {
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const isMobile = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`)
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
    const [selectedDiceIds, setSelectedDiceIds] = useState<Set<number>>(new Set())

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

        let disciplinePowerBonus = 0
        if (selectedDicePool.attribute) {
            const applicablePowers = getApplicableDisciplinePowers(character, selectedDicePool.attribute, selectedDicePool.skill)
            const applicablePowerKeys = new Set(applicablePowers.map(({ power }) => `${power.discipline}-${power.name}`))

            for (const powerKey of selectedDicePool.selectedDisciplinePowers) {
                if (!applicablePowerKeys.has(powerKey)) continue

                const [disciplineName, powerName] = powerKey.split("-", 2)
                const disciplinePowers = character.disciplines.filter(p => p.discipline === disciplineName)
                const disciplineRating = disciplinePowers.length

                if (powerName === "Wrecker") {
                    disciplinePowerBonus += disciplineRating * 2
                } else {
                    disciplinePowerBonus += disciplineRating
                }
            }
        }

        return attributeValue + skillOrDisciplineValue + specialtyBonus + bloodSurgeBonus + disciplinePowerBonus
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
            setSelectedDiceIds(new Set())
        }
    }, [opened, resetModal, x, y])

    useEffect(() => {
        if (selectedDicePool.attribute && (selectedDicePool.skill || selectedDicePool.discipline)) {
            setActiveTab("selected")
        }
    }, [selectedDicePool])

    const rollDie = (): number => {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            // fully random numbers
            const array = new Uint32Array(1)
            crypto.getRandomValues(array)
            const random = array[0] / (0xFFFFFFFF + 1)
            return Math.floor(random * 10) + 1
        }
        // Pseudo-random numbers
        return Math.floor(Math.random() * 10) + 1
    }

    const rollDice = () => {
        const countToUse = activeTab === "selected" ? selectedPoolDiceCount : diceCount
        const bloodDiceCount = Math.min(hunger, countToUse)

        if (isMobile) {
            const newDice: DieResult[] = Array.from({ length: countToUse }, (_, i) => ({
                id: Date.now() + i,
                value: rollDie(),
                isRolling: false,
                isBloodDie: i < bloodDiceCount,
            }))
            setDice(newDice)
        } else {
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
    }

    const nonBloodDice = useMemo(() => {
        return dice.filter((d) => !d.isBloodDie && !d.isRolling)
    }, [dice])

    const rerollableDice = useMemo(() => {
        return dice.filter((d) => !d.isBloodDie && !d.isRolling && d.value < 6)
    }, [dice])

    const canReroll = useMemo(() => {
        if (!character || !setCharacter) return false
        const totalWillpowerDamage = (character.ephemeral?.superficialWillpowerDamage ?? 0) + (character.ephemeral?.aggravatedWillpowerDamage ?? 0)
        const availableWillpower = character.willpower - totalWillpowerDamage
        if (isMobile) {
            return availableWillpower > 0 && rerollableDice.length > 0
        }
        return availableWillpower > 0 && selectedDiceIds.size > 0 && selectedDiceIds.size <= 3
    }, [character, selectedDiceIds, isMobile, rerollableDice.length])

    const handleDieClick = (dieId: number, isBloodDie: boolean) => {
        if (isBloodDie || dice.some((d) => d.isRolling)) return

        setSelectedDiceIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(dieId)) {
                newSet.delete(dieId)
            } else if (newSet.size < 3) {
                newSet.add(dieId)
            }
            return newSet
        })
    }

    const handleReroll = () => {
        if (!character || !setCharacter || !canReroll) return

        const totalWillpowerDamage = (character.ephemeral?.superficialWillpowerDamage ?? 0) + (character.ephemeral?.aggravatedWillpowerDamage ?? 0)
        const availableWillpower = character.willpower - totalWillpowerDamage
        if (availableWillpower <= 0) return

        let diceIdsToReroll: Set<number>
        if (isMobile) {
            diceIdsToReroll = new Set(rerollableDice.map((d) => d.id))
        } else {
            diceIdsToReroll = selectedDiceIds
            if (diceIdsToReroll.size === 0) return
        }

        setCharacter({
            ...character,
            ephemeral: {
                ...character.ephemeral,
                superficialWillpowerDamage: (character.ephemeral?.superficialWillpowerDamage ?? 0) + 1,
            },
        })

        if (isMobile) {
            const rerolledDice = dice.filter((d) => diceIdsToReroll.has(d.id))
            const oldValuesMap = new Map(rerolledDice.map((d) => [d.id, d.value]))

            const newDice = dice.map((die) => {
                if (diceIdsToReroll.has(die.id)) {
                    return {
                        ...die,
                        value: rollDie(),
                        isRolling: false,
                    }
                }
                return die
            })

            const resultsText = rerolledDice.map((die) => {
                const oldVal = oldValuesMap.get(die.id) ?? 0
                const newDie = newDice.find((d) => d.id === die.id)
                const newVal = newDie?.value ?? 0
                const displayOld = oldVal === 10 ? "0" : oldVal.toString()
                const displayNew = newVal === 10 ? "0" : newVal.toString()
                return `${displayOld}→${displayNew}`
            }).join(", ")

            const newValues = rerolledDice.map((die) => {
                const newDie = newDice.find((d) => d.id === die.id)
                return newDie?.value ?? 0
            })
            const successCount = newValues.filter((v) => v >= 6).length
            const successText = successCount > 0 ? ` (${successCount} ${successCount === 1 ? "success" : "successes"})` : ""

            setDice(newDice)

            notifications.show({
                title: "Willpower Reroll",
                message: `${resultsText}${successText}`,
                color: primaryColor,
                autoClose: 4000,
            })
        } else {
            setDice((prev) =>
                prev.map((die) => {
                    if (diceIdsToReroll.has(die.id)) {
                        return {
                            ...die,
                            value: 0,
                            isRolling: true,
                        }
                    }
                    return die
                })
            )

            setTimeout(() => {
                setDice((prev) =>
                    prev.map((die) => {
                        if (diceIdsToReroll.has(die.id)) {
                            return {
                                ...die,
                                value: rollDie(),
                                isRolling: false,
                            }
                        }
                        return die
                    })
                )
                setSelectedDiceIds(new Set())
            }, 1500)
        }
    }

    const calculateSuccesses = useMemo(() => {
        if (dice.length === 0 || dice.some((d) => d.isRolling)) {
            return { totalSuccesses: 0, results: [] }
        }

        const results: Array<{ type: "success" | "critical" | "blood-success" | "blood-critical" | "bestial-failure"; value: number }> = []
        const allTens: DieResult[] = []
        let totalSuccesses = 0

        dice.forEach((die) => {
            if (die.isBloodDie && die.value === 1) {
                results.push({ type: "bestial-failure", value: die.value })
            } else if (die.value >= 6) {
                if (die.value === 10) {
                    allTens.push(die)
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

        const totalCritPairs = Math.floor(allTens.length / 2)
        const remainingTens = allTens.length % 2

        for (let i = 0; i < totalCritPairs; i++) {
            const die1 = allTens[i * 2]
            const die2 = allTens[i * 2 + 1]

            results.push({ type: die1.isBloodDie ? "blood-critical" : "critical", value: 10 })
            results.push({ type: die2.isBloodDie ? "blood-critical" : "critical", value: 10 })
            totalSuccesses += 4
        }

        for (let i = 0; i < remainingTens; i++) {
            const die = allTens[totalCritPairs * 2 + i]
            results.push({ type: die.isBloodDie ? "blood-critical" : "critical", value: 10 })
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
                            discipline_powers: selectedDicePool.selectedDisciplinePowers,
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

    const modalContent = (
        <>
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

                <Group gap="xs" justify="space-between" style={{ flexShrink: 0, position: "relative" }}>
                    <div style={{ width: character && setCharacter ? 36 : 0 }} />
                    <Button
                        size="md"
                        color={primaryColor}
                        onClick={rollDice}
                        disabled={dice.some((d) => d.isRolling) || (activeTab === "selected" && selectedPoolDiceCount === 0)}
                    >
                        {dice.some((d) => d.isRolling)
                            ? "Rolling..."
                            : activeTab === "selected"
                                ? `Roll ${selectedPoolDiceCount} ${selectedPoolDiceCount === 1 ? "die" : "dice"}`
                                : "Roll Dice"}
                    </Button>
                    {character && setCharacter ? (
                        <RouseCheckButton
                            character={character}
                            setCharacter={setCharacter}
                            primaryColor={primaryColor}
                            size="lg"
                            iconSize={20}
                            tooltipZIndex={3000}
                        />
                    ) : (
                        <div style={{ width: 36 }} />
                    )}
                </Group>

                {isMobile ? null : <DiceContainer
                    primaryColor={primaryColor}
                    onDieClick={handleDieClick}
                    selectedDiceIds={selectedDiceIds}
                    isMobile={isMobile}
                />}

                <AnimatePresence>
                    {dice.length > 0 && !dice.some((d) => d.isRolling) ? (
                        <SuccessResults
                            key="success-results"
                            results={calculateSuccesses.results}
                            totalSuccesses={calculateSuccesses.totalSuccesses}
                            primaryColor={primaryColor}
                            onReroll={nonBloodDice.length > 0 && character && setCharacter ? handleReroll : undefined}
                            canReroll={canReroll}
                            selectedDiceCount={selectedDiceIds.size}
                            rerollableDiceCount={rerollableDice.length}
                            isMobile={isMobile}
                        />
                    ) : null}
                </AnimatePresence>
            </Stack>
        </>
    )

    if (isMobile) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        zIndex: 1999,
                        pointerEvents: "none",
                    }}
                />
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "75vh",
                        maxHeight: "600px",
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        backdropFilter: "blur(10px)",
                        borderTopLeftRadius: "16px",
                        borderTopRightRadius: "16px",
                        borderTop: `2px solid ${colorValue}`,
                        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
                        zIndex: 2000,
                        display: "flex",
                        flexDirection: "column",
                        padding: "1rem",
                        paddingTop: "0.5rem",
                        overflow: "hidden",
                        pointerEvents: "auto",
                    }}
                >
                    <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingTop: "0.5rem" }}>
                        {modalContent}
                    </div>
                </motion.div>
            </>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2000,
                pointerEvents: "none",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                    width: "min(610px, 90vw)",
                    height: "min(880px, 90vh)",
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${colorValue}`,
                    cursor: "move",
                    display: "flex",
                    flexDirection: "column",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
            >
                {modalContent}
            </motion.div>
        </div>
    )
}


export default DiceRollModal
