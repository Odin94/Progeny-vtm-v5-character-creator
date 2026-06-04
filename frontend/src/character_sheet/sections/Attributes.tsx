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

const Attributes = ({ options }: AttributesProps) => {
    const { character, mode } = options
    const { selectedAttribute, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            selectedAttribute: state.selectedDicePool.attribute,
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )
    const { diceModalOpened, openDiceModal } = useDiceRollModalStore(
        useShallow((state) => ({
            diceModalOpened: state.opened,
            openDiceModal: state.open
        }))
    )
    const textStyle = {
        fontFamily: "Courier New"
    }

    const handleAttributeClick = (attribute: AttributesKey) => {
        updateSelectedDicePool({
            attribute: diceModalOpened && selectedAttribute === attribute ? null : attribute,
            selectedDisciplinePowers: [],
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            openDiceModal()
        }
    }

    const renderAttributeRow = (attribute: AttributesKey) => {
        const isSelected = selectedAttribute === attribute
        return (
            <Group
                key={attribute}
                justify="space-between"
                mb="xs"
                style={
                    diceModalOpened
                        ? {
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              backgroundColor: isSelected
                                  ? `${options.primaryColor}33`
                                  : "transparent",
                              transition: "background-color 0.2s"
                          }
                        : undefined
                }
                onClick={diceModalOpened ? () => handleAttributeClick(attribute) : undefined}
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
