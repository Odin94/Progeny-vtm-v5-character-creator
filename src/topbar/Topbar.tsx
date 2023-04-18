import { Center, Grid, Text, Title } from "@mantine/core"
import { Character } from "../data/Character"
import TopMenu from "./TopMenu"

export type TopBarProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const Topbar = ({ character, setCharacter }: TopBarProps) => {

    return (
        <>
            <Grid>
                <Grid.Col offset={4} span={4}>
                    <Center>
                        <Title>VtM v5 Character Creator</Title>
                        <Text c="dimmed">&nbsp; by Odin</Text>
                    </Center>
                </Grid.Col>

                <Grid.Col offset={2} span={2}>
                    <span style={{ float: "right" }}>
                        <TopMenu character={character} setCharacter={setCharacter} />
                    </span>
                </Grid.Col>
            </Grid>
        </>

    )
}

export default Topbar