import { changeSheetPredatorType } from "../utils/changePredatorType"
import { getCharacterDraftIdentity } from "~/utils/characterDraft"
import { TextInput, NumberInput, Select } from "@mantine/core"
import { memo, useState, type ReactNode } from "react"
import { clans } from "~/data/Clans"
import { ClanName, PredatorTypeName } from "~/data/NameSchemas"
import {
    getPredatorTypeOptions,
    getCharacterPredatorTypeKey,
    getPredatorDisciplineKey
} from "~/data/predatorTypeOptions"
import { predatorDisciplineKey } from "~/data/PredatorTypeRules"
import { SheetOptions } from "../CharacterSheet"
import {
    useDebouncedUncontrolledStringField,
    useDebouncedUncontrolledNumberField
} from "../utils/useDebouncedUncontrolledField"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewClan } from "~/data/Homebrew"
import { getHomebrewSource } from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import PredatorTypeModal from "~/components/PredatorTypeModal"
import CharacterDescription from "../components/CharacterDescription"
import classes from "../sheet.module.css"
import { getOrdinal } from "../utils/ordinal"

type TopDataProps = {
    options: SheetOptions
}

const LedgerField = ({
    label,
    children,
    wide = false
}: {
    label: string
    children: ReactNode
    wide?: boolean
}) => (
    <div className={classes.field} data-wide={wide || undefined}>
        <span className={classes.label}>{label}</span>
        {children}
    </div>
)

const FieldText = ({ value }: { value?: ReactNode }) => (
    <p className={classes.fieldValue} data-empty={!value || undefined}>
        {value || "—"}
    </p>
)

