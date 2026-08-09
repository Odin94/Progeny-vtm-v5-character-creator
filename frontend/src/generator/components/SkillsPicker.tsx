import { Button, Divider, Grid, Group, ScrollArea, Space, Text, Tooltip } from "@mantine/core"
import { RAW_GOLD, RAW_GREY, RAW_RED, RAW_GRAPE, rgba } from "~/theme/colors"
import { useDisclosure } from "@mantine/hooks"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import {
    Skills,
    SkillsKey,
    emptySkills,
    skillsDescriptions,
    skillsKeySchema
} from "../../data/Skills"
import { globals } from "../../globals"
import { upcase } from "../utils"
import { SpecialtyModal } from "./SkillSpecialtyModal"
import {
    GeneratorPhasePrompt,
    GeneratorSectionDivider,
    GeneratorStepHero
} from "./sharedGeneratorUi"
import {
    DistributionKey,
    emptySkillsSetting,
    SkillsSetting
} from "../creatorDrafts"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type SkillsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
    pickedSkills: SkillsSetting
    setPickedSkills: (skills: SkillsSetting) => void
    pickedDistribution: DistributionKey | null
    setPickedDistribution: (distribution: DistributionKey | null) => void
}

type SkillDistribution = { strongest: number; decent: number; acceptable: number; special: number }

const distributionDescriptions: Record<DistributionKey, string> = {
    "Jack of All Trades": "Decent at many things, good at none (1/8/10)",
    Balanced: "Best default choice (3/5/7)",
    Specialist: "Uniquely great at one thing, bad at most (1/3/3/3)"
}

const distributionByType: Record<DistributionKey, SkillDistribution> = {
    "Jack of All Trades": {
        special: 0,
        strongest: 1,
        decent: 8,
        acceptable: 10
    },
    Balanced: {
        special: 0,
        strongest: 3,
        decent: 5,
        acceptable: 7
    },
    Specialist: {
        special: 1,
        strongest: 3,
        decent: 3,
        acceptable: 3
    }
}

const getAll = (skillSetting: SkillsSetting): SkillsKey[] => {
    return Object.values(skillSetting).reduce((acc, s) => [...acc, ...s], [])
}

