import { Group } from "@mantine/core"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { memo, useEffect, useRef, useState } from "react"
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
    const [isDiceBoardScrolling, setIsDiceBoardScrolling] = useState(false)
    const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const { dice, activeTab } = useDiceRollModalStore(
        useShallow((state) => ({
            dice: state.dice,
            activeTab: state.activeTab
        }))
    )

    useEffect(() => {
        return () => {
            if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current)
        }
    }, [])

    const handleDiceBoardScroll = () => {
        setIsDiceBoardScrolling(true)
        if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current)
        scrollIdleTimeoutRef.current = setTimeout(() => setIsDiceBoardScrolling(false), 700)
    }

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

    const dieSize = 100
    const diceGap = 10
    const maxDicePerRow = 4
    // The 3D faces extend past the Die component's 100px layout box. Reserve room so
    // the top and bottom faces are entirely inside the scrollable board.
    const boardInset = 60
    const totalRows = Math.max(1, Math.ceil(dice.length / maxDicePerRow))
    const diceGridWidth =
        Math.min(Math.max(dice.length, 1), maxDicePerRow) * (dieSize + diceGap) - diceGap
    const diceGridHeight = totalRows * (dieSize + diceGap) - diceGap
    const boardWidth = diceGridWidth + boardInset * 2
    // This must grow with the number of rows. Previously the dice were centered in a
    // fixed-height absolute-positioning board, which put the first row above scrollTop 0.
    const boardHeight = Math.max(250, diceGridHeight + boardInset * 2)

    return (
        <Group
            data-testid="dice-results-scroll-area"
            className={`dice-results-scroll-area${isDiceBoardScrolling ? " dice-results-scroll-area--scrolling" : ""}`}
            onScroll={handleDiceBoardScroll}
            justify="center"
            gap="md"
            style={{
                flex: activeTab === "selected" ? "1 1 380px" : "1 1 480px",
                maxHeight: activeTab === "selected" ? "380px" : "480px",
                minHeight: activeTab === "selected" ? "80px" : "270px",
                flexWrap: "wrap",
                position: "relative",
                // Dice are positioned absolutely for their entrance animation, so a large
                // pool can extend beyond this intentionally compact board. Keep that
                // overflow reachable for reroll selection on both mouse and touch devices.
                overflowX: "hidden",
                overflowY: "auto",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
                alignItems: "flex-start"
            }}
        >
            <div
                data-testid="dice-results-content"
                style={{
                    position: "relative",
                    width: `${boardWidth}px`,
                    height: `${boardHeight}px`,
                    flex: "0 0 auto"
                }}
            >
                <AnimatePresence initial={false}>
                    {dice.map((die, index) => {
                        const seed = die.id % 1000
                        const random = () => {
                            const x = Math.sin(seed) * 10000
                            return x - Math.floor(x)
                        }

                        const row = Math.floor(index / maxDicePerRow)
                        const col = index % maxDicePerRow
                        const finalX = col * (dieSize + diceGap) + boardInset - boardWidth / 2
                        const finalY = row * (dieSize + diceGap) + boardInset - boardHeight / 2

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
                                        !die.isBloodDie &&
                                        !die.isRolling &&
                                        onDieClick !== undefined
                                    }
                                    ariaLabel={`${die.isBloodDie ? "Hunger" : "Regular"} die ${index + 1} showing ${die.value === 10 ? "0" : die.value}`}
                                />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </Group>
    )
}

export default memo(DiceContainer)
