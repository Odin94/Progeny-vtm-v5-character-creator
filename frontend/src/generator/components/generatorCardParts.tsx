import { Button } from "@mantine/core"
import { IconCircleCheck, IconLock, IconPlus } from "@tabler/icons-react"
import type { ReactNode } from "react"
import HomebrewBadge from "~/components/HomebrewBadge"
import { DisabledReason, Dots as DotTrack } from "~/components/ui"
import type { HomebrewSource } from "~/data/Homebrew"
import classes from "./generatorCards.module.css"

/**
 * VtM-style dot track (●●○). Purely decorative: pair it with readable text for the value.
 * The dot color follows the `--dot-color` custom property of the nearest ancestor.
 */
export const Dots = ({
    filled,
    total = filled,
    size = "md"
}: {
    filled: number
    total?: number
    size?: "md" | "lg"
}) => <DotTrack filled={filled} total={total} size={size} glow />

export type GrimoireFact = { label: string; value: string; icon?: ReactNode }

/**
 * A ritual / ceremony as a rulebook grimoire entry: title, level dots, italic flavor summary,
 * a facts table and one "Take" action. `lockedReason` dims the entry and explains why it
 * can't be taken; `selected` marks the one already on the character.
 */
export const GrimoireEntry = ({
    name,
    level,
    summary,
    facts,
    homebrewSource,
    selected,
    lockedReason,
    lockedNote,
    onTake
}: {
    name: string
    level: number
    summary: string
    facts: GrimoireFact[]
    homebrewSource?: HomebrewSource
    selected?: boolean
    lockedReason?: string
    lockedNote?: ReactNode
    onTake: () => void
}) => (
    <article
        className={`${classes.entry} ${classes.enter}`}
        data-selected={selected || undefined}
        data-locked={lockedReason ? true : undefined}
    >
        <header className={classes.entryHead}>
            <h3 className={classes.entryTitle}>{name}</h3>
            {homebrewSource ? <HomebrewBadge source={homebrewSource} /> : null}
            <span className={classes.entryLevel}>
                Level {level}
                <Dots filled={level} />
            </span>
        </header>

        <p className={classes.entrySummary}>{summary}</p>

        <dl className={classes.entryFacts}>
            {facts.map((fact) => (
                <div key={fact.label} className={classes.fact}>
                    <dt className={classes.factLabel}>
                        {fact.icon}
                        {fact.label}
                    </dt>
                    <dd className={classes.factValue}>{fact.value || "—"}</dd>
                </div>
            ))}
        </dl>

        <footer className={classes.entryFooter}>
            {lockedNote}
            {selected ? (
                <span className={classes.chosenMark}>
                    <IconCircleCheck size={14} stroke={1.8} />
                    Currently chosen
                </span>
            ) : null}
            <DisabledReason reason={lockedReason}>
                <Button
                    size="xs"
                    variant="light"
                    color="red"
                    fullWidth
                    disabled={Boolean(lockedReason)}
                    leftSection={
                        lockedReason ? (
                            <IconLock size={13} stroke={1.8} />
                        ) : (
                            <IconPlus size={13} stroke={2} />
                        )
                    }
                    onClick={onTake}
                >
                    Take {name}
                </Button>
            </DisabledReason>
        </footer>
    </article>
)

export { classes as generatorCardClasses }
