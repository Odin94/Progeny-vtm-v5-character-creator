import { ScrollArea, UnstyledButton } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconBook2, IconCheck } from "@tabler/icons-react"
import type { CSSProperties, ReactNode } from "react"
import { trackEvent } from "../../utils/analytics"
import { isThinbloodFlaw, isThinbloodMerit, loresheets } from "~/data/MeritsAndFlaws"
import { ClanName, clanNameSchema, DisciplineName } from "~/data/NameSchemas"
import { Character, getEmptyCharacter, MeritFlaw } from "../../data/Character"
import { clans } from "../../data/Clans"
import { globals } from "../../globals"
import { notDefault } from "../utils"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewClan } from "~/data/Homebrew"
import { replacePredatorSkillBonuses } from "~/data/predatorTypeOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import { getPrimaryColor } from "~/character_sheet/utils/style"
import { GeneratorSectionDivider, GeneratorStepHero } from "./sharedGeneratorUi"
import classes from "./ClanPicker.module.css"

/** Clan accent: the same Mantine color the character sheet uses for that clan. */
const clanAccent = (clan: ClanName) => {
    const color = getPrimaryColor(clan)
    return `var(--mantine-color-${color}-${color === "gray" ? 3 : 5})`
}

type ClanPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
    onClanChanged?: () => void
}

const ClanPicker = ({ character, setCharacter, nextStep, onClanChanged }: ClanPickerProps) => {
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewClans = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter((item): item is HomebrewClan & { id: string } => item.kind === "clan")
            .map((clan) => ({ clan, collection }))
    )

    const createClanPick = (clan: ClanName) => {
        const clanDisciplines = clan === "Caitiff" ? [] : clans[clan].nativeDisciplines
        const isSelected = character.clan === clan && character.homebrewClan === undefined

        return (
            <ClanCard
                key={clan}
                testId={`clan-${clan.toLowerCase().replace(/\s+/g, "-")}-card`}
                accent={clanAccent(clan)}
                selected={isSelected}
                name={clan}
                sigil={
                    <span
                        className={classes.sigil}
                        style={{ "--sigil": `url("${clans[clan].logo}")` } as CSSProperties}
                        role="img"
                        aria-label={`${clan} clan symbol`}
                    />
                }
                description={clans[clan].description}
                disciplines={clanDisciplines}
                onClick={() => {
                    const clanChanged =
                        clan !== character.clan || character.homebrewClan !== undefined
                    const predatorType =
                        clan === "Thin-blood" ||
                        (clans[clan].excludedPredatorTypes ?? []).includes(
                            character.predatorType.name
                        )
                            ? getEmptyCharacter().predatorType
                            : character.predatorType
                    const newMerits =
                        clan === character.clan ? character.merits : getNewMerits(clan, character)
                    const newFlaws =
                        clan === "Thin-blood"
                            ? character.flaws
                            : flawsWithoutThinbloodFlaws(character.flaws)
                    if (
                        (notDefault(character, "disciplines") ||
                            notDefault(character, "predatorType")) &&
                        clan !== character.clan
                    ) {
                        notifications.show({
                            title: "Reset Disciplines",
                            message: "Because you changed your clan",
                            autoClose: 7000,
                            color: "yellow"
                        })

                        setCharacter({
                            ...character,
                            clan,
                            homebrewClan: undefined,
                            disciplines: [],
                            disciplineLevels: {},
                            rituals: [],
                            ceremonies: [],
                            availableDisciplineNames: clans[clan].nativeDisciplines,
                            ...replacePredatorSkillBonuses(character, predatorType),
                            merits: newMerits,
                            flaws: newFlaws
                        })
                    } else {
                        setCharacter({
                            ...character,
                            clan,
                            homebrewClan: undefined,
                            availableDisciplineNames: clans[clan].nativeDisciplines,
                            ...replacePredatorSkillBonuses(character, predatorType),
                            merits: newMerits,
                            flaws: newFlaws
                        })
                    }

                    if (clanChanged) onClanChanged?.()

                    trackEvent({
                        action: "clan clicked",
                        category: "clans",
                        label: clan
                    })
                    nextStep()
                }}
            />
        )
    }

    const createHomebrewClanPick = (
        clan: HomebrewClan & { id: string },
        collection: (typeof homebrewCollections)[number]
    ) => (
        <ClanCard
            key={`${collection.id}-${clan.id}`}
            accent="var(--mantine-color-grape-5)"
            selected={
                character.homebrewClan?.homebrewSource.itemId === clan.id &&
                character.homebrewClan?.homebrewSource.collectionId === collection.id
            }
            name={clan.name}
            badge={<HomebrewBadge source={{ ...sourceFor(clan, collection) }} />}
            sigil={
                clan.logo ? (
                    <img
                        className={classes.sigilImage}
                        src={clan.logo}
                        alt={`${clan.name} clan symbol`}
                    />
                ) : (
                    <IconBook2 size={52} stroke={1.3} className={classes.sigilFallback} />
                )
            }
            description={clan.summary || clan.description}
            disciplines={clan.nativeDisciplines}
            onClick={() => {
                const clanChanged =
                    character.homebrewClan?.homebrewSource.itemId !== clan.id ||
                    character.homebrewClan?.homebrewSource.collectionId !== collection.id
                const predatorType = (clan.excludedPredatorTypes ?? []).includes(
                    character.predatorType.name
                )
                    ? getEmptyCharacter().predatorType
                    : character.predatorType
                const source = {
                    itemId: clan.id,
                    collectionId: collection.id,
                    collectionName: collection.name
                }
                setCharacter({
                    ...character,
                    clan: "",
                    homebrewClan: {
                        ...clan,
                        excludedPredatorTypes: clan.excludedPredatorTypes ?? [],
                        excludedMeritsAndFlaws: clan.excludedMeritsAndFlaws ?? [],
                        homebrewSource: source
                    },
                    disciplines: [],
                    disciplineLevels: {},
                    rituals: [],
                    ceremonies: [],
                    availableDisciplineNames: clan.nativeDisciplines,
                    ...replacePredatorSkillBonuses(character, predatorType)
                })
                if (clanChanged) onClanChanged?.()
                nextStep()
            }}
        />
    )

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w={"100%"}
                px={20}
                pt={4}
                pb={8}
                scrollbarSize={nightfallScrollbarSize}
                type="always"
                scrollbars="y"
                offsetScrollbars="present"
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    <GeneratorStepHero
                        leadText="Pick your"
                        accentText="Clan"
                        titleTestId="clan-picker-heading"
                        description="Your clan defines your lineage, your powers, and your curse."
                        marginBottom={globals.isPhoneScreen ? 14 : 22}
                    />

                    {clanSections.map((section) => (
                        <section key={section.label} aria-label={section.label}>
                            <GeneratorSectionDivider
                                label={section.label}
                                marginY={globals.isPhoneScreen ? "sm" : "md"}
                            />
                            <div className={classes.grid}>
                                {section.clans
                                    .map((c) => clanNameSchema.parse(c))
                                    .map((clan) => createClanPick(clan))}
                            </div>
                        </section>
                    ))}

                    {homebrewClans.length > 0 ? (
                        <section aria-label="Homebrew Clans">
                            <GeneratorSectionDivider
                                label="Homebrew Clans"
                                marginY={globals.isPhoneScreen ? "sm" : "md"}
                            />
                            <div className={classes.grid}>
                                {homebrewClans.map(({ clan, collection }) =>
                                    createHomebrewClanPick(clan, collection)
                                )}
                            </div>
                        </section>
                    ) : null}
                </div>
            </ScrollArea>
        </div>
    )
}

