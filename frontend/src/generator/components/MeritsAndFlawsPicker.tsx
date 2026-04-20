import { faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Badge, Box, Button, Divider, Grid, Group, Modal, ScrollArea, Stack, Tabs, Text, Tooltip, useMantineTheme } from "@mantine/core"
import { Dispatch, memo, SetStateAction, useEffect, useMemo, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, MeritFlaw } from "../../data/Character"
import { clans } from "../../data/Clans"
import { isThinbloodFlaw, isThinbloodMerit, MeritOrFlaw, meritsAndFlaws, thinbloodMeritsAndFlaws } from "../../data/MeritsAndFlaws"
import { PredatorTypes } from "../../data/PredatorType"
import { globals } from "../../globals"
import { Loresheets } from "./Loresheets"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type MeritsAndFlawsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type ResetTarget = "merit" | "flaw" | null

const flawIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={90} style={{ color: "#e03131" }} />
}
const meritIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={270} style={{ color: "rgb(47, 158, 68)" }} />
}

const sectionHeadingStyle = {
    fontFamily: "Cinzel, Georgia, serif",
    fontSize: "0.96rem",
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
}

type MeritOrFlawCardProps = {
    meritOrFlaw: MeritOrFlaw
    type: "flaw" | "merit"
    pickedByName: Map<string, MeritFlaw>
    exclusionMap: Map<string, string[]>
    predatorTypeMeritsByName: Map<string, MeritFlaw>
    remainingMerits: number
    remainingFlaws: number
    remainingThinbloodMeritPoints: number
    phoneScreen: boolean
    setPickedMeritsAndFlaws: Dispatch<SetStateAction<MeritFlaw[]>>
    setRemainingMerits: Dispatch<SetStateAction<number>>
    setRemainingFlaws: Dispatch<SetStateAction<number>>
    setRemainingThinbloodMeritPoints: Dispatch<SetStateAction<number>>
}

