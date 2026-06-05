import { Box, Grid, Group, Text, Title } from "@mantine/core"
import { attributesKeySchema, AttributesKey } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"

type AttributesProps = {
    options: SheetOptions
}

type AttributeRowProps = {
    attribute: AttributesKey
    options: SheetOptions
    textStyle: React.CSSProperties
}

const AttributeRow = ({ attribute, options, textStyle }: AttributeRowProps) => {
    const { character } = options
    const { isSelected, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            isSelected: state.selectedDicePool.attribute === attribute,
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )

    const handleAttributeClick = (attribute: AttributesKey) => {
        const diceModalOpened = useDiceRollModalStore.getState().opened
        updateSelectedDicePool({
            attribute: diceModalOpened && isSelected ? null : attribute,
            selectedDisciplinePowers: [],
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            useDiceRollModalStore.getState().openSelectedPool()
        }
    }

    return (
        <Group
            justify="space-between"
            mb="xs"
            style={{
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: isSelected ? `${options.primaryColor}33` : "transparent",
                transition: "background-color 0.2s"
            }}
            onClick={() => {
                if (useDiceRollModalStore.getState().opened) {
                    handleAttributeClick(attribute)
                }
            }}
        >
            <Text
                style={{ ...textStyle, cursor: "pointer" }}
                onClick={(event) => {
                    event.stopPropagation()
                    handleAttributeClick(attribute)
                }}
            >
                {upcase(attribute)}
            </Text>
            <Pips
                level={character.attributes[attribute]}
                minLevel={1}
                options={options}
                field={`attributes.${attribute}`}
            />
        </Group>
    )
}

const Attributes = ({ options }: AttributesProps) => {
    const textStyle = {
        fontFamily: "Courier New"
    }

    const renderAttributeRow = (attribute: AttributesKey) => {
        return (
            <AttributeRow
                key={attribute}
                attribute={attribute}
                options={options}
                textStyle={textStyle}
            />
        )
    }

    return (
        <Box>
            <Title order={2} mb="md" c={options.primaryColor}>
                Attributes
            </Title>
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        PHYSICAL
                    </Title>
                    {["strength", "dexterity", "stamina"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map(renderAttributeRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        SOCIAL
                    </Title>
                    {["charisma", "manipulation", "composure"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map(renderAttributeRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        MENTAL
                    </Title>
                    {["intelligence", "wits", "resolve"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map(renderAttributeRow)}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Attributes
