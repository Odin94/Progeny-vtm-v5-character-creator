import { Collapse } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconChevronDown, IconHistory } from "@tabler/icons-react"
import { useRollHistoryStore } from "../../../stores/rollHistoryStore"
import { getRollOutcome } from "../rollOutcome"
import DieGlyphs from "./DieGlyphs"
import classes from "../diceRoller.module.css"

const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

/** Earlier rolls from this visit. The roll currently on the table is left out. */
const RollHistory = ({ currentRollId }: { currentRollId: string | null }) => {
    const entries = useRollHistoryStore((state) => state.entries)
    const [expanded, { toggle }] = useDisclosure(false)
    const earlier = entries.filter((entry) => entry.rollId !== currentRollId)

    if (earlier.length === 0) return null

    return (
        <div className={classes.history}>
            <button
                type="button"
                className={classes.disclosure}
                aria-expanded={expanded}
                onClick={toggle}
            >
                <IconHistory size={14} />
                Earlier rolls
                <span className={classes.disclosureCount}>{earlier.length}</span>
                <IconChevronDown size={14} className={classes.disclosureChevron} />
            </button>
            <Collapse expanded={expanded}>
                <ol className={classes.historyList}>
                    {earlier.map((entry) => {
                        const outcome = getRollOutcome(entry.dice, entry.totalSuccesses)
                        return (
                            <li
                                key={entry.rollId}
                                className={classes.historyItem}
                                data-outcome={outcome.kind}
                            >
                                <span
                                    className={classes.historyTotal}
                                    aria-label={`${entry.totalSuccesses} successes`}
                                >
                                    {entry.totalSuccesses}
                                </span>
                                <span className={classes.historyMain}>
                                    <span className={classes.historyPool}>{entry.poolLabel}</span>
                                    <DieGlyphs dice={entry.dice} size={20} max={14} />
                                </span>
                                <span className={classes.historyMeta}>
                                    {outcome.label ? (
                                        <span className={classes.historyTag}>{outcome.label}</span>
                                    ) : null}
                                    {entry.rerolled ? (
                                        <span className={classes.historyTag}>Rerolled</span>
                                    ) : null}
                                    {formatTime(entry.at)}
                                </span>
                            </li>
                        )
                    })}
                </ol>
            </Collapse>
        </div>
    )
}

export default RollHistory