const sourceFor = (
    clan: HomebrewClan & { id: string },
    collection: { id: string; name: string }
) => ({ itemId: clan.id, collectionId: collection.id, collectionName: collection.name })

const clanSections = [
    { label: "Rulers & Commanders", clans: ["Ventrue", "Tzimisce", "Lasombra"] },
    { label: "Fighters & Protectors", clans: ["Brujah", "Gangrel", "Banu Haqim"] },
    { label: "Seducers & Deceivers", clans: ["Toreador", "Ravnos", "Ministry"] },
    { label: "Investigators & Researchers", clans: ["Malkavian", "Tremere", "Hecata"] },
    { label: "Hidden Lurkers", clans: ["Nosferatu", "Salubri"] },
    { label: "Advanced & Special Clans", clans: ["Caitiff", "Thin-blood"] }
]

type ClanCardProps = {
    name: string
    accent: string
    sigil: ReactNode
    description: string
    disciplines: DisciplineName[]
    selected: boolean
    badge?: ReactNode
    testId?: string
    onClick: () => void
}

const ClanCard = ({
    name,
    accent,
    sigil,
    description,
    disciplines,
    selected,
    badge,
    testId,
    onClick
}: ClanCardProps) => (
    <UnstyledButton
        data-testid={testId}
        className={classes.card}
        data-selected={selected || undefined}
        aria-pressed={selected}
        style={{ "--clan": accent } as CSSProperties}
        onClick={onClick}
    >
        {selected ? (
            <span className={classes.chosen}>
                <IconCheck size={11} stroke={3} />
                Chosen
            </span>
        ) : null}
        <span className={classes.medallion}>{sigil}</span>
        <span className={classes.body}>
            <span className={classes.name}>{name}</span>
            {badge}
            <span className={classes.description}>{description}</span>
            {disciplines.length > 0 ? (
                <span className={classes.disciplines}>
                    {disciplines.map((discipline) => (
                        <span key={discipline} className={classes.discipline}>
                            {formatDisciplineName(discipline)}
                        </span>
                    ))}
                </span>
            ) : null}
        </span>
    </UnstyledButton>
)

const formatDisciplineName = (discipline: DisciplineName) =>
    discipline
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

const meritsWithoutThinbloodMerits = (merits: MeritFlaw[]) =>
    merits.filter((m) => !isThinbloodMerit(m.name))
const flawsWithoutThinbloodFlaws = (flaws: MeritFlaw[]) =>
    flaws.filter((f) => !isThinbloodFlaw(f.name))
const meritsWithoutInvalidLoreSheets = (newClan: ClanName, character: Character) => {
    const { merits } = character
    const loresheetMerits = loresheets.flatMap((loresheet) =>
        loresheet.merits.map((lsMerit) => {
            return { loresheet, meritName: lsMerit.name }
        })
    )

    return merits.filter((m) => {
        const loresheetMerit = loresheetMerits.find((lsMerit) => m.name === lsMerit.meritName)
        if (!loresheetMerit) return true

        const requirementsMet = loresheetMerit.loresheet.requirementFunctions.every((fun) =>
            fun({ ...character, clan: newClan })
        )
        return requirementsMet
    })
}

const getNewMerits = (newClan: ClanName, character: Character) => {
    let newMerits = meritsWithoutInvalidLoreSheets(newClan, character)
    newMerits = newClan === "Thin-blood" ? newMerits : meritsWithoutThinbloodMerits(newMerits)

    if (newMerits.length < character.merits.length) {
        notifications.show({
            title: "Reset (some) Merits",
            message: "Because you changed your clan",
            autoClose: 7000,
            color: "yellow"
        })
    }

    return newMerits
}

export default ClanPicker
