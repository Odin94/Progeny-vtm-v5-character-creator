import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Indicator,
    Loader,
    ScrollArea,
    Switch,
    TextInput,
    Tooltip
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
    IconAlertCircle,
    IconArrowLeft,
    IconArrowRight,
    IconCheck,
    IconChevronDown,
    IconCopy,
    IconDice,
    IconDroplet,
    IconHeartHandshake,
    IconInfoCircle,
    IconLogin2,
    IconLogout,
    IconMessageCircle,
    IconPlus,
    IconRefresh,
    IconSend2,
    IconUsers
} from "@tabler/icons-react"
import { memo, type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useSessionChat } from "~/hooks/useSessionChat"
import { getAutoShareDiceRolls, setAutoShareDiceRolls } from "~/utils/chatSettings"
import { SheetOptions } from "../CharacterSheet"
import { useAuth } from "~/hooks/useAuth"
import { api, type RecentChatSessionResponse } from "~/utils/api"
import { coterieHttp } from "~/utils/http/coteries"
import { RollData } from "../stores/sessionChatStore"
import NameTag from "~/components/NameTag"
import { DisabledReason } from "~/components/ui"
import { motion as motionTokens } from "~/theme/tokens"
import { upcase } from "~/generator/utils"
import DieGlyphs from "./diceRollModal/parts/DieGlyphs"
import { getRollOutcome } from "./diceRollModal/rollOutcome"
import classes from "./ChatWindow.module.css"

type ChatWindowProps = {
    options: Pick<SheetOptions, "primaryColor" | "character">
    openSignal?: number
    sessionLabel?: string | null
    sessionLabelSessionId?: string | null
    initiallyExpanded?: boolean
    lockedOpen?: boolean
    docked?: boolean
    inline?: boolean
}

type Coterie = {
    id: string
    name: string
    owned: boolean
}

type SenderMessage = {
    userId?: string
    userName?: string
    showNameTag?: boolean
    characterName?: string
}

const hashStringToHue = (value: string): number => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0
    }
    return hash % 360
}

