import { Stack, Text } from "@mantine/core"
import { Character, getEmptyCharacter } from "../data/Character"
import AttributesDisplay from "./components/Attributes"
import SkillDisplay from "./components/SkillsDisplay"

export type SidebarProps = {
    character: Character
}

const emptyCharacter = getEmptyCharacter()


const Sidebar = ({ character }: SidebarProps) => {
    const notDefault = (attribute: keyof Character) => {
        return character[attribute] !== emptyCharacter[attribute]
    }

    return (
        <Stack>
            {notDefault("clan") ? <Text>Clan: {character.clan}</Text> : null}
            {notDefault("attributes") ? <AttributesDisplay attributes={character.attributes} /> : null}
            {notDefault("skills") ? <SkillDisplay skills={character.skills} /> : null}
        </Stack>
    )
}

export default Sidebar