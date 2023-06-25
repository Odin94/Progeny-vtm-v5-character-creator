import { faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, ScrollArea, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { Character, MeritFlaw } from "../../data/Character"
import { globals } from "../../globals"
import { MeritOrFlaw, meritsAndFlaws } from "../../data/MeritsAndFlaws"
import { Loresheets } from "./Loresheets"


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

        const createButton = (level: number) => {
            return (<Button key={meritOrFlaw.name + level} disabled={!!wasPickedLevel && wasPickedLevel >= level} onClick={() => {
                if (type === "flaw") {
                    if (remainingFlaws + wasPickedLevel < level) return
                    setRemainingFlaws(remainingFlaws + wasPickedLevel - level)
                } else {
                    if (remainingMerits + wasPickedLevel < level) return
                    setRemainingMerits(remainingMerits + wasPickedLevel - level)
                }
                setPickedMeritsAndFlaws([...(pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name)), { name: meritOrFlaw.name, level, type, summary: meritOrFlaw.summary }])
            }} style={{ marginRight: "5px" }} compact variant="outline" color={buttonColor}>{level}</Button>)
        }

        let bg = {}
        if (wasPickedLevel) bg = { background: type === "flaw" ? "rgba(255, 25, 25, 0.2)" : "rgba(50, 255, 100, 0.2)" }
        return (
            <Text style={{ ...bg, padding: "5px" }} key={meritOrFlaw.name}>
                {icon} &nbsp;
                <b>{meritOrFlaw.name}</b> - {meritOrFlaw.summary}

                <span>
                    &nbsp; {meritOrFlaw.cost.map((i) => createButton(i))}
                    {alreadyPickedItem ? <Button onClick={() => {
                        setPickedMeritsAndFlaws([...(pickedMeritsAndFlaws.filter((m) => m.name !== alreadyPickedItem?.name))])
                        type === "flaw" ? setRemainingFlaws(remainingFlaws + wasPickedLevel) : setRemainingMerits(remainingMerits + wasPickedLevel)
                    }} style={{ marginRight: "5px" }} compact variant="subtle" color={"yellow"}>Unpick</Button> : null}
                </span>
            </Text>
        )
    }

    const height = globals.viewportHeightPx
    const discountFeatureFlag = false
    return (
        <Stack align="center" mt={100}>
            <Text fz={globals.largeFontSize} ta={"center"}>Remaining Advantage points: {remainingMerits} <br /> Remaining Flaw points: {remainingFlaws}</Text>

            {discountFeatureFlag ? <Loresheets getMeritOrFlawLine={getMeritOrFlawLine} /> : null}

            <ScrollArea h={height - 300} w={"100%"} p={20}>
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