const TopData = ({ options }: TopDataProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const clan = character.homebrewClan ?? (character.clan ? clans[character.clan] : null)
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewClans = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter((item): item is HomebrewClan & { id: string } => item.kind === "clan")
            .map((item) => ({ item, collection }))
    )
    const predatorTypes = getPredatorTypeOptions(homebrewCollections, character)
    const isFreeMode = mode === "free"
    const isExperienceEditable = mode === "xp" || isFreeMode
    const isExperienceSpentEditable = isFreeMode
    const [predatorTypeModalOpened, setPredatorTypeModalOpened] = useState(false)
    const [pendingPredatorType, setPendingPredatorType] = useState<PredatorTypeName>("")
    const [pendingPredatorSpecialty, setPendingPredatorSpecialty] = useState("")
    const [pendingPredatorDiscipline, setPendingPredatorDiscipline] = useState("")

    const nameField = useDebouncedUncontrolledStringField({
        character,
        setCharacter,
        field: "name"
    })
    const ambitionField = useDebouncedUncontrolledStringField({
        character,
        setCharacter,
        field: "ambition"
    })
    const desireField = useDebouncedUncontrolledStringField({
        character,
        setCharacter,
        field: "desire"
    })
    const playerField = useDebouncedUncontrolledStringField({
        character,
        setCharacter,
        field: "player"
    })
    const generationField = useDebouncedUncontrolledNumberField({
        character,
        setCharacter,
        field: "generation"
    })
    const sireField = useDebouncedUncontrolledStringField({
        character,
        setCharacter,
        field: "sire"
    })
    const experienceSpentField = useDebouncedUncontrolledNumberField({
        character,
        setCharacter,
        field: "ephemeral.experienceSpent",
        getValue: (char) => char.ephemeral.experienceSpent,
        updateFn: (char, value) => ({
            ...char,
            ephemeral: {
                ...char.ephemeral,
                experienceSpent: value
            }
        })
    })
    const experienceField = useDebouncedUncontrolledNumberField({
        character,
        setCharacter,
        field: "experience"
    })

    const clanSelect = (
        <Select
            aria-label="Clan"
            placeholder="Select a clan"
            data={Object.keys(clans)
                .filter((clanName) => clanName !== "")
                .map((clanName) => ({
                    value: clanName,
                    label: clanName
                }))
                .concat(
                    homebrewClans.map(({ item, collection }) => ({
                        value: `homebrew:${collection.id}:${item.id}`,
                        label: `${item.name} · Homebrew (${collection.name})`
                    }))
                )}
            value={
                character.homebrewClan
                    ? `homebrew:${character.homebrewClan.homebrewSource.collectionId}:${character.homebrewClan.homebrewSource.itemId}`
                    : character.clan || null
            }
            onChange={(value) => {
                if (value) {
                    if (value.startsWith("homebrew:")) {
                        const [, collectionId, itemId] = value.split(":")
                        const match = homebrewClans.find(
                            ({ item, collection }) =>
                                item.id === itemId && collection.id === collectionId
                        )
                        if (match) {
                            setCharacter((current) => ({
                                ...current,
                                clan: "",
                                homebrewClan: {
                                    ...match.item,
                                    homebrewSource: getHomebrewSource(match.item, match.collection)
                                },
                                availableDisciplineNames: match.item.nativeDisciplines
                            }))
                        }
                        return
                    }
                    const selectedClan = value as ClanName
                    setCharacter((current) => ({
                        ...current,
                        clan: selectedClan,
                        homebrewClan: undefined,
                        availableDisciplineNames: clans[selectedClan].nativeDisciplines
                    }))
                }
            }}
            size="sm"
            color={primaryColor}
        />
    )

    const predatorTypeSelect = (
        <Select
            aria-label="Predator type"
            placeholder="Select a predator type"
            data={Object.keys(predatorTypes)
                .filter((predatorTypeName) => predatorTypeName !== "")
                .map((predatorTypeName) => ({
                    value: predatorTypeName,
                    label:
                        predatorTypes[predatorTypeName].name +
                        (predatorTypes[predatorTypeName].homebrewSource
                            ? ` — ${predatorTypes[predatorTypeName].homebrewSource!.collectionName}`
                            : "")
                }))}
            value={getCharacterPredatorTypeKey(character) || null}
            allowDeselect={false}
            onOptionSubmit={(value) => {
                if (value) {
                    const selectedPredatorType = value as PredatorTypeName
                    const selectedPredatorTypeData = predatorTypes[selectedPredatorType]
                    const firstSpecialty = selectedPredatorTypeData.specialtyOptions[0]
                    const storedSpecialty =
                        getCharacterPredatorTypeKey(character) === selectedPredatorType
                            ? character.predatorType.pickedSpecialties[0]
                            : undefined
                    const storedSpecialtyOption = storedSpecialty
                        ? (selectedPredatorTypeData.specialtyOptions.find(
                              (option) =>
                                  option.skill === storedSpecialty.skill &&
                                  option.name === storedSpecialty.name
                          ) ??
                          selectedPredatorTypeData.specialtyOptions.find(
                              (option) => option.skill === storedSpecialty.skill
                          ))
                        : undefined
                    const initialSpecialty = storedSpecialtyOption ?? firstSpecialty
                    setPendingPredatorType(selectedPredatorType)
                    setPendingPredatorSpecialty(
                        initialSpecialty ? `${initialSpecialty.skill}_${initialSpecialty.name}` : ""
                    )
                    setPendingPredatorDiscipline(
                        getCharacterPredatorTypeKey(character) === selectedPredatorType
                            ? getPredatorDisciplineKey(character)
                            : selectedPredatorTypeData.disciplineOptions[0]
                              ? predatorDisciplineKey(selectedPredatorTypeData.disciplineOptions[0])
                              : ""
                    )
                    setPredatorTypeModalOpened(true)
                }
            }}
            size="sm"
            color={primaryColor}
        />
    )

    const availableXP = character.experience - character.ephemeral.experienceSpent
    const eyebrowParts = [
        character.sect,
        clan?.name,
        character.generation ? `${getOrdinal(character.generation)} Generation` : ""
    ].filter(Boolean)
    const showClanField = isFreeMode || !clan
    const lineage = !isFreeMode && (character.sire || character.chronicle)

    return (
        <>
            <header className={classes.dossier}>
                <div className={classes.identity}>
                    <div className={classes.sigil} aria-hidden="true">
                        {clan?.logo ? (
                            <span
                                className={classes.sigilMark}
                                style={{
                                    maskImage: `url(${clan.logo})`,
                                    WebkitMaskImage: `url(${clan.logo})`
                                }}
                            />
                        ) : (
                            <span className={classes.sigilEmpty}>?</span>
                        )}
                    </div>
                    <div className={classes.identityText}>
                        {eyebrowParts.length > 0 || character.homebrewClan ? (
                            <div className={classes.eyebrow}>
                                {eyebrowParts.map((part) => (
                                    <span key={part}>{part}</span>
                                ))}
                                {character.homebrewClan ? (
                                    <HomebrewBadge source={character.homebrewClan.homebrewSource} />
                                ) : null}
                            </div>
                        ) : null}
                        {isFreeMode ? (
                            <TextInput
                                className={classes.nameInput}
                                aria-label="Character name"
                                value={nameField.value}
                                onChange={(e) => nameField.onChange(e.target.value)}
                                placeholder="Unnamed Character"
                                color={primaryColor}
                            />
                        ) : (
                            <h1 className={classes.name} data-empty={!character.name || undefined}>
                                {character.name || "Unnamed Character"}
                            </h1>
                        )}
                        {lineage ? (
                            <p className={classes.lineage}>
                                {character.sire ? (
                                    <>
                                        Childe of <strong>{character.sire}</strong>
                                    </>
                                ) : null}
                                {character.sire && character.chronicle ? " · " : null}
                                {character.chronicle}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className={classes.ledger}>
                    {showClanField ? <LedgerField label="Clan">{clanSelect}</LedgerField> : null}
                    <LedgerField label="Predator type">
                        {isFreeMode ? (
                            predatorTypeSelect
                        ) : (
                            <FieldText value={character.predatorType.name} />
                        )}
                    </LedgerField>
                    {isFreeMode ? (
                        <LedgerField label="Generation">
                            <NumberInput
                                aria-label="Generation"
                                value={generationField.value}
                                onChange={(value) => {
                                    const numValue =
                                        typeof value === "string"
                                            ? parseInt(value) || 0
                                            : value || 0
                                    generationField.onChange(numValue)
                                }}
                                min={0}
                                size="sm"
                                color={primaryColor}
                            />
                        </LedgerField>
                    ) : null}
                    <LedgerField label="Sire">
                        {isFreeMode ? (
                            <TextInput
                                aria-label="Sire"
                                value={sireField.value}
                                onChange={(e) => sireField.onChange(e.target.value)}
                                placeholder="—"
                                size="sm"
                                color={primaryColor}
                            />
                        ) : (
                            <FieldText value={character.sire} />
                        )}
                    </LedgerField>
                    <LedgerField label="Player">
                        {isFreeMode ? (
                            <TextInput
                                aria-label="Player"
                                value={playerField.value}
                                onChange={(e) => playerField.onChange(e.target.value)}
                                placeholder="—"
                                size="sm"
                                color={primaryColor}
                            />
                        ) : (
                            <FieldText value={character.player} />
                        )}
                    </LedgerField>
                    <LedgerField label="Experience">
                        <div className={classes.xp}>
                            {isExperienceSpentEditable ? (
                                <NumberInput
                                    className={classes.xpInput}
                                    aria-label="Experience spent"
                                    value={experienceSpentField.value}
                                    onChange={experienceSpentField.onChange}
                                    min={0}
                                    size="sm"
                                    hideControls
                                    color={primaryColor}
                                />
                            ) : (
                                <span className={classes.xpSpent}>
                                    {character.ephemeral.experienceSpent}
                                </span>
                            )}
                            <span className={classes.xpSlash}>/</span>
                            {isExperienceEditable ? (
                                <NumberInput
                                    className={classes.xpInput}
                                    aria-label="Total experience"
                                    value={experienceField.value}
                                    onChange={experienceField.onChange}
                                    min={0}
                                    size="sm"
                                    hideControls
                                    color={primaryColor}
                                />
                            ) : (
                                <span className={classes.xpTotal}>{character.experience}</span>
                            )}
                        </div>
                        <span className={classes.xpMeta}>
                            {availableXP >= 0 ? `${availableXP} available` : "Overspent"}
                        </span>
                    </LedgerField>
                </div>

                <div className={classes.motives}>
                    <div className={classes.motive}>
                        <span className={classes.label}>Ambition</span>
                        {isFreeMode ? (
                            <TextInput
                                aria-label="Ambition"
                                value={ambitionField.value}
                                onChange={(e) => ambitionField.onChange(e.target.value)}
                                placeholder="—"
                                size="sm"
                                color={primaryColor}
                            />
                        ) : (
                            <p
                                className={classes.motiveText}
                                data-empty={!character.ambition || undefined}
                            >
                                {character.ambition || "—"}
                            </p>
                        )}
                    </div>
                    <div className={classes.motive} data-tone="gold">
                        <span className={classes.label}>Desire</span>
                        {isFreeMode ? (
                            <TextInput
                                aria-label="Desire"
                                value={desireField.value}
                                onChange={(e) => desireField.onChange(e.target.value)}
                                placeholder="—"
                                size="sm"
                                color={primaryColor}
                            />
                        ) : (
                            <p
                                className={classes.motiveText}
                                data-empty={!character.desire || undefined}
                            >
                                {character.desire || "—"}
                            </p>
                        )}
                    </div>
                </div>

                <CharacterDescription
                    key={getCharacterDraftIdentity(character)}
                    character={character}
                    setCharacter={setCharacter}
                    primaryColor={primaryColor}
                    canEdit={options.canEdit}
                    editDisabledReason={options.editDisabledReason}
                />
            </header>
            {pendingPredatorType ? (
                <PredatorTypeModal
                    key={pendingPredatorType}
                    modalOpened={predatorTypeModalOpened}
                    closeModal={() => {
                        setPredatorTypeModalOpened(false)
                        setPendingPredatorType("")
                    }}
                    character={character}
                    pickedPredatorType={pendingPredatorType}
                    predatorTypeDefinition={predatorTypes[pendingPredatorType]}
                    onConfirmPredatorType={(predatorType) =>
                        setCharacter((current) => changeSheetPredatorType(current, predatorType))
                    }
                    setCharacter={setCharacter}
                    nextStep={() => undefined}
                    specialty={pendingPredatorSpecialty}
                    setSpecialty={setPendingPredatorSpecialty}
                    discipline={pendingPredatorDiscipline}
                    setDiscipline={setPendingPredatorDiscipline}
                    onPredatorTypeChanged={() => undefined}
                />
            ) : null}
        </>
    )
}

export default memo(TopData, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        getCharacterDraftIdentity(p.character) === getCharacterDraftIdentity(n.character) &&
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.name === n.character.name &&
        p.character.description === n.character.description &&
        p.character.sire === n.character.sire &&
        p.character.player === n.character.player &&
        p.character.ambition === n.character.ambition &&
        p.character.desire === n.character.desire &&
        p.character.clan === n.character.clan &&
        p.character.generation === n.character.generation &&
        p.character.experience === n.character.experience &&
        p.character.ephemeral.experienceSpent === n.character.ephemeral.experienceSpent &&
        p.character.predatorType === n.character.predatorType &&
        p.character.sect === n.character.sect &&
        p.character.chronicle === n.character.chronicle &&
        p.character.homebrewClan === n.character.homebrewClan
    )
})
