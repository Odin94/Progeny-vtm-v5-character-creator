import { Group } from "@mantine/core"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { memo } from "react"
import Die from "./Die"
import { useDiceRollModalStore } from "../../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import { vtmRed } from "~/character_sheet/utils/style"

export type DieResult = {
    id: number
    value: number
    isRolling: boolean
    isBloodDie: boolean
}

type DiceContainerProps = {
    primaryColor: string
    onDieClick?: (dieId: number, isBloodDie: boolean) => void
    selectedDiceIds?: Set<number>
    isMobile?: boolean
}

const DiceContainer = ({
    primaryColor,
    onDieClick,
    selectedDiceIds = new Set(),
    isMobile = false
}: DiceContainerProps) => {
    const shouldReduceMotion = useReducedMotion()
    const { dice, activeTab } = useDiceRollModalStore(
        useShallow((state) => ({
            dice: state.dice,
            activeTab: state.activeTab
        }))
    )

    if (isMobile) {
        return (
            <Group
                justify="center"
                gap="xs"
                wrap="wrap"
                style={{ minHeight: dice.length > 0 ? "50px" : 0, flexShrink: 0 }}
            >
                <AnimatePresence initial={false}>
                    {dice.map((die, index) => (
                        <Die
                            key={die.id}
                            value={die.value}
                            isRolling={die.isRolling}
                            primaryColor={die.isBloodDie ? vtmRed : primaryColor}
                            onClick={() => onDieClick?.(die.id, die.isBloodDie)}
                            isSelected={selectedDiceIds.has(die.id)}
                            isSelectable={
                                !die.isBloodDie && !die.isRolling && onDieClick !== undefined
                            }
                            animateAppearance={false}
                            keepRollCentered
                            ariaLabel={`${die.isBloodDie ? "Hunger" : "Regular"} die ${index + 1} showing ${die.value === 10 ? "0" : die.value}`}
                        />
                    ))}
                </AnimatePresence>
            </Group>
        )
    }

    return (
        <Group
            justify="center"
            gap="md"
            style={{
                flex: activeTab === "selected" ? "1 1 380px" : "1 1 480px",
                maxHeight: activeTab === "selected" ? "380px" : "480px",
                minHeight: activeTab === "selected" ? "80px" : "270px",
                flexWrap: "wrap",
                position: "relative",
                overflow: "hidden",
                alignItems: "center"
            }}
        >
            <AnimatePresence initial={false}>
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
                    const maxDicePerRow = Math.max(
                        1,
                        Math.floor((containerWidth - dieSize) / (dieSize + gap))
                    )
                    const row = Math.floor(index / maxDicePerRow)
                    const col = index % maxDicePerRow
                    const totalRows = Math.ceil(dice.length / maxDicePerRow)

                    const totalWidth = Math.min(dice.length, maxDicePerRow) * (dieSize + gap) - gap
                    const totalHeight = totalRows * (dieSize + gap) - gap

                    const startX = (containerWidth - totalWidth) / 2
                    const startY = (containerHeight - totalHeight) / 2

                    const finalX =
                        startX + col * (dieSize + gap) + dieSize / 2 - containerWidth / 2 - 30
                    const finalY =
                        startY + row * (dieSize + gap) + dieSize / 2 - containerHeight / 2 - 30

                    const randomOffset = random() > 0.5 ? 800 : -800
                    const randomOffsetX = (random() - 0.5) * 2000 + randomOffset
                    const randomOffsetY = (random() - 0.5) * 400
                    const randomRotationZ = random() * 360
                    const randomDelay = index * 0.1 + random() * 0.2
                    const randomStiffness = 100 + random() * 50
                    const randomDamping = 15 + random() * 10
                    const randomDuration = 0.8 + random() * 0.4
                    const finalTransform = `translate3d(${finalX}px, ${finalY}px, 0) rotateZ(0deg) scale(1)`
                    const offsetTransform = `translate3d(${finalX + randomOffsetX}px, ${finalY + randomOffsetY}px, 0) rotateZ(${randomRotationZ}deg) scale(0.9)`
                    const exitTransform = `translate3d(${finalX + randomOffsetX}px, ${finalY + randomOffsetY}px, 0) rotateZ(${randomRotationZ}deg) scale(0.95)`

                    return (
                        <motion.div
                            key={die.id}
                            initial={{
                                opacity: 0,
                                transform: shouldReduceMotion ? finalTransform : offsetTransform
                            }}
                            animate={{
                                opacity: 1,
                                transform: finalTransform
                            }}
                            exit={{
                                opacity: 0,
                                transform: shouldReduceMotion ? finalTransform : exitTransform,
                                transition: {
                                    duration: shouldReduceMotion ? 0.12 : 0.2,
                                    ease: [0.23, 1, 0.32, 1]
                                }
                            }}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0.12 }
                                    : {
                                          type: "spring",
                                          stiffness: randomStiffness,
                                          damping: randomDamping,
                                          delay: randomDelay,
                                          duration: randomDuration
                                      }
                            }
                            style={{
                                display: "inline-block",
                                position: "absolute",
                                left: "50%",
                                top: "50%"
                            }}
                        >
                            <Die
                                value={die.value}
                                isRolling={die.isRolling}
                                primaryColor={die.isBloodDie ? vtmRed : primaryColor}
                                animationDelay={randomDelay}
                                seed={seed}
                                onClick={() => onDieClick?.(die.id, die.isBloodDie)}
                                isSelected={selectedDiceIds.has(die.id)}
                                isSelectable={
                                    !die.isBloodDie && !die.isRolling && onDieClick !== undefined
                                }
                                ariaLabel={`${die.isBloodDie ? "Hunger" : "Regular"} die ${index + 1} showing ${die.value === 10 ? "0" : die.value}`}
                            />
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </Group>
    )
}

export default memo(DiceContainer)
