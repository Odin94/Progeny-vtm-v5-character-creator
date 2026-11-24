import { ActionIcon, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDroplet } from "@tabler/icons-react"
import { memo, useState } from "react"
import posthog from "posthog-js"
import { Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import classes from "../sheet.module.css"
import { useSessionChat } from "~/hooks/useSessionChat"
import { getAutoShareDiceRolls } from "~/utils/chatSettings"

type RouseCheckButtonProps = {
    character?: Character
    setCharacter?: SetCharacter
    primaryColor: string
    size?: "sm" | "md" | "lg" | "xl"
    iconSize?: number
    tooltipZIndex?: number
    onRouseCheck?: (roll: number, success: boolean) => void
    disabledReason?: string
    showHungerInTooltip?: boolean
}

const RouseCheckButton = ({
    character,
    setCharacter,
    primaryColor,
    size = "sm",
    iconSize = 16,
    tooltipZIndex,
    onRouseCheck,
    disabledReason,
    showHungerInTooltip = false
}: RouseCheckButtonProps) => {
    const [animationKey, setAnimationKey] = useState(0)
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null)
    const { sendRouseCheck, sessionId, connectionStatus } = useSessionChat((state) => ({
        sendRouseCheck: state.sendRouseCheck,
        sessionId: state.sessionId,
        connectionStatus: state.connectionStatus
    }))

    const handleRouseCheck = () => {
        if (!character || !setCharacter || disabledReason) return

        const hunger = character.ephemeral?.hunger ?? 0
        const roll = Math.floor(Math.random() * 10) + 1
        const success = roll >= 6
        setIsSuccess(success)
        setAnimationKey((prev) => prev + 1)

        let newHunger = hunger
        if (!success) {
            newHunger = Math.min(hunger + 1, 5)
            setCharacter((current) => ({
                ...current,
                ephemeral: {
                    ...current.ephemeral,
                    hunger: newHunger
                }
            }))
        }

        let message = `Rouse Check: ${roll}`

        if (!success) {
            message += ". Hunger increased"
        } else {
            message += ". Passed."
        }

        notifications.show({
            message,
            color: success ? primaryColor : "red"
        })

        try {
            posthog.capture("rouse-check", {
                roll,
                success,
                hunger_before: hunger,
                hunger_after: newHunger
            })
        } catch (error) {
            console.warn("PostHog rouse-check tracking failed:", error)
        }

        const autoShareDiceRolls = getAutoShareDiceRolls()
        if (autoShareDiceRolls && connectionStatus === "connected" && sessionId) {
            const characterName = character?.name || undefined
            sendRouseCheck(roll, success, newHunger, characterName)
        }

        onRouseCheck?.(roll, success)
    }

    if (!character || !setCharacter) {
        return null
    }

    const hunger = character.ephemeral?.hunger ?? 0
    const isDisabled = !!disabledReason || hunger >= 5

    return (
        <Tooltip
            label={
                disabledReason ??
                (hunger >= 5
                    ? "Cannot rouse check at hunger 5"
                    : `Roll rouse check${showHungerInTooltip ? ` (${hunger}/5)` : ""}`)
            }
            zIndex={tooltipZIndex}
        >
            <span className={classes.disabledWrap}>
                <ActionIcon
                    size={size}
                    variant="light"
                    onClick={handleRouseCheck}
                    color="red"
                    disabled={isDisabled}
                    aria-label="Rouse check"
                >
                    <span
                        key={animationKey}
                        className={classes.rollIcon}
                        data-result={isSuccess === null ? undefined : isSuccess ? "pass" : "fail"}
                    >
                        <IconDroplet size={iconSize} stroke={1.8} />
                    </span>
                </ActionIcon>
            </span>
        </Tooltip>
    )
}

export default memo(RouseCheckButton, (previous, next) => {
    return (
        previous.character?.name === next.character?.name &&
        previous.character?.ephemeral.hunger === next.character?.ephemeral.hunger &&
        previous.setCharacter === next.setCharacter &&
        previous.primaryColor === next.primaryColor &&
        previous.size === next.size &&
        previous.iconSize === next.iconSize &&
        previous.tooltipZIndex === next.tooltipZIndex &&
        previous.onRouseCheck === next.onRouseCheck &&
        previous.disabledReason === next.disabledReason &&
        previous.showHungerInTooltip === next.showHungerInTooltip
    )
})
