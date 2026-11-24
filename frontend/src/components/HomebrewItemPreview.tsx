import { memo, type ReactNode } from "react"
import { IconDropletFilled } from "@tabler/icons-react"
import type { HomebrewClan, HomebrewItem, HomebrewMeritFlaw, HomebrewPower } from "~/data/Homebrew"
import { homebrewKindLabel } from "~/data/Homebrew"
import HomebrewPredatorTypePreview from "~/components/HomebrewPredatorTypePreview"
import HomebrewLoresheetPreview from "~/components/HomebrewLoresheetPreview"
import { CostPips, DotPips, HomebrewKindIcon } from "~/components/HomebrewCodex"
import "./HomebrewPreview.css"

const titleCase = (value: string) => value.replace(/\b\w/g, (character) => character.toUpperCase())

const Stat = ({
    label,
    children,
    wide
}: {
    label: string
    children: ReactNode
    wide?: boolean
}) => (
    <div className="hb-entry__stat" data-wide={wide || undefined}>
        <dt>{label}</dt>
        <dd>{children}</dd>
    </div>
)

const TagList = ({ values, empty = "None" }: { values: string[]; empty?: string }) =>
    values.length ? (
        <span className="hb-entry__tags">
            {values.map((value) => (
                <span key={value} className="hb-entry__tag">
                    {value}
                </span>
            ))}
        </span>
    ) : (
        <span className="hb-entry__none">{empty}</span>
    )

const RouseChecks = ({ count }: { count: number }) =>
    count > 0 ? (
        <span
            className="hb-entry__rouse"
            role="img"
            aria-label={`${count} Rouse ${count === 1 ? "check" : "checks"}`}
        >
            {Array.from({ length: count }, (_, index) => (
                <IconDropletFilled key={index} size={13} aria-hidden="true" />
            ))}
        </span>
    ) : (
        <span className="hb-entry__none">None</span>
    )

const isPower = (item: HomebrewItem): item is HomebrewPower =>
    item.kind === "power" ||
    item.kind === "ritual" ||
    item.kind === "ceremony" ||
    item.kind === "formula"

const PowerStats = ({ item }: { item: HomebrewPower }) => (
    <dl className="hb-entry__stats">
        <Stat label="Dice pool">
            {item.dicePool || <span className="hb-entry__none">Not specified</span>}
        </Stat>
        <Stat label="Rouse checks">
            <RouseChecks count={item.rouseChecks} />
        </Stat>
        {item.amalgamPrerequisites.length ? (
            <Stat label="Amalgam">
                {item.amalgamPrerequisites
                    .map(({ discipline, level }) => `${titleCase(discipline)} ${level}`)
                    .join(", ")}
            </Stat>
        ) : null}
        {item.requiredTime ? <Stat label="Required time">{item.requiredTime}</Stat> : null}
        {item.ingredients ? (
            <Stat label="Ingredients" wide>
                {item.ingredients}
            </Stat>
        ) : null}
        {item.prerequisitePowers?.length ? (
            <Stat label="Prerequisite powers" wide>
                <TagList values={item.prerequisitePowers} />
            </Stat>
        ) : null}
    </dl>
)

const ClanStats = ({ item }: { item: HomebrewClan }) => (
    <>
        <div className="hb-entry__pair">
            <div>
                <span className="hb-entry__label">Bane</span>
                <p className="hb-entry__text">{item.bane || "—"}</p>
            </div>
            <div>
                <span className="hb-entry__label">Compulsion</span>
                <p className="hb-entry__text">{item.compulsion || "—"}</p>
            </div>
        </div>
        <dl className="hb-entry__stats">
            <Stat label="Native Disciplines" wide>
                <TagList values={item.nativeDisciplines.map(titleCase)} />
            </Stat>
            <Stat label="Excluded predator types">
                <TagList values={item.excludedPredatorTypes} />
            </Stat>
            <Stat label="Excluded merits & flaws">
                <TagList values={item.excludedMeritsAndFlaws} />
            </Stat>
        </dl>
    </>
)

const HomebrewMeritFlawPreview = ({ item }: { item: HomebrewMeritFlaw }) => (
    <article className="hb-entry hb-entry--compact" data-kind={item.kind}>
        <header className="hb-entry__head">
            <span className="hb-entry__kind">
                <HomebrewKindIcon kind={item.kind} size={13} />
                {homebrewKindLabel(item.kind)}
            </span>
            <CostPips costs={item.costs} tone={item.kind === "flaw" ? "blood" : "gold"} />
        </header>
        <h3 className="hb-entry__name">{item.name || "Untitled rule"}</h3>
        <p className="hb-entry__summary">
            {item.summary || item.description || "No description provided."}
        </p>
        {item.excludes.length ? (
            <p className="hb-entry__footnote">
                <span className="hb-entry__label">Excludes</span> {item.excludes.join(", ")}
            </p>
        ) : null}
    </article>
)

const HomebrewItemPreview = ({ item }: { item: HomebrewItem }) => {
    if (item.kind === "predatorType") return <HomebrewPredatorTypePreview item={item} />
    if (item.kind === "loresheet") return <HomebrewLoresheetPreview item={item} />
    if (item.kind === "merit" || item.kind === "flaw") {
        return <HomebrewMeritFlawPreview item={item} />
    }

    const summary = item.summary || item.description || "No description provided."
    const showDescription =
        "description" in item && !!item.description && item.description !== item.summary

    return (
        <article className="hb-entry" data-kind={item.kind}>
            <header className="hb-entry__head">
                <span className="hb-entry__kind">
                    <HomebrewKindIcon kind={item.kind} size={13} />
                    {isPower(item) && item.discipline ? (
                        <>
                            {titleCase(item.discipline)}
                            <span className="hb-entry__kind-sep" aria-hidden="true">
                                ·
                            </span>
                            {homebrewKindLabel(item.kind)}
                        </>
                    ) : (
                        homebrewKindLabel(item.kind)
                    )}
                </span>
                {isPower(item) ? (
                    <DotPips
                        value={item.level}
                        max={item.kind === "power" ? 5 : undefined}
                        label={`Level ${item.level}`}
                    />
                ) : null}
            </header>
            <h3 className="hb-entry__name">{item.name || "Untitled rule"}</h3>
            <p className="hb-entry__summary">{summary}</p>
            {isPower(item) ? <PowerStats item={item} /> : null}
            {item.kind === "clan" ? <ClanStats item={item} /> : null}
            {showDescription ? <p className="hb-entry__description">{item.description}</p> : null}
        </article>
    )
}

export default memo(HomebrewItemPreview)
