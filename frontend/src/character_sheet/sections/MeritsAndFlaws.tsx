import {
    Box,
    Grid,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    Badge,
    useMantineTheme,
    Center,
    ActionIcon,
    Modal,
    Button,
    Divider,
    Tooltip,
} from "@mantine/core"
import { useState, useMemo } from "react"
import { SheetOptions } from "../CharacterSheet"
import { bgAlpha, hexToRgba } from "../utils/style"
import MeritFlawSelectModal from "../components/MeritFlawSelectModal"
import { MeritFlaw } from "~/data/Character"
import { IconPlus, IconX } from "@tabler/icons-react"
import { PredatorTypes } from "~/data/PredatorType"

type MeritsAndFlawsProps = {
    options: SheetOptions
}

const MeritsAndFlaws = ({ options }: MeritsAndFlawsProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const [meritModalOpened, setMeritModalOpened] = useState(false)
    const [flawModalOpened, setFlawModalOpened] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ type: "merit" | "flaw"; item: MeritFlaw } | null>(null)
    const isEditable = mode === "xp" || mode === "free"
    const isFreeMode = mode === "free"

    // TODOdin: Make a hook that gets you all merits and flaws
    // TODOdin: Make descriptions of merits and flaws editable
    const predatorTypeMerits = useMemo(() => {
        if (!character.predatorType?.name) return []
        const predatorType = PredatorTypes[character.predatorType.name as keyof typeof PredatorTypes]
        if (!predatorType) return []
        return predatorType.meritsAndFlaws.filter((mf) => mf.type === "merit")
    }, [character.predatorType?.name])

    const predatorTypeFlaws = useMemo(() => {
        if (!character.predatorType?.name) return []
        const predatorType = PredatorTypes[character.predatorType.name as keyof typeof PredatorTypes]
        if (!predatorType) return []
        return predatorType.meritsAndFlaws.filter((mf) => mf.type === "flaw")
    }, [character.predatorType?.name])

    // Get picked merits and flaws from predator type
    const pickedPredatorTypeMerits = useMemo(() => {
        if (!character.predatorType?.pickedMeritsAndFlaws) return []
        return character.predatorType.pickedMeritsAndFlaws.filter((mf) => mf.type === "merit")
    }, [character.predatorType?.pickedMeritsAndFlaws])

    const pickedPredatorTypeFlaws = useMemo(() => {
        if (!character.predatorType?.pickedMeritsAndFlaws) return []
        return character.predatorType.pickedMeritsAndFlaws.filter((mf) => mf.type === "flaw")
    }, [character.predatorType?.pickedMeritsAndFlaws])

    // Combine regular merits with predator type merits (both automatic and picked)
    const allMerits = useMemo(() => {
        const regularMerits = character.merits.map((merit) => ({ merit, isFromPredatorType: false }))
        const autoMerits = predatorTypeMerits.map((merit) => ({ merit, isFromPredatorType: true }))
        const pickedMerits = pickedPredatorTypeMerits.map((merit) => ({ merit, isFromPredatorType: true }))
        return [...regularMerits, ...autoMerits, ...pickedMerits]
    }, [character.merits, predatorTypeMerits, pickedPredatorTypeMerits])

    // Combine regular flaws with predator type flaws (both automatic and picked)
    const allFlaws = useMemo(() => {
        const regularFlaws = character.flaws.map((flaw) => ({ flaw, isFromPredatorType: false }))
        const autoFlaws = predatorTypeFlaws.map((flaw) => ({ flaw, isFromPredatorType: true }))
        const pickedFlaws = pickedPredatorTypeFlaws.map((flaw) => ({ flaw, isFromPredatorType: true }))
        return [...regularFlaws, ...autoFlaws, ...pickedFlaws]
    }, [character.flaws, predatorTypeFlaws, pickedPredatorTypeFlaws])

    if (
        character.merits.length === 0 &&
        character.flaws.length === 0 &&
        predatorTypeMerits.length === 0 &&
        predatorTypeFlaws.length === 0 &&
        pickedPredatorTypeMerits.length === 0 &&
        pickedPredatorTypeFlaws.length === 0 &&
        !isEditable
    ) {
        return null
    }

    const handleDeleteMerit = (merit: MeritFlaw) => {
        setItemToDelete({ type: "merit", item: merit })
    }

    const handleDeleteFlaw = (flaw: MeritFlaw) => {
        setItemToDelete({ type: "flaw", item: flaw })
    }

    const confirmDelete = () => {
        if (!itemToDelete) return

        if (itemToDelete.type === "merit") {
            setCharacter({
                ...character,
                merits: character.merits.filter((m) => m !== itemToDelete.item),
            })
        } else {
            setCharacter({
                ...character,
                flaws: character.flaws.filter((f) => f !== itemToDelete.item),
            })
        }

        setItemToDelete(null)
    }

    return (
        <>
            <Box>
                <Title order={2} mb="md" c={primaryColor}>
                    Merits & Flaws
                </Title>
                <Grid>
                    {allMerits.length > 0 || isEditable ? (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={4} mb="sm">
                                Merits
                            </Title>
                            <Stack gap="xs">
                                {allMerits.map(({ merit, isFromPredatorType }, index) => {
                                    const meritPaper = (
                                        <Paper key={index} p="sm" withBorder style={{ backgroundColor: paperBg, position: "relative" }}>
                                            {isFreeMode && !isFromPredatorType ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleDeleteMerit(merit)}
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        right: "8px",
                                                    }}
                                                >
                                                    <IconX size={16} />
                                                </ActionIcon>
                                            ) : null}
                                            <Group justify={isFreeMode ? "flex-start" : "space-between"}>
                                                <Text fw={700} style={{ paddingRight: isFreeMode ? "60px" : "0" }}>
                                                    {merit.name}
                                                </Text>
                                                {!isFreeMode ? (
                                                    <Badge color={primaryColor} circle>
                                                        {merit.level}
                                                    </Badge>
                                                ) : null}
                                            </Group>
                                            {isFreeMode ? (
                                                <Badge
                                                    color={primaryColor}
                                                    circle
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        right: "40px",
                                                    }}
                                                >
                                                    {merit.level}
                                                </Badge>
                                            ) : null}
                                            {merit.summary ? (
                                                <Text size="sm" c="dimmed" mt="xs">
                                                    {merit.summary.charAt(0).toUpperCase() + merit.summary.slice(1)}
                                                </Text>
                                            ) : null}
                                        </Paper>
                                    )

                                    if (isFromPredatorType) {
                                        return (
                                            <Tooltip key={index} label="Added by predator type" withArrow>
                                                <Box>{meritPaper}</Box>
                                            </Tooltip>
                                        )
                                    }

                                    return meritPaper
                                })}
                                {isEditable ? (
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
                                            <ActionIcon
                                                size="xl"
                                                variant="light"
                                                color={primaryColor}
                                                radius="xl"
                                                onClick={() => setMeritModalOpened(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <IconPlus size={24} />
                                            </ActionIcon>
                                        </Center>
                                    </Paper>
                                ) : null}
                            </Stack>
                        </Grid.Col>
                    ) : null}
                    {allFlaws.length > 0 || isEditable ? (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={4} mb="sm">
                                Flaws
                            </Title>
                            <Stack gap="xs">
                                {allFlaws.map(({ flaw, isFromPredatorType }, index) => {
                                    const flawPaper = (
                                        <Paper key={index} p="sm" withBorder style={{ backgroundColor: paperBg, position: "relative" }}>
                                            {isFreeMode && !isFromPredatorType ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleDeleteFlaw(flaw)}
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        right: "8px",
                                                    }}
                                                >
                                                    <IconX size={16} />
                                                </ActionIcon>
                                            ) : null}
                                            <Group justify={isFreeMode ? "flex-start" : "space-between"}>
                                                <Text fw={700} style={{ paddingRight: isFreeMode ? "60px" : "0" }}>
                                                    {flaw.name}
                                                </Text>
                                                {!isFreeMode ? (
                                                    <Badge color="red" circle>
                                                        {flaw.level}
                                                    </Badge>
                                                ) : null}
                                            </Group>
                                            {isFreeMode ? (
                                                <Badge
                                                    color="red"
                                                    circle
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        right: "40px",
                                                    }}
                                                >
                                                    {flaw.level}
                                                </Badge>
                                            ) : null}
                                            {flaw.summary ? (
                                                <Text size="sm" c="dimmed" mt="xs">
                                                    {flaw.summary.charAt(0).toUpperCase() + flaw.summary.slice(1)}
                                                </Text>
                                            ) : null}
                                        </Paper>
                                    )

                                    if (isFromPredatorType) {
                                        return (
                                            <Tooltip key={index} label="Added by predator type" withArrow>
                                                <Box>{flawPaper}</Box>
                                            </Tooltip>
                                        )
                                    }

                                    return flawPaper
                                })}
                                {isEditable ? (
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
                                            <ActionIcon
                                                size="xl"
                                                variant="light"
                                                color="red"
                                                radius="xl"
                                                onClick={() => setFlawModalOpened(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <IconPlus size={24} />
                                            </ActionIcon>
                                        </Center>
                                    </Paper>
                                ) : null}
                            </Stack>
                        </Grid.Col>
                    ) : null}
                </Grid>
            </Box>
            <MeritFlawSelectModal opened={meritModalOpened} onClose={() => setMeritModalOpened(false)} options={options} type="merit" />
            <MeritFlawSelectModal opened={flawModalOpened} onClose={() => setFlawModalOpened(false)} options={options} type="flaw" />
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
                        Delete {itemToDelete?.type} &quot;{itemToDelete?.item.name}&quot;?
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

export default MeritsAndFlaws
