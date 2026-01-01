import { Badge, Box, Group, Stack, Text, Tooltip } from "@mantine/core"
import { Power } from "~/data/Disciplines"
import { Character } from "~/data/Character"
import Tally from "~/components/Tally"
import { getValueForKey } from "~/generator/utils"

type DisciplinePowerCardProps = {
    power: Power
    primaryColor: string
    onClick?: () => void
    inModal: boolean
    renderActions?: () => React.ReactNode
    character?: Character
}

export const calculateDicePoolValues = (dicePoolString: string, character: Character): string | null => {
    if (!dicePoolString || dicePoolString.trim() === "" || dicePoolString === "-") {
        return null
    }

    const components = dicePoolString.split("+").map((comp) => comp.trim())

    const values: number[] = []

    for (const component of components) {
        const alternatives = component.split("/").map((alt) => alt.trim())

        if (alternatives.length === 1) {
            const value = getValueForKey(alternatives[0].toLowerCase(), character)
            values.push(value)
        } else {
            let bestValue = getValueForKey(alternatives[0].toLowerCase(), character)
            for (let i = 1; i < alternatives.length; i++) {
                const value = getValueForKey(alternatives[i].toLowerCase(), character)
                if (value > bestValue) {
                    bestValue = value
                }
            }
            values.push(bestValue)
        }
    }

    return values.join(" + ")
}

const DisciplinePowerCard = ({ power, primaryColor, onClick, inModal, renderActions, character }: DisciplinePowerCardProps) => {
    const content = (
        <Stack gap="xs" style={{ height: "100%", minHeight: "140px" }}>
            <Group justify="space-between" align="flex-start">
                <Text fw={600} size="sm" style={{ flex: 1 }}>
                    {power.name}
                </Text>
                <Group gap="xs" align="center">
                    <Badge size="sm" variant="dot" color={primaryColor}>
                        Lv.{power.level}
                    </Badge>
                    {renderActions ? renderActions() : null}
                </Group>
            </Group>
            {power.summary ? (
                <Text size="xs" c="dimmed" lineClamp={4} style={{ flex: 1 }}>
                    {power.summary}
                </Text>
            ) : (
                <Box style={{ flex: 1 }} />
            )}
            <Stack gap={2} mt="auto">
                {power.dicePool && power.dicePool !== "-" ? (
                    character ? (
                        (() => {
                            const tooltipValue = calculateDicePoolValues(power.dicePool, character)
                            return tooltipValue ? (
                                <Tooltip label={tooltipValue}>
                                    <Text size="xs" style={{ cursor: "help" }}>
                                        {power.dicePool.toUpperCase()}
                                    </Text>
                                </Tooltip>
                            ) : (
                                <Text size="xs">{power.dicePool.toUpperCase()}</Text>
                            )
                        })()
                    ) : (
                        <Text size="xs">{power.dicePool.toUpperCase()}</Text>
                    )
                ) : null}
                <Group gap="xs" align="center">
                    <Text size="xs">Rouses:</Text>
                    {power.rouseChecks > 0 ? (
                        <Tally n={power.rouseChecks} size={16} style={{ color: "var(--mantine-color-red-6)" }} />
                    ) : (
                        <Text size="xs">FREE</Text>
                    )}
                </Group>
            </Stack>
        </Stack>
    )

    if (inModal) {
        return (
            <Box
                p="xs"
                onClick={onClick}
                style={{
                    border: "1px solid var(--mantine-color-gray-8)",
                    borderRadius: "var(--mantine-radius-sm)",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    minHeight: "140px",
                    display: "flex",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-light-hover)`
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                }}
            >
                {content}
            </Box>
        )
    }

    return (
        // TODOdin: Make this border prettier
        <Box
            p="xs"
            style={{
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: "var(--mantine-radius-sm)",
                minHeight: "140px",
                display: "flex",
            }}
        >
            {content}
        </Box>
    )
}

export default DisciplinePowerCard
