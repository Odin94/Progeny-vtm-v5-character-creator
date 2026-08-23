import { Box, Grid, Group, Paper, Text, Title } from "@mantine/core"
import { memo } from "react"
import { attributesKeySchema, AttributesKey } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import { sheetSurfaceStyle } from "../utils/style"

type AttributesProps = {
    options: SheetOptions
}

type AttributeRowProps = {
    attribute: AttributesKey
    options: SheetOptions
    textStyle: React.CSSProperties
}

const attributeTextStyle: React.CSSProperties = {
    fontFamily: "Inter, Segoe UI, sans-serif",
    fontWeight: 600,
    fontSize: "0.95rem"
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
                width: "100%",
                minWidth: 0,
                padding: "0.4rem 0.5rem",
                cursor: "pointer",
                borderRadius: "var(--mantine-radius-sm)",
                backgroundColor: isSelected
                    ? `var(--mantine-color-${options.primaryColor}-light)`
                    : "transparent",
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
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="md" style={{ ...sheetSurfaceStyle, border: "none" }}>
                        <Title order={4} mb={3} c="dimmed">
                            PHYSICAL
                        </Title>
                        {["strength", "dexterity", "stamina"]
                            .map((a) => attributesKeySchema.parse(a))
                            .map(renderAttributeRow)}
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="md" style={{ ...sheetSurfaceStyle, border: "none" }}>
                        <Title order={4} mb={3} c="dimmed">
                            SOCIAL
                        </Title>
                        {["charisma", "manipulation", "composure"]
                            .map((a) => attributesKeySchema.parse(a))
                            .map(renderAttributeRow)}
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="md" style={{ ...sheetSurfaceStyle, border: "none" }}>
                        <Title order={4} mb={3} c="dimmed">
                            MENTAL
                        </Title>
                        {["intelligence", "wits", "resolve"]
                            .map((a) => attributesKeySchema.parse(a))
                            .map(renderAttributeRow)}
                    </Paper>
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
