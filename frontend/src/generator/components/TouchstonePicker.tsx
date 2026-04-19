import {
    Box,
    Button,
    Divider,
    Grid,
    Group,
    Modal,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Textarea,
    Title,
    useMantineTheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { Character, Touchstone } from "../../data/Character"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons"
import { globals } from "../../globals"
import FocusBorderWrapper from "../../character_sheet/components/FocusBorderWrapper"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type TouchstonePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type TouchstonePlaceholder = {
    name: string
    conviction: string
    description: string
}

const touchstonePlaceholderOptions: TouchstonePlaceholder[] = [
    {
        name: "Max Mustermann",
        conviction: "Never betray your friends",
        description: "Your childhood friend to whom you made a promise to always be there for each other",
    },
    {
        name: "Elena Fischer",
        conviction: "Protect the people who depend on you",
        description: "Your older sister, still holding the family together while believing you can one night come home for good",
    },
    {
        name: "Jonah Reyes",
        conviction: "Power means nothing without mercy",
        description: "A burned-out paramedic who patched you up more than once and still sees the person you used to be",
    },
    {
        name: "Mira Voss",
        conviction: "Always tell the truth when it matters most",
        description: "An investigative journalist and former lover whose faith in honesty still cuts through your excuses",
    },
]

const getRandomTouchstonePlaceholder = (): TouchstonePlaceholder =>
    touchstonePlaceholderOptions[Math.floor(Math.random() * touchstonePlaceholderOptions.length)]

const touchstoneFieldStyles = {
    label: {
        fontFamily: "Cinzel, Georgia, serif",
        fontSize: "0.9rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(201, 172, 102, 1)",
        marginBottom: 8,
    },
    input: {
        background: "rgba(20, 16, 18, 0.82)",
        borderColor: "rgba(125, 91, 72, 0.4)",
        color: "rgba(244, 236, 232, 0.95)",
        fontFamily: "Inter, Segoe UI, sans-serif",
    },
} as const

const TouchstonePicker = ({ character, setCharacter, nextStep }: TouchstonePickerProps) => {
    const theme = useMantineTheme()
    const colorValue = theme.colors.grape[6]
    const phoneScreen = globals.isPhoneScreen
    const smallScreen = globals.isSmallScreen

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Touchstone Picker" })
    }, [])

    const initial = character.touchstones.length > 0 ? character.touchstones : [{ name: "", description: "", conviction: "" }]
    const [touchstones, setTouchstones] = useState<Touchstone[]>(initial)
    const [touchstonePlaceholders, setTouchstonePlaceholders] = useState<TouchstonePlaceholder[]>(() =>
        initial.map(() => getRandomTouchstonePlaceholder())
    )
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
    const [touchstoneToDelete, setTouchstoneToDelete] = useState<number | null>(null)
    const [addButtonHovered, setAddButtonHovered] = useState(false)

    const persistTouchstones = (updatedTouchstones: Touchstone[]) => {
        setCharacter({ ...character, touchstones: updatedTouchstones })
    }

    const updateTouchstone = (i: number, updatedTouchstone: { name?: string; description?: string; conviction?: string }) => {
        const newTouchstones = [...touchstones]
        newTouchstones[i] = { ...touchstones[i], ...updatedTouchstone }
        setTouchstones(newTouchstones)
    }

    return (
        <div style={generatorScrollableShellStyle}>
            <Stack align="center" gap={"md"} style={{ ...generatorScrollableAreaStyle, width: "100%" }}>
                <ScrollArea
                    style={generatorScrollableAreaStyle}
                    w="100%"
                    px={smallScreen ? 12 : 20}
                    pt={4}
                    pb={8}
                    scrollbarSize={nightfallScrollbarSize}
                    type="always"
                    offsetScrollbars="present"
                    styles={nightfallScrollAreaStyles}
                >
                    <div style={generatorScrollableContentStyle}>
                    <Stack gap="md" align="center">
                        <Stack gap={6} align="center" mb={phoneScreen ? 18 : 26} w="100%">
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Crimson Text, Georgia, serif",
                                    fontSize: phoneScreen ? "1.95rem" : "2.35rem",
                                    lineHeight: 1.1,
                                    color: "rgba(244, 236, 232, 0.95)",
                                }}
                            >
                                Pick your{" "}
                                <span
                                    style={{
                                        fontFamily: "Cinzel, Georgia, serif",
                                        letterSpacing: "0.05em",
                                        color: "rgba(224, 49, 49, 1)",
                                    }}
                                >
                                    Touchstones & Convictions
                                </span>
                            </Text>
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Inter, Segoe UI, sans-serif",
                                    fontSize: phoneScreen ? "0.82rem" : "0.9rem",
                                    letterSpacing: "0.04em",
                                    color: "rgba(214, 204, 198, 0.5)",
                                }}
                            >
                                Touchstones are humans in your life that tie you to your humanity
                            </Text>
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Inter, Segoe UI, sans-serif",
                                    fontSize: "0.76rem",
                                    letterSpacing: "0.05em",
                                    color: "rgba(214, 204, 198, 0.36)",
                                }}
                            >
                                Connect a conviction to each relationship
                            </Text>
                        </Stack>

                        <Box my="lg" w="100%">
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.3) 50%, transparent 100%)" }} />
                                <Title
                                    order={4}
                                    style={{
                                        fontFamily: "Cinzel, Georgia, serif",
                                        fontSize: "0.95rem",
                                        fontWeight: 600,
                                        letterSpacing: "0.24em",
                                        textTransform: "uppercase",
                                        color: "rgba(224, 49, 49, 1)",
                                    }}
                                >
                                    Touchstones
                                </Title>
                                <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.3) 50%, transparent 100%)" }} />
                            </div>
                        </Box>

                        {touchstones.map((touchstone, i) => {
                            return (
                                <Box
                                    key={i}
                                    maw={smallScreen ? "100%" : 860}
                                    w="100%"
                                    px={phoneScreen ? 14 : 18}
                                    py={phoneScreen ? 14 : 18}
                                    style={{
                                        borderRadius: 18,
                                        border: "1px solid rgba(125, 91, 72, 0.38)",
                                        background: "linear-gradient(180deg, rgba(30, 21, 24, 0.78) 0%, rgba(18, 13, 16, 0.92) 100%)",
                                        boxShadow: "0 18px 32px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                                    }}
                                >
                                    <Stack gap="md">
                                        <Grid align="flex-start">
                                            <Grid.Col span={12}>
                                                <Grid>
                                                    <Grid.Col span={phoneScreen ? 12 : 6}>
                                                        <FocusBorderWrapper colorValue={colorValue} style={{ width: "100%" }}>
                                                            <TextInput
                                                                value={touchstone.name}
                                                                onChange={(event) => updateTouchstone(i, { name: event.currentTarget.value })}
                                                                onBlur={() => persistTouchstones(touchstones)}
                                                                placeholder={touchstonePlaceholders[i]?.name ?? touchstonePlaceholderOptions[0].name}
                                                                label="Touchstone Name"
                                                                styles={touchstoneFieldStyles}
                                                            />
                                                        </FocusBorderWrapper>
                                                    </Grid.Col>
                                                    <Grid.Col span={phoneScreen ? 12 : 6}>
                                                        <FocusBorderWrapper colorValue={colorValue} style={{ width: "100%" }}>
                                                            <TextInput
                                                                value={touchstone.conviction}
                                                                onChange={(event) => updateTouchstone(i, { conviction: event.currentTarget.value })}
                                                                onBlur={() => persistTouchstones(touchstones)}
                                                                placeholder={touchstonePlaceholders[i]?.conviction ?? touchstonePlaceholderOptions[0].conviction}
                                                                label="Conviction"
                                                                styles={touchstoneFieldStyles}
                                                            />
                                                        </FocusBorderWrapper>
                                                    </Grid.Col>
                                                    <Grid.Col span={12}>
                                                        <FocusBorderWrapper colorValue={colorValue} style={{ width: "100%" }}>
                                                            <Textarea
                                                                value={touchstone.description}
                                                                onChange={(event) => updateTouchstone(i, { description: event.currentTarget.value })}
                                                                onBlur={() => persistTouchstones(touchstones)}
                                                                placeholder={touchstonePlaceholders[i]?.description ?? touchstonePlaceholderOptions[0].description}
                                                                label="Description"
                                                                autosize
                                                                minRows={3}
                                                                styles={touchstoneFieldStyles}
                                                            />
                                                        </FocusBorderWrapper>
                                                    </Grid.Col>
                                                </Grid>
                                            </Grid.Col>
                                        </Grid>

                                        <Group>
                                            <Button
                                                leftSection={<FontAwesomeIcon icon={faTrash} />}
                                                size="xs"
                                                color="red"
                                                variant="subtle"
                                                onClick={() => {
                                                    const hasContent =
                                                        touchstone.name.trim() !== "" ||
                                                        touchstone.description.trim() !== "" ||
                                                        touchstone.conviction.trim() !== ""
                                                    if (hasContent) {
                                                        setTouchstoneToDelete(i)
                                                        openDeleteModal()
                                                    } else {
                                                        const newTouchstones = [...touchstones]
                                                        const newPlaceholders = [...touchstonePlaceholders]
                                                        newTouchstones.splice(i, 1)
                                                        newPlaceholders.splice(i, 1)
                                                        setTouchstones(newTouchstones)
                                                        setTouchstonePlaceholders(newPlaceholders)
                                                        persistTouchstones(newTouchstones)
                                                    }
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Box>
                            )
                        })}

                        <Button
                            leftSection={<FontAwesomeIcon icon={faPlus} />}
                            color="red"
                            variant="outline"
                            onClick={() => {
                                const newTouchstones = [...touchstones, { name: "", description: "", conviction: "" }]
                                const newPlaceholders = [...touchstonePlaceholders, getRandomTouchstonePlaceholder()]
                                setTouchstones(newTouchstones)
                                setTouchstonePlaceholders(newPlaceholders)
                                persistTouchstones(newTouchstones)
                            }}
                            onMouseEnter={() => setAddButtonHovered(true)}
                            onMouseLeave={() => setAddButtonHovered(false)}
                            styles={{
                              // TODOdin: Lol. Lmao even. Let's get proper css hover in here before merging
                                root: {
                                    alignSelf: "center",
                                    borderColor: addButtonHovered ? "rgba(250, 82, 82, 0.85)" : "rgba(224, 49, 49, 0.4)",
                                    background: addButtonHovered ? "rgba(224, 49, 49, 0.24)" : "rgba(224, 49, 49, 0.08)",
                                    boxShadow: addButtonHovered ? "0 0 0 1px rgba(224, 49, 49, 0.22), 0 0 18px rgba(224, 49, 49, 0.18), 0 10px 24px rgba(224, 49, 49, 0.18)" : "none",
                                    transform: addButtonHovered ? "translateY(-1px) scale(1.01)" : "translateY(0) scale(1)",
                                    transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                },
                                section: {
                                    color: "rgba(224, 49, 49, 1)",
                                },
                            }}
                        >
                            Add Touchstone
                        </Button>
                    </Stack>
                    </div>
                </ScrollArea>

                <Group justify="center">
                    <Button
                        color="grape"
                        onClick={() => {
                            persistTouchstones(touchstones)

                            trackEvent({
                                action: "touchstone confirm clicked",
                                category: "touchstones",
                                label: `${touchstones.length}`,
                            })

                            nextStep()
                        }}
                    >
                        Confirm
                    </Button>
                </Group>
            </Stack>

            <Modal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                title=""
                centered
                withCloseButton={false}
                overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
                styles={{
                    content: {
                        border: "1px solid rgba(125, 91, 72, 0.38)",
                        background: "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
                        boxShadow: "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    },
                    body: {
                        padding: phoneScreen ? "1.1rem" : "1.35rem",
                    },
                }}
            >
                <Stack gap="md">
                    <Stack gap={6} align="center">
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                fontSize: phoneScreen ? "1.2rem" : "1.35rem",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(244, 236, 232, 0.95)",
                            }}
                        >
                            Delete Touchstone?
                        </Text>
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                fontSize: "0.9rem",
                                color: "rgba(214, 204, 198, 0.62)",
                            }}
                        >
                            This will remove the touchstone and its conviction from the character.
                        </Text>
                    </Stack>

                    {touchstoneToDelete !== null && touchstones[touchstoneToDelete]?.name && (
                        <Box
                            px="md"
                            py="sm"
                            style={{
                                borderRadius: 14,
                                border: "1px solid rgba(125, 91, 72, 0.3)",
                                background: "rgba(255, 255, 255, 0.03)",
                            }}
                        >
                            <Text
                                ta="center"
                                style={{
                                    fontFamily: "Cinzel, Georgia, serif",
                                    fontSize: "0.92rem",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: "rgba(201, 172, 102, 1)",
                                }}
                            >
                                {touchstones[touchstoneToDelete].name}
                            </Text>
                        </Box>
                    )}

                    <Divider color="rgba(125, 91, 72, 0.28)" />

                    <Group justify="space-between">
                        <Button
                            color="gray"
                            variant="subtle"
                            leftSection={<FontAwesomeIcon icon={faXmark} />}
                            onClick={closeDeleteModal}
                            styles={{
                                root: {
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                },
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="red"
                            leftSection={<FontAwesomeIcon icon={faTrash} />}
                            onClick={() => {
                                if (touchstoneToDelete !== null) {
                                    const newTouchstones = [...touchstones]
                                    const newPlaceholders = [...touchstonePlaceholders]
                                    newTouchstones.splice(touchstoneToDelete, 1)
                                    newPlaceholders.splice(touchstoneToDelete, 1)
                                    setTouchstones(newTouchstones)
                                    setTouchstonePlaceholders(newPlaceholders)
                                    persistTouchstones(newTouchstones)
                                }
                                setTouchstoneToDelete(null)
                                closeDeleteModal()
                            }}
                            styles={{
                                root: {
                                    background: "linear-gradient(180deg, rgba(224, 49, 49, 0.92) 0%, rgba(186, 38, 38, 0.95) 100%)",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                    boxShadow: "0 10px 24px rgba(224, 49, 49, 0.24)",
                                },
                            }}
                        >
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    )
}

export default TouchstonePicker
