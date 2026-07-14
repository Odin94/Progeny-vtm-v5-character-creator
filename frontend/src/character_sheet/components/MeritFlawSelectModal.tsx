import {
    Badge,
    Box,
    Button,
    Card,
    Center,
    Grid,
    Group,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Tabs,
    Text,
    Textarea,
    TextInput,
    Title,
    Tooltip
} from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"
import posthog from "posthog-js"
import { useEffect, useMemo, useState } from "react"
import { MeritFlaw } from "~/data/Character"
import { clans } from "~/data/Clans"
import {
    essentialLoresheets,
    essentialMeritsAndFlaws,
    essentialThinbloodMeritsAndFlaws,
    MeritOrFlaw
} from "~/data/MeritsAndFlaws"
import { PredatorTypes } from "~/data/PredatorType"
import { intersection } from "~/generator/utils"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getMeritCost } from "../utils/xp"
import PipButton from "./PipButton"

type MeritFlawSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    type: "merit" | "flaw"
}

const MeritFlawSelectModal = ({ opened, onClose, options, type }: MeritFlawSelectModalProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [selectedMeritFlaw, setSelectedMeritFlaw] = useState<MeritOrFlaw | null>(null)
    const [selectedLevel, setSelectedLevel] = useState<number>(1)
    const [activeTab, setActiveTab] = useState<string | null>("regular")
    const [openLoresheetTitle, setOpenLoresheetTitle] = useState("")
    const [loresheetQuery, setLoresheetQuery] = useState("")
    const [regularQuery, setRegularQuery] = useState("")
    const [customName, setCustomName] = useState("")
    const [customLevel, setCustomLevel] = useState<number>(1)
    const [customDescription, setCustomDescription] = useState("")
    const [contentReady, setContentReady] = useState(false)
    const isEditable = mode === "xp" || mode === "free"

    useEffect(() => {
        if (!opened) {
            setContentReady(false)
            return
        }

        const frame = window.requestAnimationFrame(() => setContentReady(true))
        return () => window.cancelAnimationFrame(frame)
    }, [opened])

    useEffect(() => {
        if (!opened) {
            setSelectedMeritFlaw(null)
            setSelectedLevel(1)
            setActiveTab("regular")
            setOpenLoresheetTitle("")
            setLoresheetQuery("")
            setRegularQuery("")
            setCustomName("")
            setCustomLevel(1)
            setCustomDescription("")
        }
    }, [opened])

    const allMeritsAndFlaws =
        character.clan === "Thin-blood"
            ? [essentialThinbloodMeritsAndFlaws, ...essentialMeritsAndFlaws]
            : essentialMeritsAndFlaws
    const characterMeritFlawNames = new Set(
        type === "merit" ? character.merits.map((m) => m.name) : character.flaws.map((f) => f.name)
    )

    const exclusionMap = useMemo(() => {
        const map = new Map<string, string[]>()
        character.merits.forEach((merit) => {
            merit.excludes.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(merit.name)
            })
        })
        character.flaws.forEach((flaw) => {
            flaw.excludes.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(flaw.name)
            })
        })
        character.predatorType.pickedMeritsAndFlaws.forEach((meritFlaw) => {
            meritFlaw.excludes.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(meritFlaw.name)
            })
        })
        const predatorType = PredatorTypes[character.predatorType.name]
        if (predatorType) {
            predatorType.meritsAndFlaws.forEach((meritFlaw) => {
                meritFlaw.excludes.forEach((excludedName) => {
                    if (!map.has(excludedName)) {
                        map.set(excludedName, [])
                    }
                    map.get(excludedName)?.push(meritFlaw.name)
                })
            })
        }
        const clan = clans[character.clan]
        if (clan?.excludedMeritsAndFlaws) {
            clan.excludedMeritsAndFlaws.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(`${character.clan} clan`)
            })
        }
        return map
    }, [
        character.merits,
        character.flaws,
        character.predatorType.pickedMeritsAndFlaws,
        character.predatorType.name,
        character.clan
    ])

    useEffect(() => {
        if (selectedMeritFlaw) {
            setSelectedLevel(1)
        }
    }, [selectedMeritFlaw])

    const getAvailableMeritsOrFlaws = (): MeritOrFlaw[] => {
        const all: MeritOrFlaw[] = []
        allMeritsAndFlaws.forEach((category) => {
            const items = type === "merit" ? category.merits : category.flaws
            items.forEach((item) => {
                if (!characterMeritFlawNames.has(item.name)) {
                    all.push(item)
                }
            })
        })
        return all
    }

    const availableItems = getAvailableMeritsOrFlaws()

    const addMeritFlaw = (meritFlaw: MeritOrFlaw, level: number) => {
        const newMeritFlaw: MeritFlaw = {
            name: meritFlaw.name,
            level: level,
            summary: meritFlaw.summary,
            excludes: meritFlaw.excludes,
            type
        }

        if (mode === "xp" && type === "merit") {
            const existingMerit = character.merits.find((m) => m.name === meritFlaw.name)
            const previousLevel = existingMerit ? existingMerit.level : 0
            const cost = getMeritCost(level, previousLevel)
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            if (existingMerit) {
                setCharacter((current) => ({
                    ...current,
                    merits: current.merits.map((m) => (m === existingMerit ? newMeritFlaw : m)),
                    ephemeral: {
                        ...current.ephemeral,
                        experienceSpent: current.ephemeral.experienceSpent + cost
                    }
                }))
            } else {
                setCharacter((current) => ({
                    ...current,
                    merits: [...current.merits, newMeritFlaw],
                    ephemeral: {
                        ...current.ephemeral,
                        experienceSpent: current.ephemeral.experienceSpent + cost
                    }
                }))
            }
        } else {
            if (type === "merit") {
                const existingMerit = character.merits.find((m) => m.name === meritFlaw.name)
                if (existingMerit) {
                    setCharacter((current) => ({
                        ...current,
                        merits: current.merits.map((m) => (m === existingMerit ? newMeritFlaw : m))
                    }))
                } else {
                    setCharacter((current) => ({
                        ...current,
                        merits: [...current.merits, newMeritFlaw]
                    }))
                }
            } else {
                const existingFlaw = character.flaws.find((f) => f.name === meritFlaw.name)
                if (existingFlaw) {
                    setCharacter((current) => ({
                        ...current,
                        flaws: current.flaws.map((f) => (f === existingFlaw ? newMeritFlaw : f))
                    }))
                } else {
                    setCharacter((current) => ({
                        ...current,
                        flaws: [...current.flaws, newMeritFlaw]
                    }))
                }
            }
        }

        try {
            posthog.capture("sheet-merit-flaw-pick", {
                name: meritFlaw.name,
                type: type,
                level: level,
                mode: mode
            })
        } catch (error) {
            console.warn("PostHog sheet-merit-flaw-pick tracking failed:", error)
        }

        onClose()
        setSelectedMeritFlaw(null)
        setSelectedLevel(1)
    }

    const handleSelect = () => {
        if (!selectedMeritFlaw) return
        addMeritFlaw(selectedMeritFlaw, selectedLevel)
    }

    const handleAddCustom = () => {
        if (!customName.trim()) return

        const customMeritFlaw: MeritFlaw = {
            name: customName.trim(),
            level: customLevel,
            summary: customDescription.trim(),
            excludes: [],
            type
        }

        if (mode === "xp" && type === "merit") {
            const existingMerit = character.merits.find((m) => m.name === customName.trim())
            const previousLevel = existingMerit ? existingMerit.level : 0
            const cost = getMeritCost(customLevel, previousLevel)
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            if (existingMerit) {
                setCharacter((current) => ({
                    ...current,
                    merits: current.merits.map((m) => (m === existingMerit ? customMeritFlaw : m)),
                    ephemeral: {
                        ...current.ephemeral,
                        experienceSpent: current.ephemeral.experienceSpent + cost
                    }
                }))
            } else {
                setCharacter((current) => ({
                    ...current,
                    merits: [...current.merits, customMeritFlaw],
                    ephemeral: {
                        ...current.ephemeral,
                        experienceSpent: current.ephemeral.experienceSpent + cost
                    }
                }))
            }
        } else {
            if (type === "merit") {
                const existingMerit = character.merits.find((m) => m.name === customName.trim())
                if (existingMerit) {
                    setCharacter((current) => ({
                        ...current,
                        merits: current.merits.map((m) =>
                            m === existingMerit ? customMeritFlaw : m
                        )
                    }))
                } else {
                    setCharacter((current) => ({
                        ...current,
                        merits: [...current.merits, customMeritFlaw]
                    }))
                }
            } else {
                const existingFlaw = character.flaws.find((f) => f.name === customName.trim())
                if (existingFlaw) {
                    setCharacter((current) => ({
                        ...current,
                        flaws: current.flaws.map((f) => (f === existingFlaw ? customMeritFlaw : f))
                    }))
                } else {
                    setCharacter((current) => ({
                        ...current,
                        flaws: [...current.flaws, customMeritFlaw]
                    }))
                }
            }
        }

        try {
            posthog.capture("sheet-merit-flaw-custom", {
                name: customName.trim(),
                type: type,
                level: customLevel,
                mode: mode
            })
        } catch (error) {
            console.warn("PostHog sheet-merit-flaw-custom tracking failed:", error)
        }

        onClose()
        setCustomName("")
        setCustomLevel(1)
        setCustomDescription("")
    }

    const getCustomMeritCost = (level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const existingMerit = character.merits.find((m) => m.name === customName.trim())
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const getCostForItem = (item: MeritOrFlaw, level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const existingMerit = character.merits.find((m) => m.name === item.name)
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const handleItemClick = (item: MeritOrFlaw) => {
        if (exclusionMap.has(item.name)) {
            return
        }
        if (item.cost.length === 1) {
            addMeritFlaw(item, item.cost[0])
        } else {
            if (mode === "xp" && type === "merit") {
                const lowestLevel = item.cost[0]
                const lowestCost = getCostForItem(item, lowestLevel)
                const availableXP = getAvailableXP(character)
                if (!canAffordUpgrade(availableXP, lowestCost)) {
                    return
                }
            }
            setSelectedMeritFlaw(item)
        }
    }

    const getCostForLevel = (level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const existingMerit = character.merits.find((m) => m.name === selectedMeritFlaw?.name)
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const openLoresheet = essentialLoresheets.find((sheet) => sheet.title === openLoresheetTitle)
    const pickedMeritsAndFlaws = [...character.merits, ...character.flaws]

    const renderLoresheetsContent = () => {
        if (openLoresheet) {
            const availableMerits = openLoresheet.merits.filter(
                (merit) => !characterMeritFlawNames.has(merit.name)
            )

            return (
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                            <Title order={4} mb="sm" c={primaryColor}>
                                {openLoresheet.title}
                            </Title>
                            <Text size="sm" c="dimmed" mb="md">
                                {openLoresheet.summary}
                            </Text>
                            <Text size="xs" c="dimmed">
                                Source: {openLoresheet.source}
                            </Text>
                        </Box>
                        <Button
                            variant="subtle"
                            onClick={() => setOpenLoresheetTitle("")}
                            color={primaryColor}
                        >
                            Back
                        </Button>
                    </Group>
                    {availableMerits.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">
                            All merits from this loresheet have been added.
                        </Text>
                    ) : (
                        <Grid gutter="md">
                            {availableMerits.map((merit) => {
                                const excludingItems = exclusionMap.get(merit.name) ?? []
                                const isExcluded = excludingItems.length > 0
                                const lowestLevel = merit.cost[0]
                                const lowestCost =
                                    mode === "xp" ? getCostForItem(merit, lowestLevel) : 0
                                const availableXP = getAvailableXP(character)
                                const canAffordLowest =
                                    mode !== "xp" || canAffordUpgrade(availableXP, lowestCost)
                                const canClick = !isExcluded && canAffordLowest
                                const tooltipLabel = isExcluded
                                    ? `Excluded by: ${excludingItems.join(", ")}`
                                    : mode === "xp" && !canAffordLowest
                                      ? `Insufficient XP. Need ${lowestCost}, have ${availableXP}`
                                      : undefined

                                const boxContent = (
                                    <Box
                                        p="xs"
                                        onClick={() => handleItemClick(merit)}
                                        style={{
                                            border: "1px solid var(--mantine-color-gray-8)",
                                            borderRadius: "var(--mantine-radius-sm)",
                                            cursor: canClick ? "pointer" : "default",
                                            transition: "background-color 0.2s",
                                            opacity: isExcluded ? 0.5 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (canClick) {
                                                e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-light-hover)`
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                        }}
                                    >
                                        <Stack gap="xs">
                                            <Group justify="space-between" align="flex-start">
                                                <Text
                                                    fw={600}
                                                    size="sm"
                                                    style={{ flex: 1 }}
                                                    c={isExcluded ? "dimmed" : undefined}
                                                >
                                                    {merit.name}
                                                </Text>
                                                <Badge size="sm" variant="dot" color={primaryColor}>
                                                    {merit.cost.join("/")}
                                                </Badge>
                                            </Group>
                                            {merit.summary ? (
                                                <Text size="xs" c="dimmed" lineClamp={3}>
                                                    {merit.summary}
                                                </Text>
                                            ) : null}
                                        </Stack>
                                    </Box>
                                )

                                if (tooltipLabel) {
                                    return (
                                        <Grid.Col key={merit.name} span={{ base: 12, sm: 6 }}>
                                            <Tooltip label={tooltipLabel} withArrow>
                                                {boxContent}
                                            </Tooltip>
                                        </Grid.Col>
                                    )
                                }

                                return (
                                    <Grid.Col key={merit.name} span={{ base: 12, sm: 6 }}>
                                        {boxContent}
                                    </Grid.Col>
                                )
                            })}
                        </Grid>
                    )}
                </Stack>
            )
        }

        const normalizedLoresheetQuery = loresheetQuery.trim().toLocaleLowerCase()
        const availableLoresheets = essentialLoresheets.filter((loresheet) => {
            const requirementsMet = loresheet.requirementFunctions.every((fun) => fun(character))
            if (!requirementsMet) return false
            const titleMatches =
                normalizedLoresheetQuery.length === 0 ||
                loresheet.title.toLocaleLowerCase().includes(normalizedLoresheetQuery)
            if (!titleMatches) return false
            const sheetPicked =
                intersection(
                    pickedMeritsAndFlaws.map((m) => m.name),
                    loresheet.merits.map((m) => m.name)
                ).length > 0
            const hasAvailableMerits = loresheet.merits.some(
                (merit) => !characterMeritFlawNames.has(merit.name)
            )
            return hasAvailableMerits || sheetPicked
        })

        if (availableLoresheets.length === 0) {
            return (
                <Stack gap="md">
                    <TextInput
                        aria-label="Search loresheets"
                        leftSection={<IconSearch size={16} />}
                        placeholder="Search loresheets by title"
                        value={loresheetQuery}
                        onChange={(event) => setLoresheetQuery(event.currentTarget.value)}
                    />
                    <Text c="dimmed" ta="center" py="xl">
                        {normalizedLoresheetQuery.length > 0
                            ? "No loresheets match that title."
                            : "No available loresheets."}
                    </Text>
                </Stack>
            )
        }

        return (
            <Stack gap="md">
                <TextInput
                    aria-label="Search loresheets"
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search loresheets by title"
                    value={loresheetQuery}
                    onChange={(event) => setLoresheetQuery(event.currentTarget.value)}
                />
                <ScrollArea h={400}>
                    <Grid gutter="md">
                        {availableLoresheets.map((loresheet) => {
                            const sheetPicked =
                                intersection(
                                    pickedMeritsAndFlaws.map((m) => m.name),
                                    loresheet.merits.map((m) => m.name)
                                ).length > 0

                            return (
                                <Grid.Col key={loresheet.title} span={{ base: 12, sm: 6, md: 4 }}>
                                    <Card
                                        h={250}
                                        style={{
                                            backgroundColor: "rgba(26, 27, 30, 0.90)",
                                            borderColor: sheetPicked ? "green" : "black"
                                        }}
                                        withBorder={sheetPicked}
                                    >
                                        <Stack gap="xs" h="100%">
                                            <Text fw={600} size="sm" ta="center">
                                                {loresheet.title}
                                            </Text>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                                lineClamp={4}
                                                style={{ flex: 1 }}
                                            >
                                                {loresheet.summary}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {loresheet.source}
                                            </Text>
                                            <Button
                                                variant="light"
                                                color="blue"
                                                fullWidth
                                                size="xs"
                                                onClick={() =>
                                                    setOpenLoresheetTitle(loresheet.title)
                                                }
                                            >
                                                Open
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                </ScrollArea>
            </Stack>
        )
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Select a ${type === "merit" ? "Merit" : "Flaw"}`}
            size="lg"
        >
            {contentReady ? (
                <Stack gap="md">
                    {selectedMeritFlaw ? (
                        <>
                            <Box>
                                <Title order={4} mb="sm" c={primaryColor}>
                                    {selectedMeritFlaw.name}
                                </Title>
                                <Text size="sm" c="dimmed" mb="md">
                                    {selectedMeritFlaw.summary}
                                </Text>
                                <Text size="sm" fw={600} mb="xs">
                                    Select Level:
                                </Text>
                                <Group gap="xs">
                                    {selectedMeritFlaw.cost.map((_, index) => {
                                        const level = index + 1
                                        const cost = getCostForLevel(level)
                                        const availableXP = getAvailableXP(character)
                                        const canAfford =
                                            type === "flaw" ||
                                            mode !== "xp" ||
                                            canAffordUpgrade(availableXP, cost)
                                        const disabledReason =
                                            type === "flaw" || mode !== "xp"
                                                ? undefined
                                                : canAfford
                                                  ? undefined
                                                  : `Insufficient XP. Need ${cost}, have ${availableXP}`

                                        return (
                                            <PipButton
                                                key={level}
                                                filled={selectedLevel >= level}
                                                onClick={() => setSelectedLevel(level)}
                                                options={options}
                                                disabledReason={disabledReason}
                                                xpCost={
                                                    type === "flaw" || mode !== "xp"
                                                        ? undefined
                                                        : cost
                                                }
                                            />
                                        )
                                    })}
                                </Group>
                            </Box>
                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="subtle"
                                    onClick={() => setSelectedMeritFlaw(null)}
                                    color={primaryColor}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSelect}
                                    color={primaryColor}
                                    disabled={
                                        mode === "xp" &&
                                        type === "merit" &&
                                        !canAffordUpgrade(
                                            getAvailableXP(character),
                                            getCostForLevel(selectedLevel)
                                        )
                                    }
                                >
                                    Add
                                </Button>
                            </Group>
                        </>
                    ) : (
                        <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor}>
                            <Tabs.List>
                                <Tabs.Tab value="regular">
                                    {type === "merit" ? "Merits" : "Flaws"}
                                </Tabs.Tab>
                                {type === "merit" ? (
                                    <Tabs.Tab value="loresheets">Loresheets</Tabs.Tab>
                                ) : null}
                                {isEditable ? <Tabs.Tab value="custom">Custom</Tabs.Tab> : null}
                            </Tabs.List>

                            <Tabs.Panel value="regular" pt="md">
                                {availableItems.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="xl">
                                        No available {type === "merit" ? "merits" : "flaws"} to add.
                                    </Text>
                                ) : (
                                    <Stack gap="md">
                                        <TextInput
                                            aria-label={`Search ${type === "merit" ? "merits" : "flaws"}`}
                                            leftSection={<IconSearch size={16} />}
                                            placeholder={`Search ${type === "merit" ? "merits" : "flaws"} by name`}
                                            value={regularQuery}
                                            onChange={(event) =>
                                                setRegularQuery(event.currentTarget.value)
                                            }
                                        />
                                        {(() => {
                                            const normalizedRegularQuery = regularQuery
                                                .trim()
                                                .toLocaleLowerCase()
                                            const matchesQuery = (name: string) =>
                                                normalizedRegularQuery.length === 0 ||
                                                name
                                                    .toLocaleLowerCase()
                                                    .includes(normalizedRegularQuery)

                                            const visibleCategories = allMeritsAndFlaws
                                                .map((category) => {
                                                    const items =
                                                        type === "merit"
                                                            ? category.merits
                                                            : category.flaws
                                                    const availableCategoryItems = items.filter(
                                                        (item) =>
                                                            !characterMeritFlawNames.has(
                                                                item.name
                                                            ) && matchesQuery(item.name)
                                                    )
                                                    return { category, availableCategoryItems }
                                                })
                                                .filter(
                                                    ({ availableCategoryItems }) =>
                                                        availableCategoryItems.length > 0
                                                )

                                            if (visibleCategories.length === 0) {
                                                return (
                                                    <Text c="dimmed" ta="center" py="xl">
                                                        No {type === "merit" ? "merits" : "flaws"}{" "}
                                                        match that name.
                                                    </Text>
                                                )
                                            }

                                            return (
                                                <Stack gap="lg">
                                                    {visibleCategories.map(
                                                        ({ category, availableCategoryItems }) => (
                                                            <Stack key={category.title} gap="md">
                                                                <Title order={4} c={primaryColor}>
                                                                    {category.title}
                                                                </Title>
                                                                <Grid gutter="md">
                                                                    {availableCategoryItems.map(
                                                                        (item) => {
                                                                            const excludingItems =
                                                                                exclusionMap.get(
                                                                                    item.name
                                                                                ) ?? []
                                                                            const isExcluded =
                                                                                excludingItems.length >
                                                                                0
                                                                            const lowestLevel =
                                                                                item.cost[0]
                                                                            const lowestCost =
                                                                                mode === "xp" &&
                                                                                type === "merit"
                                                                                    ? getCostForItem(
                                                                                          item,
                                                                                          lowestLevel
                                                                                      )
                                                                                    : 0
                                                                            const availableXP =
                                                                                getAvailableXP(
                                                                                    character
                                                                                )
                                                                            const canAffordLowest =
                                                                                type === "flaw" ||
                                                                                mode !== "xp" ||
                                                                                canAffordUpgrade(
                                                                                    availableXP,
                                                                                    lowestCost
                                                                                )
                                                                            const canClick =
                                                                                !isExcluded &&
                                                                                canAffordLowest
                                                                            const tooltipLabel =
                                                                                isExcluded
                                                                                    ? `Excluded by: ${excludingItems.join(", ")}`
                                                                                    : mode ===
                                                                                            "xp" &&
                                                                                        type ===
                                                                                            "merit" &&
                                                                                        !canAffordLowest
                                                                                      ? `Insufficient XP. Need ${lowestCost}, have ${availableXP}`
                                                                                      : undefined

                                                                            const boxContent = (
                                                                                <Box
                                                                                    p="xs"
                                                                                    onClick={() =>
                                                                                        handleItemClick(
                                                                                            item
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        border: "1px solid var(--mantine-color-gray-8)",
                                                                                        borderRadius:
                                                                                            "var(--mantine-radius-sm)",
                                                                                        cursor: canClick
                                                                                            ? "pointer"
                                                                                            : "default",
                                                                                        transition:
                                                                                            "background-color 0.2s",
                                                                                        opacity:
                                                                                            isExcluded
                                                                                                ? 0.5
                                                                                                : 1
                                                                                    }}
                                                                                    onMouseEnter={(
                                                                                        e
                                                                                    ) => {
                                                                                        if (
                                                                                            canClick
                                                                                        ) {
                                                                                            e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-light-hover)`
                                                                                        }
                                                                                    }}
                                                                                    onMouseLeave={(
                                                                                        e
                                                                                    ) => {
                                                                                        e.currentTarget.style.backgroundColor =
                                                                                            "transparent"
                                                                                    }}
                                                                                >
                                                                                    <Stack gap="xs">
                                                                                        <Group
                                                                                            justify="space-between"
                                                                                            align="flex-start"
                                                                                        >
                                                                                            <Text
                                                                                                fw={
                                                                                                    600
                                                                                                }
                                                                                                size="sm"
                                                                                                style={{
                                                                                                    flex: 1
                                                                                                }}
                                                                                                c={
                                                                                                    isExcluded
                                                                                                        ? "dimmed"
                                                                                                        : undefined
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    item.name
                                                                                                }
                                                                                            </Text>
                                                                                            <Badge
                                                                                                size="sm"
                                                                                                variant="dot"
                                                                                                color={
                                                                                                    type ===
                                                                                                    "flaw"
                                                                                                        ? "red"
                                                                                                        : primaryColor
                                                                                                }
                                                                                            >
                                                                                                {item.cost.join(
                                                                                                    "/"
                                                                                                )}
                                                                                            </Badge>
                                                                                        </Group>
                                                                                        {item.summary ? (
                                                                                            <Text
                                                                                                size="xs"
                                                                                                c="dimmed"
                                                                                                lineClamp={
                                                                                                    3
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    item.summary
                                                                                                }
                                                                                            </Text>
                                                                                        ) : null}
                                                                                    </Stack>
                                                                                </Box>
                                                                            )

                                                                            if (tooltipLabel) {
                                                                                return (
                                                                                    <Grid.Col
                                                                                        key={
                                                                                            item.name
                                                                                        }
                                                                                        span={{
                                                                                            base: 12,
                                                                                            sm: 6
                                                                                        }}
                                                                                    >
                                                                                        <Tooltip
                                                                                            label={
                                                                                                tooltipLabel
                                                                                            }
                                                                                            withArrow
                                                                                        >
                                                                                            {
                                                                                                boxContent
                                                                                            }
                                                                                        </Tooltip>
                                                                                    </Grid.Col>
                                                                                )
                                                                            }

                                                                            return (
                                                                                <Grid.Col
                                                                                    key={item.name}
                                                                                    span={{
                                                                                        base: 12,
                                                                                        sm: 6
                                                                                    }}
                                                                                >
                                                                                    {boxContent}
                                                                                </Grid.Col>
                                                                            )
                                                                        }
                                                                    )}
                                                                </Grid>
                                                            </Stack>
                                                        )
                                                    )}
                                                </Stack>
                                            )
                                        })()}
                                    </Stack>
                                )}
                            </Tabs.Panel>

                            {type === "merit" ? (
                                <Tabs.Panel value="loresheets" pt="md">
                                    {renderLoresheetsContent()}
                                </Tabs.Panel>
                            ) : null}
                            {isEditable ? (
                                <Tabs.Panel value="custom" pt="md">
                                    <Stack gap="md">
                                        <TextInput
                                            label="Name"
                                            placeholder={`Enter ${type === "merit" ? "merit" : "flaw"} name`}
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            required
                                        />
                                        <Textarea
                                            label="Description"
                                            placeholder={`Enter ${type === "merit" ? "merit" : "flaw"} description (optional)`}
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            minRows={3}
                                        />
                                        <Box>
                                            <Text size="sm" fw={600} mb="xs">
                                                Select Level:
                                            </Text>
                                            <Group gap="xs">
                                                {[1, 2, 3, 4, 5].map((level) => {
                                                    const cost = getCustomMeritCost(level)
                                                    const availableXP = getAvailableXP(character)
                                                    const canAfford =
                                                        type === "flaw" ||
                                                        mode !== "xp" ||
                                                        canAffordUpgrade(availableXP, cost)
                                                    const disabledReason =
                                                        type === "flaw" || mode !== "xp"
                                                            ? undefined
                                                            : canAfford
                                                              ? undefined
                                                              : `Insufficient XP. Need ${cost}, have ${availableXP}`

                                                    return (
                                                        <PipButton
                                                            key={level}
                                                            filled={customLevel >= level}
                                                            onClick={() => setCustomLevel(level)}
                                                            options={options}
                                                            disabledReason={disabledReason}
                                                            xpCost={
                                                                type === "flaw" || mode !== "xp"
                                                                    ? undefined
                                                                    : cost
                                                            }
                                                        />
                                                    )
                                                })}
                                            </Group>
                                        </Box>
                                        <Group justify="flex-end" mt="md">
                                            <Button
                                                onClick={handleAddCustom}
                                                color={primaryColor}
                                                disabled={
                                                    !customName.trim() ||
                                                    (mode === "xp" &&
                                                        type === "merit" &&
                                                        !canAffordUpgrade(
                                                            getAvailableXP(character),
                                                            getCustomMeritCost(customLevel)
                                                        ))
                                                }
                                            >
                                                Add
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Tabs.Panel>
                            ) : null}
                        </Tabs>
                    )}
                </Stack>
            ) : (
                <Center mih={320}>
                    <Loader color={primaryColor} />
                </Center>
            )}
        </Modal>
    )
}

export default MeritFlawSelectModal
