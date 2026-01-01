import { BackgroundImage, Box, Container, Divider, Paper, SegmentedControl, Stack } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useMemo } from "react"
import { Character } from "~/data/Character"
import { getPrimaryColor, SheetOptions } from "./constants"
import Attributes from "./parts/Attributes"
import BottomData from "./parts/BottomData"
import Disciplines from "./parts/Disciplines"
import MeritsAndFlaws from "./parts/MeritsAndFlaws"
import Skills from "./parts/Skills"
import TheBlood from "./parts/TheBlood"
import TopData from "./parts/TopData"
import Touchstones from "./parts/Touchstones"
import backgroundImage from "./resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import CharacterSheetMenu from "./components/CharacterSheetMenu"

export type CharacterSheetMode = "play" | "xp" | "free"

type CharacterSheetProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const CharacterSheet = ({ character, setCharacter }: CharacterSheetProps) => {
    const [mode, setMode] = useLocalStorage<CharacterSheetMode>({ key: "characterSheetMode", defaultValue: "play" })
    const primaryColor = getPrimaryColor(character.clan)

    const sheetOptions: SheetOptions = useMemo(
        () => ({
            mode,
            primaryColor,
            character,
            setCharacter,
        }),
        [mode, primaryColor, character, setCharacter]
    )

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
                        position: "relative",
                    }}
                >
                    <Box
                        style={{
                            position: "absolute",
                            top: "1rem",
                            right: "1rem",
                            zIndex: 10,
                        }}
                    >
                        <SegmentedControl
                            value={mode}
                            onChange={(value) => setMode(value as CharacterSheetMode)}
                            data={[
                                { label: "Play", value: "play" },
                                { label: "XP", value: "xp" },
                                { label: "Free", value: "free" },
                            ]}
                            color={primaryColor}
                            orientation="vertical"
                        />
                    </Box>

                    <Paper p="lg" radius="md" style={{ backgroundColor: "transparent" }}>
                        <Stack gap="lg">
                            <TopData options={sheetOptions} />

                            <Divider />

                            <Attributes options={sheetOptions} />

                            <Divider />

                            <Skills options={sheetOptions} />

                            {character.disciplines.length > 0 || character.rituals.length > 0 ? <Divider /> : null}

                            <Disciplines options={sheetOptions} />

                            <Divider />

                            <BottomData options={sheetOptions} />

                            <Divider />

                            <TheBlood options={sheetOptions} />

                            {character.touchstones.length > 0 ? <Divider /> : null}

                            <Touchstones options={sheetOptions} />

                            {character.merits.length > 0 || character.flaws.length > 0 ? <Divider /> : null}

                            <MeritsAndFlaws options={sheetOptions} />
                        </Stack>
                    </Paper>
                </Box>
            </Container>
            <CharacterSheetMenu options={sheetOptions} />
        </BackgroundImage>
    )
}

export default CharacterSheet
