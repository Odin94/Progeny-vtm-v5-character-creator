import { Box, ScrollArea, Stack, Text, UnstyledButton } from "@mantine/core"
import { IconCheck } from "@tabler/icons-react"
import { Character } from "../data/Character"
import {
    GeneratorStepId,
    getGeneratorStepIndex,
    getVisibleGeneratorSteps
} from "../generator/steps"
import { isDefault } from "../generator/utils"
import { globals } from "../globals"
import { RAW_GRAPE, rgba } from "../theme/colors"
import { trackEvent } from "../utils/analytics"

export type AsideBarProps = {
    selectedStep: GeneratorStepId
    setSelectedStep: (step: GeneratorStepId) => void
    character: Character
}

const AsideBar = ({ selectedStep, setSelectedStep, character }: AsideBarProps) => {
    const steps = getVisibleGeneratorSteps(character)
    const activeIndex = getGeneratorStepIndex(character, selectedStep)
    const compact = globals.viewportHeightPx <= 900

    const isHigherLevelAccessible = (character: Character, step: (typeof steps)[number]) => {
        if (step.id === "clan") {
            return true
        }

        if (!step.progressKey) {
            return true
        }

        const stepperKeys = steps
            .map((candidateStep) => candidateStep.progressKey)
            .filter((value): value is NonNullable<typeof value> => value !== undefined)
        const index = Math.max(0, stepperKeys.indexOf(step.progressKey) - 1)

        for (let i = index; i < stepperKeys.length; i++) {
            if (!isDefault(character, stepperKeys[i])) return true
        }
        return false
    }

    const getStagesList = () => {
        return (
            <Stack gap={0}>
                {!compact && (
                    <Text
                        size="sm"
                        fw={600}
                        style={{
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "var(--mantine-color-dimmed)",
                            marginBottom: "1rem"
                        }}
                    >
                        Stages
                    </Text>
                )}
                {steps.map((step, index) => {
                    const isCurrent = step.id === selectedStep
                    const isCompleted = index < activeIndex
                    const isAccessible = isHigherLevelAccessible(character, step)
                    const isLast = index === steps.length - 1

                    return (
                        <Box key={step.id}>
                            <UnstyledButton
                                onClick={() => {
                                    if (!isAccessible) return
                                    // Track jumps back to an earlier step so abandonment that
                                    // starts with re-editing a previous step is measurable.
                                    if (index < activeIndex) {
                                        trackEvent({
                                            action: "generator step back navigation",
                                            category: "generator",
                                            label: `${selectedStep} -> ${step.id}`
                                        })
                                    }
                                    setSelectedStep(step.id)
                                }}
                                disabled={!isAccessible}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: compact ? "0.375rem 0.5rem" : "0.5rem 0.625rem",
                                    borderRadius: "0.5rem",
                                    cursor: isAccessible ? "pointer" : "default",
                                    transition: "background-color 150ms ease",
                                    backgroundColor: isCurrent
                                        ? "rgba(190, 75, 219, 0.12)"
                                        : "transparent",
                                    border: isCurrent
                                        ? "1px solid rgba(190, 75, 219, 0.3)"
                                        : "1px solid transparent",
                                    opacity: !isAccessible && !isCurrent && !isCompleted ? 0.4 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrent && isAccessible) {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(255, 255, 255, 0.05)"
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrent) {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                    }
                                }}
                            >
                                <Box
                                    style={{
                                        width: "1.875rem",
                                        height: "1.875rem",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        transition: "all 200ms ease",
                                        ...(isCurrent
                                            ? {
                                                  backgroundColor: "var(--mantine-color-grape-6)",
                                                  color: "white",
                                                  boxShadow: "0 0 10px rgba(190, 75, 219, 0.4)"
                                              }
                                            : isCompleted
                                              ? {
                                                    backgroundColor: "rgba(212, 175, 55, 0.2)",
                                                    color: "rgb(212, 175, 55)",
                                                    border: "1px solid rgba(212, 175, 55, 0.3)"
                                                }
                                              : {
                                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                                    color: "var(--mantine-color-dimmed)",
                                                    border: "1px solid rgba(255, 255, 255, 0.15)"
                                                })
                                    }}
                                >
                                    {isCompleted && !isCurrent ? (
                                        <IconCheck size={12} />
                                    ) : (
                                        index + 1
                                    )}
                                </Box>

                                <Text
                                    size="sm"
                                    style={{
                                        color: isCurrent
                                            ? "var(--mantine-color-text)"
                                            : "var(--mantine-color-dimmed)",
                                        fontWeight: isCurrent ? 500 : 400,
                                        lineHeight: 1.2,
                                        transition: "color 150ms ease"
                                    }}
                                >
                                    {step.label}
                                </Text>
                            </UnstyledButton>

                            {!isLast && (
                                <Box style={{ marginLeft: "23px" }}>
                                    <Box
                                        style={{
                                            width: "1px",
                                            height: compact ? "0.875rem" : "1.375rem",
                                            backgroundColor: isCompleted
                                                ? "rgba(212, 175, 55, 0.3)"
                                                : "rgba(255, 255, 255, 0.1)"
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )
                })}
            </Stack>
        )
    }

    return (
        <Stack gap="md" style={{ padding: "0.5rem 0", zIndex: 0, height: "100%", minHeight: 0 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    flex: 1,
                    minHeight: 0,
                    width: "100%"
                }}
            >
                <ScrollArea
                    h="100%"
                    w="100%"
                    type="auto"
                    offsetScrollbars
                    scrollbarSize={8}
                    styles={{
                        scrollbar: {
                            background: "transparent"
                        },
                        thumb: {
                            background: rgba(RAW_GRAPE, 0.38),
                            borderRadius: "999px",
                            transition: "background 140ms ease",
                            "&:hover": {
                                background: rgba(RAW_GRAPE, 0.62)
                            },
                            "&:active": {
                                background: rgba(RAW_GRAPE, 0.8)
                            }
                        },
                        corner: {
                            background: "transparent"
                        }
                    }}
                >
                    {getStagesList()}
                </ScrollArea>
            </div>
        </Stack>
    )
}

export default AsideBar