const SkillsPicker = ({
    character,
    setCharacter,
    nextStep,
    pickedSkills,
    setPickedSkills,
    pickedDistribution,
    setPickedDistribution
}: SkillsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const hasConfirmedSkills = Object.values(character.skills).some((value) => value !== 0)
    const distr = pickedDistribution
        ? distributionByType[pickedDistribution]
        : { special: 0, strongest: 0, decent: 0, acceptable: 0 }

    const skillsFromSelection = (selection: SkillsSetting): Skills => {
        const skills = { ...emptySkills }
        selection.special.forEach((skill) => (skills[skill] = 4))
        selection.strongest.forEach((skill) => (skills[skill] = 3))
        selection.decent.forEach((skill) => (skills[skill] = 2))
        selection.acceptable.forEach((skill) => (skills[skill] = 1))
        return skills
    }

    const isComplete =
        pickedDistribution !== null &&
        pickedSkills.special.length === distr.special &&
        pickedSkills.strongest.length === distr.strongest &&
        pickedSkills.decent.length === distr.decent &&
        pickedSkills.acceptable.length === distr.acceptable
    const skillAllocationIsFull =
        pickedDistribution !== null &&
        pickedSkills.special.length >= distr.special &&
        pickedSkills.strongest.length >= distr.strongest &&
        pickedSkills.decent.length >= distr.decent &&
        pickedSkills.acceptable.length >= distr.acceptable

    const createButton = (skill: SkillsKey, i: number) => {
        const alreadyPicked = [
            ...pickedSkills.special,
            ...pickedSkills.strongest,
            ...pickedSkills.decent,
            ...pickedSkills.acceptable
        ].includes(skill)
        const assignedLevel = (() => {
            if (pickedSkills.special.includes(skill)) return 4
            if (pickedSkills.strongest.includes(skill)) return 3
            if (pickedSkills.decent.includes(skill)) return 2
            if (pickedSkills.acceptable.includes(skill)) return 1
            return null
        })()

        let onClick: () => void
        if (alreadyPicked) {
            onClick = () => {
                setPickedSkills({
                    special: pickedSkills.special.filter((it) => it !== skill),
                    strongest: pickedSkills.strongest.filter((it) => it !== skill),
                    decent: pickedSkills.decent.filter((it) => it !== skill),
                    acceptable: pickedSkills.acceptable.filter((it) => it !== skill)
                })
            }
        } else if (pickedSkills.special.length < distr.special) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, special: [...pickedSkills.special, skill] })
            }
        } else if (pickedSkills.strongest.length < distr.strongest) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, strongest: [...pickedSkills.strongest, skill] })
            }
        } else if (pickedSkills.decent.length < distr.decent) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, decent: [...pickedSkills.decent, skill] })
            }
        } else if (pickedSkills.acceptable.length < distr.acceptable) {
            const finalPick = { ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] }
            onClick = () => {
                setPickedSkills(finalPick)
                if (
                    !hasConfirmedSkills &&
                    finalPick.special.length === distr.special &&
                    finalPick.strongest.length === distr.strongest &&
                    finalPick.decent.length === distr.decent &&
                    finalPick.acceptable.length === distr.acceptable
                ) {
                    openModal()
                }
            }
        } else {
            onClick = () => {}
        }

        const trackClick = () => {
            trackEvent({
                action: "skill clicked",
                category: "skills",
                label: skill
            })
        }

        return (
            <Grid.Col key={skill} span={4}>
                <Tooltip
                    disabled={alreadyPicked}
                    label={skillsDescriptions[skill]}
                    transitionProps={{ transition: "slide-up", duration: 200 }}
                    events={globals.tooltipTriggerEvents}
                >
                    <Button
                        data-testid={`skill-${skill.replace(/\s+/g, "-")}-button`}
                        p={phoneScreen ? "xs" : "default"}
                        variant={alreadyPicked ? "outline" : "filled"}
                        disabled={
                            pickedDistribution === null || (!alreadyPicked && skillAllocationIsFull)
                        }
                        color="grape"
                        fullWidth={false}
                        style={{
                            width: "88%",
                            marginLeft: "auto",
                            marginRight: "auto",
                            display: "flex",
                            minHeight: phoneScreen ? 36 : 40
                        }}
                        styles={{
                            inner: {
                                alignItems: "center",
                                justifyContent: phoneScreen ? "flex-start" : "space-between",
                                paddingTop: 2,
                                paddingBottom: 3
                            },
                            label: {
                                lineHeight: 1.3,
                                overflow: "visible",
                                flex: 1
                            },
                            section: {
                                overflow: "visible"
                            },
                            root: {
                                justifyContent: "space-between",
                                background:
                                    assignedLevel === 4
                                        ? rgba(RAW_RED, 0.38)
                                        : assignedLevel === 3
                                          ? rgba(RAW_RED, 0.2)
                                          : assignedLevel === 2
                                            ? "rgba(204, 166, 51, 0.4)"
                                            : assignedLevel === 1
                                              ? "rgba(43, 43, 43, 0.5)"
                                              : pickedDistribution === null
                                                ? "rgba(43, 43, 43, 0.3)"
                                                : rgba(RAW_GRAPE, 0.8),
                                borderColor:
                                    assignedLevel === 4
                                        ? rgba(RAW_RED, 1)
                                        : assignedLevel === 3
                                          ? rgba(RAW_RED, 0.95)
                                          : assignedLevel === 2
                                            ? rgba(RAW_GOLD, 0.9)
                                            : assignedLevel === 1
                                              ? "rgba(180, 180, 180, 0.42)"
                                              : pickedDistribution === null
                                                ? "rgba(180, 180, 180, 0.24)"
                                                : rgba(RAW_GRAPE, 0.45),
                                color: alreadyPicked ? "rgba(244, 236, 232, 0.95)" : undefined
                            }
                        }}
                        rightSection={
                            !phoneScreen && assignedLevel ? (
                                <Group gap={4} wrap="nowrap">
                                    {Array.from({ length: 5 }).map((_, dotIndex) => (
                                        <div
                                            key={`${skill}-dot-${dotIndex}`}
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "999px",
                                                background:
                                                    dotIndex < assignedLevel
                                                        ? assignedLevel === 4 || assignedLevel === 3
                                                            ? rgba(RAW_RED, 1)
                                                            : assignedLevel === 2
                                                              ? "rgba(232, 204, 92, 0.98)"
                                                              : "rgba(210, 210, 210, 0.85)"
                                                        : "rgba(255, 255, 255, 0.14)",
                                                boxShadow:
                                                    dotIndex < assignedLevel &&
                                                    (assignedLevel === 4 || assignedLevel === 3)
                                                        ? `0 0 6px ${rgba(RAW_RED, 0.38)}`
                                                        : "none"
                                            }}
                                        />
                                    ))}
                                </Group>
                            ) : undefined
                        }
                        onClick={() => {
                            trackClick()
                            onClick()
                        }}
                    >
                        <Text
                            fz={phoneScreen ? 12 : "inherit"}
                            lh={1.3}
                            ta="left"
                            style={{ width: "100%" }}
                        >
                            {upcase(skill)}
                        </Text>
                    </Button>
                </Tooltip>
                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const toPick = (() => {
        if (pickedSkills.special.length < distr.special) return "special"
        if (pickedSkills.strongest.length < distr.strongest) return "strongest"
        if (pickedSkills.decent.length < distr.decent) return "decent"
        return "acceptable"
    })()

    const closeModalAndUndoLastPick = () => {
        setPickedSkills({ ...pickedSkills, acceptable: pickedSkills.acceptable.slice(0, -1) })
        closeModal()
    }

    const confirmEditedSkills = () => {
        const pickedSkillNames = getAll(pickedSkills)
        setCharacter({
            ...character,
            skills: skillsFromSelection(pickedSkills),
            skillSpecialties: character.skillSpecialties.filter((specialty) =>
                pickedSkillNames.includes(specialty.skill)
            )
        })
        nextStep()
    }

    const resetSkills = () => {
        setPickedSkills(emptySkillsSetting)
        setPickedDistribution(null)
        setCharacter({
            ...character,
            skills: { ...emptySkills },
            skillSpecialties: []
        })
    }

    const createSkillButtons = () => (
        <Group>
            <Grid grow m={0}>
                <Grid.Col span={4}>
                    <Text fs="italic" fw={700} ta="center">
                        Physical
                    </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Text fs="italic" fw={700} ta="center">
                        Social
                    </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Text fs="italic" fw={700} ta="center">
                        Mental
                    </Text>
                </Grid.Col>
                {[
                    "athletics",
                    "animal ken",
                    "academics",
                    "brawl",
                    "etiquette",
                    "awareness",
                    "craft",
                    "insight",
                    "finance",
                    "drive",
                    "intimidation",
                    "investigation",
                    "firearms",
                    "leadership",
                    "medicine",
                    "melee",
                    "performance",
                    "occult",
                    "larceny",
                    "persuasion",
                    "politics",
                    "stealth",
                    "streetwise",
                    "science",
                    "survival",
                    "subterfuge",
                    "technology"
                ]
                    .map((s) => skillsKeySchema.parse(s))
                    .map((clan, i) => createButton(clan, i))}
            </Grid>
        </Group>
    )

    const phases = [
        pickedDistribution === "Specialist"
            ? {
                  key: "special",
                  prompt: "Pick your",
                  bold: `${distr.special - pickedSkills.special.length}`,
                  suffix: "specialty skill",
                  level: 4,
                  done: pickedSkills.special.length === distr.special
              }
            : null,
        {
            key: "strongest",
            prompt: "Pick your",
            bold: `${distr.strongest - pickedSkills.strongest.length} strongest`,
            suffix: "skills",
            level: 3,
            done: pickedSkills.strongest.length === distr.strongest
        },
        {
            key: "decent",
            prompt: "Pick",
            bold: `${distr.decent - pickedSkills.decent.length}`,
            suffix: "skills you're decent in",
            level: 2,
            done: pickedSkills.decent.length === distr.decent
        },
        {
            key: "acceptable",
            prompt: "Pick",
            bold: `${distr.acceptable - pickedSkills.acceptable.length}`,
            suffix: "skills you're ok in",
            level: 1,
            done: pickedSkills.acceptable.length === distr.acceptable
        }
    ].filter(Boolean) as Array<{
        key: string
        prompt: string
        bold: string
        suffix: string
        level: number
        done: boolean
    }>

    return (
        <div style={generatorScrollableShellStyle}>
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
                <div style={generatorScrollableContentStyle}>
                    {!pickedDistribution ? (
                        <>
                    <GeneratorStepHero
                        leadText="Pick your"
                        accentText="Skill Distribution"
                        description="Balanced is the default choice"
                        marginBottom={32}
                    />
                    <Grid grow m={0}>
                        {(
                            ["Jack of All Trades", "Balanced", "Specialist"] as DistributionKey[]
                        ).map((distribution) => {
                            return (
                                <Grid.Col span={4} key={distribution}>
                                    <Tooltip
                                        disabled={pickedDistribution !== null}
                                        label={distributionDescriptions[distribution]}
                                        transitionProps={{ transition: "slide-up", duration: 200 }}
                                        events={globals.tooltipTriggerEvents}
                                    >
                                        <Button
                                            data-testid={`skill-distribution-${distribution
                                                .toLowerCase()
                                                .replace(/\s+/g, "-")}-button`}
                                            p={phoneScreen ? "xs" : "default"}
                                            disabled={pickedDistribution !== null}
                                            color="red"
                                            fullWidth={false}
                                            style={{
                                                width: "88%",
                                                marginLeft: "auto",
                                                marginRight: "auto",
                                                display: "flex"
                                            }}
                                            onClick={() => {
                                                setPickedDistribution(distribution)
                                            }}
                                        >
                                            <Text fz={phoneScreen ? 12 : "inherit"} ta="left">
                                                {distribution}
                                            </Text>
                                        </Button>
                                    </Tooltip>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                    <Space h="xl" />
                    <Space h="xl" />
                        </>
                    ) : (
                        <GeneratorPhasePrompt
                            lines={phases}
                            activeKey={toPick}
                            phoneScreen={phoneScreen}
                            caption={pickedDistribution}
                        />
                    )}

                    <GeneratorSectionDivider label="Skills" />

                    <Space h="sm" />

                    {createSkillButtons()}
                </div>
            </ScrollArea>

            <SpecialtyModal
                modalOpened={modalOpened}
                closeModal={closeModalAndUndoLastPick}
                setCharacter={setCharacter}
                nextStep={nextStep}
                character={character}
                pickedSkillNames={getAll(pickedSkills)}
                skills={skillsFromSelection(pickedSkills)}
            />
            {hasConfirmedSkills ? (
                <Group justify="center" mt="md">
                    <Button
                        variant="outline"
                        color="red"
                        onClick={resetSkills}
                    >
                        Reset skills
                    </Button>
                    <Button
                        data-testid="skills-confirm-button"
                        color="grape"
                        disabled={!isComplete}
                        styles={generatorConfirmButtonStyles}
                        onClick={confirmEditedSkills}
                    >
                        Confirm
                    </Button>
                </Group>
            ) : null}
        </div>
    )
}

export default SkillsPicker
