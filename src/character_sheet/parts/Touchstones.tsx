import { Box, Grid, Paper, Text, Title, useMantineTheme, Center, ActionIcon, Modal, Button, Group, Divider, Stack } from "@mantine/core"
import { useState } from "react"
import { SheetOptions } from "../utils/constants"
import { bgAlpha, hexToRgba } from "../utils/style"
import TouchstoneModal from "../components/TouchstoneModal"
import { Touchstone } from "~/data/Character"
import { IconPlus, IconX, IconPencil } from "@tabler/icons-react"

type TouchstonesProps = {
    options: SheetOptions
}

const Touchstones = ({ options }: TouchstonesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const [modalOpened, setModalOpened] = useState(false)
    const [initialTouchstone, setInitialTouchstone] = useState<Touchstone | null>(null)
    const [touchstoneToDelete, setTouchstoneToDelete] = useState<Touchstone | null>(null)
    const isFreeMode = mode === "free"

    if (character.touchstones.length === 0 && !isFreeMode) {
        return null
    }

    const handleDeleteTouchstone = (touchstone: Touchstone) => {
        setTouchstoneToDelete(touchstone)
    }

    const confirmDelete = () => {
        if (!touchstoneToDelete) return

        setCharacter({
            ...character,
            touchstones: character.touchstones.filter(
                (t) =>
                    !(
                        t.name === touchstoneToDelete.name &&
                        t.description === touchstoneToDelete.description &&
                        t.conviction === touchstoneToDelete.conviction
                    )
            ),
        })

        setTouchstoneToDelete(null)
    }

    return (
        <>
            <Box>
                <Title order={2} mb="md" c={primaryColor}>
                    Touchstones
                </Title>
                <Grid>
                    {character.touchstones.map((touchstone, index) => (
                        <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                            <Paper
                                p="sm"
                                withBorder
                                style={{
                                    backgroundColor: paperBg,
                                    position: "relative",
                                    minHeight: "120px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {isFreeMode ? (
                                    <Group gap="xs" style={{ position: "absolute", top: "8px", right: "8px" }}>
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color={primaryColor}
                                            onClick={() => {
                                                setInitialTouchstone(touchstone)
                                                setModalOpened(true)
                                            }}
                                        >
                                            <IconPencil size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleDeleteTouchstone(touchstone)}
                                        >
                                            <IconX size={16} />
                                        </ActionIcon>
                                    </Group>
                                ) : null}
                                <Text fw={700} style={{ paddingRight: isFreeMode ? "60px" : "0" }}>
                                    {touchstone.name}
                                </Text>
                                {touchstone.description ? (
                                    <Text size="sm" c="dimmed" mt="xs">
                                        {touchstone.description}
                                    </Text>
                                ) : null}
                                <Box style={{ flex: 1 }} />
                                {touchstone.conviction ? (
                                    <Text size="sm" mt="auto">
                                        <Text span fw={700}>
                                            Conviction:
                                        </Text>{" "}
                                        {touchstone.conviction}
                                    </Text>
                                ) : null}
                            </Paper>
                        </Grid.Col>
                    ))}
                    {isFreeMode ? (
                        <Grid.Col span={{ base: 12, md: 6 }}>
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
                                        onClick={() => {
                                            setInitialTouchstone(null)
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
                                </Center>
                            </Paper>
                        </Grid.Col>
                    ) : null}
                </Grid>
            </Box>
            <TouchstoneModal
                opened={modalOpened}
                onClose={() => {
                    setModalOpened(false)
                    setInitialTouchstone(null)
                }}
                options={options}
                initialTouchstone={initialTouchstone}
            />
            <Modal
                opened={!!touchstoneToDelete}
                onClose={() => {
                    setTouchstoneToDelete(null)
                }}
                title=""
                centered
                withCloseButton={false}
            >
                <Stack>
                    <Text fz="xl" ta="center">
                        Delete touchstone &quot;{touchstoneToDelete?.name}&quot;?
                    </Text>
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button
                            color="yellow"
                            variant="subtle"
                            onClick={() => {
                                setTouchstoneToDelete(null)
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

export default Touchstones
