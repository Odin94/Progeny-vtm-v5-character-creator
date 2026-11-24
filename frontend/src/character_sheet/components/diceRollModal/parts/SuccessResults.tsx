import { Button, Tooltip } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"
import type { CSSProperties } from "react"
import successIcon from "~/resources/diceResults/success.svg"
import criticalIcon from "~/resources/diceResults/critical.svg"
import bloodSuccessIcon from "~/resources/diceResults/blood-success.svg"
import bloodCriticalIcon from "~/resources/diceResults/blood-critical.svg"
import bestialFailureIcon from "~/resources/diceResults/bestial-failure.svg"
import { globals } from "~/globals"
import type { RollOutcome } from "../rollOutcome"
import { RollEffect, RollVignette } from "./RollEffects"
import classes from "../diceRoller.module.css"

type SuccessResult = {
    type: "success" | "critical" | "blood-success" | "blood-critical" | "bestial-failure"
    value: number
}

type SuccessResultsProps = {
    compact?: boolean
    results: SuccessResult[]
    totalSuccesses: number
    primaryColor: string
    outcome: RollOutcome
    onReroll?: () => void
    canReroll?: boolean
    selectedDiceCount?: number
    rerollDisabledReason?: string
    availableWillpower?: number
    maxWillpower?: number
}

const iconFor: Record<SuccessResult["type"], string> = {
    success: successIcon,
    critical: criticalIcon,
    "blood-success": bloodSuccessIcon,
    "blood-critical": bloodCriticalIcon,
    "bestial-failure": bestialFailureIcon
}

const labelFor: Record<SuccessResult["type"], string> = {
    success: "Success",
    critical: "Critical",
    "blood-success": "Hunger success",
    "blood-critical": "Messy critical",
    "bestial-failure": "Bestial failure"
}

const SuccessResults = ({
    compact = false,
    results,
    totalSuccesses,
    primaryColor,
    outcome,
    onReroll,
    canReroll = false,
    selectedDiceCount = 0,
    rerollDisabledReason,
    availableWillpower,
    maxWillpower
}: SuccessResultsProps) => {
    const noWillpower = rerollDisabledReason === "No willpower left to reroll"
    const awaitingSelection = rerollDisabledReason === "Select up to 3 regular dice to reroll"
    const countState = noWillpower
        ? "empty"
        : awaitingSelection
          ? "hint"
          : selectedDiceCount > 0
            ? "selected"
            : undefined
    const countLabel = noWillpower
        ? "No WP left"
        : awaitingSelection
          ? "Tap dice"
          : selectedDiceCount > 0
            ? `${selectedDiceCount}/3`
            : null

    return (
        <section
            className={classes.results}
            data-outcome={outcome.kind}
            data-compact={compact || undefined}
            aria-label="Roll result"
        >
            <RollEffect kind={outcome.kind} />
            <RollVignette kind={outcome.kind} />

            <div className={classes.resultsTop}>
                <div className={classes.total} aria-hidden="true">
                    <span className={classes.totalNumber}>{totalSuccesses}</span>
                    <span className={classes.totalUnit}>
                        {totalSuccesses === 1 ? "success" : "successes"}
                    </span>
                </div>
                {outcome.label ? (
                    <div className={classes.outcome}>
                        <div className={classes.outcomeLabel}>{outcome.label}</div>
                    </div>
                ) : null}
            </div>
            {outcome.detail && !compact ? (
                <div className={classes.outcomeDetail}>{outcome.detail}</div>
            ) : null}
            <span className="pg-visually-hidden" aria-live="polite">
                Total Successes: {totalSuccesses}
            </span>

            {results.length > 0 ? (
                <div className={classes.resultIcons}>
                    {results.map((result, index) => (
                        <img
                            key={index}
                            src={iconFor[result.type]}
                            alt={labelFor[result.type]}
                            title={labelFor[result.type]}
                            className={classes.resultIcon}
                            style={{ "--i": index } as CSSProperties}
                        />
                    ))}
                </div>
            ) : (
                <div className={classes.noSuccesses}>No successes</div>
            )}

            {onReroll ? (
                <div className={classes.reroll}>
                    <div className={classes.rerollText}>
                        <span className={classes.rerollTitle}>
                            Willpower reroll
                            {maxWillpower ? (
                                <span
                                    className={classes.willpowerDots}
                                    role="img"
                                    aria-label={`${availableWillpower ?? 0} of ${maxWillpower} willpower left`}
                                >
                                    {Array.from({ length: maxWillpower }, (_, index) => (
                                        <span
                                            key={index}
                                            className={classes.willpowerDot}
                                            data-filled={
                                                index < (availableWillpower ?? 0) || undefined
                                            }
                                        />
                                    ))}
                                </span>
                            ) : null}
                        </span>
                        {!compact ? (
                            <span className={classes.rerollSub}>Up to 3 regular dice</span>
                        ) : null}
                    </div>
                    {countLabel ? (
                        <span className={classes.rerollCount} data-state={countState}>
                            {countLabel}
                        </span>
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
                            <Button
                                aria-label="Reroll selected dice with willpower"
                                color={canReroll ? "gold" : primaryColor}
                                variant={canReroll ? "filled" : "default"}
                                size="xs"
                                onClick={onReroll}
                                disabled={!canReroll}
                                leftSection={<IconRefresh size={14} />}
                                style={!canReroll ? { pointerEvents: "none" } : undefined}
                            >
                                Reroll
                            </Button>
                        </span>
                    </Tooltip>
                </div>
            ) : null}
        </section>
    )
}

export default SuccessResults
