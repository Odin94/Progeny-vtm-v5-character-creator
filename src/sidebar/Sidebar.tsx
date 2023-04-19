import { Center, ScrollArea, Stack, Text } from "@mantine/core"
import { Character, getEmptyCharacter } from "../data/Character"
import AttributesDisplay from "./components/AttributesDisplay"
import SkillDisplay from "./components/SkillsDisplay"
import BasicsDisplay from "./components/BasicsDisplay"
import DisciplineDisplay from "./components/DisciplinesDisplay"
import TouchstoneDisplay from "./components/TouchstoneDisplay"
import MeritsAndFlawsDisplay from "./components/MeritsAndFlawsDisplay"
import { isEmptyList } from "../generator/utils"
import { useViewportSize } from "@mantine/hooks"

export type SidebarProps = {
    character: Character
}

const emptyCharacter = getEmptyCharacter()


const Sidebar = ({ character }: SidebarProps) => {
    const { height, width } = useViewportSize();
    console.log({ height, width })
    const notDefault = (attribute: keyof Character) => {
        if (isEmptyList(character[attribute])) return false
        return character[attribute] !== emptyCharacter[attribute]
    }

    return (
        // Subtracting header-height
        <ScrollArea h={height - 60} type="never">
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
        </ScrollArea>
    )
}

export default Sidebar