import { Box, Button, Center, Group, Loader, Tabs, Text, Textarea, TextInput } from "@mantine/core"
import { IconArrowLeft } from "@tabler/icons-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import posthog from "posthog-js"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { MeritFlaw } from "~/data/Character"
import { clans } from "~/data/Clans"
import {
    advancedMeritsAndFlaws,
    advancedThinbloodMeritsAndFlaws,
    essentialLoresheets,
    essentialMeritsAndFlaws,
    essentialThinbloodMeritsAndFlaws,
    Loresheet,
    MeritOrFlaw
} from "~/data/MeritsAndFlaws"
import { getCharacterPredatorType } from "~/data/predatorTypeOptions"
import {
    addMeritFlawExclusions,
    getPredatorTypeMeritsByName,
    isMeritFlawCoveredByPredatorTypeGrant
} from "~/data/meritsAndFlawsResolution"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getMeritCost } from "../utils/xp"
import PipButton from "./PipButton"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewLoresheet, HomebrewMeritFlaw, HomebrewSource } from "~/data/Homebrew"
import { getHomebrewSource, getMeritFlawIdentity } from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import { DisabledReason } from "~/components/ui"
import {
    DisabledLine,
    MetaRows,
    OptionCard,
    OptionHead,
    SearchField,
    SelectEmpty,
    SelectFooter,
    SelectScroll,
    SelectToolbar,
    SheetModal,
    Summary,
    Tag,
    matchesQuery,
    selectModalClasses,
    useListNav
} from "./selectModalParts"

type DisplayMeritFlaw = MeritOrFlaw & { homebrewSource?: HomebrewSource; text?: string }
type DisplayLoresheet = Omit<Loresheet, "merits"> & { merits: DisplayMeritFlaw[] }

type MeritFlawSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    type: "merit" | "flaw"
}

