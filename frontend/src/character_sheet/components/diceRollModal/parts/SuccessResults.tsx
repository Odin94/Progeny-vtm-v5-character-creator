import { Box, Group, Stack, Text, useMantineTheme, ActionIcon, Tooltip, Badge } from "@mantine/core"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { IconRefresh } from "@tabler/icons-react"
import successIcon from "~/resources/diceResults/success.svg"
import criticalIcon from "~/resources/diceResults/critical.svg"
import bloodSuccessIcon from "~/resources/diceResults/blood-success.svg"
import bloodCriticalIcon from "~/resources/diceResults/blood-critical.svg"
import bestialFailureIcon from "~/resources/diceResults/bestial-failure.svg"
import { globals } from "~/globals"

type SuccessResult = {
    type: "success" | "critical" | "blood-success" | "blood-critical" | "bestial-failure"
    value: number
}

type SuccessResultsProps = {
    results: SuccessResult[]
    totalSuccesses: number
    primaryColor: string
    onReroll?: () => void
    canReroll?: boolean
    selectedDiceCount?: number
    rerollDisabledReason?: string
}

const SuccessResults = ({
    results,
    totalSuccesses,
    primaryColor,
    onReroll,
    canReroll = false,
    selectedDiceCount = 0,
    rerollDisabledReason
}: SuccessResultsProps) => {
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const totalSuccessesRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [showCountInHeadline, setShowCountInHeadline] = useState(false)

    useEffect(() => {
        const checkVisibility = () => {
            if (!totalSuccessesRef.current || !containerRef.current) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const totalSuccessesRect = totalSuccessesRef.current.getBoundingClientRect()

            const isVisible =
                totalSuccessesRect.top >= containerRect.top &&
                totalSuccessesRect.bottom <= containerRect.bottom

            setShowCountInHeadline(!isVisible)
        }

        checkVisibility()
        const observer = new ResizeObserver(checkVisibility)
        const mutationObserver = new MutationObserver(checkVisibility)

        if (containerRef.current) {
            observer.observe(containerRef.current)
            mutationObserver.observe(containerRef.current, {
                childList: true,
                subtree: true
            })
        }

        window.addEventListener("scroll", checkVisibility, true)
        window.addEventListener("resize", checkVisibility)

        return () => {
            observer.disconnect()
            mutationObserver.disconnect()
            window.removeEventListener("scroll", checkVisibility, true)
            window.removeEventListener("resize", checkVisibility)
        }
    }, [results])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.5
            }}
            style={{ flexShrink: 0, marginTop: "auto" }}
        >
            <Box
                ref={containerRef}
                style={{
                    border: `1px solid ${colorValue}`,
                    borderRadius: "8px",
                    padding: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    minHeight: "150px",
                    maxHeight: "150px",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    overflow: "hidden"
                }}
            >
                <Stack gap="sm" style={{ flex: 1 }}>
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Text fw={700} fz="md" c={primaryColor} style={{ flex: 1 }}>
                            Successes{showCountInHeadline ? `: ${totalSuccesses}` : ":"}
                        </Text>
                        {onReroll ? (
                            <Group gap="xs" wrap="nowrap">
                                {rerollDisabledReason === "No willpower left to reroll" ? (
                                    <Badge size="sm" variant="outline" color="gray">
                                        No WP left
                                    </Badge>
                                ) : rerollDisabledReason ===
                                  "Select up to 3 regular dice to reroll" ? (
                                    <Badge size="sm" variant="outline" color={primaryColor}>
                                        Tap dice
                                    </Badge>
                                ) : selectedDiceCount > 0 ? (
                                    <Badge size="sm" variant="filled" color={primaryColor}>
                                        {selectedDiceCount}/3
                                    </Badge>
                                ) : null}
                                <Tooltip
                                    label={
                                        rerollDisabledReason ??
                                        (selectedDiceCount > 0
                                            ? `Reroll ${selectedDiceCount} dice (1 willpower)`
                                            : "Select up to 3 regular dice to reroll (1 willpower)")
                                    }
                                    zIndex={2100}
                                    events={globals.tooltipTriggerEvents}
                                >
                                    <span style={{ display: "inline-flex" }}>
                                        <ActionIcon
                                            aria-label="Reroll selected dice with willpower"
                                            color={primaryColor}
                                            variant={canReroll ? "filled" : "outline"}
                                            onClick={onReroll}
                                            disabled={!canReroll}
                                            size="sm"
                                            style={
                                                !canReroll ? { pointerEvents: "none" } : undefined
                                            }
                                        >
                                            <IconRefresh size={16} />
                                        </ActionIcon>
                                    </span>
                                </Tooltip>
                            </Group>
                        ) : null}
                    </Group>
                    {results.length > 0 ? (
                        <>
                            <Group gap="xs" wrap="wrap">
                                {results.map((result, index) => {
                                    let iconSrc: string
                                    switch (result.type) {
                                        case "success":
                                            iconSrc = successIcon
                                            break
                                        case "critical":
                                            iconSrc = criticalIcon
                                            break
                                        case "blood-success":
                                            iconSrc = bloodSuccessIcon
                                            break
                                        case "blood-critical":
                                            iconSrc = bloodCriticalIcon
                                            break
                                        case "bestial-failure":
                                            iconSrc = bestialFailureIcon
                                            break
                                    }
                                    return (
                                        <motion.img
                                            key={index}
                                            src={iconSrc}
                                            alt={result.type}
                                            style={{ width: "40px", height: "40px" }}
                                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 20,
                                                delay: index * 0.05
                                            }}
                                        />
                                    )
                                })}
                            </Group>
                            <Text ref={totalSuccessesRef} fw={600} fz="lg">
                                Total Successes: {totalSuccesses}
                            </Text>
                        </>
                    ) : (
                        <Text c="dimmed">No successes</Text>
                    )}
                </Stack>
            </Box>
        </motion.div>
    )
}

export default SuccessResults
