import { Box, Button, Divider, Grid, Group, ScrollArea, Space, Stack, Text, Title, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import { Skills, SkillsKey, emptySkills, skillsDescriptions, skillsKeySchema } from "../../data/Skills"
import { globals } from "../../globals"
import { upcase } from "../utils"
import { SpecialtyModal } from "./SkillSpecialtyModal"

type SkillsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SkillsSetting = {
    special: SkillsKey[]
    strongest: SkillsKey[]
    decent: SkillsKey[]
    acceptable: SkillsKey[]
}

type DistributionKey = "Jack of All Trades" | "Balanced" | "Specialist"

type SkillDistribution = { strongest: number; decent: number; acceptable: number; special: number }

const distributionDescriptions: Record<DistributionKey, string> = {
    "Jack of All Trades": "Decent at many things, good at none (1/8/10)",
    Balanced: "Best default choice (3/5/7)",
    Specialist: "Uniquely great at one thing, bad at most (1/3/3/3)",
}

const distributionByType: Record<DistributionKey, SkillDistribution> = {
    "Jack of All Trades": {
        special: 0,
        strongest: 1,
        decent: 8,
        acceptable: 10,
    },
    Balanced: {
        special: 0,
        strongest: 3,
        decent: 5,
        acceptable: 7,
    },
    Specialist: {
        special: 1,
        strongest: 3,
        decent: 3,
        acceptable: 3,
    },
}

const getAll = (skillSetting: SkillsSetting): SkillsKey[] => {
    return Object.values(skillSetting).reduce((acc, s) => [...acc, ...s], [])
}

const SkillsPicker = ({ character, setCharacter, nextStep }: SkillsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Skills Picker" })
    }, [])

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [skills, setSkills] = useState(emptySkills)
    const [pickedSkills, setPickedSkills] = useState<SkillsSetting>({ special: [], strongest: [], decent: [], acceptable: [] })
    const [pickedDistribution, setPickedDistribution] = useState<DistributionKey | null>(null)
    const distr = pickedDistribution ? distributionByType[pickedDistribution] : { special: 0, strongest: 0, decent: 0, acceptable: 0 }

    const createButton = (skill: SkillsKey, i: number) => {
        const alreadyPicked = [...pickedSkills.special, ...pickedSkills.strongest, ...pickedSkills.decent, ...pickedSkills.acceptable].includes(skill)
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
                    acceptable: pickedSkills.acceptable.filter((it) => it !== skill),
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
        } else if (pickedSkills.acceptable.length < distr.acceptable - 1) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] })
            }
        } else {
            const finalPick = { ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] }
            onClick = () => {
                const skills: Skills = {
                    athletics: 0,
                    brawl: 0,
                    craft: 0,
                    drive: 0,
                    firearms: 0,
                    melee: 0,
                    larceny: 0,
                    stealth: 0,
                    survival: 0,

                    "animal ken": 0,
                    etiquette: 0,
                    insight: 0,
                    intimidation: 0,
                    leadership: 0,
                    performance: 0,
                    persuasion: 0,
                    streetwise: 0,
                    subterfuge: 0,

                    academics: 0,
                    awareness: 0,
                    finance: 0,
                    investigation: 0,
                    medicine: 0,
                    occult: 0,
                    politics: 0,
                    science: 0,
                    technology: 0,
                }
                finalPick.special.forEach((special) => (skills[special] = 4))
                finalPick.strongest.forEach((strongest) => (skills[strongest] = 3))
                finalPick.decent.forEach((decent) => (skills[decent] = 2))
                finalPick.acceptable.forEach((acceptable) => (skills[acceptable] = 1))

                setPickedSkills(finalPick)
                setSkills(skills)
                openModal()
            }
        }

        const trackClick = () => {
            trackEvent({
                action: "skill clicked",
                category: "skills",
                label: skill,
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
                        p={phoneScreen ? 0 : "default"}
                        variant={alreadyPicked ? "outline" : "filled"}
                        disabled={pickedDistribution === null}
                        color="grape"
                        fullWidth={false}
                        style={{ width: "88%", marginLeft: "auto", marginRight: "auto", minHeight: phoneScreen ? 36 : 40 }}
                        styles={{
                            inner: {
                                alignItems: "center",
                                justifyContent: phoneScreen ? "center" : "space-between",
                                paddingTop: 2,
                                paddingBottom: 3,
                            },
                            label: {
                                lineHeight: 1.3,
                                overflow: "visible",
                                flex: 1,
                            },
                            section: {
                                overflow: "visible",
                            },
                            root: {
                                justifyContent: "space-between",
                                background:
                                    assignedLevel === 4
                                        ? "rgba(197, 32, 32, 0.38)"
                                        : assignedLevel === 3
                                          ? "rgba(197, 32, 32, 0.2)"
                                          : assignedLevel === 2
                                            ? "rgba(204, 166, 51, 0.4)"
                                            : assignedLevel === 1
                                              ? "rgba(43, 43, 43, 0.5)"
                                              : pickedDistribution === null
                                                ? "rgba(43, 43, 43, 0.3)"
                                                : "rgba(126, 74, 201, 0.8)",
                                borderColor:
                                    assignedLevel === 4
                                        ? "rgba(224, 49, 49, 1)"
                                        : assignedLevel === 3
                                          ? "rgba(224, 49, 49, 0.95)"
                                          : assignedLevel === 2
                                            ? "rgba(201, 172, 102, 0.9)"
                                            : assignedLevel === 1
                                              ? "rgba(180, 180, 180, 0.42)"
                                              : pickedDistribution === null
                                                ? "rgba(180, 180, 180, 0.24)"
                                                : "rgba(183, 148, 246, 0.45)",
                                color: alreadyPicked ? "rgba(244, 236, 232, 0.95)" : undefined,
                            },
                        }}
                        rightSection={
                            !phoneScreen && assignedLevel ? (
                                <Group gap={4} wrap="nowrap">
                                    {Array.from({ length: 5 }).map((_, dotIndex) => (
                                        <Box
                                            key={`${skill}-dot-${dotIndex}`}
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "999px",
                                                background:
                                                    dotIndex < assignedLevel
                                                        ? assignedLevel === 4 || assignedLevel === 3
                                                            ? "rgba(224, 49, 49, 1)"
                                                            : assignedLevel === 2
                                                              ? "rgba(232, 204, 92, 0.98)"
                                                              : "rgba(210, 210, 210, 0.85)"
                                                        : "rgba(255, 255, 255, 0.14)",
                                                boxShadow:
                                                    dotIndex < assignedLevel && (assignedLevel === 4 || assignedLevel === 3)
                                                        ? "0 0 6px rgba(224, 49, 49, 0.38)"
                                                        : "none",
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
                        <Text fz={phoneScreen ? 12 : "inherit"} lh={1.3} ta={phoneScreen ? "center" : "left"} style={{ width: "100%" }}>
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
                    "technology",
                ]
                    .map((s) => skillsKeySchema.parse(s))
                    .map((clan, i) => createButton(clan, i))}
            </Grid>
        </Group>
    )

    const height = globals.viewportHeightPx
    const phases = [
        pickedDistribution === "Specialist"
            ? {
                  key: "special",
                  prompt: "Pick your",
                  bold: `${distr.special - pickedSkills.special.length}`,
                  suffix: "specialty skill",
                  level: 4,
                  done: pickedSkills.special.length === distr.special,
              }
            : null,
        {
            key: "strongest",
            prompt: "Pick your",
            bold: `${distr.strongest - pickedSkills.strongest.length} strongest`,
            suffix: "skills",
            level: 3,
            done: pickedSkills.strongest.length === distr.strongest,
        },
        {
            key: "decent",
            prompt: "Pick",
            bold: `${distr.decent - pickedSkills.decent.length}`,
            suffix: "skills you're decent in",
            level: 2,
            done: pickedSkills.decent.length === distr.decent,
        },
        {
            key: "acceptable",
            prompt: "Pick",
            bold: `${distr.acceptable - pickedSkills.acceptable.length}`,
            suffix: "skills you're ok in",
            level: 1,
            done: pickedSkills.acceptable.length === distr.acceptable,
        },
    ].filter(Boolean) as Array<{ key: string; prompt: string; bold: string; suffix: string; level: number; done: boolean }>

    return (
        <div style={{ marginTop: height < globals.heightBreakPoint ? "60px" : 0 }}>
            {!pickedDistribution ? (
                <>
                    <Text fz={globals.largeFontSize} ta={"center"}>
                        Pick your <b>Skill Distribution</b>
                    </Text>
                    <Space h="xl" />
                    <Grid grow>
                        {(["Jack of All Trades", "Balanced", "Specialist"] as DistributionKey[]).map((distribution) => {
                            return (
                                <Grid.Col span={4} key={distribution}>
                                    <Tooltip
                                        disabled={pickedDistribution !== null}
                                        label={distributionDescriptions[distribution]}
                                        transitionProps={{ transition: "slide-up", duration: 200 }}
                                        events={globals.tooltipTriggerEvents}
                                    >
                                        <Button
                                            p={phoneScreen ? 0 : "default"}
                                            disabled={pickedDistribution !== null}
                                            color="red"
                                            fullWidth
                                            onClick={() => {
                                                setPickedDistribution(distribution)
                                            }}
                                        >
                                            <Text fz={phoneScreen ? 12 : "inherit"}>{distribution}</Text>
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
                <Stack gap={6} align="center" mb="md">
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            fontSize: "0.78rem",
                            letterSpacing: "0.06em",
                            color: "rgba(214, 204, 198, 0.42)",
                        }}
                    >
                        {pickedDistribution}
                    </Text>
                    {phases.map((phase) => {
                        const isActive = toPick === phase.key
                        const isPast = phase.done && !isActive

                        return (
                            <Box
                                key={phase.key}
                                style={{
                                    position: "relative",
                                    height: phoneScreen ? "1.9rem" : "2.35rem",
                                    width: "100%",
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: isPast ? 0.28 : isActive ? 1 : 0.5, y: 0 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text
                                        ta="center"
                                        style={{
                                            fontFamily: "Crimson Text, Georgia, serif",
                                            fontSize: isActive ? (phoneScreen ? "1.15rem" : "1.45rem") : phoneScreen ? "0.95rem" : "1rem",
                                            lineHeight: 1.1,
                                            color: isActive ? "rgba(244, 236, 232, 0.95)" : "rgba(214, 204, 198, 0.56)",
                                            transition: "all 220ms ease",
                                        }}
                                    >
                                        {isActive ? (
                                            <motion.span
                                                animate={{ opacity: [0.65, 1, 0.65] }}
                                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    fontFamily: "Cinzel, Georgia, serif",
                                                    color: "rgba(224, 49, 49, 1)",
                                                    marginRight: "0.4rem",
                                                }}
                                            >
                                                {"›"}
                                            </motion.span>
                                        ) : null}
                                        {phase.prompt}{" "}
                                        <span
                                            style={{
                                                fontFamily: "Cinzel, Georgia, serif",
                                                letterSpacing: "0.05em",
                                                color: isActive ? "rgba(224, 49, 49, 1)" : "inherit",
                                                textDecoration: isPast ? "line-through" : "none",
                                            }}
                                        >
                                            {phase.bold}
                                        </span>{" "}
                                        {phase.suffix}
                                        <span
                                            style={{
                                                marginLeft: "0.45rem",
                                                fontFamily: "Inter, Segoe UI, sans-serif",
                                                fontSize: phoneScreen ? "0.68rem" : "0.72rem",
                                                letterSpacing: "0.11em",
                                                textTransform: "uppercase",
                                                opacity: isActive ? 0.72 : 0.5,
                                            }}
                                        >
                                            lvl {phase.level}
                                        </span>
                                    </Text>
                                </motion.div>
                            </Box>
                        )
                    })}
                </Stack>
            )}

            <Box my="lg">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.3) 50%, transparent 100%)" }} />
                    <Title
                        order={4}
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            color: "rgba(224, 49, 49, 1)",
                        }}
                    >
                        Skills
                    </Title>
                    <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.3) 50%, transparent 100%)" }} />
                </div>
            </Box>

            <Space h="sm" />

            {height < globals.heightBreakPoint ? <ScrollArea h={height - 340}>{createSkillButtons()}</ScrollArea> : createSkillButtons()}

            <SpecialtyModal
                modalOpened={modalOpened}
                closeModal={closeModalAndUndoLastPick}
                setCharacter={setCharacter}
                nextStep={nextStep}
                character={character}
                pickedSkillNames={getAll(pickedSkills)}
                skills={skills}
            />
        </div>
    )
}

export default SkillsPicker
