import { Button } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import posthog from "posthog-js"
import { useEffect, useMemo, useState } from "react"
import { Character, getDisciplineLevel } from "~/data/Character"
import { Ritual } from "~/data/Disciplines"
import { Rituals } from "~/data/Rituals"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getRitualCost } from "../utils/xp"
import CustomRitualModal from "./CustomRitualModal"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewPower } from "~/data/Homebrew"
import {
    getPowerDisciplineIdentity,
    getRitualIdentity,
    homebrewPowerToRitual
} from "~/utils/homebrewOptions"
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

type RitualSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
}

const getBloodSorceryLevel = (character: Character): number =>
    getDisciplineLevel(character, "official:blood sorcery")

const RitualSelectModal = ({ opened, onClose, options }: RitualSelectModalProps) => {
    const { character, mode, primaryColor, setCharacter } = options
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const availableXP = getAvailableXP(character)
    const knownRitualIds = useMemo(
        () => new Set(character.rituals.map(getRitualIdentity)),
        [character.rituals]
    )
    const bloodSorceryLevel = getBloodSorceryLevel(character)
    const ritualCatalog = [
        ...Rituals,
        ...homebrewCollections.flatMap((collection) =>
            collection.items
                .filter((item): item is HomebrewPower & { id: string } => item.kind === "ritual")
                .map((item) => homebrewPowerToRitual(item, collection))
        )
    ]
    const availableRituals = ritualCatalog.filter(
        (ritual) =>
            ritual.level <= bloodSorceryLevel && !knownRitualIds.has(getRitualIdentity(ritual))
    )
    const ritualsByLevel = new Map<number, Ritual[]>()

    availableRituals.forEach((ritual) => {
        const existing = ritualsByLevel.get(ritual.level) ?? []
        ritualsByLevel.set(ritual.level, [...existing, ritual])
    })

    const sortedLevels = Array.from(ritualsByLevel.keys()).sort((a, b) => a - b)

    const handleSelectRitual = (ritual: Ritual) => {
        setCharacter((current) => {
            const updatedCharacter = {
                ...current,
                rituals: [...current.rituals, ritual]
            }

            if (mode === "xp") {
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent:
                        updatedCharacter.ephemeral.experienceSpent + getRitualCost(ritual.level)
                }
            }

            return updatedCharacter
        })

        try {
            posthog.capture("sheet-ritual-pick", {
                ritual_name: ritual.name,
                level: ritual.level,
                mode
            })
        } catch (error) {
            console.warn("PostHog sheet-ritual-pick tracking failed:", error)
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
            items: ritualsByLevel
                .get(level)!
                .filter((item) => matchesQuery(query, item.name, item.summary))
        }))
        .filter((group) => group.items.length > 0)
    const visibleItems = visibleLevels.flatMap((group) => group.items)

    const getBlockedReason = (item: Ritual) => {
        if (mode !== "xp") return undefined
        const cost = getRitualCost(item.level)
        return canAffordUpgrade(availableXP, cost)
            ? undefined
            : `Insufficient XP. Need ${cost}, have ${availableXP}`
    }

    const nav = useListNav({
        items: visibleItems,
        onPick: (item) => {
            if (!getBlockedReason(item)) handleSelectRitual(item)
        },
        resetKey: query
    })

    let navIndex = 0
    return (
        <SheetModal opened={opened} onClose={onClose} title="Select a Ritual" size="xl">
            <SelectToolbar>
                <SearchField
                    label="Search rituals"
                    placeholder="Search rituals"
                    value={query}
                    onChange={setQuery}
                    nav={nav}
                />
            </SelectToolbar>
            <SelectScroll listId={nav.listId} label="Rituals">
                {availableRituals.length === 0 ? (
                    <SelectEmpty>No available rituals to add.</SelectEmpty>
                ) : visibleItems.length === 0 ? (
                    <SelectEmpty>No ritual matches “{query.trim()}”.</SelectEmpty>
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
                        Create Custom Ritual
                    </Button>
                }
            />
            <CustomRitualModal
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

export default RitualSelectModal
