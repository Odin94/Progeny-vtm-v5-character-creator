import { ScrollArea, Tooltip, UnstyledButton } from "@mantine/core"
import { IconCheck, IconLock } from "@tabler/icons-react"
import { Character } from "../data/Character"
import {
    GeneratorStepId,
    getGeneratorStepIndex,
    getVisibleGeneratorSteps
} from "../generator/steps"
import { isDefault, notDefault } from "../generator/utils"
import { globals } from "../globals"
import { trackEvent } from "../utils/analytics"
import classes from "./AsideBar.module.css"

export type AsideBarProps = {
    selectedStep: GeneratorStepId
    setSelectedStep: (step: GeneratorStepId) => void
    character: Character
}

const ordinal = (n: number) => {
    const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"
    return `${n}${suffix}`
}

/** The choice a finished step stands for, shown under its label ("Brujah", "13th generation"). */
export const getGeneratorStepSummary = (character: Character, stepId: GeneratorStepId) => {
    switch (stepId) {
        case "clan":
            return character.homebrewClan?.name || character.clan || undefined
        case "generation":
            return notDefault(character, "generation")
                ? `${ordinal(character.generation)} generation`
                : undefined
        case "predator-type":
            return character.predatorType.name || undefined
        case "basics":
            return character.name.trim() || undefined
        default:
            return undefined
    }
}

const AsideBar = ({ selectedStep, setSelectedStep, character }: AsideBarProps) => {
    const steps = getVisibleGeneratorSteps(character)
    const activeIndex = getGeneratorStepIndex(character, selectedStep)
    const compact = globals.viewportHeightPx <= 900
    const progress = steps.length > 1 ? Math.max(0, activeIndex) / (steps.length - 1) : 1

    const isHigherLevelAccessible = (character: Character, step: (typeof steps)[number]) => {
        if (step.id === "clan") {
            return true
        }

        if (!step.progressKey) {
            return true
        }

        const progressKeys = steps
            .map((candidateStep) => candidateStep.progressKey)
            .filter((value): value is NonNullable<typeof value> => value !== undefined)
        // A predator type is optional, so an empty selection must not prevent moving on to
        // Basics or returning there after navigating back through the sidebar. Keep it in the
        // predator-type step's own prerequisites so that step is still gated by Generation.
        const stepperKeys =
            step.id === "predator-type"
                ? progressKeys
                : progressKeys.filter((progressKey) => progressKey !== "predatorType")
        const index = Math.max(0, stepperKeys.indexOf(step.progressKey) - 1)

        for (let i = index; i < stepperKeys.length; i++) {
            if (!isDefault(character, stepperKeys[i])) return true
        }
        return false
    }

    return (
        <nav
            className={`${classes.root} ${compact ? classes.compact : ""}`}
            aria-label="Character creation steps"
        >
            <div className={classes.head}>
                <span className={classes.eyebrow}>The Embrace</span>
                <div className={classes.progressText}>
                    Step {activeIndex + 1}
                    <span className={classes.progressOf}>of {steps.length}</span>
                </div>
                <div className={classes.track} aria-hidden="true">
                    <div
                        className={classes.trackFill}
                        style={{ transform: `scaleX(${Math.max(0.04, progress)})` }}
                    />
                </div>
            </div>

            <ScrollArea type="auto" offsetScrollbars scrollbarSize={8} style={{ flex: 1 }}>
                <ol className={classes.list}>
                    {steps.map((step, index) => {
                        const isCurrent = step.id === selectedStep
                        const isCompleted = index < activeIndex
                        const isAccessible = isHigherLevelAccessible(character, step)
                        const state = isCurrent
                            ? "current"
                            : isCompleted
                              ? "complete"
                              : isAccessible
                                ? "upcoming"
                                : "locked"
                        const summary = getGeneratorStepSummary(character, step.id)

                        const button = (
                            <UnstyledButton
                                data-testid={`generator-step-${step.id}`}
                                className={classes.step}
                                data-state={state}
                                aria-current={isCurrent ? "step" : undefined}
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
                            >
                                <span className={classes.node} aria-hidden="true">
                                    <span className={classes.nodeContent}>
                                        {isCompleted && !isCurrent ? (
                                            <IconCheck size={14} stroke={2.4} />
                                        ) : !isAccessible && !isCurrent ? (
                                            <IconLock size={12} stroke={2} />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                </span>
                                <span className={classes.text}>
                                    <span className={classes.label}>{step.label}</span>
                                    {summary && (isCompleted || isCurrent) ? (
                                        <span className={classes.meta}>{summary}</span>
                                    ) : null}
                                </span>
                            </UnstyledButton>
                        )

                        return (
                            <li key={step.id} className={classes.item} data-state={state}>
                                {isAccessible ? (
                                    button
                                ) : (
                                    <Tooltip label="Finish the earlier steps first" position="left">
                                        <span className={classes.stepTooltipTarget} tabIndex={0}>
                                            {button}
                                        </span>
                                    </Tooltip>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </ScrollArea>
        </nav>
    )
}

export default AsideBar
