import { faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Grid, Space, Stack, Text } from "@mantine/core"
import { useState } from "react"
import { Character, MeritFlaw } from "../../data/Character"


type MeritsAndFlawsPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type MeritOrFlaw = { name: string, cost: number[], summary: string }

type MeritsAndFlaws = {
    title: string,
    merits: MeritOrFlaw[]
    flaws: MeritOrFlaw[]
}

const meritsAndFlaws: MeritsAndFlaws[] = [
    {
        title: "Looks",
        merits: [
            { name: "Beautiful", cost: [2], summary: "+1 die in Social rolls" },
            { name: "Stunning", cost: [4], summary: "+2 dice in Social rolls" },
        ],
        flaws: [
            { name: "Ugly", cost: [1], summary: "-1 die in Social rolls" },
            { name: "Repulsive", cost: [2], summary: "-2 dice in Social rolls" },
        ]
    },
    {
        title: "Haven",
        merits: [
            { name: "Haven", cost: [1, 2, 3], summary: "secure homebase" },
            { name: "Hidden Armory", cost: [1], summary: "weapons and armor in your haven" },
            { name: "Watchmen", cost: [1], summary: "mortal security guards" },
            { name: "Luxury", cost: [1], summary: "+2 Dice on Social rolls in your haven" },
        ],
        flaws: [
            { name: "No Haven", cost: [1], summary: "you don't have a home" },
            { name: "Haunted", cost: [1], summary: "ghostly presence in your haven" },
            { name: "Compromised", cost: [2], summary: "your haven is on a watchlist" },
        ]
    },
    {
        title: "Resources",
        merits: [{ name: "Resources", cost: [1, 2, 3, 4, 5], summary: "wealth & income" }],
        flaws: [{ name: "Destitute", cost: [1], summary: "poor & no income" }]
    },
    {
        title: "Feeding",
        merits: [
            { name: "Bloodhound", cost: [1], summary: "smell resonance in mortal blood" },
            { name: "Iron Gullet", cost: [3], summary: "able to feed on rancid blood" },
        ],
        flaws: [
            { name: "Prey Exclusion", cost: [1], summary: "can't feed on certain types of people" },
            { name: "Methusela's Thirst", cost: [1], summary: "can't fully satiate on mortal blood" },
            { name: "Farmer", cost: [2], summary: "feeding on non-animal blood costs you 2 willpower" },
            { name: "Organovore", cost: [2], summary: "your hunger demands human flesh and organs" },
        ]
    },
    {
        title: "Keeping up with the times",
        merits: [],
        flaws: [
            { name: "Living in the Past", cost: [1], summary: "you have outdated views" },
            { name: "Archaic", cost: [1], summary: "Technology skill stuck at 0" },
        ]
    },
    {
        title: "Mythic",
        merits: [{ name: "Eat Food", cost: [1], summary: "can consume normal food" },],
        flaws: [
            { name: "Folkloric Bane", cost: [1], summary: "specific items damage you (eg. silver, garlic)" },
            { name: "Folkloric Block", cost: [1], summary: "must spend willpower to move past specific block (eg. running water, door uninvited)" },
            { name: "Stigmata", cost: [1], summary: "bleed from your hands, feet and forehead when at Hunger 4" },
            { name: "Stake Bait", cost: [1], summary: "Final Death when staked" },
        ]
    },
    {
        title: "Mask",
        merits: [{ name: "Mask", cost: [1, 2], summary: "fake identity with fake documents" },],
        flaws: [
            { name: "Known Corpse", cost: [1], summary: "others know you're dead" },
            { name: "Known Blankbody", cost: [2], summary: "Certain governments / organizations know you're a vampire" },
        ]
    },
    {
        title: "Linguistics",
        merits: [{ name: "Linguistics", cost: [1], summary: "fluently speak another language" },],
        flaws: [{ name: "Illiterate", cost: [1], summary: "can't read and write" },]
    },
    {
        title: "Kindred",
        merits: [
            { name: "Mawla", cost: [1, 2, 3, 4, 5], summary: "kindred mentor to advise or help you" },
            { name: "Status", cost: [1, 2, 3, 4, 5], summary: "positive reputation within a faction" },
        ],
        flaws: [
            { name: "Adversary", cost: [1], summary: "kindred enemy" },
            { name: "Suspect", cost: [1], summary: "bad reputation within a faction, -2 on Social tests with them" },
            { name: "Shunned", cost: [2], summary: "despised by a faction" },
        ]
    },
    {
        title: "Mortals",
        merits: [
            { name: "Retainer", cost: [1, 3], summary: "loyal mortal servant" },
            { name: "Allies", cost: [1, 2, 3, 4, 5], summary: "group of mortals to advise or help you" },
            { name: "Contacts", cost: [1, 2, 3], summary: "mortals who provide information or valuable items" },
            { name: "Herd", cost: [1], summary: "group of mortals who let you feed" },
        ],
        flaws: [
            { name: "Stalkers", cost: [1], summary: "unwanted mortal followers" },
            { name: "Enemy", cost: [1, 2], summary: "group of mortals that want to harm you" },
            { name: "Obvious Predator", cost: [1], summary: "mortals are scared of you, can't keep Herd" },
        ]
    }
]

const flawIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={90} style={{ color: "#e03131" }} />
}
const meritIcon = () => {
    return <FontAwesomeIcon icon={faPlay} rotation={270} style={{ color: "rgb(47, 158, 68)", }} />
}


const MeritsAndFlawsPicker = ({ character, setCharacter, nextStep }: MeritsAndFlawsPickerProps) => {
    const [pickedMeritsAndFlaws, setPickedMeritsAndFlaws] = useState<MeritFlaw[]>([])
    const [remainingMerits, setRemainingMerits] = useState(7)
    const [remainingFlaws, setRemainingFlaws] = useState(2)



    const getMeritOrFlawLine = (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => {
        const buttonColor = type === "flaw" ? "red" : "green"
        const icon = type === "flaw" ? flawIcon() : meritIcon()

        const alreadyPickedItem = pickedMeritsAndFlaws.find((l) => l.name === meritOrFlaw.name)
        const wasPickedLevel = alreadyPickedItem?.level

        const createButton = (level: number) => {
            return (<Button disabled={!!wasPickedLevel && wasPickedLevel >= level} onClick={() => {
                // TODO: Enable clicking buttons again for same merit/flaw and updating the existing pick
                if (type === "flaw") {
                    if (remainingFlaws < level) return
                    setRemainingFlaws(remainingFlaws - level)
                } else {
                    if (remainingMerits < level) return
                    setRemainingMerits(remainingMerits - level)
                }
                setPickedMeritsAndFlaws([...pickedMeritsAndFlaws, { name: meritOrFlaw.name, level, type, summary: meritOrFlaw.summary }])
            }} style={{ marginRight: "5px" }} compact variant="outline" color={buttonColor}>{level}</Button>)
        }

        let bg = {}
        if (!!wasPickedLevel) bg = { background: type === "flaw" ? "red" : "green" }
        return (<>
            <Text style={bg}>
                {icon} &nbsp;
                {meritOrFlaw.name} - {meritOrFlaw.summary}

                <span> &nbsp; {meritOrFlaw.cost.map((i) => createButton(i))} </span>
            </Text>
        </>)
    }

    return (
        <Stack>
            <h1>Spend 7 dots in Advantages and 2 dots in Flaws</h1>
            <h1>Remaining Advantage points: {remainingMerits} <br /> Remaining Flaw points: {remainingFlaws} </h1>
            <Grid>
                {meritsAndFlaws.map((category) => {
                    return (
                        <Grid.Col span={6}>
                            <Stack>
                                <Text size={"xl"}>{category.title}</Text>
                                {category.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                                {category.flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                            </Stack>
                        </Grid.Col>
                    )
                })}
            </Grid>

            <Space h={"xl"} />

            <Button color="grape" onClick={() => {
                setCharacter({ ...character, merits: pickedMeritsAndFlaws.filter((l) => l.type === "merit"), flaws: pickedMeritsAndFlaws.filter((l) => l.type === "flaw") })
                nextStep()
            }}>Confirm</Button>

            <Space h={"xl"} />

        </Stack>
    )
}

export default MeritsAndFlawsPicker