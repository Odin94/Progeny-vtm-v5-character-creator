import { ActionIcon, Badge, Box, Checkbox, Group, Stack, Text, Tooltip } from "@mantine/core"
import { IconInfoCircle, IconRotateClockwise } from "@tabler/icons-react"
import { Character } from "~/data/Character"
import { useCharacterSheetStore } from "../../../stores/characterSheetStore"
import { upcase } from "~/generator/utils"
import { useShallow } from "zustand/react/shallow"

type SelectedDicePoolDisplayProps = {
    character?: Character
    primaryColor: string
    skillSpecialties: Array<{ name: string; skill: string }>
}

const SelectedDicePoolDisplay = ({
    character,
    primaryColor,
    skillSpecialties,
}: SelectedDicePoolDisplayProps) => {
    const { selectedDicePool, resetSelectedDicePool, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            selectedDicePool: state.selectedDicePool,
            resetSelectedDicePool: state.resetSelectedDicePool,
            updateSelectedDicePool: state.updateSelectedDicePool,
        }))
    )
    return (
        <Box
            style={{
                border: `1px solid ${primaryColor}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                flexShrink: 0,
            }}
        >
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <Text fw={700} fz="md" c={primaryColor}>
                            Selected Dice Pool:
                        </Text>
                        <Tooltip
                            label="You can click Attributes, Skills, or Disciplines on the character sheet to determine your dice pool"
                            position="top"
                            withArrow
                            multiline
                            w={250}
                            zIndex={3000}
                        >
                            <ActionIcon
                                variant="subtle"
                                color={primaryColor}
                                size="sm"
                                style={{ cursor: "help" }}
                            >
                                <IconInfoCircle size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    {(selectedDicePool.attribute || selectedDicePool.skill || selectedDicePool.discipline) ? (
                        <ActionIcon
                            variant="subtle"
                            color={primaryColor}
                            onClick={resetSelectedDicePool}
                            title="Reset dice pool"
                        >
                            <IconRotateClockwise size={18} />
                        </ActionIcon>
                    ) : null}
                </Group>
                <Group gap="xs">
                    {selectedDicePool.attribute ? (
                        <Badge variant="light" color={primaryColor} size="lg">
                            {upcase(selectedDicePool.attribute)}: {character?.attributes[selectedDicePool.attribute] || 0}
                        </Badge>
                    ) : (
                        <Text c="dimmed" size="sm">No attribute selected</Text>
                    )}
                    {selectedDicePool.skill ? (
                        <Badge variant="light" color={primaryColor} size="lg">
                            {upcase(selectedDicePool.skill)}: {character?.skills[selectedDicePool.skill] || 0}
                        </Badge>
                    ) : selectedDicePool.discipline ? (
                        <Badge variant="light" color={primaryColor} size="lg">
                            {upcase(selectedDicePool.discipline)}: {character?.disciplines.filter(p => p.discipline === selectedDicePool.discipline).length || 0}
                        </Badge>
                    ) : (
                        <Text c="dimmed" size="sm">No skill/discipline selected</Text>
                    )}
                </Group>
                {skillSpecialties.length > 0 && selectedDicePool.skill ? (
                    <Stack gap="xs" mt="sm">
                        <Text fw={600} fz="sm" c={primaryColor}>
                            Specialties (+1 die each):
                        </Text>
                        <Group gap="xs">
                            {skillSpecialties.map((specialty) => (
                                <Checkbox
                                    key={specialty.name}
                                    label={specialty.name}
                                    checked={selectedDicePool.selectedSpecialties.includes(specialty.name)}
                                    onChange={(e) => {
                                        if (e.currentTarget.checked) {
                                            updateSelectedDicePool({
                                                selectedSpecialties: [...selectedDicePool.selectedSpecialties, specialty.name],
                                            })
                                        } else {
                                            updateSelectedDicePool({
                                                selectedSpecialties: selectedDicePool.selectedSpecialties.filter(s => s !== specialty.name),
                                            })
                                        }
                                    }}
                                    color={primaryColor}
                                />
                            ))}
                        </Group>
                    </Stack>
                ) : null}
                <Checkbox
                    label="Blood Surge (+2 dice)"
                    checked={selectedDicePool.bloodSurge}
                    onChange={(e) => {
                        updateSelectedDicePool({
                            bloodSurge: e.currentTarget.checked,
                        })
                    }}
                    color={primaryColor}
                    mt="sm"
                />
            </Stack>
        </Box>
    )
}

export default SelectedDicePoolDisplay
