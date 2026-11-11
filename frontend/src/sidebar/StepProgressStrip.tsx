import { UnstyledButton } from "@mantine/core"
import { IconChevronDown } from "@tabler/icons-react"
import type { Character } from "../data/Character"
import { type GeneratorStepId, getVisibleGeneratorSteps } from "../generator/steps"
import classes from "./AsideBar.module.css"

export const STEP_PROGRESS_STRIP_HEIGHT = 56

type StepProgressStripProps = {
    character: Character
    selectedStep: GeneratorStepId
    stepsOpen: boolean
    onToggleSteps: () => void
}

/**
 * Small-screen counterpart of the stepper: current step + segmented progress. Tapping it opens
 * the full step list drawer.
 */
const StepProgressStrip = ({
    character,
    selectedStep,
    stepsOpen,
    onToggleSteps
}: StepProgressStripProps) => {
    const steps = getVisibleGeneratorSteps(character)
    const activeIndex = steps.findIndex((step) => step.id === selectedStep)
    const current = steps[activeIndex]

    return (
        <UnstyledButton
            className={classes.strip}
            style={{ height: STEP_PROGRESS_STRIP_HEIGHT }}
            data-open={stepsOpen || undefined}
            aria-expanded={stepsOpen}
            aria-label={`Step ${activeIndex + 1} of ${steps.length}: ${current?.label ?? ""}. ${
                stepsOpen ? "Hide" : "Show"
            } all steps`}
            onClick={(event) => {
                // The canvas behind closes the drawer on click; keep this toggle self-contained.
                event.stopPropagation()
                onToggleSteps()
            }}
        >
            <span className={classes.stripRow}>
                <span className={classes.stripCount}>
                    {activeIndex + 1} / {steps.length}
                </span>
                <span className={classes.stripLabel}>{current?.label}</span>
                <span className={classes.stripAction}>
                    Steps
                    <IconChevronDown size={14} className={classes.stripChevron} />
                </span>
            </span>
            <span className={classes.segments} aria-hidden="true">
                {steps.map((step, index) => (
                    <span
                        key={step.id}
                        className={classes.segment}
                        data-state={
                            index < activeIndex
                                ? "complete"
                                : index === activeIndex
                                  ? "current"
                                  : undefined
                        }
                    />
                ))}
            </span>
        </UnstyledButton>
    )
}

export default StepProgressStrip
