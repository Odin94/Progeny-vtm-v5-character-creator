import { Card, Center, Grid, Image, Space, Text, Title, useMantineTheme } from "@mantine/core";
import { Character } from "../../data/Character";
import { Clan, descriptionByClan, logoByClan } from "../../data/Clans";


type ClanPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

// const colorByClan: Record<Clan, string> = {
//     "Brujah": "red",
//     "Gangrel": "red",

//     "Nosferatu": "gray",

//     "Malkavian": "green",
//     "Tremere": "green",

//     "Ventrue": "blue",

//     "Toreador": "grape",

//     "": ""
// }

const ClanPicker = ({ character, setCharacter, nextStep }: ClanPickerProps) => {
    const theme = useMantineTheme();

    const c1 = "rgba(26, 27, 30, 0.90)"
    const c2 = theme.fn.rgba(theme.colors.grape[8], 0.90)//"rgba(156, 54, 181, 0.90)"  // grape
    const bgColor = theme.fn.linearGradient(0, c1, c2)

    const createClanPick = (clan: Clan) => {
        return (
            <Grid.Col key={clan} span={4}>
                <Card className="hoverCard" shadow="sm" padding="lg" radius="md" h={275} style={{ background: bgColor, cursor: "pointer", }}
                    onClick={() => {
                        setCharacter({ ...character, clan })
                        nextStep()
                    }}>
                    <Card.Section>
                        <Center pt={10}>
                            <Image
                                fit="contain"
                                withPlaceholder
                                src={logoByClan[clan]}
                                height={120}
                                width={120}
                                alt="Norway"
                            />
                        </Center>
                    </Card.Section>

                    <Center>
                        <Title p="md">{clan}</Title>
                    </Center>

                    <Text h={55} size="sm" color="dimmed">
                        {descriptionByClan[clan]}
                    </Text>
                </Card>
            </Grid.Col >
        )
    }

    return (
        <div>
            <h1>Pick your clan</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Clan</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Grid grow>
                {
                    (["Brujah", "Gangrel", "Nosferatu", "Malkavian", "Tremere", "Ventrue", "Toreador",
                        "Lasombra", "Banu Haqim", "Ministry", "Ravnos", "Tzimisce", "Hecata", "Salubri"] as Clan[]).map((clan) => createClanPick(clan))
                }
            </Grid>
        </div>
    )
}

export default ClanPicker
