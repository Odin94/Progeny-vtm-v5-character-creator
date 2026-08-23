import {
    Box,
    Grid,
    Paper,
    Text,
    Center,
    ActionIcon,
    Modal,
    Button,
    Group,
    Divider,
    Stack
} from "@mantine/core"
import { memo, useState } from "react"
import { SheetOptions } from "../CharacterSheet"
import { sheetAddSurfaceStyle, sheetSurfaceStyle } from "../utils/style"
import TouchstoneModal from "../components/TouchstoneModal"
import { Touchstone } from "~/data/Character"
import { IconPlus, IconX, IconPencil } from "@tabler/icons-react"

type TouchstonesProps = {
    options: SheetOptions
}

const Touchstones = ({ options }: TouchstonesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [modalOpened, setModalOpened] = useState(false)
    const [initialTouchstone, setInitialTouchstone] = useState<Touchstone | null>(null)
    const [initialIndex, setInitialIndex] = useState<number | null>(null)
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

        setCharacter((current) => ({
            ...current,
            touchstones: current.touchstones.filter(
                (t) =>
                    !(
                        t.name === touchstoneToDelete.name &&
                        t.description === touchstoneToDelete.description &&
                        t.conviction === touchstoneToDelete.conviction
                    )
            )
        }))

        setTouchstoneToDelete(null)
    }

    return (
        <>
            <Box>
                <Grid>
                    {character.touchstones.map((touchstone, index) => (
                        <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                            <Paper
                                p="sm"
                                style={{
                                    ...sheetSurfaceStyle,
                                    position: "relative",
                                    minHeight: "120px",
                                    display: "flex",
                                    flexDirection: "column"
                                }}
                            >
                                {isFreeMode ? (
                                    <Group
                                        gap="xs"
                                        style={{ position: "absolute", top: "8px", right: "8px" }}
                                    >
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color={primaryColor}
                                            onClick={() => {
                                                setInitialTouchstone(touchstone)
                                                setInitialIndex(index)
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
                                    ...sheetAddSurfaceStyle
                                }}
                            >
                                <Center style={{ height: "100%" }}>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color={primaryColor}
                                        radius="md"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => {
                                            setInitialTouchstone(null)
                                            setInitialIndex(null)
                                            setModalOpened(true)
                                        }}
                                    >
                                        Add touchstone
                                    </Button>
                                </Center>
                            </Paper>
                        </Grid.Col>
                    ) : null}
                </Grid>
            </Box>
            {modalOpened ? (
                <TouchstoneModal
                    opened
                    onClose={() => {
                        setModalOpened(false)
                        setInitialTouchstone(null)
                        setInitialIndex(null)
                    }}
                    options={options}
                    initialTouchstone={initialTouchstone}
                    initialIndex={initialIndex}
                />
            ) : null}
            {touchstoneToDelete ? (
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
            ) : null}
        </>
    )
}

export default memo(Touchstones, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.touchstones === n.character.touchstones
    )
})
