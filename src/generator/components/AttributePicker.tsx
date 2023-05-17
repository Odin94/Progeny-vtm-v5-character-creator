import { Button, Divider, Grid, Group, Text, Tooltip } from "@mantine/core"
import { useState } from "react"
import { Character } from "../../data/Character"
import { upcase } from "../utils"
import { AttributesKey, attributeDescriptions, attributesKeySchema } from "../../data/Attributes"

type AttributePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type AttributeSetting = {
    strongest: AttributesKey | null,
    weakest: AttributesKey | null,
    medium: AttributesKey[],
}

const AttributePicker = ({ character, setCharacter, nextStep }: AttributePickerProps) => {
    const [pickedAttributes, setPickedAttributes] = useState<AttributeSetting>({ strongest: null, weakest: null, medium: [] })

    const createButton = (attribute: AttributesKey, i: number) => {
        let onClick
        if (!pickedAttributes.strongest) {
            onClick = () => {
                setPickedAttributes({ ...pickedAttributes, strongest: attribute })
            }
        } else if (!pickedAttributes.weakest) {
            onClick = () => {
                setPickedAttributes({ ...pickedAttributes, weakest: attribute })
            }
        } else if (pickedAttributes.medium.length < 2) {
            onClick = () => {
                setPickedAttributes({ ...pickedAttributes, medium: [...pickedAttributes.medium, attribute] })
            }
        } else {
            onClick = () => {
                const finalPick = { ...pickedAttributes, medium: [...pickedAttributes.medium, attribute] }
                const attributes = {
                    strength: 2,
                    charisma: 2,
                    intelligence: 2,
                    dexterity: 2,
                    manipulation: 2,
                    wits: 2,
                    stamina: 2,
                    composure: 2,
                    resolve: 2,
                }
                attributes[finalPick.strongest!] = 4
                attributes[finalPick.weakest!] = 1
                finalPick.medium.forEach((medium) => attributes[medium] = 3)
                setCharacter({ ...character, attributes })
                nextStep()
            }
        }

        const disabled = [pickedAttributes.strongest, pickedAttributes.weakest, ...pickedAttributes.medium].includes(attribute)
        const dots = (() => {
            if (attribute === pickedAttributes.strongest) return "💪"
            if (attribute === pickedAttributes.weakest) return "🪶"
            if (pickedAttributes.medium.includes(attribute)) return "👌"
            return ""
        })()

        return (
            <Grid.Col key={attribute} span={4}>
                <Tooltip label={attributeDescriptions[attribute]} transitionProps={{ transition: 'slide-up', duration: 200 }}>
                    {/* div here because button being disabled freezes tooltip in place */}
                    <div>
                        <Button leftIcon={dots} disabled={disabled} color="grape" fullWidth onClick={onClick}>{upcase(attribute)}</Button>
                    </div>
                </Tooltip>

                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const header = (() => {
        if (!pickedAttributes.strongest) return (<h1>Pick your <b>strongest</b> attribute!</h1>)
        if (!pickedAttributes.weakest) return (<h1>Pick your <b>weakest</b> attribute!</h1>)
        return (<h1>Pick your <b>3 medium</b> attributes!</h1>)
    })()
    return (
        <div>
            {header}

            <Text ta="center" fz="xl" fw={700} c="red">Attributes</Text>

            <hr color="#e03131" />

            <Group>
                <Grid grow>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Physical</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Social</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Mental</Text></Grid.Col>
                    {
                        ["strength", "charisma", "intelligence",
                            "dexterity", "manipulation", "wits",
                            "stamina", "composure", "resolve"]
                            .map((a) => attributesKeySchema.parse(a))
                            .map((clan, i) => createButton(clan, i))
                    }
                </Grid>
            </Group>
        </div>
    )
}

export default AttributePicker
