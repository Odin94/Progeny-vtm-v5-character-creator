import { Box, Card, Center, Grid, Image, rgba as mantineRgba, ScrollArea, Stack, Text, Title, useMantineTheme } from "@mantine/core"
import { RAW_RED, rgba } from "~/theme/colors"
import { notifications } from "@mantine/notifications"
import { useEffect } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { isThinbloodFlaw, isThinbloodMerit, loresheets } from "~/data/MeritsAndFlaws"
import { ClanName, clanNameSchema } from "~/data/NameSchemas"
import { Character, getEmptyCharacter, MeritFlaw } from "../../data/Character"
import { clans } from "../../data/Clans"
import { globals } from "../../globals"
import { notDefault } from "../utils"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

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
        const bgColor = `linear-gradient(0deg, ${c1}, ${c2})`

        return (
            <Grid.Col key={clan} span={4}>
                <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    h={275}
                    style={{
                        background: bgColor,
                        cursor: "pointer",
                        transition: "transform 160ms ease, box-shadow 160ms ease",
                    }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.transform = "translateY(-8px)"
                        event.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.22) 0px 19px 43px"
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.transform = "translateY(0)"
                        event.currentTarget.style.boxShadow = ""
                    }}
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

                        trackEvent({
                            action: "clan clicked",
                            category: "clans",
                            label: clan,
                        })
                        nextStep()
                    }}
                >
                    <Card.Section>
                        <Center pt={10}>
                            <Image fit="contain" src={clans[clan].logo} height={120} width={120} alt="Norway" />
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
    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w={"100%"}
                px={20}
                pt={4}
                pb={8}
                scrollbarSize={nightfallScrollbarSize}
                type="always"

                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                <Stack gap={4} align="center" mb={globals.isPhoneScreen ? 18 : 26}>
                    <Title
                        order={2}
                        ta="center"
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            color: "rgba(248, 240, 235, 0.96)",
                        }}
                    >
                        Pick your{" "}
                        <Text component="strong" inherit c="red.5" style={{ textShadow: `0 0 18px ${rgba(RAW_RED, 0.35)}` }}>
                            Clan
                        </Text>
                    </Title>
                    <Text
                        ta="center"
                        maw={620}
                        style={{
                            fontFamily: "Crimson Text, Georgia, serif",
                            fontSize: "1.1rem",
                            color: "rgba(235, 225, 218, 0.74)",
                        }}
                    >
                        Your clan defines your lineage, your powers, and your curse.
                    </Text>
                </Stack>

                <CategoryHeading label="Rulers & Commanders" />
                <Grid grow m={0}>
                    {["Ventrue", "Tzimisce", "Lasombra"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.blue[8], 0.9)))}
                </Grid>

                <CategoryHeading label="Fighters & Protectors" />
                <Grid grow m={0}>
                    {["Brujah", "Gangrel", "Banu Haqim"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.red[8], 0.9)))}
                </Grid>

                <CategoryHeading label="Seducers & Deceivers" />
                <Grid grow m={0}>
                    {["Toreador", "Ravnos", "Ministry"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.grape[8], 0.9)))}
                </Grid>

                <CategoryHeading label="Investigators & Researchers" />
                <Grid grow m={0}>
                    {["Malkavian", "Tremere", "Hecata"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.green[9], 0.9)))}
                </Grid>

                <CategoryHeading label="Hidden Lurkers" />
                <Grid grow m={0}>
                    {["Nosferatu", "Salubri"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.gray[6], 0.9)))}
                </Grid>

                <CategoryHeading label="Advanced & Special Clans" />
                <Grid grow m={0}>
                    {["Caitiff", "Thin-blood"]
                        .map((c) => clanNameSchema.parse(c))
                        .map((clan) => createClanPick(clan, mantineRgba(theme.colors.teal[8], 0.9)))}
                </Grid>
                </div>
            </ScrollArea>
        </div>
    )
}

const CategoryHeading = ({ label }: { label: string }) => (
    <Box my="md">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, height: "2px", background: `linear-gradient(90deg, transparent 0%, ${rgba(RAW_RED, 0.38)} 50%, transparent 100%)` }} />
            <Text
                ta="center"
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: "0.96rem",
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: rgba(RAW_RED, 1),
                }}
            >
                {label}
            </Text>
            <div style={{ flex: 1, height: "2px", background: `linear-gradient(90deg, transparent 0%, ${rgba(RAW_RED, 0.38)} 50%, transparent 100%)` }} />
        </div>
    </Box>
)

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
