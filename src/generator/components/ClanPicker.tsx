import { Card, Center, Grid, Image, ScrollArea, Text, Title, useMantineTheme } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useEffect } from "react"
import ReactGA from "react-ga4"
import { isThinbloodFlaw, isThinbloodMerit, loresheets } from "~/data/MeritsAndFlaws"
import { ClanName, clanNameSchema } from "~/data/NameSchemas"
import { Character, getEmptyCharacter, MeritFlaw } from "../../data/Character"
import { clans } from "../../data/Clans"
import { globals } from "../../globals"
import { notDefault } from "../utils"

type ClanPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const ClanPicker = ({ character, setCharacter, nextStep }: ClanPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Clan Picker" })
    }, [])

    const theme = useMantineTheme()

    const c1 = "rgba(26, 27, 30, 0.90)"

    const createClanPick = (clan: ClanName, c2: string) => {
        const bgColor = theme.fn.linearGradient(0, c1, c2)

        return (
            <Grid.Col key={clan} span={4}>
                <Card
                    className="hoverCard"
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    h={275}
                    style={{ background: bgColor, cursor: "pointer" }}
                    onClick={() => {
                        const newMerits = clan === character.clan ? character.merits : getNewMerits(clan, character)
                        const newFlaws = clan === "Thin-blood" ? character.flaws : flawsWithoutThinbloodFlaws(character.flaws)
                        if ((notDefault(character, "disciplines") || notDefault(character, "predatorType")) && clan !== character.clan) {
                            notifications.show({
                                title: "Reset Disciplines",
                                message: "Because you changed your clan",
                                autoClose: 7000,
                                color: "yellow",
                            })

                            setCharacter({
                                ...character,
                                clan,
                                disciplines: [],
                                availableDisciplineNames: clans[clan].nativeDisciplines,
                                predatorType: clan === "Thin-blood" ? getEmptyCharacter().predatorType : character.predatorType,
                                merits: newMerits,
                                flaws: newFlaws,
                            })
                        } else {
                            setCharacter({
                                ...character,
                                clan,
                                availableDisciplineNames: clans[clan].nativeDisciplines,
                                merits: newMerits,
                                flaws: newFlaws,
                            })
                        }

                        ReactGA.event({
                            action: "clan clicked",
                            category: "clans",
                            label: clan,
                        })
                        nextStep()
                    }}
                >
                    <Card.Section>
                        <Center pt={10}>
                            <Image fit="contain" withPlaceholder src={clans[clan].logo} height={120} width={120} alt="Norway" />
                        </Center>
                    </Card.Section>

                    <Center>
                        <Title p="md">{clan}</Title>
                    </Center>

                    <Text h={55} size="sm" color="dimmed" ta="center">
                        {clans[clan].description}
                    </Text>
                </Card>
            </Grid.Col>
        )
    }

    const height = globals.viewportHeightPx
    return (
        <div style={{ height: height - 250 }}>
            <Text fz={"30px"} ta={"center"}>
                Pick your <b>Clan</b>
            </Text>

            <Text ta="center" fz="xl" fw={700} c="red">
                Clan
            </Text>
            <hr color="#e03131" />

            <ScrollArea h={height - 215} w={"100%"} p={20}>
                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c={theme.colors.blue[6]}>
                    Rulers & Commanders
                </Text>
                <Grid grow m={0}>
                    {["Ventrue", "Tzimisce", "Lasombra"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.blue[8], 0.9)))}
                </Grid>

                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c={theme.colors.red[8]}>
                    Fighters & Protectors
                </Text>
                <Grid grow m={0}>
                    {["Brujah", "Gangrel", "Banu Haqim"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.red[8], 0.9)))}
                </Grid>

                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c={theme.colors.grape[7]}>
                    Seducers & Deceivers
                </Text>

                <Grid grow m={0}>
                    {["Toreador", "Ravnos", "Ministry"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.grape[8], 0.9)))}
                </Grid>

                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c="green">
                    Investigators & Researchers
                </Text>
                <Grid grow m={0}>
                    {["Malkavian", "Tremere", "Hecata"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.green[9], 0.9)))}
                </Grid>

                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c="rgb(175,175,175)">
                    Hidden Lurkers
                </Text>
                <Grid grow m={0}>
                    {["Nosferatu", "Salubri"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.gray[6], 0.9)))}
                </Grid>

                <Text ta="center" fz="xl" fw={700} mb={"sm"} mt={"md"} c="teal">
                    Advanced & special Clans
                </Text>
                <Grid grow m={0}>
                    {["Caitiff", "Thin-blood"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, theme.fn.rgba(theme.colors.teal[8], 0.9)))}
                </Grid>
            </ScrollArea>
        </div>
    )
}

const meritsWithoutThinbloodMerits = (merits: MeritFlaw[]) => merits.filter((m) => !isThinbloodMerit(m.name))
const flawsWithoutThinbloodFlaws = (flaws: MeritFlaw[]) => flaws.filter((f) => !isThinbloodFlaw(f.name))
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

        const requirementsMet = loresheetMerit.loresheet.requirementFunctions.every((fun) => fun({ ...character, clan: newClan }))
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
            color: "yellow",
        })
    }

    return newMerits
}

export default ClanPicker
