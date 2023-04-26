import { Center, Grid, Text, Title } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { Character } from "../data/Character"
import TopMenu from "./TopMenu"

export type TopBarProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void,
}

const Topbar = ({ character, setCharacter, setSelectedStep }: TopBarProps) => {
    const largeScreen = useMediaQuery('(min-width: 1500px)');

    return (
        <>
            <Grid>
                <Grid.Col offset={largeScreen ? 4 : 2} span={largeScreen ? 4 : 6}>
                    <Center>
                        <Title order={largeScreen ? 1 : 3}>VtM v5 Character Creator</Title>
                        <Text c="dimmed">&nbsp; by Odin</Text>
                    </Center>
                </Grid.Col>

                <Grid.Col offset={2} span={2}>
                    <span style={{ float: "right" }}>
                        <TopMenu character={character} setCharacter={setCharacter} setSelectedStep={setSelectedStep} />
                    </span>
                </Grid.Col>
            </Grid>
        </>

    )
}

export default Topbar