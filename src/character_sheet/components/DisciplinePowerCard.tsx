import { Badge, Box, Group, Stack, Text } from "@mantine/core"
import { Power } from "~/data/Disciplines"
import Tally from "~/components/Tally"

type DisciplinePowerCardProps = {
    power: Power
    primaryColor: string
    onClick?: () => void
    inModal: boolean
    renderActions?: () => React.ReactNode
}

const DisciplinePowerCard = ({ power, primaryColor, onClick, inModal, renderActions }: DisciplinePowerCardProps) => {
    const content = (
        <Stack gap="xs">
            <Group justify="space-between" align="flex-start">
                <Stack gap={2} style={{ flex: 1 }}>
                    <Text fw={600} size="sm">
                        {power.name}
                    </Text>
                    {power.summary ? (
                        <Text size="xs" c="dimmed" lineClamp={4} style={{ minHeight: "68px" }}>
                            {power.summary}
                        </Text>
                    ) : null}
                </Stack>
                <Group gap="xs" align="center">
                    <Badge size="sm" variant="dot" color={primaryColor}>
                        Lv.{power.level}
                    </Badge>
                    {renderActions ? renderActions() : null}
                </Group>
            </Group>
            <Stack gap={2} mt={4}>
                {power.dicePool && power.dicePool !== "-" ? <Text size="xs">{power.dicePool.toUpperCase()}</Text> : null}
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
            }}
        >
            {content}
        </Box>
    )
}

export default DisciplinePowerCard
