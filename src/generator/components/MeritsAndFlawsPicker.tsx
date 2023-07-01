import { faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, ScrollArea, Stack, Tabs, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { Character, MeritFlaw } from "../../data/Character"
import { globals } from "../../globals"
import { MeritOrFlaw, meritsAndFlaws } from "../../data/MeritsAndFlaws"
import { Loresheets } from "./Loresheets"
import { PredatorTypes } from "../../data/PredatorType"


type MeritsAndFlawsPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const flawIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={90} style={{ color: "#e03131" }} />
}
const meritIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={270} style={{ color: "rgb(47, 158, 68)", }} />
}


const MeritsAndFlawsPicker = ({ character, setCharacter, nextStep }: MeritsAndFlawsPickerProps) => {
    useEffect(() => { ReactGA.send({ hitType: "pageview", title: "Merits-and-flaws Picker" }) }, [])
    const [activeTab, setActiveTab] = useState<string | null>('merits');

    const [pickedMeritsAndFlaws, setPickedMeritsAndFlaws] = useState<MeritFlaw[]>([...(character.merits), ...(character.flaws)])

    const usedMeritsLevel = character.merits.reduce((acc, { level }) => acc + level, 0)
    const usedFLawsLevel = character.flaws.reduce((acc, { level }) => acc + level, 0)

    const [remainingMerits, setRemainingMerits] = useState(7 - usedMeritsLevel)
    const [remainingFlaws, setRemainingFlaws] = useState(2 - usedFLawsLevel)

    const getMeritOrFlawLine = (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit"): JSX.Element => {
        const buttonColor = type === "flaw" ? "red" : "green"
        const icon = type === "flaw" ? flawIcon() : meritIcon()

        const alreadyPickedItem = pickedMeritsAndFlaws.find((l) => l.name === meritOrFlaw.name)
        const wasPickedLevel = alreadyPickedItem?.level ?? 0

        const predatorTypeMeritsFlaws = PredatorTypes[character.predatorType.name].meritsAndFlaws
        const meritInPredatorType = predatorTypeMeritsFlaws.find(m => m.name === meritOrFlaw.name)
        const meritInPredatorTypeLevel = meritInPredatorType?.level ?? 0

        const createButton = (level: number) => {
            const cost = level - meritInPredatorTypeLevel
            return (<Button key={meritOrFlaw.name + level} disabled={(meritInPredatorType && meritInPredatorType.level >= level) || (!!wasPickedLevel && wasPickedLevel >= level)} onClick={() => {
                if (type === "flaw") {
                    if (remainingFlaws + wasPickedLevel < cost) return
                    setRemainingFlaws(remainingFlaws + wasPickedLevel - cost)
                } else {
                    if (remainingMerits + wasPickedLevel < cost) return
                    setRemainingMerits(remainingMerits + wasPickedLevel - cost)
                }
                setPickedMeritsAndFlaws([...(pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name)), { name: meritOrFlaw.name, level, type, summary: meritOrFlaw.summary }])
            }} style={{ marginRight: "5px" }} compact variant="outline" color={buttonColor}>{level}</Button>)
        }

        const bg = alreadyPickedItem ? { background: type === "flaw" ? "rgba(255, 25, 25, 0.2)" : "rgba(50, 255, 100, 0.2)" } : {}
        const cost = wasPickedLevel - meritInPredatorTypeLevel
        return (
            <Text style={{ ...bg, padding: "5px" }} key={meritOrFlaw.name}>
                {icon} &nbsp;
                <b>{meritOrFlaw.name}</b> - {meritInPredatorType ? "Already picked in Predator Type" : meritOrFlaw.summary}

                <span>
                    &nbsp; {meritOrFlaw.cost.map((i) => createButton(i))}
                    {alreadyPickedItem ? <Button onClick={() => {
                        setPickedMeritsAndFlaws([...(pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name))])
                        type === "flaw" ? setRemainingFlaws(remainingFlaws + cost) : setRemainingMerits(remainingMerits + cost)
                    }} style={{ marginRight: "5px" }} compact variant="subtle" color={"yellow"}>Unpick</Button> : null}
                </span>
            </Text>
        )
    }

    const height = globals.viewportHeightPx
    return (
        <Stack align="center" mt={100}>
            <Text fz={globals.largeFontSize} ta={"center"}>Remaining Advantage points: {remainingMerits} <br /> Remaining Flaw points: {remainingFlaws}</Text>

            <Tabs color="grape" value={activeTab} onTabChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab maw={"30%"} value="merits">Merits & Flaws</Tabs.Tab>
                    <Tabs.Tab maw={"70%"} value="loresheets">Loresheets (optional & advanced)</Tabs.Tab>
                </Tabs.List>

                {/* Merits & Flaws */}
                <Tabs.Panel value="merits" pt="xs">
                    <ScrollArea h={height - 330} w={"100%"} p={20}>
                        <Grid m={0}>
                            {meritsAndFlaws.map((category) => {
                                return (
                                    <Grid.Col span={6} key={category.title}>
                                        <Stack spacing={"xs"}>
                                            <Text fw={700} size={"xl"}>{category.title}</Text>
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
                    <Loresheets getMeritOrFlawLine={getMeritOrFlawLine} pickedMeritsAndFlaws={pickedMeritsAndFlaws} />
                </Tabs.Panel>
            </Tabs>

            <Button color="grape" onClick={() => {
                setCharacter({
                    ...character,
                    merits: pickedMeritsAndFlaws.filter((l) => l.type === "merit"),
                    flaws: pickedMeritsAndFlaws.filter((l) => l.type === "flaw")
                })

                ReactGA.event({
                    action: "merits confirm clicked",
                    category: "merits",
                    label: pickedMeritsAndFlaws.map((m) => `${m.name}: ${m.level}`).join(", "),
                })

                nextStep()
            }}>Confirm</Button>

        </Stack>
    )
}

export default MeritsAndFlawsPicker