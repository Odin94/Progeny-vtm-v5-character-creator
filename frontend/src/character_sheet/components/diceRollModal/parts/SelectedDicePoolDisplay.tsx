import { ActionIcon, Badge, Box, Checkbox, Group, Stack, Text } from "@mantine/core"
import { IconRotateClockwise } from "@tabler/icons-react"
import { Character } from "~/data/Character"
import { SelectedDicePool } from "../../../CharacterSheet"
import { upcase } from "~/generator/utils"

type SelectedDicePoolDisplayProps = {
    selectedDicePool: SelectedDicePool
    setSelectedDicePool: (pool: SelectedDicePool) => void
    character?: Character
    primaryColor: string
    skillSpecialties: Array<{ name: string; skill: string }>
}

const SelectedDicePoolDisplay = ({
    selectedDicePool,
    setSelectedDicePool,
    character,
    primaryColor,
    skillSpecialties,
}: SelectedDicePoolDisplayProps) => {
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
                    <Text fw={700} fz="md" c={primaryColor}>
                        Selected Dice Pool:
                    </Text>
                    {(selectedDicePool.attribute || selectedDicePool.skill || selectedDicePool.discipline) ? (
                        <ActionIcon
                            variant="subtle"
                            color={primaryColor}
                            onClick={() => setSelectedDicePool({ attribute: null, skill: null, discipline: null, selectedSpecialties: [], bloodSurge: false })}
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
                                            setSelectedDicePool({
                                                ...selectedDicePool,
                                                selectedSpecialties: [...selectedDicePool.selectedSpecialties, specialty.name],
                                            })
                                        } else {
                                            setSelectedDicePool({
                                                ...selectedDicePool,
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
                        setSelectedDicePool({
                            ...selectedDicePool,
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
