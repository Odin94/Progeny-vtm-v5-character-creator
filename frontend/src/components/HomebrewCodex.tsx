import { Tooltip, UnstyledButton } from "@mantine/core"
import {
    IconBat,
    IconBolt,
    IconChevronDown,
    IconCrown,
    IconDiamond,
    IconDropletFilled,
    IconFlame,
    IconFlask,
    IconMask,
    IconPentagram,
    IconScript,
    IconSkull
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import AnimatedCollapse from "~/components/AnimatedCollapse"
import type { HomebrewItem, HomebrewItemKind } from "~/data/Homebrew"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import "./HomebrewCodex.css"

/* Shared building blocks for the homebrew "scriptorium": kind glyphs, counts, dot pips,
   the blood-drop rating, collapsible kind sections and the contents index. */

const kindIcons: Record<HomebrewItemKind, typeof IconFlame> = {
    discipline: IconFlame,
    power: IconBolt,
    ritual: IconPentagram,
    ceremony: IconSkull,
    formula: IconFlask,
    loresheet: IconScript,
    merit: IconDiamond,
    flaw: IconMask,
    clan: IconCrown,
    predatorType: IconBat
}

const kindPlurals: Record<HomebrewItemKind, string> = {
    discipline: "Disciplines",
    power: "Powers",
    ritual: "Rituals",
    ceremony: "Ceremonies",
    formula: "Thin-Blood Formulae",
    loresheet: "Loresheets",
    merit: "Merits",
    flaw: "Flaws",
    clan: "Clans",
    predatorType: "Predator Types"
}

export const HomebrewKindIcon = ({
    kind,
    size = 16,
    stroke = 1.6
}: {
    kind: HomebrewItemKind
    size?: number
    stroke?: number
}) => {
    const Icon = kindIcons[kind] ?? IconScript
    return <Icon size={size} stroke={stroke} aria-hidden="true" />
}

export const homebrewKindPlural = (kind: HomebrewItemKind) =>
    kindPlurals[kind] ?? homebrewKindLabel(kind)

export const homebrewKindCount = (kind: HomebrewItemKind, count: number) =>
    `${count} ${count === 1 ? homebrewKindLabel(kind) : homebrewKindPlural(kind)}`

/** Groups items by kind in the canonical kind order, dropping empty kinds. */
export const groupHomebrewItems = <T extends HomebrewItem>(
    items: T[],
    kinds: readonly HomebrewItemKind[]
) =>
    kinds
        .map((kind) => ({ kind, items: items.filter((item) => item.kind === kind) }))
        .filter((group) => group.items.length > 0)

/** Small row of dots (V5 ratings). `tone` colors the filled pips. */
export const DotPips = ({
    value,
    max,
    tone = "accent",
    label
}: {
    value: number
    max?: number
    tone?: "accent" | "gold" | "blood"
    label?: string
}) => {
    const total = Math.max(max ?? value, value, 0)
    return (
        <span
            className="hb-pips"
            data-tone={tone}
            role="img"
            aria-label={label ?? `${value} ${value === 1 ? "dot" : "dots"}`}
        >
            {Array.from({ length: total }, (_, index) => (
                <span key={index} className="hb-pip" data-filled={index < value || undefined} />
            ))}
        </span>
    )
}

/** Dot costs for merits & flaws: "●", or a range like "●–●●●" for several costs. */
export const CostPips = ({ costs, tone }: { costs: number[]; tone: "gold" | "blood" }) => {
    const sorted = [...costs].sort((a, b) => a - b)
    if (!sorted.length) return null
    const label = `${sorted.join(", ")} ${sorted.length === 1 && sorted[0] === 1 ? "dot" : "dots"}`
    if (sorted.length === 1) return <DotPips value={sorted[0]} tone={tone} label={label} />
    const contiguous = sorted.every((cost, index) => index === 0 || cost === sorted[index - 1] + 1)
    return (
        <span className="hb-cost-range" role="img" aria-label={label}>
            {contiguous ? (
                <>
                    <DotPips value={sorted[0]} tone={tone} label="" />
                    <span className="hb-cost-range__dash" aria-hidden="true">
                        –
                    </span>
                    <DotPips value={sorted[sorted.length - 1]} tone={tone} label="" />
                </>
            ) : (
                sorted.map((cost, index) => (
                    <span key={cost} className="hb-cost-range__part">
                        {index > 0 ? (
                            <span className="hb-cost-range__dash" aria-hidden="true">
                                /
                            </span>
                        ) : null}
                        <DotPips value={cost} tone={tone} label="" />
                    </span>
                ))
            )}
        </span>
    )
}

/** The five-drop community rating. Interactive drops preview the rating on hover. */
export const BloodRating = ({
    value,
    interactive = false,
    onChange,
    size = 15
}: {
    value: number
    interactive?: boolean
    onChange?: (rating: number) => void
    size?: number
}) => {
    const rounded = Math.round(value)
    return (
        <div
            className="hb-rating"
            data-interactive={interactive || undefined}
            role="group"
            aria-label={`${value.toFixed(1)} out of 5 blood rating`}
        >
            {[1, 2, 3, 4, 5].map((rating) =>
                interactive ? (
                    <UnstyledButton
                        key={rating}
                        className="hb-rating__drop"
                        data-filled={rating <= rounded || undefined}
                        aria-label={`Rate ${rating} blood`}
                        onClick={(event) => {
                            event.stopPropagation()
                            onChange?.(rating)
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        <IconDropletFilled size={size} />
                    </UnstyledButton>
                ) : (
                    <span
                        key={rating}
                        className="hb-rating__drop"
                        data-filled={rating <= rounded || undefined}
                    >
                        <IconDropletFilled size={size} aria-hidden="true" />
                    </span>
                )
            )}
        </div>
    )
}

export const homebrewKindSectionId = (prefix: string, kind: HomebrewItemKind) => `${prefix}-${kind}`

/** Collapsible kind section ("Disciplines · 3") with an optional action slot. */
export const HomebrewKindSection = ({
    kind,
    count,
    idPrefix,
    collapsed,
    motionEnabled,
    onToggle,
    actions,
    children
}: {
    kind: HomebrewItemKind
    count: number
    idPrefix: string
    collapsed: boolean
    motionEnabled: boolean
    onToggle: (motionEnabled: boolean) => void
    actions?: ReactNode
    children: ReactNode
}) => (
    <section
        className="hb-kind"
        id={homebrewKindSectionId(idPrefix, kind)}
        data-kind={kind}
        aria-label={homebrewKindPlural(kind)}
    >
        <header className="hb-kind__header">
            <UnstyledButton
                className="hb-kind__toggle"
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${homebrewKindLabel(kind)}`}
                aria-expanded={!collapsed}
                onClick={(event) => onToggle(event.detail !== 0)}
            >
                <span className="hb-kind__glyph">
                    <HomebrewKindIcon kind={kind} size={15} />
                </span>
                <span className="hb-kind__title">{homebrewKindPlural(kind)}</span>
                <span className="hb-kind__count">{count}</span>
                <IconChevronDown
                    size={15}
                    className={`hb-kind__chevron animated-collapse-toggle__chevron${motionEnabled ? "" : " animated-collapse-toggle__chevron--instant"}`}
                    data-collapsed={collapsed || undefined}
                    aria-hidden="true"
                />
            </UnstyledButton>
            <span className="hb-kind__rule" aria-hidden="true" />
            {actions ? <div className="hb-kind__actions">{actions}</div> : null}
        </header>
        <AnimatedCollapse opened={!collapsed} motionEnabled={motionEnabled}>
            <div className="hb-kind__body">{children}</div>
        </AnimatedCollapse>
    </section>
)

/** Sticky "Contents" list that jumps to each kind section. Hidden below desktop widths. */
export const HomebrewKindIndex = ({
    groups,
    idPrefix,
    title = "Contents",
    footer
}: {
    groups: Array<{ kind: HomebrewItemKind; items: unknown[] }>
    idPrefix: string
    title?: string
    footer?: ReactNode
}) => (
    <nav className="hb-index" aria-label={title}>
        <span className="pg-eyebrow hb-index__title">{title}</span>
        <ol className="hb-index__list">
            {groups.map(({ kind, items }) => (
                <li key={kind}>
                    <UnstyledButton
                        className="hb-index__link"
                        onClick={() =>
                            document
                                .getElementById(homebrewKindSectionId(idPrefix, kind))
                                ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                    >
                        <HomebrewKindIcon kind={kind} size={14} />
                        <span className="hb-index__label">{homebrewKindPlural(kind)}</span>
                        <span className="hb-index__count">{items.length}</span>
                    </UnstyledButton>
                </li>
            ))}
        </ol>
        {footer}
    </nav>
)

/** Compact "what's inside" list: glyph + count per kind, with a tooltip naming the kind. */
export const HomebrewKindCounts = ({
    counts,
    max = 5
}: {
    counts: Partial<Record<HomebrewItemKind, number>>
    max?: number
}) => {
    const entries = homebrewItemKinds
        .map((kind) => [kind, counts[kind] ?? 0] as [HomebrewItemKind, number])
        .filter(([, count]) => count > 0)
    if (!entries.length) return <span className="hb-counts hb-counts--empty">No rules yet</span>
    const visible = entries.slice(0, max)
    const hidden = entries.slice(max)
    return (
        <ul className="hb-counts" aria-label="Contents">
            {visible.map(([kind, count]) => (
                <Tooltip key={kind} label={homebrewKindCount(kind, count)}>
                    <li className="hb-counts__item" aria-label={homebrewKindCount(kind, count)}>
                        <HomebrewKindIcon kind={kind} size={13} />
                        <span>{count}</span>
                    </li>
                </Tooltip>
            ))}
            {hidden.length ? (
                <Tooltip
                    label={hidden.map(([kind, count]) => homebrewKindCount(kind, count)).join(", ")}
                >
                    <li className="hb-counts__item hb-counts__more">+{hidden.length}</li>
                </Tooltip>
            ) : null}
        </ul>
    )
}

export const countHomebrewItems = (items: HomebrewItem[]) =>
    items.reduce<Partial<Record<HomebrewItemKind, number>>>((counts, item) => {
        counts[item.kind] = (counts[item.kind] ?? 0) + 1
        return counts
    }, {})
