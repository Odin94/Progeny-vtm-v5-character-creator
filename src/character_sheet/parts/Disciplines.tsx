import {
    Badge,
    Box,
    Divider,
    Grid,
    Group,
    Stack,
    Text,
    Title,
    Paper,
    Center,
    ActionIcon,
    Modal,
    Button,
    Tooltip,
    useMantineTheme,
} from "@mantine/core"
import { useState } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { disciplines } from "~/data/Disciplines"
import { SheetOptions } from "../utils/constants"
import DisciplineSelectModal from "../components/DisciplineSelectModal"
import DisciplinePowerCard from "../components/DisciplinePowerCard"
import { IconPlus, IconX } from "@tabler/icons-react"
import { Power } from "~/data/Disciplines"
import { getDisciplineCost, getAvailableXP, canAffordUpgrade } from "../utils/xp"
import { bgAlpha, hexToRgba } from "../utils/style"

type DisciplinesProps = {
    options: SheetOptions
}

const Disciplines = ({ options }: DisciplinesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const [modalOpened, setModalOpened] = useState(false)
    const [initialDiscipline, setInitialDiscipline] = useState<DisciplineName | null>(null)
    const [itemToDelete, setItemToDelete] = useState<
        { type: "power"; power: Power } | { type: "discipline"; disciplineName: DisciplineName } | null
    >(null)
    const isEditable = mode === "xp" || mode === "free"
    const isFreeMode = mode === "free"
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)

    if (character.disciplines.length === 0 && character.rituals.length === 0 && !isEditable) {
        return null
    }

    const powersByDiscipline = new Map<DisciplineName, typeof character.disciplines>()
    character.disciplines.forEach((power) => {
        if (!powersByDiscipline.has(power.discipline)) {
            powersByDiscipline.set(power.discipline, [power])
        } else {
            powersByDiscipline.set(power.discipline, [...powersByDiscipline.get(power.discipline)!, power])
        }
    })

    const handleDeletePower = (power: Power) => {
        setItemToDelete({ type: "power", power })
    }

    const handleDeleteDiscipline = (disciplineName: DisciplineName) => {
        setItemToDelete({ type: "discipline", disciplineName })
    }

    const confirmDelete = () => {
        if (!itemToDelete) return

        let updatedCharacter
        if (itemToDelete.type === "power") {
            updatedCharacter = {
                ...character,
                disciplines: character.disciplines.filter((p) => p !== itemToDelete.power),
            }
        } else {
            updatedCharacter = {
                ...character,
                disciplines: character.disciplines.filter((p) => p.discipline !== itemToDelete.disciplineName),
            }
        }

        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        setCharacter(updatedCharacter)
        setItemToDelete(null)
    }

    return (
        <>
            {character.disciplines.length > 0 || isEditable ? (
                <Box>
                    <Title order={2} mb="lg" c={primaryColor}>
                        Disciplines
                    </Title>
                    <Grid gutter="md">
                        {Array.from(powersByDiscipline.entries()).map(([disciplineName, powers]) => {
                            const discipline = disciplines[disciplineName]
                            const logo = discipline?.logo

                            return (
                                <Grid.Col key={disciplineName} span={{ base: 12, md: 6, lg: 4 }}>
                                    <Paper p="md" withBorder style={{ height: "100%", backgroundColor: paperBg }}>
                                        <Group gap="md" mb="md" align="center">
                                            {logo ? (
                                                <img
                                                    src={logo}
                                                    alt={upcase(disciplineName)}
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : null}
                                            <Group justify="space-between" style={{ flex: 1 }} align="center">
                                                <Title order={4} style={{ margin: 0 }}>
                                                    {upcase(disciplineName)}
                                                </Title>
                                                <Group gap="xs" align="center">
                                                    <Badge size="lg" variant="light" color={primaryColor} circle>
                                                        {powers.length}
                                                    </Badge>
                                                    {isFreeMode && powers.length === 0 ? (
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() => handleDeleteDiscipline(disciplineName)}
                                                        >
                                                            <IconX size={16} />
                                                        </ActionIcon>
                                                    ) : null}
                                                </Group>
                                            </Group>
                                        </Group>
                                        <Divider mb="sm" />
                                        <Stack gap="sm">
                                            {powers
                                                .sort((a, b) => a.level - b.level)
                                                .map((power) => (
                                                    <DisciplinePowerCard
                                                        key={power.name}
                                                        power={power}
                                                        primaryColor={primaryColor}
                                                        inModal={false}
                                                        character={character}
                                                        renderActions={
                                                            isFreeMode
                                                                ? () => (
                                                                      <ActionIcon
                                                                          size="sm"
                                                                          variant="subtle"
                                                                          color="red"
                                                                          onClick={() => handleDeletePower(power)}
                                                                      >
                                                                          <IconX size={16} />
                                                                      </ActionIcon>
                                                                  )
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                            {isEditable ? (
                                                <Center mt="xs">
                                                    {mode === "xp" ? (
                                                        (() => {
                                                            const cost = getDisciplineCost(character, disciplineName)
                                                            const availableXP = getAvailableXP(character)
                                                            const canAfford = canAffordUpgrade(availableXP, cost)
                                                            const tooltipLabel = canAfford
                                                                ? `${cost} XP`
                                                                : `Insufficient XP. Need ${cost}, have ${availableXP}`

                                                            return (
                                                                <Tooltip label={tooltipLabel}>
                                                                    <span style={{ display: "inline-block" }}>
                                                                        <ActionIcon
                                                                            size="lg"
                                                                            radius="xl"
                                                                            variant="light"
                                                                            color={primaryColor}
                                                                            disabled={!canAfford}
                                                                            onClick={() => {
                                                                                setInitialDiscipline(disciplineName)
                                                                                setModalOpened(true)
                                                                            }}
                                                                            style={{
                                                                                cursor: canAfford ? "pointer" : "default",
                                                                            }}
                                                                        >
                                                                            <IconPlus size={18} />
                                                                        </ActionIcon>
                                                                    </span>
                                                                </Tooltip>
                                                            )
                                                        })()
                                                    ) : (
                                                        <ActionIcon
                                                            size="lg"
                                                            radius="xl"
                                                            variant="light"
                                                            color={primaryColor}
                                                            onClick={() => {
                                                                setInitialDiscipline(disciplineName)
                                                                setModalOpened(true)
                                                            }}
                                                        >
                                                            <IconPlus size={18} />
                                                        </ActionIcon>
                                                    )}
                                                </Center>
                                            ) : null}
                                        </Stack>
                                    </Paper>
                                </Grid.Col>
                            )
                        })}
                        {isEditable ? (
                            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                                <Paper
                                    p="md"
                                    withBorder
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: paperBg,
                                    }}
                                >
                                    <Center style={{ height: "100%" }}>
                                        {mode === "xp" ? (
                                            (() => {
                                                const disciplinesAlreadyHave = new Set(
                                                    character.disciplines.map((power) => power.discipline)
                                                )
                                                const allDisciplines = Object.keys(disciplines) as DisciplineName[]
                                                const availableDisciplines = allDisciplines.filter(
                                                    (disciplineName) => disciplineName !== "" && !disciplinesAlreadyHave.has(disciplineName)
                                                )

                                                const costs = availableDisciplines.map((disciplineName) =>
                                                    getDisciplineCost(character, disciplineName)
                                                )
                                                const minCost = costs.length > 0 ? Math.min(...costs) : 0
                                                const availableXP = getAvailableXP(character)
                                                const canAfford = canAffordUpgrade(availableXP, minCost)
                                                const tooltipLabel = canAfford
                                                    ? `${minCost} XP`
                                                    : `Insufficient XP. Need ${minCost}, have ${availableXP}`

                                                return (
                                                    <Tooltip label={tooltipLabel}>
                                                        <span style={{ display: "inline-block" }}>
                                                            <ActionIcon
                                                                size="xl"
                                                                variant="light"
                                                                color={primaryColor}
                                                                radius="xl"
                                                                disabled={!canAfford}
                                                                onClick={() => {
                                                                    setInitialDiscipline(null)
                                                                    setModalOpened(true)
                                                                }}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    cursor: canAfford ? "pointer" : "default",
                                                                }}
                                                            >
                                                                <IconPlus size={24} />
                                                            </ActionIcon>
                                                        </span>
                                                    </Tooltip>
                                                )
                                            })()
                                        ) : (
                                            <ActionIcon
                                                size="xl"
                                                variant="light"
                                                color={primaryColor}
                                                radius="xl"
                                                onClick={() => {
                                                    setInitialDiscipline(null)
                                                    setModalOpened(true)
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <IconPlus size={24} />
                                            </ActionIcon>
                                        )}
                                    </Center>
                                </Paper>
                            </Grid.Col>
                        ) : null}
                    </Grid>
                </Box>
            ) : null}

            {character.rituals.length > 0 ? (
                <Box mt="xl">
                    {character.disciplines.length > 0 ? <Divider mb="lg" /> : null}
                    <Title order={2} mb="lg" ta="center">
                        Rituals
                    </Title>
                    <Grid gutter="md">
                        {character.rituals.map((ritual) => (
                            <Grid.Col key={ritual.name} span={{ base: 12, md: 6 }}>
                                <Paper p="md" withBorder>
                                    <Group justify="space-between" align="flex-start" mb="xs">
                                        <Text fw={700} size="lg">
                                            {ritual.name}
                                        </Text>
                                        <Badge variant="light" color={primaryColor}>
                                            Ritual
                                        </Badge>
                                    </Group>
                                    {ritual.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {ritual.summary}
                                        </Text>
                                    ) : null}
                                </Paper>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Box>
            ) : null}
            <DisciplineSelectModal
                opened={modalOpened}
                onClose={() => {
                    setModalOpened(false)
                    setInitialDiscipline(null)
                }}
                options={options}
                initialDiscipline={initialDiscipline}
                hideBackButton={initialDiscipline !== null}
            />
            <Modal
                opened={!!itemToDelete}
                onClose={() => {
                    setItemToDelete(null)
                }}
                title=""
                centered
                withCloseButton={false}
            >
                <Stack>
                    <Text fz="xl" ta="center">
                        {itemToDelete?.type === "power"
                            ? `Delete power "${itemToDelete.power.name}"?`
                            : `Delete discipline "${itemToDelete ? upcase(itemToDelete.disciplineName) : ""}"?`}
                    </Text>
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button
                            color="yellow"
                            variant="subtle"
                            onClick={() => {
                                setItemToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default Disciplines
