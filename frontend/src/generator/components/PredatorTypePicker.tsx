import { Box, Button, Group, ScrollArea, Stack, UnstyledButton } from "@mantine/core"
import { IconCheck, IconLock } from "@tabler/icons-react"
import { useDisclosure } from "@mantine/hooks"
import { trackEvent } from "../../utils/analytics"
import { Character, getCharacterExcludedPredatorTypes } from "../../data/Character"
import { PredatorType } from "../../data/PredatorType"
import { globals } from "../../globals"
import PredatorTypeModal from "../../components/PredatorTypeModal"
import { PredatorTypeName } from "~/data/NameSchemas"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import {
    getPredatorTypeOptions,
    getCharacterPredatorTypeKey,
    getPredatorDisciplineKey
} from "~/data/predatorTypeOptions"
import { predatorDisciplineKey } from "~/data/PredatorTypeRules"
import HomebrewBadge from "~/components/HomebrewBadge"
import { GeneratorConfirmButton, GeneratorStepHero } from "./sharedGeneratorUi"
import classes from "./PredatorTypePicker.module.css"

type PredatorTypePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void

    // Lifted into Generator so a half-configured predator type survives navigating to another
    // step and back — see the comment on the state in Generator.tsx.
    pickedPredatorType: PredatorTypeName
    setPickedPredatorType: (predatorType: PredatorTypeName) => void
    specialty: string
    setSpecialty: (specialty: string) => void
    discipline: string
    setDiscipline: (discipline: string) => void
    onPredatorTypeChanged: () => void
    skipPredatorType: () => void
}

// Build the SegmentedControl value for a stored specialty. Non-custom specialties round-trip
// exactly; custom-input ones store the typed text as `name`, so we match on skill and use the
// option's canonical key (the modal restores the typed text separately).
const specialtyKeyForStored = (
    predatorType: PredatorType,
    stored: { skill: string; name: string } | undefined,
    fallbackKey: string
) => {
    if (!stored) return fallbackKey
    const exact = predatorType.specialtyOptions.find(
        (o) => `${o.skill}_${o.name}` === `${stored.skill}_${stored.name}`
    )
    if (exact) return `${exact.skill}_${exact.name}`
    const bySkill = predatorType.specialtyOptions.find((o) => o.skill === stored.skill)
    return bySkill ? `${bySkill.skill}_${bySkill.name}` : fallbackKey
}

type CategoryMeta = {
    key: "violent" | "sociable" | "stealth" | "exclusive" | "homebrew"
    label: string
    predatorTypes: PredatorTypeName[]
}

const CATEGORIES: CategoryMeta[] = [
    {
        key: "violent",
        label: "Violent",
        predatorTypes: ["Alleycat", "Extortionist", "Roadside Killer", "Montero"]
    },
    {
        key: "sociable",
        label: "Sociable",
        predatorTypes: ["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren"]
    },
    {
        key: "stealth",
        label: "Stealth",
        predatorTypes: ["Sandman", "Graverobber", "Grim Reaper", "Pursuer", "Trapdoor"]
    },
    {
        key: "exclusive",
        label: "Excluding Mortals",
        predatorTypes: ["Bagger", "Blood Leech", "Farmer"]
    }
]

const titleCase = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase())

