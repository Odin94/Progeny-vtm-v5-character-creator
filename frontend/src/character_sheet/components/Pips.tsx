import { Group } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import PipButton from "./PipButton"
import { SheetOptions } from "../CharacterSheet"
import { Character } from "~/data/Character"
import { getAvailableXP, canAffordUpgrade, getAttributeCost, getSkillCost, getBloodPotencyCost } from "../utils/xp"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { potencyLimitByGeneration } from "~/data/BloodPotency"

type PipsProps = {
    level: number
    maxLevel?: number
    minLevel?: number
    options?: SheetOptions
    field?: string
}

const Pips = ({ level, maxLevel = 5, minLevel = 0, options, field }: PipsProps) => {
    const prevLevelRef = useRef(level)

    const { firstChangingIndex, isFilling } = useMemo(() => {
        const prevLevel = prevLevelRef.current
        const filling = level > prevLevel
        const emptying = level < prevLevel

        if (filling) {
            return { firstChangingIndex: prevLevel, isFilling: true }
        } else if (emptying) {
            return { firstChangingIndex: prevLevel - 1, isFilling: false }
        }

        return { firstChangingIndex: null, isFilling: false }
    }, [level])

    useEffect(() => {
        prevLevelRef.current = level
    }, [level])

    // TODOdin: Update costFunctionByFieldName to make it usable here instaed of getCostFunction()
    const getCostFunction = (): ((newLevel: number) => number) | null => {
        if (!field) return null
        if (field.startsWith("attributes.")) {
            return getAttributeCost
        }
        if (field.startsWith("skills.")) {
            return getSkillCost
        }
        if (field === "bloodPotency") {
            return getBloodPotencyCost
        }
        return null
    }

    const getXPCost = (index: number): number | undefined => {
        if (!options || !field || options.mode !== "xp") return undefined

        const clickedLevel = index + 1
        const wouldDecrease = clickedLevel <= level

        // Health and willpower are not editable in XP mode
        if (field === "maxHealth" || field === "willpower") {
            return undefined
        }

        if (wouldDecrease) {
            return undefined
        }

        const newLevel = clickedLevel
        const clampedLevel = Math.min(Math.max(minLevel, newLevel), maxLevel)
        const currentLevel = level
        if (clampedLevel !== currentLevel + 1) {
            return undefined
        }

        const costFunction = getCostFunction()
        return costFunction ? costFunction(clampedLevel) : 0
    }

    const getDisabledReason = (index: number): string | undefined => {
        if (!options || !field) return "No options or field provided"

        const { mode, character } = options
        let newLevel: number
        if (level === 1 && index === 0) {
            newLevel = 0
        } else {
            newLevel = index + 1
        }
        const wouldDecrease = newLevel < level

        // Health and willpower are not editable in play or XP mode
        if ((field === "maxHealth" || field === "willpower") && (mode === "play" || mode === "xp")) {
            return "Health and Willpower are automatically calculated from attributes"
        }

        if (mode === "play") {
            return "Editing is disabled in Play mode"
        }

        if (mode === "xp") {
            if (wouldDecrease) {
                return "Cannot decrease in XP mode"
            }
            const clampedLevel = Math.min(Math.max(minLevel, newLevel), maxLevel)
            const currentLevel = level
            if (clampedLevel !== currentLevel + 1) {
                return "Can only increase one level at a time in XP mode"
            }

            // Check blood potency generation limits
            if (field === "bloodPotency") {
                const limits = potencyLimitByGeneration[character.generation]
                if (limits) {
                    if (clampedLevel < limits.min) {
                        return `Blood Potency cannot be below ${limits.min} for ${character.generation}${getGenerationSuffix(character.generation)} generation. Your generation allows Blood Potency between ${limits.min} and ${limits.max}.`
                    }
                    if (clampedLevel > limits.max) {
                        return `Blood Potency cannot exceed ${limits.max} for ${character.generation}${getGenerationSuffix(character.generation)} generation. Your generation allows Blood Potency between ${limits.min} and ${limits.max}.`
                    }
                }
            }

            const costFunction = getCostFunction()
            const cost = costFunction ? costFunction(clampedLevel) : 0
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return `Insufficient XP. Need ${cost}, have ${availableXP}`
            }
        }

        return undefined
    }

    const getGenerationSuffix = (generation: number): string => {
        if (generation >= 11 && generation <= 13) return "th"
        if (generation === 14) return "th"
        if (generation === 15) return "th"
        if (generation === 16) return "th"
        const lastDigit = generation % 10
        if (lastDigit === 1) return "st"
        if (lastDigit === 2) return "nd"
        if (lastDigit === 3) return "rd"
        return "th"
    }

    const handlePipClick = (index: number) => {
        if (!options || !field) return

        const { mode, character, setCharacter } = options
        let newLevel: number
        if (level === 1 && index === 0) {
            newLevel = 0
        } else {
            newLevel = index + 1
        }
        const clampedLevel = Math.min(Math.max(minLevel, newLevel), maxLevel)

        if (mode === "play") {
            return
        }

        if (mode === "xp") {
            if (clampedLevel !== level + 1) {
                return
            }

            // Check blood potency generation limits
            if (field === "bloodPotency") {
                const limits = potencyLimitByGeneration[character.generation]
                if (limits) {
                    if (clampedLevel < limits.min || clampedLevel > limits.max) {
                        return
                    }
                }
            }

            const costFunction = getCostFunction()
            const cost = costFunction ? costFunction(clampedLevel) : 0
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            const update: Partial<Character> = {}
            // TODOdin: Find a way to stop looking for specific things here, and also get better type safety (no "as never")
            if (field === "bloodPotency") {
                update.bloodPotency = clampedLevel
            } else if (field.startsWith("attributes.")) {
                const attr = field.split(".")[1]
                update.attributes = { ...character.attributes, [attr]: clampedLevel }
            } else if (field.startsWith("skills.")) {
                const skill = field.split(".")[1]
                update.skills = { ...character.skills, [skill]: clampedLevel }
            } else {
                update[field as keyof Character] = clampedLevel as never
            }
            const updatedCharacter = {
                ...character,
                ...update,
                ephemeral: {
                    ...character.ephemeral,
                    experienceSpent: character.ephemeral.experienceSpent + cost,
                },
            }
            // Update health, willpower, blood potency, and humanity when attributes change
            if (field.startsWith("attributes.")) {
                updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
            }
            setCharacter(updatedCharacter)
            return
        }

        const update: Partial<Character> = {}
        if (field === "bloodPotency") {
            update.bloodPotency = clampedLevel
        } else if (field.startsWith("attributes.")) {
            const attr = field.split(".")[1]
            update.attributes = { ...character.attributes, [attr]: clampedLevel }
        } else if (field.startsWith("skills.")) {
            const skill = field.split(".")[1]
            update.skills = { ...character.skills, [skill]: clampedLevel }
        } else {
            update[field as keyof Character] = clampedLevel as never
        }
        const updatedCharacter = {
            ...character,
            ...update,
        }
        // Update health, willpower, blood potency, and humanity when attributes change
        if (field.startsWith("attributes.")) {
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        }
        setCharacter(updatedCharacter)
    }

    return (
        <Group gap={4}>
            {Array.from({ length: maxLevel }, (_, index) => (
                <PipButton
                    key={index}
                    index={index}
                    filled={index < level}
                    firstChangingIndex={firstChangingIndex}
                    isFilling={isFilling}
                    onClick={() => handlePipClick(index)}
                    style={(index + 1) % 5 === 0 && index < maxLevel - 1 ? { marginRight: 8 } : undefined}
                    options={options}
                    disabledReason={getDisabledReason(index)}
                    xpCost={getXPCost(index)}
                />
            ))}
        </Group>
    )
}

export default Pips
