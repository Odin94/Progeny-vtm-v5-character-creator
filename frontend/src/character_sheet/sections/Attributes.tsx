import { Box, Grid, Group, Text, Title } from "@mantine/core"
import { memo } from "react"
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

const attributeTextStyle: React.CSSProperties = {
    fontFamily: "Courier New"
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

const MemoizedAttributeRow = memo(AttributeRow, (prev, next) => {
    const previous = prev.options
    const following = next.options
    return (
        prev.attribute === next.attribute &&
        previous.mode === following.mode &&
        previous.primaryColor === following.primaryColor &&
        previous.canEdit === following.canEdit &&
        previous.editDisabledReason === following.editDisabledReason &&
        previous.setCharacter === following.setCharacter &&
        previous.character.attributes[prev.attribute] ===
            following.character.attributes[next.attribute] &&
        previous.character.generation === following.character.generation &&
        previous.character.experience === following.character.experience &&
        previous.character.ephemeral.experienceSpent ===
            following.character.ephemeral.experienceSpent
    )
})

const Attributes = ({ options }: AttributesProps) => {
    const renderAttributeRow = (attribute: AttributesKey) => {
        return (
            <MemoizedAttributeRow
                key={attribute}
                attribute={attribute}
                options={options}
                textStyle={attributeTextStyle}
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

export default memo(Attributes, (prev, next) => {
    return (
        prev.options.mode === next.options.mode &&
        prev.options.primaryColor === next.options.primaryColor &&
        prev.options.character.attributes === next.options.character.attributes &&
        prev.options.character.generation === next.options.character.generation &&
        prev.options.character.experience === next.options.character.experience &&
        prev.options.character.ephemeral.experienceSpent ===
            next.options.character.ephemeral.experienceSpent
    )
})
