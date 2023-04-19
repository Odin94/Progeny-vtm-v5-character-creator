import { Button, Card, Center, Grid, Image, Space, Text, Title } from "@mantine/core";
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
    const createClanPick = (clan: Clan) => {
        return (
            <Grid.Col key={clan} span={4}>
                <Card shadow="sm" padding="lg" radius="md" h={300} style={{ backgroundColor: "rgba(26, 27, 30, 0.95)" }}>
                    <Card.Section>
                        <Center>
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

                    <Text h={40} size="sm" color="dimmed">
                        {descriptionByClan[clan]}
                    </Text>

                    <Button variant="light" color={"grape"} fullWidth mt="md" radius="md" onClick={() => {
                        setCharacter({ ...character, clan })
                        nextStep()
                    }}>
                        Pick {clan}
                    </Button>
                </Card>
            </Grid.Col>
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
                    (["Brujah", "Gangrel", "Nosferatu", "Malkavian", "Tremere", "Ventrue", "Toreador"] as Clan[]).map((clan) => createClanPick(clan))
                }
            </Grid>
        </div>
    )
}

export default ClanPicker