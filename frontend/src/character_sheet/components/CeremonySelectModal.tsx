import { Button } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import posthog from "posthog-js"
import { useEffect, useMemo, useState } from "react"
import { Character } from "~/data/Character"
import {
    Ceremony,
    Ceremonies,
    characterHasCeremonyPrerequisite,
    getOblivionCeremonyLevel,
    getCeremonyPrerequisiteLabel
} from "~/data/Ceremonies"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getRitualCost } from "../utils/xp"
import CustomCeremonyModal from "./CustomCeremonyModal"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewPower } from "~/data/Homebrew"
import { getRitualIdentity, homebrewPowerToCeremony } from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import {
    DisabledLine,
    LevelTag,
    MetaRows,
    OptionCard,
    OptionGroup,
    OptionHead,
    RouseDrops,
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

type CeremonySelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
}

const CeremonySelectModal = ({ opened, onClose, options }: CeremonySelectModalProps) => {
    const { character, mode, primaryColor, setCharacter } = options
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const availableXP = getAvailableXP(character)
    const knownCeremonyIds = useMemo(
        () => new Set(character.ceremonies.map(getRitualIdentity)),
        [character.ceremonies]
    )
    const oblivionLevel = getOblivionCeremonyLevel(character)
    const ceremonyCatalog = [
        ...Ceremonies,
        ...homebrewCollections.flatMap((collection) =>
            collection.items
                .filter((item): item is HomebrewPower & { id: string } => item.kind === "ceremony")
                .map((item) => homebrewPowerToCeremony(item, collection))
        )
    ]
    const availableCeremonies = ceremonyCatalog.filter(
        (ceremony) =>
            ceremony.level <= oblivionLevel &&
            !knownCeremonyIds.has(getRitualIdentity(ceremony)) &&
            characterHasCeremonyPrerequisite(character, ceremony)
    )
    const ceremoniesByLevel = new Map<number, Ceremony[]>()

    availableCeremonies.forEach((ceremony) => {
        const existing = ceremoniesByLevel.get(ceremony.level) ?? []
        ceremoniesByLevel.set(ceremony.level, [...existing, ceremony])
    })

    const sortedLevels = Array.from(ceremoniesByLevel.keys()).sort((a, b) => a - b)

    const handleSelectCeremony = (ceremony: Ceremony) => {
        setCharacter((current) => {
            const updatedCharacter = {
                ...current,
                ceremonies: [...current.ceremonies, ceremony]
            }

            if (mode === "xp") {
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent:
                        updatedCharacter.ephemeral.experienceSpent + getRitualCost(ceremony.level)
                }
            }

            return updatedCharacter
        })

        try {
            posthog.capture("sheet-ceremony-pick", {
                ceremony_name: ceremony.name,
                level: ceremony.level,
                mode
            })
        } catch (error) {
            console.warn("PostHog sheet-ceremony-pick tracking failed:", error)
        }

        onClose()
    }

    const [query, setQuery] = useState("")
    const [customOpened, setCustomOpened] = useState(false)
    useEffect(() => {
        if (!opened) setQuery("")
    }, [opened])

    const visibleLevels = sortedLevels
        .map((level) => ({
            level,
            items: ceremoniesByLevel
                .get(level)!
                .filter((item) => matchesQuery(query, item.name, item.summary))
        }))
        .filter((group) => group.items.length > 0)
    const visibleItems = visibleLevels.flatMap((group) => group.items)

    const getBlockedReason = (item: Ceremony) => {
        if (mode !== "xp") return undefined
        const cost = getRitualCost(item.level)
        return canAffordUpgrade(availableXP, cost)
            ? undefined
            : `Insufficient XP. Need ${cost}, have ${availableXP}`
    }

    const nav = useListNav({
        items: visibleItems,
        onPick: (item) => {
            if (!getBlockedReason(item)) handleSelectCeremony(item)
        },
        resetKey: query
    })

    let navIndex = 0
    return (
        <SheetModal opened={opened} onClose={onClose} title="Select a Ceremony" size="xl">
            <SelectToolbar>
                <SearchField
                    label="Search ceremonies"
                    placeholder="Search ceremonies"
                    value={query}
                    onChange={setQuery}
                    nav={nav}
                />
            </SelectToolbar>
            <SelectScroll listId={nav.listId} label="Ceremonys">
                {availableCeremonies.length === 0 ? (
                    <SelectEmpty>No available ceremonies to add.</SelectEmpty>
                ) : visibleItems.length === 0 ? (
                    <SelectEmpty>No ceremony matches “{query.trim()}”.</SelectEmpty>
                ) : (
                    visibleLevels.map(({ level, items }) => (
                        <OptionGroup key={level} label={`Level ${level}`}>
                            <div className={selectModalClasses.grid}>
                                {items.map((item) => {
                                    const index = navIndex++
                                    const blockedReason = getBlockedReason(item)
                                    return (
                                        <OptionCard
                                            key={getRitualIdentity(item)}
                                            disabled={!!blockedReason}
                                            {...nav.optionProps(index)}
                                        >
                                            <OptionHead
                                                name={item.name}
                                                tags={
                                                    <>
                                                        {item.homebrewSource ? (
                                                            <HomebrewBadge
                                                                source={item.homebrewSource}
                                                            />
                                                        ) : null}
                                                        {mode === "xp" ? (
                                                            <Tag tone="accent">
                                                                {getRitualCost(item.level)} XP
                                                            </Tag>
                                                        ) : null}
                                                        <LevelTag level={item.level} />
                                                    </>
                                                }
                                            />
                                            <Summary>{item.summary}</Summary>
                                            <MetaRows
                                                rows={[
                                                    item.dicePool
                                                        ? [
                                                              "Pool",
                                                              <span
                                                                  key="pool"
                                                                  className={
                                                                      selectModalClasses.pool
                                                                  }
                                                              >
                                                                  {item.dicePool}
                                                              </span>
                                                          ]
                                                        : null,
                                                    [
                                                        "Requires",
                                                        getCeremonyPrerequisiteLabel(item)
                                                    ],
                                                    item.requiredTime
                                                        ? ["Time", item.requiredTime]
                                                        : null,
                                                    item.rouseChecks > 0
                                                        ? [
                                                              "Rouse",
                                                              <RouseDrops
                                                                  key="r"
                                                                  n={item.rouseChecks}
                                                              />
                                                          ]
                                                        : null,
                                                    item.ingredients
                                                        ? ["Needs", item.ingredients]
                                                        : null
                                                ]}
                                            />
                                            {blockedReason ? (
                                                <DisabledLine>{blockedReason}</DisabledLine>
                                            ) : null}
                                        </OptionCard>
                                    )
                                })}
                            </div>
                        </OptionGroup>
                    ))
                )}
            </SelectScroll>
            <SelectFooter
                end={
                    <Button
                        variant="default"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCustomOpened(true)}
                    >
                        Create Custom Ceremony
                    </Button>
                }
            />
            <CustomCeremonyModal
                opened={customOpened}
                onClose={() => setCustomOpened(false)}
                options={options}
                onSave={() => {
                    setCustomOpened(false)
                    onClose()
                }}
            />
        </SheetModal>
    )
}

export default CeremonySelectModal