const PredatorTypePicker = ({
    character,
    setCharacter,
    nextStep,
    pickedPredatorType,
    setPickedPredatorType,
    specialty,
    setSpecialty,
    discipline,
    setDiscipline,
    onPredatorTypeChanged,
    skipPredatorType
}: PredatorTypePickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const { data: collections = [] } = useCharacterHomebrew(character.id)
    const predatorTypes = getPredatorTypeOptions(collections, character)

    const isThinBlood = character.clan === "Thin-blood"

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

    const openPredatorType = (predatorTypeName: PredatorTypeName) => {
        if (isThinBlood) return

        const predatorType = predatorTypes[predatorTypeName]
        const firstSpecialtyOption = predatorType.specialtyOptions[0]
        const firstSpecialtyKey = firstSpecialtyOption
            ? `${firstSpecialtyOption.skill}_${firstSpecialtyOption.name}`
            : ""
        const firstDisciplineName = predatorType.disciplineOptions[0]
            ? predatorDisciplineKey(predatorType.disciplineOptions[0])
            : ""

        // Re-opening the same card after stepping away: the lifted state still holds the
        // in-progress edits, so keep them instead of resetting to the first option.
        const hasInProgressSelection = pickedPredatorType === predatorTypeName && specialty !== ""
        if (hasInProgressSelection) {
            openModal()
            return
        }

        // Re-opening a type the user already confirmed: seed from the stored character so the
        // modal shows their choices, not defaults. Re-confirming an unchanged discipline is then
        // non-destructive — it no longer trips the reset that clears disciplines, rituals and
        // ceremonies in PredatorTypeModal.
        const confirmed = character.predatorType
        if (getCharacterPredatorTypeKey(character) === predatorTypeName) {
            setPickedPredatorType(predatorTypeName)
            setSpecialty(
                specialtyKeyForStored(
                    predatorType,
                    confirmed.pickedSpecialties[0],
                    firstSpecialtyKey
                )
            )
            setDiscipline(getPredatorDisciplineKey(character) || firstDisciplineName)
            openModal()
            return
        }

        // Genuinely fresh pick — start from the first option.
        setPickedPredatorType(predatorTypeName)
        setSpecialty(firstSpecialtyKey)
        setDiscipline(firstDisciplineName)
        openModal()
    }

    const createCard = (predatorTypeName: PredatorTypeName) => {
        const predatorType = predatorTypes[predatorTypeName]
        const clanDisabled = getCharacterExcludedPredatorTypes(character).includes(
            predatorType.name
        )
        const isSelected = getCharacterPredatorTypeKey(character) === predatorTypeName

        return (
            <UnstyledButton
                data-testid={`predator-type-${predatorTypeName.toLowerCase().replace(/\s+/g, "-")}-card`}
                key={predatorTypeName}
                className={classes.card}
                data-selected={isSelected || undefined}
                data-locked={clanDisabled || undefined}
                aria-disabled={isThinBlood}
                aria-pressed={isSelected}
                onClick={() => {
                    // Locked cards stay openable so the coupling is legible rather than a dead
                    // end: the modal explains the clan restriction instead of blocking the click.
                    openPredatorType(predatorTypeName)
                }}
            >
                <span className={classes.head}>
                    <span className={classes.name}>
                        {predatorType.name}
                        {predatorType.homebrewSource && (
                            <HomebrewBadge source={predatorType.homebrewSource} />
                        )}
                    </span>
                    {clanDisabled ? (
                        <span className={classes.state} data-kind="locked">
                            <IconLock size={11} stroke={2.4} />
                            Locked for {character.clan}
                        </span>
                    ) : isSelected ? (
                        <span className={classes.state} data-kind="chosen">
                            <IconCheck size={11} stroke={3} />
                            Chosen
                        </span>
                    ) : null}
                </span>

                <span className={classes.summary}>{predatorType.summary}</span>

                {clanDisabled && (
                    <span className={classes.lockNote}>
                        Not available to the {character.homebrewClan?.name ?? character.clan} clan —
                        switch clans to unlock it.
                    </span>
                )}

                <span className={classes.chips}>
                    {predatorType.disciplineOptions.map((disc) => (
                        <span key={disc.name} className={classes.chip}>
                            {titleCase(disc.name)}
                        </span>
                    ))}
                </span>
            </UnstyledButton>
        )
    }

    const createPredatorTypeStack = () => (
        <Stack gap="xl">
            <GeneratorStepHero
                leadText="Pick your"
                accentText="Predator Type"
                description="Choose a predator type that defines your feeding habits"
                marginBottom={phoneScreen ? 18 : 26}
            />

            {[
                ...CATEGORIES,
                ...(Object.values(predatorTypes).some((option) => option.homebrewSource)
                    ? [
                          {
                              key: "homebrew" as const,
                              label: "Homebrew",
                              predatorTypes: Object.keys(predatorTypes).filter(
                                  (key) => predatorTypes[key].homebrewSource
                              )
                          }
                      ]
                    : [])
            ].map((meta) => (
                <Box
                    key={meta.label}
                    component="section"
                    aria-label={meta.label}
                    className={classes.category}
                    data-category={meta.key}
                >
                    <div className={classes.categoryHead}>
                        <span className={classes.categoryRule} />
                        <span className={classes.categoryLabel}>{meta.label}</span>
                        <span className={classes.categoryRule} data-side="end" />
                    </div>
                    <div className={classes.grid}>
                        {meta.predatorTypes.map((name) => createCard(name))}
                    </div>
                </Box>
            ))}

            <Group justify="center" mt="sm">
                <Button
                    data-testid="predator-type-skip-button"
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={skipPredatorType}
                >
                    Skip predator type
                </Button>
            </Group>
        </Stack>
    )

    return (
        <div style={generatorScrollableShellStyle}>
            {isThinBlood ? (
                <div
                    style={{
                        ...generatorScrollableAreaStyle,
                        display: "flex",
                        padding: "0 var(--pg-gutter)"
                    }}
                >
                    <div className={classes.thinBlood}>
                        <GeneratorStepHero leadText="Your" accentText="Hunt" marginBottom={0} />
                        <span className={classes.thinBloodText}>
                            <b>Thin-bloods</b> do not have a predator type
                        </span>
                        <GeneratorConfirmButton
                            data-testid="thin-blood-predator-type-continue-button"
                            onClick={() => {
                                trackEvent({
                                    action: "predatortype confirm clicked",
                                    category: "predator type",
                                    label: "thin-blood - no predator type"
                                })
                                nextStep()
                            }}
                        >
                            Continue
                        </GeneratorConfirmButton>
                    </div>
                </div>
            ) : (
                <ScrollArea
                    style={generatorScrollableAreaStyle}
                    w="100%"
                    px={20}
                    pt={4}
                    pb={8}
                    type="always"
                    scrollbarSize={nightfallScrollbarSize}
                    styles={nightfallScrollAreaStyles}
                >
                    <div style={generatorScrollableContentStyle}>{createPredatorTypeStack()}</div>
                </ScrollArea>
            )}

            {!isThinBlood && pickedPredatorType != "" ? (
                <PredatorTypeModal
                    modalOpened={modalOpened}
                    closeModal={closeModal}
                    character={character}
                    pickedPredatorType={pickedPredatorType}
                    predatorTypeDefinition={predatorTypes[pickedPredatorType]}
                    setCharacter={setCharacter}
                    nextStep={nextStep}
                    specialty={specialty}
                    setSpecialty={setSpecialty}
                    discipline={discipline}
                    setDiscipline={setDiscipline}
                    onPredatorTypeChanged={onPredatorTypeChanged}
                />
            ) : null}
        </div>
    )
}

export default PredatorTypePicker