const MeritOrFlawCard = memo(({
    meritOrFlaw,
    type,
    pickedByName,
    exclusionMap,
    predatorTypeMeritsByName,
    remainingMerits,
    remainingFlaws,
    remainingThinbloodMeritPoints,
    phoneScreen,
    setPickedMeritsAndFlaws,
    setRemainingMerits,
    setRemainingFlaws,
    setRemainingThinbloodMeritPoints,
}: MeritOrFlawCardProps) => {
    const buttonColor = type === "flaw" ? "red" : "teal"
    const icon = type === "flaw" ? flawIcon() : meritIcon()
    const lineKey = `${type}-${meritOrFlaw.name}`
    const accentColor = type === "flaw" ? "rgba(250, 82, 82, 0.92)" : "rgba(63, 192, 120, 0.92)"
    const selectedBg = type === "flaw" ? "rgba(224, 49, 49, 0.18)" : "rgba(46, 160, 67, 0.16)"
    const selectedBorder = type === "flaw" ? "rgba(250, 82, 82, 0.38)" : "rgba(63, 192, 120, 0.32)"
    const baseBg = "rgba(255, 255, 255, 0.03)"
    const baseBorder = "rgba(255, 255, 255, 0.06)"

    const alreadyPickedItem = pickedByName.get(meritOrFlaw.name)
    const wasPickedLevel = alreadyPickedItem?.level ?? 0
    const excludingItems = exclusionMap.get(meritOrFlaw.name) ?? []
    const isExcluded = excludingItems.length > 0

    const meritInPredatorType = predatorTypeMeritsByName.get(meritOrFlaw.name)
    const meritInPredatorTypeLevel = meritInPredatorType?.level ?? 0

    const createButton = (level: number) => {
        const cost = level - meritInPredatorTypeLevel
        return (
            <Button
                key={meritOrFlaw.name + level}
                disabled={
                    isExcluded ||
                    (meritInPredatorType && meritInPredatorType.level >= level) ||
                    wasPickedLevel === level
                }
                onClick={() => {
                    if (isThinbloodFlaw(meritOrFlaw.name)) {
                        setRemainingThinbloodMeritPoints((prev) => prev + 1)
                    } else if (isThinbloodMerit(meritOrFlaw.name)) {
                        if (remainingThinbloodMeritPoints < cost) return
                        setRemainingThinbloodMeritPoints((prev) => prev - 1)
                    } else if (type === "flaw") {
                        if (remainingFlaws + wasPickedLevel < cost) return
                        setRemainingFlaws((prev) => prev + wasPickedLevel - cost)
                    } else {
                        if (remainingMerits + wasPickedLevel < cost) return
                        setRemainingMerits((prev) => prev + wasPickedLevel - cost)
                    }
                    setPickedMeritsAndFlaws((prev) => [
                        ...prev.filter((m) => m.name !== meritOrFlaw.name),
                        { name: meritOrFlaw.name, level, type, summary: meritOrFlaw.summary, excludes: meritOrFlaw.excludes },
                    ])
                }}
                style={{ marginRight: "5px" }}
                size="xs"
                variant={alreadyPickedItem?.level === level ? "filled" : "outline"}
                color={buttonColor}
                styles={{
                    root: {
                        minWidth: 36,
                        borderColor: type === "flaw" ? "rgba(250, 82, 82, 0.45)" : "rgba(63, 192, 120, 0.4)",
                        background: alreadyPickedItem?.level === level ? accentColor : "transparent",
                        color: "rgba(244, 236, 232, 0.92)",
                    },
                }}
            >
                {level}
            </Button>
        )
    }

    const cost = wasPickedLevel - meritInPredatorTypeLevel
    const summaryText = meritInPredatorType
        ? "Already picked in Predator Type"
        : isExcluded
          ? `Excluded by: ${excludingItems.join(", ")}`
          : meritOrFlaw.summary

    const textContent = (
        <Box
            key={lineKey}
            style={{
                padding: phoneScreen ? "12px" : "14px 16px",
                borderRadius: 14,
                border: `1px solid ${alreadyPickedItem ? selectedBorder : baseBorder}`,
                background: alreadyPickedItem ? selectedBg : baseBg,
                opacity: isExcluded ? 0.5 : 1,
                transition: "background 180ms ease, border-color 180ms ease",
            }}
        >
            <Group justify="space-between" align="flex-start" gap="sm" mb={6}>
                <Text
                    style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: phoneScreen ? "0.88rem" : "0.94rem",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: alreadyPickedItem ? accentColor : "rgba(244, 236, 232, 0.94)",
                        flex: 1,
                    }}
                >
                    {icon} &nbsp;<span>{meritOrFlaw.name}</span>
                </Text>
                <Badge
                    variant="light"
                    radius="sm"
                    color={type === "flaw" ? "red" : "teal"}
                    styles={{ root: { textTransform: "uppercase", letterSpacing: "0.08em" } }}
                >
                    {type}
                </Badge>
            </Group>

            <Text
                style={{
                    fontFamily: "Crimson Text, Georgia, serif",
                    fontSize: phoneScreen ? "0.95rem" : "1rem",
                    lineHeight: 1.45,
                    color: meritInPredatorType
                        ? "rgba(212, 176, 105, 0.88)"
                        : isExcluded
                          ? "rgba(214, 204, 198, 0.72)"
                          : "rgba(214, 204, 198, 0.88)",
                }}
            >
                {summaryText}
            </Text>

            <Group gap={6} mt={10}>
                {meritOrFlaw.cost.map((i) => createButton(i))}
                {alreadyPickedItem ? (
                    <Button
                        onClick={() => {
                            setPickedMeritsAndFlaws((prev) => prev.filter((m) => m.name !== meritOrFlaw.name))
                            if (isThinbloodFlaw(meritOrFlaw.name)) {
                                setRemainingThinbloodMeritPoints((prev) => prev - 1)
                            } else if (isThinbloodMerit(meritOrFlaw.name)) {
                                setRemainingThinbloodMeritPoints((prev) => prev + 1)
                            } else {
                                type === "flaw"
                                    ? setRemainingFlaws((prev) => prev + cost)
                                    : setRemainingMerits((prev) => prev + cost)
                            }
                        }}
                        size="xs"
                        variant="subtle"
                        color="yellow"
                        styles={{ root: { paddingLeft: 8, paddingRight: 8 } }}
                    >
                        Unpick
                    </Button>
                ) : null}
            </Group>
        </Box>
    )

    if (isExcluded) {
        return (
            <Tooltip key={lineKey} label={`This ${type} is excluded because you already have: ${excludingItems.join(", ")}`} withArrow>
                {textContent}
            </Tooltip>
        )
    }

    return textContent
})

