import { Box, Grid, Group, Text, Title } from "@mantine/core"
import { attributesKeySchema, AttributesKey } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useShallow } from "zustand/react/shallow"

type AttributesProps = {
    options: SheetOptions
}

const Attributes = ({ options }: AttributesProps) => {
    const { character, mode, diceModalOpened } = options
    const { selectedDicePool, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            selectedDicePool: state.selectedDicePool,
            updateSelectedDicePool: state.updateSelectedDicePool,
        }))
    )
    const textStyle = {
        fontFamily: "Courier New",
    }

    const isClickable = mode === "play" && diceModalOpened

    const handleAttributeClick = (attribute: AttributesKey) => {
        if (!isClickable) return
        updateSelectedDicePool({
            attribute: selectedDicePool.attribute === attribute ? null : attribute,
        })
    }

    const renderAttributeRow = (attribute: AttributesKey) => {
        const isSelected = selectedDicePool.attribute === attribute
        return (
            <Group
                key={attribute}
                justify="space-between"
                mb="xs"
                style={
                    isClickable
                        ? {
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              backgroundColor: isSelected ? `${options.primaryColor}33` : "transparent",
                              transition: "background-color 0.2s",
                          }
                        : undefined
                }
                onClick={() => handleAttributeClick(attribute)}
            >
                <Text style={textStyle}>{upcase(attribute)}</Text>
                <Pips
                    level={character.attributes[attribute]}
                    minLevel={1}
                    options={options}
                    field={`attributes.${attribute}`}
                />
            </Group>
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
