import { Group } from "@mantine/core"
import { useRef, useMemo, useEffect } from "react"
import PipButton from "./PipButton"
import { SheetOptions } from "../constants"
import { Character } from "~/data/Character"
import { getAvailableXP, canAffordUpgrade, getAttributeCost, getSkillCost, getBloodPotencyCost } from "../utils/xp"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"

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
        const clickedLevel = index + 1
        const wouldDecrease = clickedLevel <= level

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
            const newLevel = clickedLevel
            const clampedLevel = Math.min(Math.max(minLevel, newLevel), maxLevel)
            const currentLevel = level
            if (clampedLevel !== currentLevel + 1) {
                return "Can only increase one level at a time in XP mode"
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

    const handlePipClick = (index: number) => {
        if (!options || !field) return

        const { mode, character, setCharacter } = options
        const clampedLevel = Math.min(Math.max(minLevel, index + 1), maxLevel)

        if (mode === "play") {
            return
        }

        if (mode === "xp") {
            if (clampedLevel !== level + 1) {
                return
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
