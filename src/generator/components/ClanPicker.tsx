import { Button, Card, Center, Grid, Image, Space, Text, Title } from "@mantine/core";
import { Character } from "../../data/Character";
import { Clan } from "../../data/Clans";
import brujahLogo from "../../resources/clanIcons/Brujah.webp";
import gangrelLogo from "../../resources/clanIcons/Gangrel.webp";
import malkavianLogo from "../../resources/clanIcons/Malkavian.webp";
import nosferatuLogo from "../../resources/clanIcons/Nosferatu.webp";
import toreadorLogo from "../../resources/clanIcons/Toreador.webp";
import tremereLogo from "../../resources/clanIcons/Tremere.webp";
import ventrueLogo from "../../resources/clanIcons/Ventrue.webp";


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

const logoByClan: Record<Clan, string> = {
    "Brujah": brujahLogo,
    "Gangrel": gangrelLogo,
    "Nosferatu": nosferatuLogo,
    "Malkavian": malkavianLogo,
    "Tremere": tremereLogo,
    "Ventrue": ventrueLogo,
    "Toreador": toreadorLogo,
    "": ""
}

const descriptionByClan: Record<Clan, string> = {
    "Brujah": "Rebels who always fight against the power, easy to anger",
    "Gangrel": "Beastlike and close to nature",
    "Nosferatu": "Disfigured lurkers in the shadows",
    "Malkavian": "Clairvoyants who are driven mad by their gift",
    "Tremere": "Blood mages, driven by their hunger for knowledge",
    "Ventrue": "High and mighty rulers, continually grasping for more power",
    "Toreador": "Beauty-obsessed artists, elegant and often snobby",
    "": ""
}

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