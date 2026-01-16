import { ActionIcon, BackgroundImage, Box, Container, Divider, Paper, SegmentedControl, Stack } from "@mantine/core"
import { useDisclosure, useLocalStorage } from "@mantine/hooks"
import { useMemo } from "react"
import { Character, getEmptyCharacter } from "~/data/Character"
import { IconDice } from "@tabler/icons-react"
import { getPrimaryColor } from "./utils/style"
import Attributes from "./sections/Attributes"
import BottomData from "./sections/BottomData"
import Disciplines from "./sections/Disciplines"
import MeritsAndFlaws from "./sections/MeritsAndFlaws"
import Skills from "./sections/Skills"
import TheBlood from "./sections/TheBlood"
import TopData from "./sections/TopData"
import Touchstones from "./sections/Touchstones"
import backgroundImage from "./resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import CharacterSheetMenu from "./components/CharacterSheetMenu"
import DiceRollModal from "./components/DiceRollModal"

export type CharacterSheetMode = "play" | "xp" | "free"

export type SheetOptions = {
    mode: CharacterSheetMode
    primaryColor: string
    character: Character
    setCharacter: (character: Character) => void
}

type CharacterSheetProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const CharacterSheet = ({ character, setCharacter }: CharacterSheetProps) => {
    const isEmptyCharacter = useMemo(() => {
        const emptyChar = getEmptyCharacter()
        return (
            character.name === emptyChar.name &&
            character.clan === emptyChar.clan &&
            character.sire === emptyChar.sire &&
            character.disciplines.length === 0 &&
            character.merits.length === 0 &&
            character.flaws.length === 0
        )
    }, [character])

    const [mode, setMode] = useLocalStorage<CharacterSheetMode>({
        key: "characterSheetMode",
        defaultValue: isEmptyCharacter ? "free" : "play",
    })
    const [diceModalOpened, { open: openDiceModal, close: closeDiceModal }] = useDisclosure(false)
    const primaryColor = getPrimaryColor(character.clan)
    // TODOdin: Remove this once dice roller is ready
    const isLocalhost =
        typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

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
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            alignItems: "flex-end",
                        }}
                    >
                        {isLocalhost ? (
                            <ActionIcon
                                size="xl"
                                variant="light"
                                color={primaryColor}
                                radius="xl"
                                onClick={openDiceModal}
                                style={{
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                                }}
                            >
                                <IconDice size={24} />
                            </ActionIcon>
                        ) : null}
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
            {isLocalhost ? <DiceRollModal opened={diceModalOpened} onClose={closeDiceModal} primaryColor={primaryColor} character={character} /> : null}
        </BackgroundImage>
    )
}

export default CharacterSheet
