import { IconUsersGroup } from "@tabler/icons-react"
import { Fragment, memo, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import { getPrimaryColor } from "~/character_sheet/utils/style"
import { EmptyState, Panel } from "~/components/ui"
import NameTag from "~/components/NameTag"
import { attributesKeySchema } from "~/data/Attributes"
import { type Character } from "~/data/Character"
import { clans } from "~/data/Clans"
import { disciplines } from "~/data/Disciplines"
import { getMeritFlawDisplayName } from "~/data/meritsAndFlawsResolution"
import type { DisciplineName } from "~/data/NameSchemas"
import { skillsKeySchema } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import type { CoterieMemberResponse } from "~/utils/api"
import { parseCharacterData } from "~/utils/characterData"
import { getCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import {
    getDisciplineDefinitionIdentity,
    getPowerDisciplineIdentity,
    getPowerIdentity
} from "~/utils/homebrewOptions"
import classes from "./CoterieCharacterSummaryGrid.module.css"

export type ParsedCoterieMember = { member: CoterieMemberResponse; character: Character }

type CoterieCharacterSummaryGridProps = {
    members: CoterieMemberResponse[]
    vitalsByCharacterId: Record<string, CharacterVitals>
    /** Right-click (and long-press / Shift+F10) on a dossier. */
    onMemberContextMenu?: (
        event: MouseEvent<HTMLElement>,
        member: CoterieMemberResponse,
        character: Character
    ) => void
    /** Icon actions rendered in the top-right of each dossier. */
    renderMemberActions?: (member: CoterieMemberResponse, character: Character) => ReactNode
    /** Briefly emphasised dossier (e.g. after jumping to it from the roster). */
    highlightedCharacterId?: string | null
    /** Replaces the default empty state. */
    emptyState?: ReactNode
}

const attributeGroups = [
    {
        label: "Physical",
        items: ["strength", "dexterity", "stamina"] as const
    },
    {
        label: "Social",
        items: ["charisma", "manipulation", "composure"] as const
    },
    {
        label: "Mental",
        items: ["intelligence", "wits", "resolve"] as const
    }
]

const skillGroups = [
    {
        label: "Physical",
        items: [
            "athletics",
            "brawl",
            "craft",
            "drive",
            "firearms",
            "melee",
            "larceny",
            "stealth",
            "survival"
        ] as const
    },
    {
        label: "Social",
        items: [
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance",
            "persuasion",
            "streetwise",
            "subterfuge"
        ] as const
    },
    {
        label: "Mental",
        items: [
            "academics",
            "awareness",
            "finance",
            "investigation",
            "medicine",
            "occult",
            "politics",
            "science",
            "technology"
        ] as const
    }
]

export const coterieMemberElementId = (characterId: string) => `coterie-member-${characterId}`

/** Mantine color name for a clan, used for sigils/accents across the coterie page. */
export const getClanColor = (character: Character) => getPrimaryColor(character.clan)

export const clanColorStyle = (clanColor: string) =>
    ({
        "--clan": `var(--mantine-color-${clanColor}-6)`,
        "--clan-bright": `var(--mantine-color-${clanColor}-4)`
    }) as CSSProperties

export const parseCoterieMembers = (members: CoterieMemberResponse[]): ParsedCoterieMember[] =>
    members
        .map((member) => ({
            member,
            character: parseCharacterData(member.character?.data)
        }))
        .filter((entry): entry is ParsedCoterieMember => !!entry.character)

const maskStyle = (logo: string): CSSProperties => ({
    maskImage: `url(${logo})`,
    WebkitMaskImage: `url(${logo})`
})

const Dots = ({ value, max = 5 }: { value: number; max?: number }) => (
    <span className={classes.dots} aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
            <span key={index} className={classes.dot} data-filled={index < value || undefined} />
        ))}
    </span>
)

