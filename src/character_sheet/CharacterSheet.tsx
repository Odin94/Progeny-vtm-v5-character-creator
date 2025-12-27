import { Container, Paper, Stack, Divider, BackgroundImage, Box } from "@mantine/core"
import { Character } from "~/data/Character"
import TopData from "./parts/TopData"
import Attributes from "./parts/Attributes"
import Skills from "./parts/Skills"
import Disciplines from "./parts/Disciplines"
import BottomData from "./parts/BottomData"
import Touchstones from "./parts/Touchstones"
import MeritsAndFlaws from "./parts/MeritsAndFlaws"
import backgroundImage from "./resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import classes from "./CharacterSheet.module.css"

type CharacterSheetProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const CharacterSheet = ({ character, setCharacter }: CharacterSheetProps) => {
    return (
        <BackgroundImage src={backgroundImage} className={classes.background}>
            <Box className={classes.overlay} />
            <Container size="xl" className={classes.container}>
                <Box className={classes.contentBox}>
                    <Paper p="lg" shadow="md" radius="md" className={classes.paper}>
                        <Stack gap="lg">
                            <TopData character={character} setCharacter={setCharacter} />

                            <Divider />

                            <Attributes character={character} setCharacter={setCharacter} />

                            <Divider />

                            <Skills character={character} setCharacter={setCharacter} />

                            {character.disciplines.length > 0 || character.rituals.length > 0 ? <Divider /> : null}

                            <Disciplines character={character} setCharacter={setCharacter} />

                            <Divider />

                            <BottomData character={character} setCharacter={setCharacter} />

                            {character.touchstones.length > 0 ? <Divider /> : null}

                            <Touchstones character={character} setCharacter={setCharacter} />

                            {character.merits.length > 0 || character.flaws.length > 0 ? <Divider /> : null}

                            <MeritsAndFlaws character={character} setCharacter={setCharacter} />
                        </Stack>
                    </Paper>
                </Box>
            </Container>
        </BackgroundImage>
    )
}

export default CharacterSheet
