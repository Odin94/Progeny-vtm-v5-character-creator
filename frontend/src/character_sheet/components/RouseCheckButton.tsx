import { ActionIcon, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDroplet } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Character } from "~/data/Character"
import { vtmRed } from "../utils/style"

type RouseCheckButtonProps = {
    character?: Character
    setCharacter?: (character: Character) => void
    primaryColor: string
    size?: "sm" | "md" | "lg" | "xl"
    iconSize?: number
    tooltipZIndex?: number
}

const RouseCheckButton = ({
    character,
    setCharacter,
    primaryColor,
    size = "sm",
    iconSize = 16,
    tooltipZIndex
}: RouseCheckButtonProps) => {
    const [animationKey, setAnimationKey] = useState(0)
    const [isSuccess, setIsSuccess] = useState(true)

    const handleRouseCheck = () => {
        if (!character || !setCharacter) return

        const hunger = character.ephemeral?.hunger ?? 0
        const roll = Math.floor(Math.random() * 10) + 1
        const success = roll >= 6
        setIsSuccess(success)
        setAnimationKey((prev) => prev + 1)

        let message = `Rouse Check: ${roll}`

        if (!success) {
            const newHunger = Math.min(hunger + 1, 5)
            setCharacter({
                ...character,
                ephemeral: {
                    ...character.ephemeral,
                    hunger: newHunger,
                },
            })
            message += ". Hunger increased"
        } else {
            message += ". Passed."
        }

        notifications.show({
            message,
            color: success ? primaryColor : "red",
        })
    }

    if (!character || !setCharacter) {
        return null
    }

    const hunger = character.ephemeral?.hunger ?? 0
    const isDisabled = hunger >= 5
    console.log({ hunger, isDisabled })

    return (
        <Tooltip
            label={isDisabled ? "Cannot rouse check at hunger 5" : "Roll rouse check"}
            zIndex={tooltipZIndex}
        >
            <ActionIcon
                size={size}
                variant="subtle"
                onClick={handleRouseCheck}
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

                    <IconDroplet size={iconSize} />
                </motion.div>
            </ActionIcon>
        </Tooltip>
    )
}

export default RouseCheckButton
