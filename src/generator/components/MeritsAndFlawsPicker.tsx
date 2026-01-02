import { faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, ScrollArea, Stack, Tabs, Text, Tooltip, useMantineTheme } from "@mantine/core"
import { useEffect, useMemo, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, MeritFlaw } from "../../data/Character"
import { clans } from "../../data/Clans"
import { isThinbloodFlaw, isThinbloodMerit, MeritOrFlaw, meritsAndFlaws, thinbloodMeritsAndFlaws } from "../../data/MeritsAndFlaws"
import { PredatorTypes } from "../../data/PredatorType"
import { globals } from "../../globals"
import { Loresheets } from "./Loresheets"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"

type MeritsAndFlawsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const flawIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={90} style={{ color: "#e03131" }} />
}
const meritIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={270} style={{ color: "rgb(47, 158, 68)" }} />
}

const MeritsAndFlawsPicker = ({ character, setCharacter, nextStep }: MeritsAndFlawsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Merits-and-flaws Picker" })
    }, [])
    const theme = useMantineTheme()

    const [activeTab, setActiveTab] = useState<string | null>("merits")

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

    const getMeritOrFlawLine = (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit"): JSX.Element => {
        const buttonColor = type === "flaw" ? "red" : "green"
        const icon = type === "flaw" ? flawIcon() : meritIcon()

        const alreadyPickedItem = pickedMeritsAndFlaws.find((l) => l.name === meritOrFlaw.name)
        const wasPickedLevel = alreadyPickedItem?.level ?? 0
        const excludingItems = exclusionMap.get(meritOrFlaw.name) ?? []
        const isExcluded = excludingItems.length > 0

        const predatorTypeMeritsFlaws = PredatorTypes[character.predatorType.name].meritsAndFlaws
        const meritInPredatorType = predatorTypeMeritsFlaws.find((m) => m.name === meritOrFlaw.name)
        const meritInPredatorTypeLevel = meritInPredatorType?.level ?? 0

        const createButton = (level: number) => {
            const cost = level - meritInPredatorTypeLevel
            return (
                <Button
                    key={meritOrFlaw.name + level}
                    disabled={
                        isExcluded ||
                        (meritInPredatorType && meritInPredatorType.level >= level) ||
                        (!!wasPickedLevel && wasPickedLevel >= level)
                    }
                    onClick={() => {
                        if (isThinbloodFlaw(meritOrFlaw.name)) {
                            setRemainingThinbloodMeritPoints(remainingThinbloodMeritPoints + 1)
                        } else if (isThinbloodMerit(meritOrFlaw.name)) {
                            if (remainingThinbloodMeritPoints < cost) return
                            setRemainingThinbloodMeritPoints(remainingThinbloodMeritPoints - 1)
                        } else if (type === "flaw") {
                            if (remainingFlaws + wasPickedLevel < cost) return
                            setRemainingFlaws(remainingFlaws + wasPickedLevel - cost)
                        } else {
                            if (remainingMerits + wasPickedLevel < cost) return
                            setRemainingMerits(remainingMerits + wasPickedLevel - cost)
                        }
                        setPickedMeritsAndFlaws([
                            ...pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name),
                            { name: meritOrFlaw.name, level, type, summary: meritOrFlaw.summary, excludes: meritOrFlaw.excludes },
                        ])
                    }}
                    style={{ marginRight: "5px" }}
                    size="xs"
                    variant="outline"
                    color={buttonColor}
                >
                    {level}
                </Button>
            )
        }

        const bg = alreadyPickedItem ? { background: type === "flaw" ? "rgba(255, 25, 25, 0.2)" : "rgba(50, 255, 100, 0.2)" } : {}
        const cost = wasPickedLevel - meritInPredatorTypeLevel
        const textStyle = isExcluded ? { ...bg, padding: "5px", opacity: 0.5, color: "grey" } : { ...bg, padding: "5px" }
        const summaryText = meritInPredatorType
            ? "Already picked in Predator Type"
            : isExcluded
              ? `Excluded by: ${excludingItems.join(", ")}`
              : meritOrFlaw.summary

        const textContent = (
            <Text style={textStyle} key={meritOrFlaw.name}>
                {icon} &nbsp;
                <b>{meritOrFlaw.name}</b> - {summaryText}
                <span>
                    &nbsp; {meritOrFlaw.cost.map((i) => createButton(i))}
                    {alreadyPickedItem ? (
                        <Button
                            onClick={() => {
                                setPickedMeritsAndFlaws([...pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name)])
                                if (isThinbloodFlaw(meritOrFlaw.name)) {
                                    setRemainingThinbloodMeritPoints(remainingThinbloodMeritPoints - 1)
                                } else if (isThinbloodMerit(meritOrFlaw.name)) {
                                    setRemainingThinbloodMeritPoints(remainingThinbloodMeritPoints + 1)
                                } else {
                                    type === "flaw" ? setRemainingFlaws(remainingFlaws + cost) : setRemainingMerits(remainingMerits + cost)
                                }
                            }}
                            style={{ marginRight: "5px" }}
                            size="xs"
                            variant="subtle"
                            color={"yellow"}
                        >
                            Unpick
                        </Button>
                    ) : null}
                </span>
            </Text>
        )

        if (isExcluded) {
            return (
                <Tooltip label={`This ${type} is excluded because you already have: ${excludingItems.join(", ")}`} withArrow>
                    {textContent}
                </Tooltip>
            )
        }

        return textContent
    }

    const height = globals.viewportHeightPx
    const isConfirmDisabled = isThinBlood && remainingThinbloodMeritPoints < 0
    return (
        <Stack align="center" mt={100}>
            <Text fz={globals.largeFontSize} ta={"center"}>
                Remaining Advantage points: {remainingMerits} <br /> Remaining Flaw points: {remainingFlaws}
            </Text>

            <Tabs color="grape" value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab maw={"30%"} value="merits">
                        Merits & Flaws
                    </Tabs.Tab>
                    <Tabs.Tab maw={"70%"} value="loresheets">
                        Loresheets (optional & advanced)
                    </Tabs.Tab>
                </Tabs.List>

                {/* Merits & Flaws */}
                <Tabs.Panel value="merits" pt="xs">
                    <ScrollArea h={height - 330} w={"100%"} p={20}>
                        {isThinBlood ? (
                            <>
                                <Text fz={globals.largeFontSize} ta={"center"} c={theme.colors.grape[6]}>
                                    Pick Thin-blood flaws to gain Thin-blood merit points
                                </Text>
                                <Text fz={globals.smallFontSize} ta={"center"} c={theme.colors.grape[6]}>
                                    Points: {remainingThinbloodMeritPoints}
                                </Text>
                            </>
                        ) : null}
                        <Grid m={0}>
                            {/* Thinbloods */}
                            {isThinBlood ? thinBloodMeritsAndFlawsComponent(getMeritOrFlawLine) : null}

                            {meritsAndFlaws.map((category) => {
                                return (
                                    <Grid.Col span={6} key={category.title}>
                                        <Stack gap={"xs"}>
                                            <Text fw={700} size={"xl"}>
                                                {category.title}
                                            </Text>
                                            <Divider mt={0} w={"50%"} />

                                            {category.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                                            {category.flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                                        </Stack>
                                    </Grid.Col>
                                )
                            })}
                        </Grid>
                    </ScrollArea>
                </Tabs.Panel>

                {/* Loresheets */}
                <Tabs.Panel value="loresheets" pt="xs">
                    <Loresheets character={character} getMeritOrFlawLine={getMeritOrFlawLine} pickedMeritsAndFlaws={pickedMeritsAndFlaws} />
                </Tabs.Panel>
            </Tabs>

            {isConfirmDisabled ? <Text c={theme.colors.red[9]}>Need to balance Thin-blood merit points</Text> : null}
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
            >
                Confirm
            </Button>
        </Stack>
    )
}

function thinBloodMeritsAndFlawsComponent(getMeritOrFlawLine: (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => JSX.Element) {
    return (
        <>
            <Grid.Col span={6}>
                <Stack gap={"xs"}>
                    <Text fw={700} size={"xl"}>
                        Thin-blood merits
                    </Text>
                    <Divider mt={0} w={"50%"} />

                    {thinbloodMeritsAndFlaws.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
                <Stack gap={"xs"}>
                    <Text fw={700} size={"xl"}>
                        Thin-blood flaws
                    </Text>
                    <Divider mt={0} w={"50%"} />

                    {thinbloodMeritsAndFlaws.flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                </Stack>
            </Grid.Col>

            <Divider mt={0} w={"100%"} my={"lg"} />
        </>
    )
}

export default MeritsAndFlawsPicker