const RatingRow = ({ label, value }: { label: string; value: number }) => (
    <div className={classes.rating}>
        <span className={classes.ratingName}>{upcase(label)}</span>
        <Dots value={value} />
        <span className="pg-visually-hidden">{value}</span>
    </div>
)

const HungerMeter = ({ hunger }: { hunger: number }) => (
    <span className={classes.track} aria-label={`Hunger ${hunger}`}>
        {Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={classes.hungerPip}
                data-filled={index < hunger || undefined}
            />
        ))}
    </span>
)

const DamageMeter = ({
    label,
    maximum,
    superficialDamage,
    aggravatedDamage
}: {
    label: string
    maximum: number
    superficialDamage: number
    aggravatedDamage: number
}) => (
    <span
        className={classes.track}
        aria-label={`${label} damage: ${superficialDamage} superficial, ${aggravatedDamage} aggravated`}
    >
        {Array.from({ length: maximum }, (_, index) => {
            const pipNumber = index + 1
            const isAggravated = pipNumber <= aggravatedDamage
            const isSuperficial = pipNumber <= superficialDamage
            const state = isAggravated ? "aggravated" : isSuperficial ? "superficial" : "none"

            return (
                <span
                    key={index}
                    className={classes.damagePip}
                    data-state={state}
                    data-group-end={((index + 1) % 5 === 0 && index < maximum - 1) || undefined}
                >
                    {state !== "none" ? (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <line x1="21" y1="3" x2="3" y2="21" />
                            {isAggravated ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
                        </svg>
                    ) : null}
                </span>
            )
        })}
    </span>
)

const HumanityMeter = ({ humanity, stains }: { humanity: number; stains: number }) => (
    <span
        className={classes.track}
        aria-label={`Humanity ${humanity} of 10${stains > 0 ? `, ${stains} stains` : ""}`}
    >
        {Array.from({ length: 10 }, (_, index) => (
            <span
                key={index}
                className={classes.humanityPip}
                data-filled={index < humanity || undefined}
                data-stained={index >= 10 - stains || undefined}
                data-group-end={index === 4 || undefined}
            />
        ))}
    </span>
)

const getTouchstoneText = (touchstone: Character["touchstones"][number]) => {
    const name = touchstone.name.trim()
    const conviction = touchstone.conviction.trim()
    const description = touchstone.description.trim()

    if (name && conviction) {
        return `${name}: ${conviction}`
    }

    return name || conviction || description
}

const getDisciplineGroups = (character: Character) =>
    character.disciplines.reduce(
        (groups, power) => {
            const identity = getPowerDisciplineIdentity(power)
            if (!groups[identity]) {
                groups[identity] = { disciplineName: power.discipline, powers: [] }
            }
            groups[identity].powers.push(power)
            return groups
        },
        {} as Record<string, { disciplineName: DisciplineName; powers: Character["disciplines"] }>
    )

const getDisciplineLogo = (
    character: Character,
    disciplineIdentity: string,
    disciplineName: DisciplineName
) => {
    const customDiscipline = Object.values(character.customDisciplines).find(
        (definition) => getDisciplineDefinitionIdentity(definition) === disciplineIdentity
    )
    return (
        customDiscipline?.logo ||
        (disciplineIdentity === `official:${disciplineName}`
            ? disciplines[disciplineName as keyof typeof disciplines]?.logo
            : "") ||
        ""
    )
}

export const getMemberPlayerName = (member: CoterieMemberResponse, character: Character) =>
    member.playerNickname?.trim() || character.player?.trim() || "Unknown player"

const SectionTitle = ({ children }: { children: ReactNode }) => (
    <h4 className={classes.sectionTitle}>{children}</h4>
)

const Dossier = ({
    member,
    character,
    vitals: liveVitals,
    actions,
    highlighted,
    onContextMenu
}: {
    member: CoterieMemberResponse
    character: Character
    vitals?: CharacterVitals
    actions?: ReactNode
    highlighted: boolean
    onContextMenu?: CoterieCharacterSummaryGridProps["onMemberContextMenu"]
}) => {
    const clan = character.clan ? clans[character.clan] : null
    const playerName = getMemberPlayerName(member, character)
    const disciplineGroups = getDisciplineGroups(character)
    const meritsAndFlaws = [...character.merits, ...character.flaws]
    const vitals = liveVitals ?? getCharacterVitals(character)
    const maxHealth = Math.max(0, Math.min(10, vitals.maxHealth))
    const superficialDamage = Math.max(0, Math.min(maxHealth, vitals.superficialDamage))
    const aggravatedDamage = Math.max(0, Math.min(maxHealth, vitals.aggravatedDamage))
    const hunger = Math.max(0, Math.min(5, vitals.hunger))
    const willpower = Math.max(0, vitals.willpower)
    const superficialWillpowerDamage = Math.max(
        0,
        Math.min(willpower, vitals.superficialWillpowerDamage)
    )
    const aggravatedWillpowerDamage = Math.max(
        0,
        Math.min(willpower, vitals.aggravatedWillpowerDamage)
    )
    const humanity = Math.max(0, Math.min(10, vitals.humanity))
    const humanityStains = Math.max(0, Math.min(10, vitals.humanityStains))
    const touchstones = character.touchstones
        .map((touchstone) => ({
            touchstone,
            text: getTouchstoneText(touchstone)
        }))
        .filter(({ text }) => text.length > 0)
    const rites = [...character.rituals, ...character.ceremonies]
    const lineage = [
        clan?.name || upcase(character.clan) || "Clanless",
        character.predatorType.name,
        character.generation ? `Gen ${character.generation}` : ""
    ].filter(Boolean)
    const disciplineEntries = Object.entries(disciplineGroups)

    return (
        <article
            id={coterieMemberElementId(member.characterId)}
            className={classes.dossier}
            style={clanColorStyle(getClanColor(character))}
            data-highlighted={highlighted || undefined}
            aria-label={character.name}
            onContextMenu={
                onContextMenu ? (event) => onContextMenu(event, member, character) : undefined
            }
        >
            {clan?.logo ? (
                <span
                    className={classes.watermark}
                    style={maskStyle(clan.logo)}
                    aria-hidden="true"
                />
            ) : null}

            <div className={classes.layout}>
                <div className={classes.aside}>
                    <header className={classes.head}>
                        <span className={classes.sigil} aria-hidden="true">
                            {clan?.logo ? (
                                <span className={classes.sigilMark} style={maskStyle(clan.logo)} />
                            ) : (
                                <span className={classes.sigilInitial}>
                                    {character.name.trim().charAt(0) || "?"}
                                </span>
                            )}
                        </span>
                        <div className={classes.identity}>
                            <h3 className={classes.name}>{character.name}</h3>
                            <div className={classes.byline}>
                                {member.showPlayerNameTag ? (
                                    <NameTag name={playerName} size="xs" />
                                ) : (
                                    <span>{playerName}</span>
                                )}
                            </div>
                            <p className={classes.lineage}>
                                {lineage.map((part, index) => (
                                    <Fragment key={`${part}-${index}`}>
                                        <span
                                            className={index === 0 ? classes.clanName : undefined}
                                        >
                                            {part}
                                            {index < lineage.length - 1 ? (
                                                <span
                                                    className={classes.lineageSep}
                                                    aria-hidden="true"
                                                >
                                                    ·
                                                </span>
                                            ) : null}
                                        </span>{" "}
                                    </Fragment>
                                ))}
                            </p>
                        </div>
                        {actions ? <div className={classes.headActions}>{actions}</div> : null}
                    </header>

                    <div className={classes.vitals}>
                        <span className={classes.vitalLabel} data-tone="hunger">
                            Hunger
                        </span>
                        <span className={classes.vitalTrack}>
                            <HungerMeter hunger={hunger} />
                            <span className={classes.vitalValue}>{hunger}/5</span>
                        </span>

                        <span className={classes.vitalLabel}>Health</span>
                        <span className={classes.vitalTrack}>
                            <DamageMeter
                                label="Health"
                                maximum={maxHealth}
                                superficialDamage={superficialDamage}
                                aggravatedDamage={aggravatedDamage}
                            />
                        </span>

                        <span className={classes.vitalLabel}>Willpower</span>
                        <span className={classes.vitalTrack}>
                            <DamageMeter
                                label="Willpower"
                                maximum={willpower}
                                superficialDamage={superficialWillpowerDamage}
                                aggravatedDamage={aggravatedWillpowerDamage}
                            />
                        </span>

                        <span className={classes.vitalLabel}>Humanity</span>
                        <span className={classes.vitalTrack}>
                            <HumanityMeter humanity={humanity} stains={humanityStains} />
                            <span className={classes.vitalValue}>{humanity}/10</span>
                        </span>
                    </div>

                    {character.description ? (
                        <p className={classes.description}>{character.description}</p>
                    ) : null}

                    <section className={classes.section}>
                        <SectionTitle>Identity</SectionTitle>
                        <dl className={classes.facts}>
                            <dt>Ambition</dt>
                            <dd>{character.ambition || "—"}</dd>
                            <dt>Desire</dt>
                            <dd>{character.desire || "—"}</dd>
                            {character.sire ? (
                                <>
                                    <dt>Sire</dt>
                                    <dd>{character.sire}</dd>
                                </>
                            ) : null}
                            {humanityStains > 0 ? (
                                <>
                                    <dt>Stains</dt>
                                    <dd>{vitals.humanityStains}</dd>
                                </>
                            ) : null}
                        </dl>
                    </section>

                    <section className={classes.section}>
                        <SectionTitle>Touchstones</SectionTitle>
                        {touchstones.length > 0 ? (
                            <ul className={classes.touchstones}>
                                {touchstones.map(({ touchstone, text }, index) => (
                                    <li
                                        key={`${touchstone.name}-${touchstone.conviction}-${index}`}
                                    >
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={classes.muted}>None recorded</p>
                        )}
                    </section>
                </div>

                <div className={classes.main}>
                    <section className={classes.section}>
                        <SectionTitle>Attributes</SectionTitle>
                        <div className={classes.ratingColumns}>
                            {attributeGroups.map((group) => (
                                <div key={group.label} className={classes.ratingGroup}>
                                    <span className={classes.ratingGroupLabel}>{group.label}</span>
                                    {group.items.map((attr) => (
                                        <RatingRow
                                            key={attr}
                                            label={attr}
                                            value={
                                                character.attributes[
                                                    attributesKeySchema.parse(attr)
                                                ] ?? 0
                                            }
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={classes.section}>
                        <SectionTitle>Skills</SectionTitle>
                        <div className={classes.ratingColumns}>
                            {skillGroups.map((group) => {
                                const nonZeroSkills = group.items.filter(
                                    (skill) =>
                                        (character.skills[skillsKeySchema.parse(skill)] ?? 0) > 0
                                )

                                return (
                                    <div key={group.label} className={classes.ratingGroup}>
                                        <span className={classes.ratingGroupLabel}>
                                            {group.label}
                                        </span>
                                        {nonZeroSkills.length > 0 ? (
                                            nonZeroSkills.map((skill) => {
                                                const specialties =
                                                    character.skillSpecialties.filter(
                                                        (specialty) => specialty.skill === skill
                                                    )

                                                return (
                                                    <div key={skill}>
                                                        <RatingRow
                                                            label={skill}
                                                            value={
                                                                character.skills[
                                                                    skillsKeySchema.parse(skill)
                                                                ] ?? 0
                                                            }
                                                        />
                                                        {specialties.length > 0 ? (
                                                            <div className={classes.specialty}>
                                                                {specialties
                                                                    .map(
                                                                        (specialty) =>
                                                                            specialty.name
                                                                    )
                                                                    .join(", ")}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className={classes.muted}>None</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <section className={classes.section}>
                        <SectionTitle>Disciplines &amp; Powers</SectionTitle>
                        {disciplineEntries.length > 0 ? (
                            <div className={classes.powerGrid}>
                                {disciplineEntries.map(([identity, { disciplineName, powers }]) => {
                                    const sortedPowers = [...powers].sort(
                                        (a, b) => a.level - b.level
                                    )
                                    const logo = getDisciplineLogo(
                                        character,
                                        identity,
                                        disciplineName
                                    )

                                    return (
                                        <div key={identity} className={classes.discipline}>
                                            <div className={classes.disciplineName}>
                                                {logo ? (
                                                    <img
                                                        src={logo}
                                                        alt=""
                                                        className={classes.disciplineLogo}
                                                    />
                                                ) : null}
                                                {upcase(disciplineName)}
                                            </div>
                                            {sortedPowers.map((power) => (
                                                <div
                                                    key={getPowerIdentity(power)}
                                                    className={classes.power}
                                                >
                                                    <div className={classes.powerHead}>
                                                        <span>{power.name}</span>
                                                        <span className={classes.powerLevel}>
                                                            {power.level}
                                                        </span>
                                                    </div>
                                                    {power.summary ? (
                                                        <div className={classes.powerSummary}>
                                                            {power.summary}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className={classes.muted}>No disciplines recorded</p>
                        )}
                    </section>

                    {rites.length > 0 ? (
                        <section className={classes.section}>
                            <SectionTitle>Rituals &amp; Ceremonies</SectionTitle>
                            <div className={classes.powerGrid}>
                                {rites.map((rite) => (
                                    <div
                                        key={rite.name}
                                        className={`${classes.power} ${classes.rite}`}
                                    >
                                        <div className={classes.powerHead}>
                                            <span>{rite.name}</span>
                                            <span className={classes.powerLevel}>{rite.level}</span>
                                        </div>
                                        {rite.summary ? (
                                            <div className={classes.powerSummary}>
                                                {rite.summary}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {meritsAndFlaws.length > 0 ? (
                        <section className={classes.section}>
                            <SectionTitle>Merits &amp; Flaws</SectionTitle>
                            <div className={classes.traits}>
                                {meritsAndFlaws.map((item, index) => (
                                    <span
                                        key={`${item.type}-${item.name}-${index}`}
                                        className={classes.trait}
                                        data-kind={item.type}
                                    >
                                        {getMeritFlawDisplayName(item)}
                                        <span className={classes.traitLevel}>{item.level}</span>
                                    </span>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </article>
    )
}

const CoterieCharacterSummaryGrid = ({
    members,
    vitalsByCharacterId,
    onMemberContextMenu,
    renderMemberActions,
    highlightedCharacterId,
    emptyState
}: CoterieCharacterSummaryGridProps) => {
    const parsedMembers = useMemo(() => parseCoterieMembers(members), [members])

    if (parsedMembers.length === 0) {
        return (
            emptyState ?? (
                <Panel p={0}>
                    <EmptyState
                        className={classes.empty}
                        icon={<IconUsersGroup size={26} stroke={1.5} />}
                        title="No character summaries available yet."
                    />
                </Panel>
            )
        )
    }

    return (
        <div className={classes.grid}>
            {parsedMembers.map(({ member, character }) => (
                <Dossier
                    key={member.characterId}
                    member={member}
                    character={character}
                    vitals={vitalsByCharacterId[member.characterId]}
                    actions={renderMemberActions?.(member, character)}
                    highlighted={highlightedCharacterId === member.characterId}
                    onContextMenu={onMemberContextMenu}
                />
            ))}
        </div>
    )
}

export default memo(CoterieCharacterSummaryGrid)
