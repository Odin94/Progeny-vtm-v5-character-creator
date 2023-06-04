import { Center, Grid, Stack, Text, Title } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { Character } from "../data/Character"
import TopMenu from "./TopMenu"

export type TopBarProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void,
}

const Topbar = ({ character, setCharacter, setSelectedStep }: TopBarProps) => {
    const largeScreen = useMediaQuery('(min-width: 500px)')

    return (
        <>
            <Grid>
                <Grid.Col offset={largeScreen ? 4 : 2} span={largeScreen ? 4 : 6}>
                    <Center>
                        <Stack spacing={"0px"} ml={"80px"}>
                            <span style={{ textAlign: "center" }}>
                                <Title style={{ display: "inline", marginLeft: "50px" }} order={largeScreen ? 1 : 3}>Progeny</Title>
                                <Text style={{ display: "inline", verticalAlign: "top" }} c="dimmed" fz="xs">&nbsp; by Odin</Text>
                            </span>

                            <Text c="dimmed" fz="sm" ta="center">A VtM v5 Character Creator</Text>
                        </Stack>
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