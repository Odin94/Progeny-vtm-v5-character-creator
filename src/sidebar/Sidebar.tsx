import { Center, Stack, Text } from "@mantine/core"
import { Character, getEmptyCharacter } from "../data/Character"
import AttributesDisplay from "./components/AttributesDisplay"
import SkillDisplay from "./components/SkillsDisplay"
import BasicsDisplay from "./components/BasicsDisplay"
import DisciplineDisplay from "./components/DisciplinesDisplay"
import TouchstoneDisplay from "./components/TouchstoneDisplay"
import MeritsAndFlawsPicker from "../generator/components/MeritsAndFlawsPicker"
import MeritsAndFlawsDisplay from "./components/MeritsAndFlawsDisplay"

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
            {notDefault("clan") ? <Text fz="xl"><Center>{character.clan}</Center></Text> : null}
            {notDefault("name") ? <BasicsDisplay character={character} /> : null}
            {notDefault("attributes") ? <AttributesDisplay attributes={character.attributes} /> : null}
            {notDefault("skills") ? <SkillDisplay skills={character.skills} /> : null}
            {notDefault("generation") ? <Text><b>Generation:</b> {character.generation}</Text> : null}
            {notDefault("predatorType") ? <Text><b>Predator Type:</b> {character.predatorType}</Text> : null}
            {notDefault("disciplines") ? <DisciplineDisplay powers={character.disciplines} /> : null}
            {notDefault("touchstones") ? <TouchstoneDisplay touchstones={character.touchstones} /> : null}
            {notDefault("merits") ? <MeritsAndFlawsDisplay merits={character.merits} flaws={character.flaws} /> : null}
        </Stack>
    )
}

export default Sidebar