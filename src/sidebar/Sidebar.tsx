import { Center, ScrollArea, Stack, Text } from "@mantine/core"
import { Character } from "../data/Character"
import { notDefault } from "../generator/utils"
import AttributesDisplay from "./components/AttributesDisplay"
import BasicsDisplay from "./components/BasicsDisplay"
import DisciplineDisplay from "./components/DisciplinesDisplay"
import MeritsAndFlawsDisplay from "./components/MeritsAndFlawsDisplay"
import SkillDisplay from "./components/SkillsDisplay"
import TouchstoneDisplay from "./components/TouchstoneDisplay"
import { globals } from "../globals"

export type SidebarProps = {
    character: Character
}

const Sidebar = ({ character }: SidebarProps) => {
    const height = globals.viewportHeightPx

    return (
        // Subtracting header-height
        <ScrollArea h={height - 60} type="never">
            <Stack>
                {notDefault(character, "clan") ? (
                    <Text fz="xl">
                        <Center>{character.clan}</Center>
                    </Text>
                ) : null}
                {notDefault(character, "name") ? <BasicsDisplay character={character} /> : null}
                {notDefault(character, "attributes") ? <AttributesDisplay attributes={character.attributes} /> : null}
                {notDefault(character, "skills") ? <SkillDisplay skills={character.skills} /> : null}
                {notDefault(character, "generation") ? (
                    <Text>
                        <b>Generation:</b> {character.generation}
                    </Text>
                ) : null}
                {notDefault(character, "predatorType") ? (
                    <Text>
                        <b>Predator Type:</b> {character.predatorType.name}
                    </Text>
                ) : null}
                {notDefault(character, "disciplines") ? (
                    <DisciplineDisplay powers={character.disciplines} rituals={character.rituals} />
                ) : null}
                {notDefault(character, "touchstones") ? <TouchstoneDisplay touchstones={character.touchstones} /> : null}
                {notDefault(character, "merits") || notDefault(character, "flaws") ? (
                    <MeritsAndFlawsDisplay merits={character.merits} flaws={character.flaws} />
                ) : null}
            </Stack>
        </ScrollArea>
    )
}

export default Sidebar
