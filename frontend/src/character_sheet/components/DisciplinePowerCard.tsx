import { Badge, Box, Group, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core"
import { Power } from "~/data/Disciplines"
import { Character } from "~/data/Character"
import Tally from "~/components/Tally"
import { getValueForKey } from "~/generator/utils"
import { bgAlpha, hexToRgba } from "../utils/style"

type DisciplinePowerCardProps = {
    power: Power
    primaryColor: string
    onClick?: () => void
    inModal: boolean
    renderActions?: () => React.ReactNode
    character?: Character
    disabled?: boolean
    disabledTooltip?: string | null
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

const DisciplinePowerCard = ({
    power,
    primaryColor,
    onClick,
    inModal,
    renderActions,
    character,
    disabled = false,
    disabledTooltip,
}: DisciplinePowerCardProps) => {
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const content = (
        <Stack gap="xs" style={{ height: "100%", minHeight: "135px" }}>
            <Text fw={600} size="sm" style={{ paddingRight: renderActions || !inModal ? "60px" : "0" }}>
                {power.name}
            </Text>
            {power.summary ? (
                <Text size="xs" c="dimmed" lineClamp={4}>
                    {power.summary}
                </Text>
            ) : null}
            <Box style={{ flex: 1 }} />
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

    const topRightActions = (
        <Group gap="xs" align="center" style={{ position: "absolute", top: "8px", right: "8px" }}>
            {!inModal ? (
                <Badge size="sm" variant="dot" color={primaryColor}>
                    Lv.{power.level}
                </Badge>
            ) : null}
            {renderActions ? renderActions() : null}
        </Group>
    )

    if (inModal) {
        const cardContent = (
            <Box
                p="xs"
                onClick={disabled ? undefined : onClick}
                style={{
                    border: "1px solid var(--mantine-color-gray-8)",
                    borderRadius: "var(--mantine-radius-sm)",
                    cursor: disabled ? "default" : "pointer",
                    transition: "background-color 0.2s",
                    minHeight: "140px",
                    display: "flex",
                    position: "relative",
                    opacity: disabled ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-light-hover)`
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                }}
            >
                {content}
                {topRightActions}
            </Box>
        )

        if (disabled && disabledTooltip) {
            return (
                <Tooltip label={disabledTooltip} withArrow>
                    <div style={{ width: "100%" }}>{cardContent}</div>
                </Tooltip>
            )
        }

        return cardContent
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
                backgroundColor: paperBg,
                position: "relative",
            }}
        >
            {content}
            {topRightActions}
        </Box>
    )
}

export default DisciplinePowerCard
