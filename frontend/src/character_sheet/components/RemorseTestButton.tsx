import { ActionIcon, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconHeartHandshake } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { useState } from "react"
import posthog from "posthog-js"
import { Character } from "~/data/Character"
import { vtmRed } from "../utils/style"

type RemorseTestButtonProps = {
    character?: Character
    setCharacter?: (character: Character) => void
    primaryColor: string
    size?: "sm" | "md" | "lg" | "xl"
    iconSize?: number
    tooltipZIndex?: number
    onRemorseTest?: (rolls: number[], successes: number, passed: boolean) => void
}

const RemorseTestButton = ({
    character,
    setCharacter,
    primaryColor,
    size = "sm",
    iconSize = 16,
    tooltipZIndex,
    onRemorseTest
}: RemorseTestButtonProps) => {
    const [animationKey, setAnimationKey] = useState(0)
    const [isSuccess, setIsSuccess] = useState(true)

    const handleRemorseTest = () => {
        if (!character || !setCharacter) return

        const humanityStains = character.ephemeral?.humanityStains ?? 0
        const maxStains = 10 - character.humanity
        const unmarkedStains = maxStains - humanityStains
        const diceCount = Math.max(1, unmarkedStains)

        const rolls: number[] = []
        let successes = 0

        for (let i = 0; i < diceCount; i++) {
            const roll = Math.floor(Math.random() * 10) + 1
            rolls.push(roll)
            if (roll >= 6) {
                successes++
            }
        }

        const passed = successes > 0
        setIsSuccess(passed)
        setAnimationKey((prev) => prev + 1)

        const newHumanityStains = 0
        let newHumanity = character.humanity

        if (!passed) {
            newHumanity = Math.max(0, character.humanity - 1)
        }

        setCharacter({
            ...character,
            humanity: newHumanity,
            ephemeral: {
                ...character.ephemeral,
                humanityStains: newHumanityStains,
            },
        })

        const rollsText = rolls.join(", ")
        let message = `Remorse Test: [${rollsText}] - ${successes} ${successes === 1 ? "success" : "successes"}`

        if (!passed) {
            message += ". Humanity decreased to " + newHumanity
        } else {
            message += ". Stains cleared."
        }

        notifications.show({
            message,
            color: passed ? primaryColor : "red",
        })

        try {
            posthog.capture("remorse-test", {
                rolls,
                successes,
                passed,
                humanity_before: character.humanity,
                humanity_after: newHumanity,
                stains_before: humanityStains,
                stains_after: newHumanityStains,
            })
        } catch (error) {
            console.warn("PostHog remorse-test tracking failed:", error)
        }

        onRemorseTest?.(rolls, successes, passed)
    }

    if (!character || !setCharacter) {
        return null
    }

    const humanityStains = character.ephemeral?.humanityStains ?? 0
    const maxStains = 10 - character.humanity
    const unmarkedStains = maxStains - humanityStains
    const diceCount = Math.max(1, unmarkedStains)
    const isDisabled = diceCount === 0 || humanityStains === 0

    return (
        <Tooltip
            label={isDisabled ? "No stains to test" : `Roll remorse test (${diceCount} ${diceCount === 1 ? "die" : "dice"})`}
            zIndex={tooltipZIndex}
        >
            <ActionIcon
                size={size}
                variant="subtle"
                onClick={handleRemorseTest}
                color={vtmRed}
                disabled={isDisabled}
            >
                <motion.div
                    key={animationKey}
                    animate={isSuccess ? {
                        rotate: [0, -6, 6, -3, 3, 0],
                        y: [0, 2, -2, 0],
                    } : {
                        x: [0, -2, 2, -2, 2, 0],
                        rotate: [0, -8, 8, 0],
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                    }}
                    style={{ display: "inline-block" }}
                >
                    <IconHeartHandshake size={iconSize} />
                </motion.div>
            </ActionIcon>
        </Tooltip>
    )
}

export default RemorseTestButton
