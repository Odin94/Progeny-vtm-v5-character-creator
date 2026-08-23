import { Group, Stack, Text } from "@mantine/core"
import { memo, useRef, useMemo, useEffect, useState } from "react"
import posthog from "posthog-js"
import "./Pips.css"
import PipButton from "./PipButton"
import { SheetOptions } from "../CharacterSheet"
import { Character } from "~/data/Character"
import {
    getAvailableXP,
    canAffordUpgrade,
    getAttributeCost,
    getSkillCost,
    getBloodPotencyCost
} from "../utils/xp"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { potencyLimitByGeneration } from "~/data/BloodPotency"

type PipsProps = {
    level: number
    maxLevel?: number
    minLevel?: number
    options?: SheetOptions
    field?: string
    readOnly?: boolean
    onLevelChange?: (level: number) => void
}

const BLOCKED_WARNING_DURATION_MS = 2_500

const Pips = ({
    level,
    maxLevel = 5,
    minLevel = 0,
    options,
    field,
    readOnly = false,
    onLevelChange
}: PipsProps) => {
    const prevLevelRef = useRef(level)
    const blockedWarningIdRef = useRef(0)
    // A click that cannot be applied gets brief visible feedback without changing the pip row's
    // layout. The id makes repeat clicks restart the warning's lifetime and animation.
    const [blockedWarning, setBlockedWarning] = useState<
        { id: number; reason: string } | undefined
    >(undefined)

    // Clicking the current top-most filled pip steps the trait down one level; clicking
    // any other pip sets the trait to that level. Uniform across all levels so no click is
    // a silent no-op (previously only level 1 handled the step-down, and clicking the top
    // pip of a higher trait did nothing).
    const getTargetLevel = (index: number): number => {
        const clickedLevel = index + 1
        return clickedLevel === level ? level - 1 : clickedLevel
    }

    // Drop the warning once the situation that caused it (mode or level) changes so a stale
    // reason never lingers.
    useEffect(() => {
        setBlockedWarning(undefined)
    }, [options?.mode, level])

    useEffect(() => {
        if (!blockedWarning) return

        const timeout = window.setTimeout(
            () => setBlockedWarning(undefined),
            BLOCKED_WARNING_DURATION_MS
        )
        return () => window.clearTimeout(timeout)
    }, [blockedWarning])

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
        if (onLevelChange) return undefined
        if (!options || !field) return "No options or field provided"

        const { mode, character, canEdit, editDisabledReason } = options
        if (!canEdit) {
            return editDisabledReason
        }

        const newLevel = getTargetLevel(index)
        const wouldDecrease = newLevel < level

        // Health and willpower are not editable in play or XP mode
        if (
            (field === "maxHealth" || field === "willpower") &&
            (mode === "play" || mode === "xp")
        ) {
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

    const capturePipEvent = (event: string, properties: Record<string, unknown>) => {
        try {
            posthog.capture(event, properties)
        } catch (error) {
            console.warn(`PostHog ${event} tracking failed:`, error)
        }
    }

    const handlePipClick = (index: number) => {
        const newLevel = getTargetLevel(index)
        const clampedLevel = Math.min(Math.max(minLevel, newLevel), maxLevel)

        if (onLevelChange) {
            onLevelChange(clampedLevel)
            return
        }

        if (!options || !field) return

        const { mode, character, setCharacter } = options

        // A single source of truth for whether the click can apply. When it can't, show a brief
        // visible explanation instead of returning silently behind a hover-only tooltip.
        const disabledReason = getDisabledReason(index)
        if (disabledReason) {
            setBlockedWarning({ id: ++blockedWarningIdRef.current, reason: disabledReason })
            capturePipEvent("sheet-pip-edit-blocked", {
                field,
                mode,
                reason: disabledReason
            })
            return
        }
        setBlockedWarning(undefined)

        if (mode === "xp") {
            const costFunction = getCostFunction()
            const cost = costFunction ? costFunction(clampedLevel) : 0
            capturePipEvent("sheet-pip-edit", {
                field,
                mode,
                fromLevel: level,
                toLevel: clampedLevel,
                xpCost: cost
            })
            setCharacter((currentCharacter) => {
                const update: Partial<Character> = {}
                // TODOdin: Find a way to stop looking for specific things here, and also get better type safety (no "as never")
                if (field === "bloodPotency") {
                    update.bloodPotency = clampedLevel
                } else if (field.startsWith("attributes.")) {
                    const attr = field.split(".")[1]
                    update.attributes = { ...currentCharacter.attributes, [attr]: clampedLevel }
                } else if (field.startsWith("skills.")) {
                    const skill = field.split(".")[1]
                    update.skills = { ...currentCharacter.skills, [skill]: clampedLevel }
                } else {
                    update[field as keyof Character] = clampedLevel as never
                }
                const updatedCharacter = {
                    ...currentCharacter,
                    ...update,
                    ephemeral: {
                        ...currentCharacter.ephemeral,
                        experienceSpent: currentCharacter.ephemeral.experienceSpent + cost
                    }
                }
                // Update health, willpower, blood potency, and humanity when attributes change
                if (field.startsWith("attributes.")) {
                    updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
                }
                return updatedCharacter
            })
            return
        }

        capturePipEvent("sheet-pip-edit", {
            field,
            mode,
            fromLevel: level,
            toLevel: clampedLevel
        })
        setCharacter((currentCharacter) => {
            const update: Partial<Character> = {}
            if (field === "bloodPotency") {
                update.bloodPotency = clampedLevel
            } else if (field.startsWith("attributes.")) {
                const attr = field.split(".")[1]
                update.attributes = { ...currentCharacter.attributes, [attr]: clampedLevel }
            } else if (field.startsWith("skills.")) {
                const skill = field.split(".")[1]
                update.skills = { ...currentCharacter.skills, [skill]: clampedLevel }
            } else {
                update[field as keyof Character] = clampedLevel as never
            }
            const updatedCharacter = {
                ...currentCharacter,
                ...update
            }
            // Update health, willpower, blood potency, and humanity when attributes change
            if (field.startsWith("attributes.")) {
                updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
            }
            return updatedCharacter
        })
    }

    return (
        <Stack gap={2} style={{ position: "relative", overflow: "visible" }}>
            <Group gap={4}>
                {Array.from({ length: maxLevel }, (_, index) => (
                    <PipButton
                        key={index}
                        index={index}
                        filled={index < level}
                        firstChangingIndex={firstChangingIndex}
                        isFilling={isFilling}
                        onClick={readOnly ? undefined : () => handlePipClick(index)}
                        style={
                            (index + 1) % 5 === 0 && index < maxLevel - 1
                                ? { marginRight: 8 }
                                : undefined
                        }
                        options={options}
                        disabledReason={readOnly ? undefined : getDisabledReason(index)}
                        hardDisabled={readOnly || (!!options && !options.canEdit)}
                        xpCost={readOnly ? undefined : getXPCost(index)}
                    />
                ))}
            </Group>
            {blockedWarning ? (
                <Text
                    key={blockedWarning.id}
                    className="pip-blocked-warning"
                    role="status"
                    aria-live="polite"
                    size="xs"
                    c="red.4"
                >
                    {blockedWarning.reason}
                </Text>
            ) : null}
        </Stack>
    )
}

const getMemoCharacterKey = (options?: SheetOptions): string => {
    if (!options) return ""
    const { character } = options
    return [
        options.mode,
        options.primaryColor,
        options.canEdit,
        options.editDisabledReason,
        character.generation,
        character.experience,
        character.ephemeral.experienceSpent
    ].join("|")
}

export default memo(Pips, (prev, next) => {
    return (
        prev.level === next.level &&
        prev.maxLevel === next.maxLevel &&
        prev.minLevel === next.minLevel &&
        prev.field === next.field &&
        prev.readOnly === next.readOnly &&
        prev.onLevelChange === next.onLevelChange &&
        getMemoCharacterKey(prev.options) === getMemoCharacterKey(next.options)
    )
})