const MeritFlawSelectModal = ({ opened, onClose, options, type }: MeritFlawSelectModalProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [selectedMeritFlaw, setSelectedMeritFlaw] = useState<DisplayMeritFlaw | null>(null)
    const [selectedLevel, setSelectedLevel] = useState<number>(1)
    const [activeTab, setActiveTab] = useState<string | null>("regular")
    const [openLoresheetTitle, setOpenLoresheetTitle] = useState("")
    const [loresheetQuery, setLoresheetQuery] = useState("")
    const [regularQuery, setRegularQuery] = useState("")
    const [showAdvancedMeritsAndFlaws, setShowAdvancedMeritsAndFlaws] = useState(false)
    const [customName, setCustomName] = useState("")
    const [customLevel, setCustomLevel] = useState<number>(1)
    const [customDescription, setCustomDescription] = useState("")
    const [contentReady, setContentReady] = useState(false)
    const isEditable = mode === "xp" || mode === "free"
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewMeritsAndFlaws = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewMeritFlaw & { id: string } =>
                    item.kind === "merit" || item.kind === "flaw"
            )
            .map((item) => ({ item, collection }))
    )
    const homebrewCategory = {
        title: "Homebrew",
        merits: homebrewMeritsAndFlaws
            .filter(({ item }) => item.kind === "merit")
            .map(({ item, collection }) => ({
                name: item.name,
                cost: item.costs,
                summary: item.summary || item.description,
                excludes: item.excludes,
                homebrewSource: getHomebrewSource(item, collection)
            })),
        flaws: homebrewMeritsAndFlaws
            .filter(({ item }) => item.kind === "flaw")
            .map(({ item, collection }) => ({
                name: item.name,
                cost: item.costs,
                summary: item.summary || item.description,
                excludes: item.excludes,
                homebrewSource: getHomebrewSource(item, collection)
            }))
    }

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
            setShowAdvancedMeritsAndFlaws(false)
            setCustomName("")
            setCustomLevel(1)
            setCustomDescription("")
        }
    }, [opened])

    const allMeritsAndFlaws: Array<{
        title: string
        merits: DisplayMeritFlaw[]
        flaws: DisplayMeritFlaw[]
    }> = [
        ...(character.clan === "Thin-blood"
            ? [
                  essentialThinbloodMeritsAndFlaws,
                  ...(showAdvancedMeritsAndFlaws ? [advancedThinbloodMeritsAndFlaws] : []),
                  ...essentialMeritsAndFlaws
              ]
            : essentialMeritsAndFlaws),
        ...(showAdvancedMeritsAndFlaws ? advancedMeritsAndFlaws : []),
        ...(homebrewMeritsAndFlaws.length ? [homebrewCategory] : [])
    ]
    const characterMeritFlawIdentities = new Set(
        (type === "merit" ? character.merits : character.flaws).map((item) =>
            getMeritFlawIdentity(item, type)
        )
    )
    const getExistingLevel = (item: DisplayMeritFlaw) => {
        if (type !== "merit") return 0
        const identity = getMeritFlawIdentity(item, "merit")
        return (
            character.merits.find((merit) => getMeritFlawIdentity(merit, "merit") === identity)
                ?.level ?? 0
        )
    }
    const canAddOrUpgrade = (item: DisplayMeritFlaw) =>
        !characterMeritFlawIdentities.has(getMeritFlawIdentity(item, type)) ||
        (type === "merit" && item.cost.some((level) => level > getExistingLevel(item)))

    const exclusionMap = useMemo(() => {
        const map = new Map<string, string[]>()
        const predatorTypeMeritsByName = getPredatorTypeMeritsByName(character)
        character.merits.forEach((merit) => {
            addMeritFlawExclusions(
                map,
                merit,
                isMeritFlawCoveredByPredatorTypeGrant(merit, predatorTypeMeritsByName)
            )
        })
        character.flaws.forEach((flaw) => {
            addMeritFlawExclusions(map, flaw)
        })
        character.predatorType.pickedMeritsAndFlaws.forEach((meritFlaw) => {
            addMeritFlawExclusions(map, meritFlaw, true)
        })
        const predatorType = getCharacterPredatorType(character)
        if (predatorType) {
            predatorType.meritsAndFlaws.forEach((meritFlaw) => {
                addMeritFlawExclusions(map, meritFlaw, true)
            })
        }
        const clan = character.homebrewClan ?? clans[character.clan]
        if (clan?.excludedMeritsAndFlaws) {
            clan.excludedMeritsAndFlaws.forEach((excludedName) => {
                if (!map.has(excludedName)) {
                    map.set(excludedName, [])
                }
                map.get(excludedName)?.push(
                    `${character.homebrewClan?.name ?? character.clan} clan`
                )
            })
        }
        return map
    }, [
        character.merits,
        character.flaws,
        character.predatorType.pickedMeritsAndFlaws,
        character.predatorType.name,
        character.clan,
        character.homebrewClan
    ])

    useEffect(() => {
        if (selectedMeritFlaw) {
            setSelectedLevel(
                selectedMeritFlaw.cost.find(
                    (level) => level > getExistingLevel(selectedMeritFlaw)
                ) ?? selectedMeritFlaw.cost[0]
            )
        }
    }, [selectedMeritFlaw])

    const getAvailableMeritsOrFlaws = (): DisplayMeritFlaw[] => {
        const all: DisplayMeritFlaw[] = []
        allMeritsAndFlaws.forEach((category) => {
            const items = type === "merit" ? category.merits : category.flaws
            items.forEach((item) => {
                if (canAddOrUpgrade(item)) {
                    all.push(item)
                }
            })
        })
        return all
    }

    const availableItems = getAvailableMeritsOrFlaws()

    const addMeritFlaw = (meritFlaw: DisplayMeritFlaw, level: number) => {
        const meritFlawIdentity = getMeritFlawIdentity(meritFlaw, type)
        const newMeritFlaw: MeritFlaw = {
            name: meritFlaw.name,
            level: level,
            summary: meritFlaw.summary,
            excludes: meritFlaw.excludes,
            type,
            text: meritFlaw.text,
            homebrewSource: meritFlaw.homebrewSource
        }

        if (mode === "xp" && type === "merit") {
            const existingMerit = character.merits.find(
                (item) => getMeritFlawIdentity(item, "merit") === meritFlawIdentity
            )
            const previousLevel = existingMerit ? existingMerit.level : 0
            if (level <= previousLevel) return
            const meritToSave = existingMerit ? { ...existingMerit, level } : newMeritFlaw
            const cost = getMeritCost(level, previousLevel)
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            if (existingMerit) {
                setCharacter((current) => ({
                    ...current,
                    merits: current.merits.map((m) => (m === existingMerit ? meritToSave : m)),
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
                const existingMerit = character.merits.find(
                    (item) => getMeritFlawIdentity(item, "merit") === meritFlawIdentity
                )
                if (existingMerit) {
                    if (level <= existingMerit.level) return
                    const meritToSave = { ...existingMerit, level }
                    setCharacter((current) => ({
                        ...current,
                        merits: current.merits.map((m) => (m === existingMerit ? meritToSave : m))
                    }))
                } else {
                    setCharacter((current) => ({
                        ...current,
                        merits: [...current.merits, newMeritFlaw]
                    }))
                }
            } else {
                const existingFlaw = character.flaws.find(
                    (item) => getMeritFlawIdentity(item, "flaw") === meritFlawIdentity
                )
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
            if (customLevel <= previousLevel) return
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
                    if (customLevel <= existingMerit.level) return
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

    const getExistingCustomMeritLevel = (): number => {
        if (type !== "merit") return 0
        return character.merits.find((merit) => merit.name === customName.trim())?.level ?? 0
    }

    const getCostForItem = (item: DisplayMeritFlaw, level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const identity = getMeritFlawIdentity(item, "merit")
        const existingMerit = character.merits.find(
            (merit) => getMeritFlawIdentity(merit, "merit") === identity
        )
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const handleItemClick = (item: DisplayMeritFlaw) => {
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
        const selectedIdentity = selectedMeritFlaw
            ? getMeritFlawIdentity(selectedMeritFlaw, "merit")
            : ""
        const existingMerit = character.merits.find(
            (merit) => getMeritFlawIdentity(merit, "merit") === selectedIdentity
        )
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const loresheetCatalog: DisplayLoresheet[] = [
        ...essentialLoresheets,
        ...homebrewCollections.flatMap((collection) =>
            collection.items
                .filter(
                    (item): item is HomebrewLoresheet & { id: string } => item.kind === "loresheet"
                )
                .map((item) => ({
                    title: item.name,
                    summary: item.summary || item.description,
                    source: item.source,
                    requirementFunctions: [],
                    merits: item.tiers.map((tier) => ({
                        name: tier.name,
                        cost: [tier.level],
                        summary: tier.summary,
                        excludes: [],
                        text: item.requirements,
                        homebrewSource: getHomebrewSource(item, collection)
                    }))
                }))
        )
    ]
    const openLoresheet = loresheetCatalog.find((sheet) => sheet.title === openLoresheetTitle)
    const pickedMeritsAndFlaws = [...character.merits, ...character.flaws]

    const pickedIdentities = new Set(
        pickedMeritsAndFlaws.map((item) => getMeritFlawIdentity(item, item.type))
    )
    const availableXP = getAvailableXP(character)
    const typeLabel = type === "merit" ? "merits" : "flaws"

    // Why an item can't be picked right now, or undefined when it can.
    const getItemBlockedReason = (item: DisplayMeritFlaw, checkCost: boolean) => {
        const excludingItems = exclusionMap.get(item.name) ?? []
        if (excludingItems.length > 0) return `Excluded by: ${excludingItems.join(", ")}`
        if (checkCost && mode === "xp") {
            const lowestCost = getCostForItem(item, item.cost[0])
            if (!canAffordUpgrade(availableXP, lowestCost)) {
                return `Insufficient XP. Need ${lowestCost}, have ${availableXP}`
            }
        }
        return undefined
    }

    const renderItemCard = (
        item: DisplayMeritFlaw,
        blockedReason: string | undefined,
        navProps: ReturnType<ReturnType<typeof useListNav>["optionProps"]>,
        tone: "accent" | "blood"
    ) => {
        const existingLevel = getExistingLevel(item)
        return (
            <OptionCard disabled={!!blockedReason} {...navProps}>
                <OptionHead
                    name={item.name}
                    tags={
                        <>
                            {item.homebrewSource ? (
                                <HomebrewBadge source={item.homebrewSource} />
                            ) : null}
                            {existingLevel > 0 ? (
                                <Tag tone="success">Has {existingLevel}</Tag>
                            ) : null}
                            <Tag tone={tone}>
                                {item.cost.join(" / ")}
                                <span className={selectModalClasses.dot} aria-hidden="true" />
                            </Tag>
                        </>
                    }
                />
                <Summary lines={2}>{item.summary}</Summary>
                {blockedReason ? <DisabledLine>{blockedReason}</DisabledLine> : null}
            </OptionCard>
        )
    }

    const renderLevelPicker = (meritFlaw: DisplayMeritFlaw) => (
        <>
            <div className={selectModalClasses.detail} style={{ flex: 1 }}>
                <h3 className={selectModalClasses.detailTitle}>{meritFlaw.name}</h3>
                {meritFlaw.summary ? (
                    <Text className={selectModalClasses.detailLore}>{meritFlaw.summary}</Text>
                ) : null}
                <Text className={selectModalClasses.fieldLabel} mt="md">
                    Select Level
                </Text>
                <Group gap="xs">
                    {meritFlaw.cost.map((level) => {
                        const existingLevel = getExistingLevel(meritFlaw)
                        const cost = getCostForLevel(level)
                        const canAfford =
                            type === "flaw" || mode !== "xp" || canAffordUpgrade(availableXP, cost)
                        const disabledReason =
                            level <= existingLevel
                                ? `Already at level ${existingLevel}`
                                : type === "flaw" || mode !== "xp"
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
                                xpCost={type === "flaw" || mode !== "xp" ? undefined : cost}
                            />
                        )
                    })}
                </Group>
            </div>
            <SelectFooter
                start={
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setSelectedMeritFlaw(null)}
                    >
                        Back
                    </Button>
                }
                end={
                    <Button
                        onClick={handleSelect}
                        color={primaryColor}
                        disabled={
                            mode === "xp" &&
                            type === "merit" &&
                            !canAffordUpgrade(availableXP, getCostForLevel(selectedLevel))
                        }
                    >
                        {getExistingLevel(meritFlaw) > 0 ? "Upgrade" : "Add"}
                    </Button>
                }
            />
        </>
    )

    const renderRegularContent = () => {
        const visibleCategories = allMeritsAndFlaws
            .map((category) => {
                const items = type === "merit" ? category.merits : category.flaws
                return {
                    category,
                    availableCategoryItems: items.filter(
                        (item) => canAddOrUpgrade(item) && matchesQuery(regularQuery, item.name)
                    )
                }
            })
            .filter(({ availableCategoryItems }) => availableCategoryItems.length > 0)

        return (
            <MeritFlawVirtualList
                listLabel={type === "merit" ? "Merits" : "Flaws"}
                query={regularQuery}
                onQueryChange={setRegularQuery}
                searchLabel={`Search ${typeLabel}`}
                searchPlaceholder={`Search ${typeLabel} by name`}
                toolbarExtra={
                    <Button
                        data-testid="toggle-advanced-merits-flaws-button"
                        variant="default"
                        aria-pressed={showAdvancedMeritsAndFlaws}
                        onClick={() =>
                            setShowAdvancedMeritsAndFlaws((showingAdvanced) => !showingAdvanced)
                        }
                    >
                        {showAdvancedMeritsAndFlaws ? "Show essential list" : "Show advanced list"}
                    </Button>
                }
                emptyText={
                    availableItems.length === 0
                        ? `No available ${typeLabel} to add.`
                        : `No ${typeLabel} match that name.`
                }
                groups={visibleCategories.map(({ category, availableCategoryItems }) => ({
                    title: category.title,
                    items: availableCategoryItems
                }))}
                getKey={(item) => getMeritFlawIdentity(item, type)}
                onPick={handleItemClick}
                renderItem={(item, navProps) =>
                    renderItemCard(
                        item,
                        getItemBlockedReason(item, type === "merit"),
                        navProps,
                        type === "flaw" ? "blood" : "accent"
                    )
                }
            />
        )
    }

    const normalizedLoresheetQuery = loresheetQuery.trim().toLocaleLowerCase()
    const availableLoresheets = loresheetCatalog.filter((loresheet) => {
        const requirementsMet = loresheet.requirementFunctions.every((fun) => fun(character))
        if (!requirementsMet) return false
        const titleMatches =
            normalizedLoresheetQuery.length === 0 ||
            loresheet.title.toLocaleLowerCase().includes(normalizedLoresheetQuery)
        if (!titleMatches) return false
        const sheetPicked = loresheet.merits.some((merit) =>
            pickedIdentities.has(getMeritFlawIdentity(merit, "merit"))
        )
        const hasAvailableMerits = loresheet.merits.some(
            (merit) => !characterMeritFlawIdentities.has(getMeritFlawIdentity(merit, "merit"))
        )
        return hasAvailableMerits || sheetPicked
    })
    const openLoresheetMerits = openLoresheet
        ? openLoresheet.merits.filter(
              (merit) => !characterMeritFlawIdentities.has(getMeritFlawIdentity(merit, "merit"))
          )
        : []

    const loresheetNav = useListNav({
        items: availableLoresheets,
        onPick: (loresheet) => setOpenLoresheetTitle(loresheet.title),
        resetKey: `${loresheetQuery}|${activeTab}`
    })
    const loresheetMeritNav = useListNav({
        items: openLoresheetMerits,
        onPick: handleItemClick,
        resetKey: openLoresheetTitle
    })

    const renderLoresheetsContent = () => {
        if (openLoresheet) {
            return (
                <>
                    <SelectToolbar>
                        <div className={selectModalClasses.detail}>
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <h3 className={selectModalClasses.detailTitle}>
                                    {openLoresheet.title}
                                </h3>
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    size="xs"
                                    leftSection={<IconArrowLeft size={14} />}
                                    onClick={() => setOpenLoresheetTitle("")}
                                >
                                    Back
                                </Button>
                            </Group>
                            <Summary lines={4}>{openLoresheet.summary}</Summary>
                            <span className={selectModalClasses.metaLabel}>
                                Source · {openLoresheet.source}
                            </span>
                        </div>
                    </SelectToolbar>
                    <SelectScroll
                        listId={loresheetMeritNav.listId}
                        label={openLoresheet.title}
                        focusNav={loresheetMeritNav}
                    >
                        {openLoresheetMerits.length === 0 ? (
                            <SelectEmpty>
                                All merits from this loresheet have been added.
                            </SelectEmpty>
                        ) : (
                            <div className={selectModalClasses.stack}>
                                {openLoresheetMerits.map((merit, index) => (
                                    <div key={getMeritFlawIdentity(merit, "merit")}>
                                        {renderItemCard(
                                            merit,
                                            getItemBlockedReason(merit, true),
                                            loresheetMeritNav.optionProps(index),
                                            "accent"
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </SelectScroll>
                </>
            )
        }

        return (
            <>
                <SelectToolbar>
                    <SearchField
                        label="Search loresheets"
                        placeholder="Search loresheets by title"
                        value={loresheetQuery}
                        onChange={setLoresheetQuery}
                        nav={loresheetNav}
                    />
                </SelectToolbar>
                <SelectScroll listId={loresheetNav.listId} label="Loresheets">
                    {availableLoresheets.length === 0 ? (
                        <SelectEmpty>
                            {normalizedLoresheetQuery.length > 0
                                ? "No loresheets match that title."
                                : "No available loresheets."}
                        </SelectEmpty>
                    ) : (
                        <div className={selectModalClasses.grid}>
                            {availableLoresheets.map((loresheet, index) => {
                                const sheetPicked = loresheet.merits.some((merit) =>
                                    pickedIdentities.has(getMeritFlawIdentity(merit, "merit"))
                                )
                                return (
                                    <OptionCard
                                        key={loresheet.title}
                                        picked={sheetPicked}
                                        {...loresheetNav.optionProps(index)}
                                    >
                                        <OptionHead
                                            display
                                            name={loresheet.title}
                                            tags={
                                                <>
                                                    {loresheet.merits[0]?.homebrewSource ? (
                                                        <HomebrewBadge
                                                            source={
                                                                loresheet.merits[0].homebrewSource
                                                            }
                                                        />
                                                    ) : null}
                                                    {sheetPicked ? (
                                                        <Tag tone="success">In use</Tag>
                                                    ) : null}
                                                </>
                                            }
                                        />
                                        <Summary lines={4}>{loresheet.summary}</Summary>
                                        <MetaRows rows={[["Source", loresheet.source]]} />
                                    </OptionCard>
                                )
                            })}
                        </div>
                    )}
                </SelectScroll>
            </>
        )
    }

    const renderCustomContent = () => {
        const addDisabledReason = !customName.trim()
            ? "Name it first"
            : type === "merit" && customLevel <= getExistingCustomMeritLevel()
              ? `Already at level ${getExistingCustomMeritLevel()}`
              : mode === "xp" &&
                  type === "merit" &&
                  !canAffordUpgrade(availableXP, getCustomMeritCost(customLevel))
                ? `Insufficient XP. Need ${getCustomMeritCost(customLevel)}, have ${availableXP}`
                : undefined
        return (
            <>
                <div className={selectModalClasses.form} style={{ flex: 1 }}>
                    <TextInput
                        label="Name"
                        placeholder={`Enter ${type === "merit" ? "merit" : "flaw"} name`}
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !addDisabledReason) handleAddCustom()
                        }}
                        required
                        autoFocus
                        data-autofocus
                    />
                    <Textarea
                        label="Description"
                        placeholder={`Enter ${type === "merit" ? "merit" : "flaw"} description (optional)`}
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                        resize="vertical"
                    />
                    <Box>
                        <Text className={selectModalClasses.fieldLabel}>Select Level</Text>
                        <Group gap="xs">
                            {[1, 2, 3, 4, 5].map((level) => {
                                const existingLevel = getExistingCustomMeritLevel()
                                const cost = getCustomMeritCost(level)
                                const canAfford =
                                    type === "flaw" ||
                                    mode !== "xp" ||
                                    canAffordUpgrade(availableXP, cost)
                                const disabledReason =
                                    level <= existingLevel
                                        ? `Already at level ${existingLevel}`
                                        : type === "flaw" || mode !== "xp"
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
                                        xpCost={type === "flaw" || mode !== "xp" ? undefined : cost}
                                    />
                                )
                            })}
                        </Group>
                    </Box>
                </div>
                <SelectFooter
                    end={
                        <DisabledReason reason={addDisabledReason}>
                            <Button
                                onClick={handleAddCustom}
                                color={primaryColor}
                                disabled={!!addDisabledReason}
                            >
                                Add
                            </Button>
                        </DisabledReason>
                    }
                />
            </>
        )
    }

    return (
        <SheetModal
            opened={opened}
            onClose={onClose}
            title={`Select a ${type === "merit" ? "Merit" : "Flaw"}`}
            size="xl"
        >
            {!contentReady ? (
                <Center mih={320}>
                    <Loader color={primaryColor} />
                </Center>
            ) : selectedMeritFlaw ? (
                renderLevelPicker(selectedMeritFlaw)
            ) : (
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    color={primaryColor}
                    className={selectModalClasses.tabs}
                    keepMounted={false}
                >
                    <Tabs.List>
                        <Tabs.Tab value="regular">{type === "merit" ? "Merits" : "Flaws"}</Tabs.Tab>
                        {type === "merit" ? (
                            <Tabs.Tab value="loresheets">Loresheets</Tabs.Tab>
                        ) : null}
                        {isEditable ? <Tabs.Tab value="custom">Custom</Tabs.Tab> : null}
                    </Tabs.List>

                    <Tabs.Panel value="regular" className={selectModalClasses.tabPanel}>
                        {renderRegularContent()}
                    </Tabs.Panel>
                    {type === "merit" ? (
                        <Tabs.Panel value="loresheets" className={selectModalClasses.tabPanel}>
                            {renderLoresheetsContent()}
                        </Tabs.Panel>
                    ) : null}
                    {isEditable ? (
                        <Tabs.Panel value="custom" className={selectModalClasses.tabPanel}>
                            {renderCustomContent()}
                        </Tabs.Panel>
                    ) : null}
                </Tabs>
            )}
        </SheetModal>
    )
}

type VirtualRow<T> = { kind: "header"; title: string } | { kind: "item"; item: T; navIndex: number }

/** Long merit/flaw catalogs: one virtualized column with sticky-free group labels as rows. */
function MeritFlawVirtualList<T>({
    groups,
    getKey,
    onPick,
    renderItem,
    query,
    onQueryChange,
    searchLabel,
    searchPlaceholder,
    toolbarExtra,
    emptyText,
    listLabel
}: {
    groups: Array<{ title: string; items: T[] }>
    getKey: (item: T) => string
    onPick: (item: T) => void
    renderItem: (
        item: T,
        navProps: ReturnType<ReturnType<typeof useListNav>["optionProps"]>
    ) => ReactNode
    query: string
    onQueryChange: (value: string) => void
    searchLabel: string
    searchPlaceholder: string
    toolbarExtra?: ReactNode
    emptyText: string
    listLabel: string
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const rows: VirtualRow<T>[] = []
    const items: T[] = []
    const rowIndexByNav: number[] = []
    for (const group of groups) {
        rows.push({ kind: "header", title: group.title })
        for (const item of group.items) {
            rowIndexByNav.push(rows.length)
            rows.push({ kind: "item", item, navIndex: items.length })
            items.push(item)
        }
    }

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: (index) => (rows[index]?.kind === "header" ? 44 : 104),
        overscan: 10,
        getItemKey: (index) => {
            const row = rows[index]
            return row.kind === "header" ? `h:${row.title}` : `i:${getKey(row.item)}`
        }
    })

    const nav = useListNav({
        items,
        onPick,
        resetKey: query,
        scrollToIndex: (index) =>
            virtualizer.scrollToIndex(rowIndexByNav[index] ?? 0, { align: "auto" })
    })

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 })
    }, [query, groups.length])

    return (
        <>
            <SelectToolbar>
                <div className={selectModalClasses.toolbarRow}>
                    <SearchField
                        label={searchLabel}
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={onQueryChange}
                        nav={nav}
                    />
                    {toolbarExtra}
                </div>
            </SelectToolbar>
            <SelectScroll ref={scrollRef} listId={nav.listId} label={listLabel}>
                {items.length === 0 ? (
                    <SelectEmpty>{emptyText}</SelectEmpty>
                ) : (
                    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const row = rows[virtualRow.index]
                            return (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={virtualizer.measureElement}
                                    className={selectModalClasses.virtualRow}
                                    style={{ top: Math.round(virtualRow.start) }}
                                >
                                    {row.kind === "header" ? (
                                        <h3
                                            className={selectModalClasses.groupLabel}
                                            style={{ paddingTop: virtualRow.index ? 16 : 4 }}
                                        >
                                            {row.title}
                                        </h3>
                                    ) : (
                                        renderItem(row.item, nav.optionProps(row.navIndex))
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </SelectScroll>
        </>
    )
}

export default MeritFlawSelectModal