const MeritsAndFlawsPicker = ({ character, setCharacter, nextStep }: MeritsAndFlawsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Merits-and-flaws Picker" })
    }, [])
    const theme = useMantineTheme()
    const phoneScreen = globals.isPhoneScreen

    const [activeTab, setActiveTab] = useState<string | null>("merits")
    const [resetTarget, setResetTarget] = useState<ResetTarget>(null)

    const [pickedMeritsAndFlaws, setPickedMeritsAndFlaws] = useState<MeritFlaw[]>([
        ...character.merits,
        ...character.flaws,
        ...character.predatorType.pickedMeritsAndFlaws,
    ])

    const usedMeritsLevel = character.merits.filter((m) => !isThinbloodMerit(m.name)).reduce((acc, { level }) => acc + level, 0)
    const usedFLawsLevel = character.flaws.filter((f) => !isThinbloodFlaw(f.name)).reduce((acc, { level }) => acc + level, 0)

    const meritPoints = character.generation === 10 || character.generation === 11 ? 9 : 7
    const flawPoints = character.generation === 10 || character.generation === 11 ? 4 : 2

    const [remainingMerits, setRemainingMerits] = useState(meritPoints - usedMeritsLevel)
    const [remainingFlaws, setRemainingFlaws] = useState(flawPoints - usedFLawsLevel)

    const isThinBlood = character.clan === "Thin-blood"
    const tbMeritCount = character.merits.filter((m) => isThinbloodMerit(m.name)).length
    const tbFlawCount = character.flaws.filter((f) => isThinbloodFlaw(f.name)).length
    const [remainingThinbloodMeritPoints, setRemainingThinbloodMeritPoints] = useState(tbFlawCount - tbMeritCount)

    const predatorTypePickedNames = useMemo(
        () => new Set(character.predatorType.pickedMeritsAndFlaws.map((item) => item.name)),
        [character.predatorType.pickedMeritsAndFlaws]
    )

    const pickedByName = useMemo(
        () => new Map(pickedMeritsAndFlaws.map((item) => [item.name, item])),
        [pickedMeritsAndFlaws]
    )

    const predatorTypeMeritsFlaws = useMemo(
        () => PredatorTypes[character.predatorType.name].meritsAndFlaws,
        [character.predatorType.name]
    )

    const predatorTypeMeritsByName = useMemo(
        () => new Map(predatorTypeMeritsFlaws.map((m) => [m.name, m])),
        [predatorTypeMeritsFlaws]
    )

    const exclusionMap = useMemo(() => {
        const map = new Map<string, string[]>()
        pickedMeritsAndFlaws.forEach((meritFlaw) => {
            meritFlaw.excludes.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(meritFlaw.name)
            })
        })
        const predatorType = PredatorTypes[character.predatorType.name]
        if (predatorType) {
            predatorType.meritsAndFlaws.forEach((meritFlaw) => {
                meritFlaw.excludes.forEach((excludedName) => {
                    if (!map.has(excludedName)) {
                        map.set(excludedName, [])
                    }
                    map.get(excludedName)?.push(meritFlaw.name)
                })
            })
        }
        const clan = clans[character.clan]
        if (clan?.excludedMeritsAndFlaws) {
            clan.excludedMeritsAndFlaws.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(`${character.clan} clan`)
            })
        }
        return map
    }, [pickedMeritsAndFlaws, character.predatorType.name, character.clan])

    const cardProps: Omit<MeritOrFlawCardProps, "meritOrFlaw" | "type"> = {
        pickedByName,
        exclusionMap,
        predatorTypeMeritsByName,
        remainingMerits,
        remainingFlaws,
        remainingThinbloodMeritPoints,
        phoneScreen,
        setPickedMeritsAndFlaws,
        setRemainingMerits,
        setRemainingFlaws,
        setRemainingThinbloodMeritPoints,
    }

    const getMeritOrFlawLine = (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit"): JSX.Element => (
        <MeritOrFlawCard key={`${type}-${meritOrFlaw.name}`} meritOrFlaw={meritOrFlaw} type={type} {...cardProps} />
    )

    const isConfirmDisabled = isThinBlood && remainingThinbloodMeritPoints < 0
    const meritSpentPoints = meritPoints - remainingMerits
    const flawSpentPoints = flawPoints - remainingFlaws

    const handleReset = () => {
        if (resetTarget === "merit") {
            setPickedMeritsAndFlaws((current) =>
                current.filter((item) => item.type !== "merit" || predatorTypePickedNames.has(item.name))
            )
            setRemainingMerits(meritPoints)
            setRemainingThinbloodMeritPoints(tbFlawCount)
        }

        if (resetTarget === "flaw") {
            setPickedMeritsAndFlaws((current) =>
                current.filter((item) => item.type !== "flaw" || predatorTypePickedNames.has(item.name))
            )
            setRemainingFlaws(flawPoints)
            setRemainingThinbloodMeritPoints(-tbMeritCount)
        }

        setResetTarget(null)
    }

    return (
        <div style={generatorScrollableShellStyle}>
            <Stack align="center" gap="md" style={{ ...generatorScrollableAreaStyle, width: "100%" }}>
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
                        <Stack gap="lg" pb="xl">
                            <Stack gap={6} align="center" mb={phoneScreen ? 8 : 12}>
                                <Text
                                    ta="center"
                                    style={{
                                        fontFamily: "Crimson Text, Georgia, serif",
                                        fontSize: phoneScreen ? "1.95rem" : "2.35rem",
                                        lineHeight: 1.1,
                                        color: "rgba(244, 236, 232, 0.95)",
                                    }}
                                >
                                    Shape your{" "}
                                    <span
                                        style={{
                                            fontFamily: "Cinzel, Georgia, serif",
                                            letterSpacing: "0.05em",
                                            color: "rgba(224, 49, 49, 1)",
                                        }}
                                    >
                                        Merits & Flaws
                                    </span>
                                </Text>
                                <Text
                                    ta="center"
                                    maw={720}
                                    style={{
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        fontSize: phoneScreen ? "0.82rem" : "0.9rem",
                                        letterSpacing: "0.04em",
                                        color: "rgba(214, 204, 198, 0.5)",
                                    }}
                                >
                                    Define what empowers you, what complicates your unlife, and which loresheets still fit your story.
                                </Text>
                            </Stack>

                        <Grid m={0} gutter="sm">
                            <Grid.Col span={phoneScreen ? 12 : 4}>
                                <PointCard
                                    label="Advantage Points"
                                    value={`${meritSpentPoints}/${meritPoints}`}
                                    tone="merit"
                                    onReset={() => setResetTarget("merit")}
                                />
                            </Grid.Col>
                            <Grid.Col span={phoneScreen ? 12 : 4}>
                                <PointCard
                                    label="Flaw Points"
                                    value={`${flawSpentPoints}/${flawPoints}`}
                                    tone="flaw"
                                    onReset={() => setResetTarget("flaw")}
                                />
                            </Grid.Col>
                                {isThinBlood ? (
                                    <Grid.Col span={phoneScreen ? 12 : 4}>
                                        <PointCard
                                            label="Thin-blood Balance"
                                            value={remainingThinbloodMeritPoints}
                                            tone={remainingThinbloodMeritPoints < 0 ? "warning" : "neutral"}
                                            helper="Gain merit points by taking thin-blood flaws."
                                        />
                                    </Grid.Col>
                                ) : null}
                            </Grid>

                            <Tabs
                                color="red"
                                value={activeTab}
                                onChange={setActiveTab}
                                styles={{
                                    list: {
                                        gap: 10,
                                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                                        paddingBottom: 10,
                                    },
                                    tab: {
                                        borderRadius: 999,
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        background: "rgba(255, 255, 255, 0.03)",
                                        color: "rgba(214, 204, 198, 0.72)",
                                        fontFamily: "Cinzel, Georgia, serif",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        fontSize: "0.78rem",
                                        fontWeight: 600,
                                        transition: "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
                                    },
                                    panel: {
                                        paddingTop: 18,
                                    },
                                }}
                            >
                            <Tabs.List>
                                <Tabs.Tab
                                    value="merits"
                                    style={activeTab === "merits" ? {
                                        background: "linear-gradient(135deg, rgba(160, 80, 200, 0.4), rgba(224, 49, 49, 0.35))",
                                        border: "1px solid rgba(224, 49, 49, 0.6)",
                                        color: "rgba(248, 240, 235, 0.96)",
                                        boxShadow: "0 4px 20px rgba(180, 60, 60, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                        transform: "translateY(-1px)",
                                    } : undefined}
                                >
                                    Merits & Flaws
                                </Tabs.Tab>
                                <Tabs.Tab
                                    value="loresheets"
                                    style={activeTab === "loresheets" ? {
                                        background: "linear-gradient(135deg, rgba(160, 80, 200, 0.4), rgba(224, 49, 49, 0.35))",
                                        border: "1px solid rgba(224, 49, 49, 0.6)",
                                        color: "rgba(248, 240, 235, 0.96)",
                                        boxShadow: "0 4px 20px rgba(180, 60, 60, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                        transform: "translateY(-1px)",
                                    } : undefined}
                                >
                                    Loresheets
                                </Tabs.Tab>
                            </Tabs.List>

                                <Tabs.Panel value="merits">
                                    <Box
                                        style={{
                                            padding: phoneScreen ? "14px" : "18px",
                                            borderRadius: 20,
                                            background: "rgba(14, 15, 18, 0.66)",
                                            border: "1px solid rgba(255, 255, 255, 0.05)",
                                            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.24)",
                                        }}
                                    >
                                        {isThinBlood ? (
                                            <Stack gap={2} align="center" mb="lg">
                                                <Text
                                                    ta="center"
                                                    style={{
                                                        fontFamily: "Crimson Text, Georgia, serif",
                                                        fontSize: phoneScreen ? "1.1rem" : "1.25rem",
                                                        color: theme.colors.grape[3],
                                                    }}
                                                >
                                                    Pick Thin-blood flaws to gain Thin-blood merit points
                                                </Text>
                                                <Text
                                                    ta="center"
                                                    style={{
                                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                                        fontSize: "0.8rem",
                                                        letterSpacing: "0.06em",
                                                        color: "rgba(214, 204, 198, 0.56)",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    Balance: {remainingThinbloodMeritPoints}
                                                </Text>
                                            </Stack>
                                        ) : null}

                                        <Grid m={0} gutter="lg">
                                            {isThinBlood ? thinBloodMeritsAndFlawsComponent(getMeritOrFlawLine, phoneScreen) : null}

                                            {meritsAndFlaws.map((category) => {
                                                return (
                                                    <Grid.Col span={phoneScreen ? 12 : 6} key={category.title}>
                                                        <Stack gap="sm">
                                                            <SectionHeading label={category.title} />
                                                            {category.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                                                            {category.flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                                                        </Stack>
                                                    </Grid.Col>
                                                )
                                            })}
                                        </Grid>
                                    </Box>
                                </Tabs.Panel>

                                <Tabs.Panel value="loresheets">
                                    <Loresheets
                                        character={character}
                                        getMeritOrFlawLine={getMeritOrFlawLine}
                                        pickedMeritsAndFlaws={pickedMeritsAndFlaws}
                                    />
                                </Tabs.Panel>
                            </Tabs>
                        </Stack>
                    </div>
                </ScrollArea>

                <Stack gap="xs" align="center">
                    {isConfirmDisabled ? (
                        <Text c={theme.colors.red[5]} ta="center">
                            Need to balance Thin-blood merit points
                        </Text>
                    ) : null}
                    <Button
                        color="grape"
                        disabled={isConfirmDisabled}
                        onClick={() => {
                            updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                            setCharacter({
                                ...character,
                                merits: pickedMeritsAndFlaws.filter((l) => l.type === "merit"),
                                flaws: pickedMeritsAndFlaws.filter((l) => l.type === "flaw"),
                            })

                            trackEvent({
                                action: "merits confirm clicked",
                                category: "merits",
                                label: pickedMeritsAndFlaws.map((m) => `${m.name}: ${m.level}`).join(", "),
                            })

                            nextStep()
                        }}
                        styles={generatorConfirmButtonStyles}
                    >
                        Confirm
                    </Button>
                </Stack>
            </Stack>

            <Modal
                opened={resetTarget !== null}
                onClose={() => setResetTarget(null)}
                title=""
                centered
                withCloseButton={false}
                overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
                styles={{
                    content: {
                        border: "1px solid rgba(125, 91, 72, 0.38)",
                        background: "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
                        boxShadow: "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    },
                    body: {
                        padding: phoneScreen ? "1.1rem" : "1.35rem",
                    },
                }}
            >
                <Stack gap="md">
                    <Stack gap={6} align="center">
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                fontSize: phoneScreen ? "1.2rem" : "1.35rem",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(244, 236, 232, 0.95)",
                            }}
                        >
                            Reset {resetTarget === "merit" ? "Advantages" : "Flaws"}?
                        </Text>
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                fontSize: "0.9rem",
                                color: "rgba(214, 204, 198, 0.62)",
                            }}
                        >
                            This will remove your picked {resetTarget === "merit" ? "advantages" : "flaws"} from this step.
                            Predator type picks are kept.
                        </Text>
                    </Stack>

                    <Divider color="rgba(125, 91, 72, 0.28)" />

                    <Group justify="space-between">
                        <Button
                            color="gray"
                            variant="subtle"
                            onClick={() => setResetTarget(null)}
                            styles={{
                                root: {
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                },
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="red"
                            onClick={handleReset}
                            styles={{
                                root: {
                                    background: "linear-gradient(180deg, rgba(224, 49, 49, 0.92) 0%, rgba(186, 38, 38, 0.95) 100%)",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                    boxShadow: "0 10px 24px rgba(224, 49, 49, 0.24)",
                                },
                            }}
                        >
                            Reset
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    )
}

const PointCard = ({
    label,
    value,
    tone,
    helper,
    onReset,
}: {
    label: string
    value: number | string
    tone: "merit" | "flaw" | "warning" | "neutral"
    helper?: string
    onReset?: () => void
}) => {
    const palette = {
        merit: {
            border: "rgba(63, 192, 120, 0.24)",
            bg: "rgba(46, 160, 67, 0.1)",
            value: "rgba(96, 230, 156, 0.95)",
        },
        flaw: {
            border: "rgba(250, 82, 82, 0.24)",
            bg: "rgba(224, 49, 49, 0.1)",
            value: "rgba(255, 135, 135, 0.95)",
        },
        warning: {
            border: "rgba(250, 176, 5, 0.28)",
            bg: "rgba(250, 176, 5, 0.08)",
            value: "rgba(255, 212, 117, 0.95)",
        },
        neutral: {
            border: "rgba(183, 148, 246, 0.24)",
            bg: "rgba(132, 94, 247, 0.09)",
            value: "rgba(214, 204, 198, 0.94)",
        },
    }[tone]

    return (
        <Box
            style={{
                height: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                border: `1px solid ${palette.border}`,
                background: palette.bg,
            }}
        >
            <Text
                style={{
                    fontFamily: "Inter, Segoe UI, sans-serif",
                    fontSize: "0.74rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(214, 204, 198, 0.54)",
                    marginBottom: 6,
                }}
            >
                {label}
            </Text>
            <Text
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: "1.55rem",
                    lineHeight: 1,
                    color: palette.value,
                }}
            >
                {value}
            </Text>
            {onReset ? (
                <Button
                    mt={10}
                    size="xs"
                    variant="subtle"
                    color={tone === "flaw" ? "red" : "teal"}
                    onClick={onReset}
                    styles={{
                        root: {
                            paddingLeft: 0,
                            paddingRight: 0,
                            height: "auto",
                        },
                        label: {
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: "0.72rem",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                        },
                    }}
                >
                    Reset
                </Button>
            ) : null}
            {helper ? (
                <Text
                    mt={8}
                    style={{
                        fontFamily: "Crimson Text, Georgia, serif",
                        fontSize: "0.95rem",
                        color: "rgba(214, 204, 198, 0.72)",
                    }}
                >
                    {helper}
                </Text>
            ) : null}
        </Box>
    )
}

const SectionHeading = ({ label }: { label: string }) => (
    <Box my="xs">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.32) 50%, transparent 100%)" }} />
            <Text style={{ ...sectionHeadingStyle, color: "rgba(224, 49, 49, 1)" }}>{label}</Text>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.32) 50%, transparent 100%)" }} />
        </div>
    </Box>
)

function thinBloodMeritsAndFlawsComponent(
    getMeritOrFlawLine: (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => JSX.Element,
    phoneScreen: boolean
) {
    return (
        <>
            <Grid.Col span={phoneScreen ? 12 : 6}>
                <Stack gap={"sm"}>
                    <SectionHeading label="Thin-blood merits" />
                    {thinbloodMeritsAndFlaws.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                </Stack>
            </Grid.Col>
            <Grid.Col span={phoneScreen ? 12 : 6}>
                <Stack gap={"sm"}>
                    <SectionHeading label="Thin-blood flaws" />
                    {thinbloodMeritsAndFlaws.flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                </Stack>
            </Grid.Col>

            <Grid.Col span={12}>
                <Divider mt={0} w={"100%"} my={"sm"} color="rgba(255, 255, 255, 0.1)" />
            </Grid.Col>
        </>
    )
}

export default MeritsAndFlawsPicker