const ChatWindow = ({
    options,
    openSignal,
    sessionLabel,
    sessionLabelSessionId,
    initiallyExpanded = false,
    lockedOpen = false,
    docked = false,
    inline = false
}: ChatWindowProps) => {
    const { primaryColor, character } = options
    const [expanded, { toggle: toggleExpanded, open: openExpanded }] =
        useDisclosure(initiallyExpanded)
    const [view, setView] = useState<"disconnected" | "creating" | "joining" | "joiningCoterie">(
        "disconnected"
    )
    const [sessionInput, setSessionInput] = useState("")
    const [sessionType, setSessionType] = useState<"temporary" | "coterie" | null>(null)
    const [copiedSessionId, setCopiedSessionId] = useState(false)
    const [coteries, setCoteries] = useState<Coterie[]>([])
    const [recentChatSession, setRecentChatSession] = useState<Extract<
        RecentChatSessionResponse,
        { available: true }
    > | null>(null)
    const [autoShare, setAutoShare] = useState(getAutoShareDiceRolls())
    const [messageInput, setMessageInput] = useState("")
    const [joinError, setJoinError] = useState<string | null>(null)
    const setupDirectionRef = useRef<1 | -1>(1)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messageInputRef = useRef<HTMLInputElement>(null)
    const restoredSessionForUserRef = useRef<string | null>(null)
    const loadedOpenPanelDataRef = useRef(false)
    const { user, isAuthenticated, signIn, isSigningIn } = useAuth()
    const shouldReduceMotion = useReducedMotion()

    const {
        connectionStatus,
        sessionId,
        sessionType: currentSessionType,
        participants,
        messages,
        connect,
        disconnect,
        joinSession,
        restoreLastSession,
        leaveSession,
        sendChatMessage
    } = useSessionChat()

    const characterName = character?.name || undefined
    const showSessionLabel =
        !!sessionLabel &&
        currentSessionType === "coterie" &&
        (!sessionLabelSessionId || sessionLabelSessionId === sessionId)
    const chatTitle = showSessionLabel ? `${sessionLabel} Chat` : "Chat"

    const isExpanded = lockedOpen || expanded

    const loadCoteries = useCallback(async () => {
        try {
            const data = await coterieHttp.getAll()
            setCoteries(data as Coterie[])
        } catch (error) {
            console.error("Failed to load coteries:", error)
        }
    }, [])

    const loadRecentChatSession = useCallback(async () => {
        try {
            const data = await api.getRecentChatSession()
            setRecentChatSession(data.available ? data : null)
        } catch (error) {
            console.error("Failed to load recent chat session:", error)
            setRecentChatSession(null)
        }
    }, [])

    useEffect(() => {
        if (openSignal || lockedOpen) {
            openExpanded()
        }
    }, [lockedOpen, openSignal, openExpanded])

    useEffect(() => {
        if (!isAuthenticated) {
            restoredSessionForUserRef.current = null
            return
        }

        const userKey = user?.id ?? "authenticated"
        if (connectionStatus === "disconnected" && restoredSessionForUserRef.current !== userKey) {
            restoredSessionForUserRef.current = userKey
            restoreLastSession(characterName)
        }
    }, [isAuthenticated, user?.id, connectionStatus, restoreLastSession, characterName])

    useEffect(() => {
        if (!isAuthenticated) {
            loadedOpenPanelDataRef.current = false
            setCoteries([])
            setRecentChatSession(null)
            return
        }

        if (!isExpanded) {
            loadedOpenPanelDataRef.current = false
            return
        }

        if (!loadedOpenPanelDataRef.current) {
            loadedOpenPanelDataRef.current = true
            void Promise.all([loadCoteries(), loadRecentChatSession()])
        }
    }, [isExpanded, isAuthenticated, loadCoteries, loadRecentChatSession])

    useEffect(() => {
        if (isExpanded && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({
                behavior: shouldReduceMotion ? "auto" : "smooth",
                block: "nearest"
            })
        }
    }, [messages, isExpanded, shouldReduceMotion])

    useEffect(() => {
        const errorMessage = messages.find((msg) => msg.type === "error")
        if (errorMessage && view === "joining") {
            setJoinError(errorMessage.message)
        } else if (connectionStatus === "connected" && sessionId && view === "joining") {
            setJoinError(null)
            setView("disconnected")
        }
    }, [messages, connectionStatus, sessionId, view])

    const handleCreateSession = () => {
        setupDirectionRef.current = 1
        setSessionType("temporary")
        setSessionInput("")
        setView("creating")
        setCopiedSessionId(false)
    }

    const handleJoinSession = () => {
        setupDirectionRef.current = 1
        setSessionType("temporary")
        setSessionInput("")
        setView("joining")
        setJoinError(null)
    }

    const handleJoinCoterie = () => {
        setupDirectionRef.current = 1
        setSessionType("coterie")
        setView("joiningCoterie")
    }

    const handleRejoinRecentChat = () => {
        if (!recentChatSession) {
            return
        }

        connect()
        if (recentChatSession.sessionType === "coterie") {
            joinSession({
                coterieId: recentChatSession.coterieId ?? recentChatSession.sessionId,
                characterName
            })
        } else {
            joinSession({
                sessionId: recentChatSession.sessionId,
                characterName
            })
        }
        setRecentChatSession(null)
        setView("disconnected")
    }

    const handleBack = () => {
        setupDirectionRef.current = -1
        setView("disconnected")
        setSessionInput("")
        setSessionType(null)
        setJoinError(null)
        if (connectionStatus === "connected" || connectionStatus === "connecting") {
            leaveSession()
        }
    }

    const handleConnect = () => {
        setJoinError(null)
        if (sessionType === "temporary" && sessionInput.trim()) {
            connect()
            joinSession({ sessionId: sessionInput.trim(), characterName })
        } else if (sessionType === "coterie" && sessionInput.trim()) {
            connect()
            joinSession({ coterieId: sessionInput.trim(), characterName })
        } else if (sessionType === "temporary") {
            connect()
            joinSession({ characterName })
        }
    }

    const handleCopySessionId = async () => {
        if (sessionId) {
            try {
                await navigator.clipboard.writeText(sessionId)
                setCopiedSessionId(true)
                setTimeout(() => setCopiedSessionId(false), 2000)
            } catch (error) {
                console.error("Failed to copy session ID:", error)
            }
        }
    }

    const handleDisconnect = () => {
        leaveSession()
        setSessionInput("")
        setView("disconnected")
    }

    const handleGoToChat = () => {
        setupDirectionRef.current = -1
        setView("disconnected")
    }

    const handleSendMessage = () => {
        if (messageInput.trim() && connectionStatus === "connected" && sessionId) {
            sendChatMessage(messageInput.trim(), characterName)
            setMessageInput("")
        }
        // Keep typing: the composer stays focused until the player moves away on purpose.
        messageInputRef.current?.focus()
    }

    const handleAutoShareToggle = (value: boolean) => {
        setAutoShare(value)
        setAutoShareDiceRolls(value)
    }

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const formatMessageName = (userName: string | undefined, characterName?: string): string => {
        if (!userName) {
            return characterName || "Unknown"
        }
        if (characterName && characterName !== userName) {
            return `${characterName} (${userName})`
        }
        return userName
    }

    const renderMessageName = (message: SenderMessage) => {
        if (message.showNameTag && message.userName) {
            return (
                <>
                    {message.characterName && message.characterName !== message.userName ? (
                        <span>{message.characterName}</span>
                    ) : null}
                    <NameTag name={message.userName} size="xs" />
                </>
            )
        }

        if (
            message.userName &&
            message.characterName &&
            message.characterName !== message.userName
        ) {
            return (
                <>
                    <span>{message.characterName}</span>
                    <span className={classes.senderPlayer}>{message.userName}</span>
                </>
            )
        }

        return <span>{formatMessageName(message.userName, message.characterName)}</span>
    }

    const isOwnMessage = (message: SenderMessage): boolean => {
        return !!user?.id && message.userId === user.id
    }

    const senderHue = (message: SenderMessage) =>
        hashStringToHue(message.userName || message.characterName || message.userId || "unknown")

    const getDisabledTooltipMessage = (): string => {
        const status = connectionStatus
        if (status === "connecting") {
            return "Connecting to chat..."
        }
        if (status === "disconnected") {
            return !sessionId
                ? "Join or create a session to send messages"
                : "Not connected to chat"
        }
        if (status === "error") {
            return "Connection error. Please try reconnecting."
        }
        if (!sessionId) {
            return "Join or create a session to send messages"
        }
        return ""
    }

    const isConnected =
        connectionStatus === "connected" && sessionId !== null && sessionId !== undefined
    const canSend = connectionStatus === "connected" && !!sessionId

    // Focus the composer when the player opens the chat into a live session.
    const focusedForOpenRef = useRef(false)
    useEffect(() => {
        if (!isExpanded || lockedOpen) {
            focusedForOpenRef.current = false
            return
        }
        if (canSend && !focusedForOpenRef.current) {
            focusedForOpenRef.current = true
            messageInputRef.current?.focus()
        }
    }, [isExpanded, lockedOpen, canSend])

    if (!isExpanded) {
        return (
            <Indicator
                disabled={!isConnected}
                processing={isConnected}
                color="green"
                size={11}
                offset={6}
                key={`${connectionStatus}-${sessionId}`}
                className={classes.launcher}
            >
                <Tooltip label={isConnected ? "Session chat" : "Open session chat"} position="left">
                    <ActionIcon
                        size={48}
                        variant="light"
                        color={primaryColor}
                        radius="xl"
                        aria-label="Open session chat"
                        className={classes.launcherButton}
                        onClick={toggleExpanded}
                    >
                        <IconMessageCircle size={22} />
                    </ActionIcon>
                </Tooltip>
            </Indicator>
        )
    }

    const statusLabel =
        connectionStatus === "connected"
            ? `${participants.length} ${participants.length === 1 ? "player" : "players"}`
            : connectionStatus === "connecting"
              ? "Connecting…"
              : connectionStatus === "error"
                ? "Connection lost"
                : "Not connected"

    // Group consecutive messages from one sender (within five minutes) under a single name.
    type ChatEntry = (typeof messages)[number]
    type SenderEntry = Exclude<ChatEntry, { type: "error" }>
    const senderKey = (message: SenderEntry) =>
        `${message.userId}|${message.userName}|${message.characterName ?? ""}`
    const groups: Array<
        | { kind: "error"; key: string; message: Extract<ChatEntry, { type: "error" }> }
        | { kind: "sender"; key: string; items: Array<{ message: SenderEntry; index: number }> }
    > = []
    messages.forEach((message, index) => {
        if (message.type === "error") {
            groups.push({ kind: "error", key: `error-${index}`, message })
            return
        }
        if (
            message.type !== "chat_message" &&
            message.type !== "dice_roll" &&
            message.type !== "rouse_check" &&
            message.type !== "remorse_check"
        ) {
            return
        }
        const previous = groups[groups.length - 1]
        if (previous?.kind === "sender") {
            const last = previous.items[previous.items.length - 1].message
            if (
                senderKey(last) === senderKey(message) &&
                message.timestamp - last.timestamp < 5 * 60 * 1000
            ) {
                previous.items.push({ message, index })
                return
            }
        }
        groups.push({ kind: "sender", key: `group-${index}`, items: [{ message, index }] })
    })

    const renderEntry = (message: SenderEntry, index: number) => {
        const hueStyle = { "--hue": senderHue(message) } as CSSProperties
        if (message.type === "chat_message") {
            return (
                <div key={index} className={classes.bubble} style={hueStyle}>
                    {message.message}
                </div>
            )
        }
        if (message.type === "dice_roll") {
            const outcome = getRollOutcome(message.rollData.dice, message.rollData.totalSuccesses)
            const diceCount = message.rollData.poolInfo?.diceCount || message.rollData.dice.length
            return (
                <div
                    key={index}
                    className={classes.card}
                    data-outcome={outcome.kind}
                    style={hueStyle}
                >
                    <div className={classes.cardKicker}>
                        <IconDice size={13} />
                        Rolled {diceCount} dice
                    </div>
                    <div className={classes.cardMain}>
                        <span className={classes.cardNumber}>
                            {message.rollData.totalSuccesses}
                        </span>
                        <span className={classes.cardUnit}>
                            {message.rollData.totalSuccesses === 1 ? "success" : "successes"}
                        </span>
                        {outcome.label ? (
                            <span className={classes.cardOutcome}>{outcome.label}</span>
                        ) : null}
                    </div>
                    {message.rollData.dice.length > 0 ? (
                        <div className={classes.cardDice}>
                            <DieGlyphs
                                dice={message.rollData.dice}
                                size={22}
                                max={20}
                                label={`Dice: ${message.rollData.dice
                                    .map((die) => `${die.value}${die.isBloodDie ? " hunger" : ""}`)
                                    .join(", ")}`}
                            />
                        </div>
                    ) : null}
                    {message.rollData.poolInfo ? (
                        <div className={classes.cardPool}>
                            {message.rollData.poolInfo.attribute
                                ? `${upcase(message.rollData.poolInfo.attribute)}${message.rollData.poolInfo.secondAttribute ? ` + ${upcase(message.rollData.poolInfo.secondAttribute)}` : ""}${message.rollData.poolInfo.skill ? ` + ${upcase(message.rollData.poolInfo.skill)}` : ""}${message.rollData.poolInfo.discipline ? ` + ${upcase(message.rollData.poolInfo.discipline)}` : ""}${getDiceBonusStr(message.rollData)}`
                                : "Custom pool"}
                        </div>
                    ) : null}
                    {message.rollData.isReroll ? (
                        <div className={classes.rerollTag}>
                            <IconRefresh size={12} />
                            Willpower Reroll
                        </div>
                    ) : null}
                </div>
            )
        }
        if (message.type === "rouse_check") {
            return (
                <div
                    key={index}
                    className={classes.card}
                    data-tone={message.success ? "pass" : "fail"}
                    style={hueStyle}
                >
                    <div className={classes.cardKicker}>
                        <IconDroplet size={13} />
                        Rouse Check
                    </div>
                    <div className={classes.cardMain}>
                        <span className={classes.cardUnit}>
                            Hunger {message.newHunger}/5
                            <span
                                className={classes.hungerMeter}
                                role="img"
                                aria-label={`Hunger ${message.newHunger} of 5`}
                            >
                                {Array.from({ length: 5 }, (_, dropIndex) => (
                                    <span
                                        key={dropIndex}
                                        className={classes.hungerDrop}
                                        data-filled={dropIndex < message.newHunger || undefined}
                                    />
                                ))}
                            </span>
                        </span>
                        <span className={classes.cardOutcome}>
                            {message.success ? "Passed" : "Failed"}
                        </span>
                    </div>
                </div>
            )
        }
        return (
            <div
                key={index}
                className={classes.card}
                data-tone={message.passed ? "pass" : "fail"}
                style={hueStyle}
            >
                <div className={classes.cardKicker}>
                    <IconHeartHandshake size={13} />
                    Remorse Test
                </div>
                <div className={classes.cardMain}>
                    <span className={classes.cardNumber}>{message.successes}</span>
                    <span className={classes.cardUnit}>
                        {message.successes === 1 ? "success" : "successes"}
                    </span>
                    <span className={classes.cardOutcome}>
                        {message.passed ? "Passed" : "Failed"}
                    </span>
                </div>
                {message.rolls.length > 0 ? (
                    <div className={classes.cardDice}>
                        <DieGlyphs
                            dice={message.rolls.map((value) => ({ value, isBloodDie: false }))}
                            size={22}
                            label={`Dice: ${message.rolls.join(", ")}`}
                        />
                    </div>
                ) : null}
                <div className={classes.cardPool}>
                    {message.passed
                        ? "Stains cleared."
                        : `Humanity decreased to ${message.newHumanity}.`}
                </div>
            </div>
        )
    }

    const viewMotion = {
        initial: {
            opacity: 0,
            transform: shouldReduceMotion
                ? "none"
                : `translateX(${setupDirectionRef.current * 8}px)`
        },
        animate: { opacity: 1, transform: "none" },
        exit: {
            opacity: 0,
            transform: shouldReduceMotion
                ? "none"
                : `translateX(${setupDirectionRef.current * -8}px)`
        },
        transition: {
            duration: shouldReduceMotion ? 0.12 : 0.16,
            ease: motionTokens.curve.inOut
        }
    }

    const backButton = (
        <Tooltip label="Back">
            <ActionIcon variant="subtle" color="gray" aria-label="Back" onClick={handleBack}>
                <IconArrowLeft size={18} />
            </ActionIcon>
        </Tooltip>
    )

    return (
        <section
            className={classes.panel}
            data-docked={(docked && !inline) || undefined}
            data-inline={inline || undefined}
            aria-label={chatTitle}
        >
            <header className={classes.header}>
                <div className={classes.heading}>
                    <div className={classes.titleRow}>
                        <span className={classes.title}>{chatTitle}</span>
                        <Tooltip
                            label="Chat messages are not stored on the server and will be lost when the chat is closed"
                            multiline
                            w={240}
                        >
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                aria-label="About session chat"
                                style={{ cursor: "help" }}
                            >
                                <IconInfoCircle size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                    <span className={classes.status}>
                        <span className={classes.statusDot} data-status={connectionStatus} />
                        {statusLabel}
                    </span>
                </div>
                <div className={classes.headerActions}>
                    {connectionStatus === "connected" && !lockedOpen ? (
                        <Tooltip label="Leave session">
                            <ActionIcon
                                variant="subtle"
                                color="red"
                                aria-label="Leave session"
                                onClick={handleDisconnect}
                            >
                                <IconLogout size={17} />
                            </ActionIcon>
                        </Tooltip>
                    ) : null}
                    {!lockedOpen ? (
                        <Tooltip label="Minimize chat">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label="Minimize chat"
                                onClick={toggleExpanded}
                            >
                                <IconChevronDown size={18} />
                            </ActionIcon>
                        </Tooltip>
                    ) : null}
                </div>
            </header>

            <AnimatePresence initial={false} mode="popLayout">
                {view === "creating" || view === "joining" || view === "joiningCoterie" ? (
                    <motion.div
                        key={view}
                        {...viewMotion}
                        style={{ flex: 1, minHeight: 0, display: "flex" }}
                    >
                        {view === "creating" ? (
                            <div className={classes.view}>
                                <div className={classes.viewHeader}>
                                    {backButton}
                                    <span className={classes.viewTitle}>Create Session</span>
                                </div>
                                {sessionId ? (
                                    <>
                                        <span className={classes.viewCopy}>
                                            Share this ID so others can join:
                                        </span>
                                        <Group gap="xs" wrap="nowrap">
                                            <TextInput
                                                value={sessionId}
                                                readOnly
                                                aria-label="Session ID"
                                                style={{ flex: 1 }}
                                                classNames={{ input: classes.sessionId }}
                                                onFocus={(event) => event.currentTarget.select()}
                                            />
                                            <Tooltip
                                                label={
                                                    copiedSessionId
                                                        ? "Copied!"
                                                        : "Copy to clipboard"
                                                }
                                            >
                                                <ActionIcon
                                                    size={36}
                                                    color={copiedSessionId ? "green" : primaryColor}
                                                    variant="filled"
                                                    aria-label="Copy session ID"
                                                    onClick={handleCopySessionId}
                                                >
                                                    <span
                                                        style={{
                                                            position: "relative",
                                                            display: "block",
                                                            width: 16,
                                                            height: 16
                                                        }}
                                                    >
                                                        <AnimatePresence initial={false}>
                                                            <motion.span
                                                                key={
                                                                    copiedSessionId
                                                                        ? "copied"
                                                                        : "copy"
                                                                }
                                                                initial={{
                                                                    opacity: 0,
                                                                    transform: shouldReduceMotion
                                                                        ? "none"
                                                                        : "scale(0.9)"
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    transform: "none"
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    transform: shouldReduceMotion
                                                                        ? "none"
                                                                        : "scale(0.9)"
                                                                }}
                                                                transition={{
                                                                    duration: shouldReduceMotion
                                                                        ? 0.12
                                                                        : 0.14,
                                                                    ease: motionTokens.curve.out
                                                                }}
                                                                style={{
                                                                    position: "absolute",
                                                                    inset: 0,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center"
                                                                }}
                                                            >
                                                                {copiedSessionId ? (
                                                                    <IconCheck size={16} />
                                                                ) : (
                                                                    <IconCopy size={16} />
                                                                )}
                                                            </motion.span>
                                                        </AnimatePresence>
                                                    </span>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                        <div className={classes.viewFooter}>
                                            <Button
                                                color={primaryColor}
                                                onClick={handleGoToChat}
                                                rightSection={<IconArrowRight size={16} />}
                                            >
                                                Go to chat
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className={classes.viewCopy}>
                                            Start a new session and share its ID with your coterie.
                                        </span>
                                        <div className={classes.viewFooter}>
                                            <Button
                                                variant="subtle"
                                                color="gray"
                                                onClick={handleBack}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                color={primaryColor}
                                                onClick={handleConnect}
                                                data-autofocus
                                            >
                                                Create Session
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : view === "joining" ? (
                            <div className={classes.view}>
                                <div className={classes.viewHeader}>
                                    {backButton}
                                    <span className={classes.viewTitle}>Join Session</span>
                                </div>
                                <TextInput
                                    autoFocus
                                    label="Session ID"
                                    placeholder="Paste the ID you were given"
                                    classNames={{ input: classes.sessionId }}
                                    value={sessionInput}
                                    onChange={(e) => {
                                        setSessionInput(e.target.value)
                                        setJoinError(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleConnect()
                                        }
                                    }}
                                    error={joinError || undefined}
                                />
                                <div className={classes.viewFooter}>
                                    <Button variant="subtle" color="gray" onClick={handleBack}>
                                        Cancel
                                    </Button>
                                    <DisabledReason
                                        reason={
                                            !sessionInput.trim()
                                                ? "Enter a session ID first"
                                                : undefined
                                        }
                                    >
                                        <Button
                                            color={primaryColor}
                                            onClick={handleConnect}
                                            disabled={
                                                !sessionInput.trim() ||
                                                connectionStatus === "connecting"
                                            }
                                            loading={connectionStatus === "connecting"}
                                        >
                                            Join
                                        </Button>
                                    </DisabledReason>
                                </div>
                            </div>
                        ) : view === "joiningCoterie" ? (
                            <div className={classes.view}>
                                <div className={classes.viewHeader}>
                                    {backButton}
                                    <span className={classes.viewTitle}>Join Coterie</span>
                                </div>
                                <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                                    <div className={classes.coterieList}>
                                        {coteries.map((coterie) => (
                                            <Button
                                                key={coterie.id}
                                                variant="default"
                                                fullWidth
                                                justify="space-between"
                                                rightSection={
                                                    coterie.owned ? (
                                                        <Badge
                                                            size="xs"
                                                            variant="light"
                                                            color="gold"
                                                        >
                                                            Owner
                                                        </Badge>
                                                    ) : null
                                                }
                                                onClick={() => {
                                                    connect()
                                                    joinSession({
                                                        coterieId: coterie.id,
                                                        characterName
                                                    })
                                                    setView("disconnected")
                                                }}
                                            >
                                                {coterie.name}
                                            </Button>
                                        ))}
                                        {coteries.length === 0 ? (
                                            <span className={classes.viewCopy}>
                                                No coteries available
                                            </span>
                                        ) : null}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : null}
                    </motion.div>
                ) : connectionStatus === "disconnected" ||
                  (view === "disconnected" && !sessionId) ? (
                    <motion.div
                        key="disconnected"
                        {...viewMotion}
                        style={{ flex: 1, minHeight: 0, display: "flex" }}
                    >
                        <div className={classes.lobby}>
                            <div className={classes.lobbyIntro}>
                                <span className={classes.lobbySigil}>
                                    <IconMessageCircle size={24} stroke={1.5} />
                                </span>
                                <span className={classes.lobbyTitle}>Session chat</span>
                                <span className={classes.lobbyCopy}>
                                    {isAuthenticated
                                        ? "Join or create a session to start chatting"
                                        : "Sign in to chat and share rolls with your coterie."}
                                </span>
                            </div>
                            {isAuthenticated ? (
                                <div className={classes.lobbyActions}>
                                    <Button
                                        fullWidth
                                        color={primaryColor}
                                        onClick={handleCreateSession}
                                        leftSection={<IconPlus size={16} />}
                                    >
                                        Create Session
                                    </Button>
                                    {recentChatSession ? (
                                        <Button
                                            fullWidth
                                            variant="light"
                                            color={primaryColor}
                                            onClick={handleRejoinRecentChat}
                                            disabled={connectionStatus === "connecting"}
                                            leftSection={<IconRefresh size={16} />}
                                        >
                                            Rejoin Last Chat
                                        </Button>
                                    ) : null}
                                    <Button
                                        fullWidth
                                        variant="default"
                                        onClick={handleJoinSession}
                                        leftSection={<IconLogin2 size={16} />}
                                    >
                                        Join Session
                                    </Button>
                                    {/* TODOdin: Uncomment once multi-account coteries are in */}
                                    {/* {coteries.length > 0 ? (
                                    <Button
                                        fullWidth
                                        variant="light"
                                        color={primaryColor}
                                        onClick={handleJoinCoterie}
                                        leftSection={<IconUsers size={16} />}
                                    >
                                        Join Coterie
                                    </Button>
                                ) : null} */}
                                </div>
                            ) : (
                                <div className={classes.lobbyActions}>
                                    <Button
                                        fullWidth
                                        color={primaryColor}
                                        onClick={signIn}
                                        loading={isSigningIn}
                                        leftSection={<IconLogin2 size={16} />}
                                    >
                                        {isSigningIn ? "Signing in…" : "Sign in to use chat"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : connectionStatus === "connecting" ? (
                    <motion.div
                        key="connecting"
                        {...viewMotion}
                        style={{ flex: 1, minHeight: 0, display: "flex" }}
                    >
                        <div className={classes.lobby}>
                            <div className={classes.lobbyIntro}>
                                <Loader size="md" />
                                <span className={classes.viewCopy}>Connecting...</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div key="connected" style={{ display: "contents" }}>
                        {participants.length > 0 ? (
                            <div className={classes.participants} aria-label="Players in session">
                                <IconUsers size={14} />
                                {participants.map((participant) => (
                                    <span
                                        key={participant.userId}
                                        className={classes.participant}
                                        style={
                                            {
                                                "--hue": hashStringToHue(
                                                    participant.userName ||
                                                        participant.userId ||
                                                        "unknown"
                                                )
                                            } as CSSProperties
                                        }
                                    >
                                        <span className={classes.participantDot} />
                                        {participant.showNameTag ? (
                                            <NameTag name={participant.userName} size="xs" />
                                        ) : (
                                            participant.userName
                                        )}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        <ScrollArea className={classes.messages} type="hover" scrollbarSize={6}>
                            <div className={classes.messagesInner} role="log" aria-live="polite">
                                {groups.length === 0 ? (
                                    <div className={classes.empty}>No messages yet.</div>
                                ) : null}
                                {groups.map((group) => {
                                    if (group.kind === "error") {
                                        return (
                                            <div key={group.key} className={classes.errorRow}>
                                                <IconAlertCircle
                                                    size={16}
                                                    style={{ flexShrink: 0, marginTop: 1 }}
                                                />
                                                <span>
                                                    {group.message.message}
                                                    <span className={classes.time}>
                                                        {" · "}
                                                        {formatTimestamp(
                                                            group.message.timestamp ?? Date.now()
                                                        )}
                                                    </span>
                                                </span>
                                            </div>
                                        )
                                    }
                                    const first = group.items[0].message
                                    const own = isOwnMessage(first)
                                    return (
                                        <div
                                            key={group.key}
                                            className={classes.group}
                                            data-own={own || undefined}
                                        >
                                            <div className={classes.groupHeader}>
                                                {!own ? (
                                                    <span
                                                        className={classes.sender}
                                                        style={
                                                            {
                                                                "--hue": senderHue(first)
                                                            } as CSSProperties
                                                        }
                                                    >
                                                        {renderMessageName(first)}
                                                    </span>
                                                ) : null}
                                                <span className={classes.time}>
                                                    {formatTimestamp(first.timestamp)}
                                                </span>
                                            </div>
                                            {group.items.map(({ message, index }) =>
                                                renderEntry(message, index)
                                            )}
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        <div className={classes.composer}>
                            <Tooltip label={getDisabledTooltipMessage()} disabled={canSend}>
                                <TextInput
                                    ref={messageInputRef}
                                    placeholder="Message your coterie…"
                                    aria-label="Chat message"
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
                                    disabled={!canSend}
                                    maxLength={5000}
                                    enterKeyHint="send"
                                    autoComplete="off"
                                />
                            </Tooltip>
                            <Tooltip label="Send">
                                <ActionIcon
                                    size={36}
                                    color={primaryColor}
                                    variant="filled"
                                    aria-label="Send message"
                                    // Keep focus in the composer when sending with the mouse.
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={handleSendMessage}
                                    disabled={!canSend || !messageInput.trim()}
                                >
                                    <IconSend2 size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </div>

                        <div className={classes.composerFooter}>
                            <Switch
                                size="xs"
                                color={primaryColor}
                                label="Share my rolls"
                                checked={autoShare}
                                onChange={(event) =>
                                    handleAutoShareToggle(event.currentTarget.checked)
                                }
                            />
                            <span className={classes.composerHint}>Enter to send</span>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    )
}

function getDiceBonusStr(rollData: RollData) {
    const bonuses: string[] = []

    if (rollData.poolInfo?.bloodSurge) {
        bonuses.push("Blood Surge")
    }

    if (rollData.poolInfo?.specialtyBonus && rollData.poolInfo.specialtyBonus > 0) {
        bonuses.push(
            `${rollData.poolInfo.specialtyBonus} Specialty${rollData.poolInfo.specialtyBonus > 1 ? "ies" : ""}`
        )
    }

    if (rollData.poolInfo?.disciplinePowerBonus && rollData.poolInfo.disciplinePowerBonus > 0) {
        bonuses.push(`${rollData.poolInfo.disciplinePowerBonus} from Discipline Powers`)
    }

    if (rollData.poolInfo?.meritFlawBonus && rollData.poolInfo.meritFlawBonus !== 0) {
        bonuses.push(
            `${rollData.poolInfo.meritFlawBonus > 0 ? "+" : ""}${rollData.poolInfo.meritFlawBonus} from Merits/Flaws`
        )
    }

    if (bonuses.length === 0) {
        return ""
    }

    return ` (${bonuses.join(", ")})`
}

export default memo(ChatWindow, (previous, next) => {
    return (
        previous.options.primaryColor === next.options.primaryColor &&
        previous.options.character.name === next.options.character.name &&
        previous.openSignal === next.openSignal &&
        previous.sessionLabel === next.sessionLabel &&
        previous.sessionLabelSessionId === next.sessionLabelSessionId &&
        previous.initiallyExpanded === next.initiallyExpanded &&
        previous.lockedOpen === next.lockedOpen &&
        previous.docked === next.docked &&
        previous.inline === next.inline
    )
})
