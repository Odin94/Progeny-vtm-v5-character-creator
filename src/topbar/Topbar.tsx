import { Center, Text, Title } from "@mantine/core"
import { Character } from "../data/Character"
import TopMenu from "./TopMenu"

export type TopBarProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const Topbar = ({ character, setCharacter }: TopBarProps) => {

    return (
        <>
            <Center>
                <Title>VtM v5 Character Creator</Title>
                <Text c="dimmed">&nbsp; by Odin</Text>

                <TopMenu character={character} setCharacter={setCharacter} />
            </Center>
        </>
    )
}

export default Topbar