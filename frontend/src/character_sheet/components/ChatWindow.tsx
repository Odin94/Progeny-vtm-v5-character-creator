import { ActionIcon, Badge, Box, Button, Group, Paper, ScrollArea, Stack, Text, TextInput, Tooltip, useMantineTheme } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconAlertCircle, IconChevronDown, IconDice, IconDroplet, IconInfoCircle, IconMessageCircle, IconUsers, IconX, IconArrowLeft } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { useSessionChat } from "~/hooks/useSessionChat"
import { getAutoShareDiceRolls, setAutoShareDiceRolls } from "~/utils/chatSettings"
import { SheetOptions } from "../CharacterSheet"
import { useAuth } from "~/hooks/useAuth"
import { api } from "~/utils/api"
import { RollData } from "../stores/sessionChatStore"

type ChatWindowProps = {
    options: SheetOptions
}

type Coterie = {
    id: string
    name: string
    owned: boolean
}

const ChatWindow = ({ options }: ChatWindowProps) => {
    const { primaryColor, character } = options
    const theme = useMantineTheme()
    const colorValue = primaryColor.startsWith("#") ? primaryColor : theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const [expanded, { toggle: toggleExpanded }] = useDisclosure(false)
    const [view, setView] = useState<"disconnected" | "creating" | "joining" | "joiningCoterie">("disconnected")
    const [sessionInput, setSessionInput] = useState("")
    const [sessionType, setSessionType] = useState<"temporary" | "coterie" | null>(null)
    const [coteries, setCoteries] = useState<Coterie[]>([])
    const [autoShare, setAutoShare] = useState(getAutoShareDiceRolls())
    const [messageInput, setMessageInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user, isAuthenticated } = useAuth()

    const {
        connectionStatus,
        sessionId,
        sessionType: currentSessionType,
        participants,
        messages,
        connect,
        disconnect,
        joinSession,
        leaveSession,
        sendChatMessage,
    } = useSessionChat()

    useEffect(() => {
        if (expanded && isAuthenticated && connectionStatus === "disconnected") {
            loadCoteries()
        }
    }, [expanded, isAuthenticated, connectionStatus])

    useEffect(() => {
        if (expanded && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, expanded])

    const loadCoteries = async () => {
        try {
            const data = await api.getCoteries()
            setCoteries(data as Coterie[])
        } catch (error) {
            console.error("Failed to load coteries:", error)
        }
    }

    const handleCreateSession = () => {
        setSessionType("temporary")
        setSessionInput("")
        setView("creating")
    }

    const handleJoinSession = () => {
        setSessionType("temporary")
        setSessionInput("")
        setView("joining")
    }

    const handleJoinCoterie = () => {
        setSessionType("coterie")
        setView("joiningCoterie")
    }

    const handleBack = () => {
        setView("disconnected")
        setSessionInput("")
        setSessionType(null)
    }

    const handleConnect = () => {
        if (sessionType === "temporary" && sessionInput.trim()) {
            connect()
            joinSession({ sessionId: sessionInput.trim() })
            setView("disconnected")
        } else if (sessionType === "coterie" && sessionInput.trim()) {
            connect()
            joinSession({ coterieId: sessionInput.trim() })
            setView("disconnected")
        } else if (sessionType === "temporary") {
            connect()
            joinSession()
            setView("disconnected")
        }
    }

    const handleDisconnect = () => {
        leaveSession()
        setSessionInput("")
        setView("disconnected")
    }

    const handleSendMessage = () => {
        if (messageInput.trim() && connectionStatus === "connected" && sessionId) {
            sendChatMessage(messageInput.trim())
            setMessageInput("")
        }
    }

    const handleAutoShareToggle = (value: boolean) => {
        setAutoShare(value)
        setAutoShareDiceRolls(value)
    }

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const getConnectionStatusColor = (): string => {
        switch (connectionStatus) {
            case "connected":
                return "green"
            case "connecting":
                return "yellow"
            case "error":
                return "red"
            default:
                return "gray"
        }
    }

    if (!expanded) {
        return (
            <ActionIcon
                size="xl"
                variant="light"
                color={primaryColor}
                radius="xl"
                onClick={toggleExpanded}
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "6rem",
                    zIndex: 1000,
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
            >
                <IconMessageCircle size={24} />
            </ActionIcon>
        )
    }

    return (
        <>
            <Paper
                p="md"
                radius="md"
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "6rem",
                    width: "400px",
                    height: "500px",
                    maxHeight: "calc(100vh - 4rem)",
                    zIndex: 1000,
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    backdropFilter: "blur(10px)",
                    border: `2px solid ${colorValue}`,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                        <Text fw={600} size="lg">
                            Chat
                        </Text>
                        <Tooltip label="Chat messages are not stored on the server and will be lost when the chat is closed" withArrow zIndex={2000}>
                            <ActionIcon size="xs" variant="subtle" color="gray" style={{ cursor: "help" }}>
                                <IconInfoCircle size={14} />
                            </ActionIcon>
                        </Tooltip>
                        {connectionStatus === "connected" ? (
                            <Badge color={getConnectionStatusColor()} size="sm">
                                {participants.length} {participants.length === 1 ? "player" : "players"}
                            </Badge>
                        ) : (
                            <Badge color={getConnectionStatusColor()} size="sm">
                                {connectionStatus}
                            </Badge>
                        )}
                    </Group>
                    <Group gap="xs">
                        {connectionStatus === "connected" ? (
                            <ActionIcon size="sm" variant="subtle" color="red" onClick={handleDisconnect}>
                                <IconX size={16} />
                            </ActionIcon>
                        ) : null}
                        <ActionIcon size="sm" variant="subtle" color={primaryColor} onClick={toggleExpanded}>
                            <IconChevronDown size={16} />
                        </ActionIcon>
                    </Group>
                </Group>

                {connectionStatus === "disconnected" ? (
                    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                        {view === "disconnected" ? (
                            <>
                                <Text ta="center" c="dimmed" size="sm" style={{ marginTop: "auto", marginBottom: "auto" }}>
                                    {isAuthenticated ? "Join or create a session to start chatting" : "Sign in to use chat"}
                                </Text>
                                {isAuthenticated ? (
                                    <Stack gap="xs" style={{ marginTop: "auto" }}>
                                        <Button
                                            fullWidth
                                            color={primaryColor}
                                            onClick={handleCreateSession}
                                            leftSection={<IconMessageCircle size={16} />}
                                        >
                                            Create Session
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="light"
                                            color={primaryColor}
                                            onClick={handleJoinSession}
                                            leftSection={<IconMessageCircle size={16} />}
                                        >
                                            Join Session
                                        </Button>
                                        {coteries.length > 0 ? (
                                            <Button
                                                fullWidth
                                                variant="light"
                                                color={primaryColor}
                                                onClick={handleJoinCoterie}
                                                leftSection={<IconUsers size={16} />}
                                            >
                                                Join Coterie
                                            </Button>
                                        ) : null}
                                    </Stack>
                                ) : null}
                            </>
                        ) : view === "creating" || view === "joining" ? (
                            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                                <Group gap="xs">
                                    <ActionIcon size="sm" variant="subtle" onClick={handleBack}>
                                        <IconArrowLeft size={16} />
                                    </ActionIcon>
                                    <Text fw={600} size="lg" style={{ flex: 1 }}>
                                        {view === "creating" ? "Create Session" : "Join Session"}
                                    </Text>
                                </Group>
                                <TextInput
                                    placeholder={view === "creating" ? "Leave empty to create new" : "Session ID"}
                                    value={sessionInput}
                                    onChange={(e) => setSessionInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleConnect()
                                        }
                                    }}
                                />
                                <Group justify="flex-end" style={{ marginTop: "auto" }}>
                                    <Button variant="subtle" onClick={handleBack}>
                                        Cancel
                                    </Button>
                                    <Button color={primaryColor} onClick={handleConnect}>
                                        {view === "creating" ? (sessionInput ? "Join" : "Create") : "Join"}
                                    </Button>
                                </Group>
                            </Stack>
                        ) : view === "joiningCoterie" ? (
                            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                                <Group gap="xs">
                                    <ActionIcon size="sm" variant="subtle" onClick={handleBack}>
                                        <IconArrowLeft size={16} />
                                    </ActionIcon>
                                    <Text fw={600} size="lg" style={{ flex: 1 }}>
                                        Join Coterie
                                    </Text>
                                </Group>
                                <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                                    <Stack gap="xs">
                                        {coteries.map((coterie) => (
                                            <Button
                                                key={coterie.id}
                                                variant="light"
                                                color={primaryColor}
                                                fullWidth
                                                onClick={() => {
                                                    connect()
                                                    joinSession({ coterieId: coterie.id })
                                                    setView("disconnected")
                                                }}
                                            >
                                                {coterie.name} {coterie.owned ? "(Owner)" : ""}
                                            </Button>
                                        ))}
                                        {coteries.length === 0 ? (
                                            <Text size="sm" c="dimmed" ta="center">
                                                No coteries available
                                            </Text>
                                        ) : null}
                                    </Stack>
                                </ScrollArea>
                            </Stack>
                        ) : null}
                    </Stack>
                ) : connectionStatus === "connecting" ? (
                    <Stack gap="md" style={{ flex: 1, justifyContent: "center" }}>
                        <Text ta="center" c="dimmed">
                            Connecting...
                        </Text>
                    </Stack>
                ) : (
                    <>
                        {participants.length > 0 ? (
                            <Group gap="xs" mb="xs" p="xs" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}>
                                <IconUsers size={14} />
                                <Text size="xs" c="dimmed">
                                    {participants.map((p) => p.characterName || p.userName).join(", ")}
                                </Text>
                            </Group>
                        ) : null}

                        <ScrollArea style={{ flex: 1, minHeight: 0 }} mb="md">
                            <Stack gap="xs">
                                {messages.map((msg, idx) => {
                                    if (msg.type === "chat_message") {
                                        return (
                                            <Box key={idx} p="xs" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}>
                                                <Group gap="xs" mb={4}>
                                                    <Text size="sm" fw={600}>
                                                        {msg.characterName || msg.userName}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {formatTimestamp(msg.timestamp)}
                                                    </Text>
                                                </Group>
                                                <Text size="sm">{msg.message}</Text>
                                            </Box>
                                        )
                                    } else if (msg.type === "dice_roll") {
                                        const criticalCount = msg.rollData.results.filter((r) => r.type === "critical" || r.type === "blood-critical").length
                                        const hasCriticals = criticalCount >= 2
                                        const hasBestial = msg.rollData.results.some((r) => r.type === "bestial-failure")
                                        function getDiceBonusStr(rollData: RollData) {
                                            const bonuses: string[] = []

                                            if (rollData.poolInfo?.bloodSurge) {
                                                bonuses.push("Blood Surge")
                                            }

                                            if (rollData.poolInfo?.specialtyBonus && rollData.poolInfo.specialtyBonus > 0) {
                                                bonuses.push(`${rollData.poolInfo.specialtyBonus} Specialty${rollData.poolInfo.specialtyBonus > 1 ? "ies" : ""}`)
                                            }

                                            if (rollData.poolInfo?.disciplinePowerBonus && rollData.poolInfo.disciplinePowerBonus > 0) {
                                                bonuses.push(`${rollData.poolInfo.disciplinePowerBonus} from Discipline Powers`)
                                            }

                                            if (bonuses.length === 0) {
                                                return ""
                                            }

                                            return ` (${bonuses.join(", ")})`
                                        }

                                        return (
                                            <Box
                                                key={idx}
                                                p="xs"
                                                style={{
                                                    backgroundColor: "rgba(192, 63, 63, 0.1)",
                                                    borderRadius: "4px",
                                                    border: `1px solid ${colorValue}`,
                                                }}
                                            >
                                                <Group gap="xs" mb={4}>
                                                    <IconDice size={14} />
                                                    <Text size="sm" fw={600}>
                                                        {msg.characterName || msg.userName}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {formatTimestamp(msg.timestamp)}
                                                    </Text>
                                                </Group>
                                                <Text size="sm">
                                                    Rolled {msg.rollData.poolInfo?.diceCount || msg.rollData.dice.length} dice:{" "}
                                                    <Text span fw={600} c={msg.rollData.totalSuccesses > 0 ? "green" : "red"}>
                                                        {msg.rollData.totalSuccesses} {msg.rollData.totalSuccesses === 1 ? "success" : "successes"}
                                                    </Text>
                                                    {hasCriticals ? (
                                                        <Text span c="yellow" fw={600}>
                                                            {" "}
                                                            (crit!)
                                                        </Text>
                                                    ) : null}
                                                    {hasBestial ? (
                                                        <Text span c="red" fw={600}>
                                                            {" "}
                                                            (bestial failure!)
                                                        </Text>
                                                    ) : null}
                                                </Text>
                                                {msg.rollData.poolInfo ? (
                                                    <Text size="xs" c="dimmed" mt={4}>
                                                        {msg.rollData.poolInfo.attribute
                                                            ? `${msg.rollData.poolInfo.attribute}${msg.rollData.poolInfo.skill ? ` + ${msg.rollData.poolInfo.skill}` : ""}${msg.rollData.poolInfo.discipline ? ` + ${msg.rollData.poolInfo.discipline}` : ""}${getDiceBonusStr(msg.rollData)}`
                                                            : "Custom pool"}
                                                    </Text>
                                                ) : null}
                                                {msg.rollData.isReroll ? (
                                                    <Text size="xs" c="yellow" mt={4} fw={600}>
                                                        Willpower Reroll
                                                    </Text>
                                                ) : null}
                                            </Box>
                                        )
                                    } else if (msg.type === "rouse_check") {
                                        return (
                                            <Box
                                                key={idx}
                                                p="xs"
                                                style={{
                                                    backgroundColor: "rgba(192, 63, 63, 0.1)",
                                                    borderRadius: "4px",
                                                    border: `1px solid ${colorValue}`,
                                                }}
                                            >
                                                <Group gap="xs" mb={4}>
                                                    <IconDroplet size={14} />
                                                    <Text size="sm" fw={600}>
                                                        {msg.characterName || msg.userName}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {formatTimestamp(msg.timestamp)}
                                                    </Text>
                                                </Group>
                                                <Text size="sm">
                                                    Rouse Check:{" "}
                                                    <Text span fw={600} c={msg.success ? "green" : "red"}>
                                                        {msg.success ? "✓ Passed" : "✗ Failed"}
                                                    </Text>
                                                </Text>
                                                <Text size="xs" c="dimmed" mt={4}>
                                                    Hunger: {msg.newHunger}/5
                                                </Text>
                                            </Box>
                                        )
                                    } else if (msg.type === "error") {
                                        return (
                                            <Box
                                                key={idx}
                                                p="xs"
                                                style={{
                                                    backgroundColor: "rgba(255, 0, 0, 0.1)",
                                                    borderRadius: "4px",
                                                    border: "1px solid rgba(255, 0, 0, 0.3)",
                                                }}
                                            >
                                                <Group gap="xs" mb={4}>
                                                    <IconAlertCircle size={14} color="red" />
                                                    <Text size="sm" fw={600} c="red">
                                                        Error
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {formatTimestamp(msg.timestamp)}
                                                    </Text>
                                                </Group>
                                                <Text size="sm" c="red">
                                                    {msg.message}
                                                </Text>
                                            </Box>
                                        )
                                    }
                                    return null
                                })}
                                <div ref={messagesEndRef} />
                            </Stack>
                        </ScrollArea>

                        <Group gap="xs" mb="xs">
                            <TextInput
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value.length <= 5000) {
                                        setMessageInput(value)
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }
                                }}
                                style={{ flex: 1 }}
                                disabled={connectionStatus !== "connected" || !sessionId}
                                maxLength={5000}
                            />
                            <ActionIcon
                                color={primaryColor}
                                variant="filled"
                                onClick={handleSendMessage}
                                disabled={connectionStatus !== "connected" || !sessionId || !messageInput.trim()}
                            >
                                <IconMessageCircle size={18} />
                            </ActionIcon>
                        </Group>

                        <Group gap="xs">
                            <Text size="xs" c="dimmed">
                                Auto-share dice rolls:
                            </Text>
                            <Button
                                size="xs"
                                variant={autoShare ? "filled" : "outline"}
                                color={primaryColor}
                                onClick={() => handleAutoShareToggle(!autoShare)}
                            >
                                {autoShare ? "On" : "Off"}
                            </Button>
                        </Group>
                    </>
                )}
            </Paper>
        </>
    )
}

export default ChatWindow
