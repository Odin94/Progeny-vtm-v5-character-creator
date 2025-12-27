import { Container, Paper, Stack, Divider, BackgroundImage, Box } from "@mantine/core"
import { Character } from "~/data/Character"
import TopData from "./parts/TopData"
import Attributes from "./parts/Attributes"
import Skills from "./parts/Skills"
import Disciplines from "./parts/Disciplines"
import BottomData from "./parts/BottomData"
import TheBlood from "./parts/TheBlood"
import Touchstones from "./parts/Touchstones"
import MeritsAndFlaws from "./parts/MeritsAndFlaws"
import backgroundImage from "./resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import { getPrimaryColor } from "./constants"

type CharacterSheetProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const CharacterSheet = ({ character, setCharacter }: CharacterSheetProps) => {
    const primaryColor = getPrimaryColor(character.clan)

    return (
        <BackgroundImage
            src={backgroundImage}
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "2rem 0",
                position: "relative",
            }}
        >
            <Box
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    zIndex: 0,
                }}
            />
            <Container
                size="xl"
                style={{
                    width: "100%",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <Box
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(7px)",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Paper p="lg" radius="md" style={{ backgroundColor: "transparent" }}>
                        <Stack gap="lg">
                            <TopData character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            <Divider />

                            <Attributes character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            <Divider />

                            <Skills character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            {character.disciplines.length > 0 || character.rituals.length > 0 ? <Divider /> : null}

                            <Disciplines character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            <Divider />

                            <BottomData character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            <Divider />

                            <TheBlood character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            {character.touchstones.length > 0 ? <Divider /> : null}

                            <Touchstones character={character} setCharacter={setCharacter} primaryColor={primaryColor} />

                            {character.merits.length > 0 || character.flaws.length > 0 ? <Divider /> : null}

                            <MeritsAndFlaws character={character} setCharacter={setCharacter} primaryColor={primaryColor} />
                        </Stack>
                    </Paper>
                </Box>
            </Container>
        </BackgroundImage>
    )
}

export default CharacterSheet
