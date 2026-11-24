import { Button, Center, Loader } from "@mantine/core"
import { useState, useEffect } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { disciplines, Power } from "~/data/Disciplines"
import { clans } from "~/data/Clans"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { Character, getDisciplineLevel, increaseDisciplineLevelForPower } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import { calculateDicePoolValues } from "./DisciplinePowerCard"
import CustomDisciplineModal from "./CustomDisciplineModal"
import CustomPowerModal from "./CustomPowerModal"
import { canAffordUpgrade, getAvailableXP, getDisciplineCost } from "../utils/xp"
import posthog from "posthog-js"
import { IconArrowLeft, IconPlus } from "@tabler/icons-react"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewDiscipline } from "~/data/Homebrew"
import {
    getHomebrewDisciplineOptions,
    getPowerDisciplineIdentity,
    getPowerIdentity
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

type DisciplineSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    initialDiscipline?: DisciplineName | null
    hideBackButton?: boolean
}

const DisciplineSelectModal = ({
    opened,
    onClose,
    options,
    initialDiscipline,
    hideBackButton
}: DisciplineSelectModalProps) => {
    const { character, primaryColor, setCharacter } = options
    const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineName | null>(
        initialDiscipline || null
    )
    const [customDisciplineModalOpened, setCustomDisciplineModalOpened] = useState(false)
    const [customPowerModalOpened, setCustomPowerModalOpened] = useState(false)
    const [contentReady, setContentReady] = useState(false)
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewDisciplineItems = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewDiscipline & { id: string } => item.kind === "discipline"
            )
            .map((item) => ({ item, collection }))
    )
    const disciplineCatalog = getHomebrewDisciplineOptions(homebrewCollections, [
        ...Object.keys(disciplines),
        ...homebrewDisciplineItems.map(({ item }) => item.name)
    ])

    const captureModalEvent = (event: string, properties: Record<string, unknown>) => {
        try {
            posthog.capture(event, properties)
        } catch (error) {
            console.warn(`PostHog ${event} tracking failed:`, error)
        }
    }

    useEffect(() => {
        if (!opened) {
            setContentReady(false)
            return
        }

        const frame = window.requestAnimationFrame(() => setContentReady(true))
        return () => window.cancelAnimationFrame(frame)
    }, [opened])

    // No open/close event existed, so every failure in here was only visible from a replay.
    useEffect(() => {
        if (!opened) return
        captureModalEvent("sheet-discipline-modal-opened", {
            discipline: initialDiscipline ?? null,
            mode: options.mode
        })
        return () => {
            captureModalEvent("sheet-discipline-modal-closed", {
                mode: options.mode
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened])

    useEffect(() => {
        if (opened && initialDiscipline) {
            setSelectedDiscipline(initialDiscipline)
        }
    }, [opened, initialDiscipline])

    useEffect(() => {
        if (!opened) {
            const timer = setTimeout(() => {
                setSelectedDiscipline(null)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [opened])

    const getCurrentDisciplineLevel = (disciplineKey: DisciplineName): number => {
        const discipline = disciplineCatalog[disciplineKey]
        if (!discipline) return 0
        const identity = discipline.homebrewSource
            ? `homebrew:${discipline.homebrewSource.collectionId}:${discipline.homebrewSource.itemId}`
            : `official:${discipline.name}`
        return getDisciplineLevel(character, identity)
    }

    const getAvailablePowers = (disciplineName: DisciplineName): Power[] => {
        const discipline = disciplineCatalog[disciplineName]
        if (!discipline) return []

        const characterPowerIds = new Set(character.disciplines.map(getPowerIdentity))

        return discipline.powers.filter((power) => !characterPowerIds.has(getPowerIdentity(power)))
    }

    // Powers the character cannot take yet stay on screen but disabled, with the reason spelled
    // out. Hiding them left users with no way to learn which lower power unlocks the one they want.
    const getPowerDisabledReasons = (power: Power): string[] => {
        const reasons: string[] = []

        if (selectedDiscipline) {
            const currentLevel = getCurrentDisciplineLevel(selectedDiscipline)
            if (currentLevel >= 5) {
                reasons.push("This Discipline is already at Level 5")
            }
            const maxLevel = currentLevel === 0 ? 1 : currentLevel + 1
            if (power.level > maxLevel) {
                const disciplineLabel = upcase(
                    disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline
                )
                reasons.push(`Requires ${disciplineLabel} Level ${power.level - 1}`)
            }
        }

        for (const {
            discipline: requiredDiscipline,
            level: requiredLevel
        } of power.amalgamPrerequisites) {
            if (getCurrentDisciplineLevel(requiredDiscipline) < requiredLevel) {
                reasons.push(`Requires ${upcase(requiredDiscipline)} Level ${requiredLevel}`)
            }
        }

        if (options.mode === "xp") {
            const cost = getDisciplineCost(
                character,
                power.discipline,
                getPowerDisciplineIdentity(power)
            )
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                reasons.push(`Insufficient XP. Need ${cost}, have ${availableXP}`)
            }
        }

        return reasons
    }

    const getPowerXpCost = (power: Power): number | null => {
        if (options.mode !== "xp" || !selectedDiscipline) return null
        return getDisciplineCost(character, power.discipline, getPowerDisciplineIdentity(power))
    }

    const clanDisciplines = new Set(
        character.homebrewClan?.nativeDisciplines ?? clans[character.clan]?.nativeDisciplines ?? []
    )

    const allDisciplines = Object.keys(disciplineCatalog) as DisciplineName[]
    const availableDisciplines = allDisciplines
        .filter((disciplineName) => {
            if (disciplineName === "") return false
            const discipline = disciplineCatalog[disciplineName]
            if (!discipline) return false
            const hasAvailablePowers = getAvailablePowers(disciplineName).length > 0
            return hasAvailablePowers
        })
        .sort((a, b) => {
            const aIsClan = clanDisciplines.has(disciplineCatalog[a]?.name ?? a)
            const bIsClan = clanDisciplines.has(disciplineCatalog[b]?.name ?? b)
            if (aIsClan && !bIsClan) return -1
            if (!aIsClan && bIsClan) return 1
            return a.localeCompare(b)
        })

    const handleSelectDiscipline = (disciplineName: DisciplineName) => {
        setSelectedDiscipline(disciplineName)
    }

    const handleSelectPower = (power: Power) => {
        if (getPowerDisabledReasons(power).length > 0) return
        setCharacter((current) => {
            const selectedOption = selectedDiscipline
                ? disciplineCatalog[selectedDiscipline]
                : undefined
            const sourceDiscipline = selectedOption?.homebrewSource
            const selectedDisciplineIdentity = selectedOption
                ? selectedOption.homebrewSource
                    ? `homebrew:${selectedOption.homebrewSource.collectionId}:${selectedOption.homebrewSource.itemId}`
                    : `official:${selectedOption.name}`
                : getPowerDisciplineIdentity(power)
            const updatedCharacter = {
                ...current,
                disciplines: [...current.disciplines, power],
                disciplineLevels: increaseDisciplineLevelForPower(current, power),
                customDisciplines: sourceDiscipline
                    ? {
                          ...current.customDisciplines,
                          [selectedDisciplineIdentity]: {
                              name: selectedOption.name,
                              summary: selectedOption.summary,
                              logo: selectedOption.logo,
                              homebrewSource: sourceDiscipline
                          }
                      }
                    : current.customDisciplines
            }
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)

            if (options.mode === "xp") {
                const cost = getDisciplineCost(
                    current,
                    power.discipline,
                    getPowerDisciplineIdentity(power)
                )
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent: updatedCharacter.ephemeral.experienceSpent + cost
                }
            }

            return updatedCharacter
        })

        captureModalEvent("sheet-power-pick", {
            power_name: power.name,
            discipline: power.discipline,
            level: power.level,
            mode: options.mode
        })

        onClose()
        setSelectedDiscipline(null)
    }

    const handleBlockedPick = (power: Power, reason: string) => {
        captureModalEvent("sheet-power-pick-blocked", {
            power_name: power.name,
            discipline: power.discipline,
            level: power.level,
            reason,
            mode: options.mode
        })
    }

    const handleBack = () => {
        setSelectedDiscipline(null)
    }

    const handleCustomPowerSaved = () => {
        setCustomPowerModalOpened(false)
        onClose()
        setSelectedDiscipline(null)
    }

    const availablePowers = selectedDiscipline ? getAvailablePowers(selectedDiscipline) : []

    const [query, setQuery] = useState("")
    useEffect(() => {
        setQuery("")
    }, [selectedDiscipline, opened])

    const visibleDisciplines = availableDisciplines.filter((disciplineName) => {
        const discipline = disciplineCatalog[disciplineName]
        return !!discipline && matchesQuery(query, discipline.name, discipline.summary)
    })

    const disciplineNav = useListNav({
        items: visibleDisciplines,
        onPick: handleSelectDiscipline,
        resetKey: `${query}|${selectedDiscipline ?? ""}`
    })

    const closeModal = () => {
        onClose()
        setSelectedDiscipline(null)
    }

    return (
        <SheetModal
            opened={opened}
            onClose={closeModal}
            title={
                selectedDiscipline
                    ? `Select a Power - ${upcase(
                          disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline
                      )}`
                    : "Select a Discipline"
            }
            size="xl"
        >
            {!contentReady ? (
                <Center mih={320}>
                    <Loader color={primaryColor} />
                </Center>
            ) : opened && selectedDiscipline ? (
                <PowerPicker
                    availablePowers={availablePowers}
                    onSelectPower={handleSelectPower}
                    onBack={handleBack}
                    onCreateCustomPower={() => setCustomPowerModalOpened(true)}
                    hideBackButton={hideBackButton}
                    character={character}
                    getPowerDisabledReasons={getPowerDisabledReasons}
                    getPowerXpCost={getPowerXpCost}
                    onBlockedPick={handleBlockedPick}
                    query={query}
                    onQueryChange={setQuery}
                />
            ) : opened ? (
                <>
                    <SelectToolbar>
                        <SearchField
                            label="Search disciplines"
                            placeholder="Search disciplines"
                            value={query}
                            onChange={setQuery}
                            nav={disciplineNav}
                        />
                    </SelectToolbar>
                    <SelectScroll listId={disciplineNav.listId} label="Disciplines">
                        {availableDisciplines.length === 0 ? (
                            <SelectEmpty>No available disciplines to add.</SelectEmpty>
                        ) : visibleDisciplines.length === 0 ? (
                            <SelectEmpty>No discipline matches “{query.trim()}”.</SelectEmpty>
                        ) : (
                            <div className={selectModalClasses.grid}>
                                {visibleDisciplines.map((disciplineName, index) => {
                                    const discipline = disciplineCatalog[disciplineName]!
                                    const isClan = clanDisciplines.has(discipline.name)
                                    return (
                                        <OptionCard
                                            key={disciplineName}
                                            variant="discipline"
                                            {...disciplineNav.optionProps(index)}
                                        >
                                            <span className={selectModalClasses.disciplineLogo}>
                                                {discipline.logo ? (
                                                    <img src={discipline.logo} alt="" />
                                                ) : null}
                                            </span>
                                            <span className={selectModalClasses.disciplineText}>
                                                <OptionHead
                                                    display
                                                    name={upcase(discipline.name)}
                                                    tags={
                                                        <>
                                                            {isClan ? (
                                                                <Tag tone="accent">Clan</Tag>
                                                            ) : null}
                                                            {discipline.homebrewSource ? (
                                                                <HomebrewBadge
                                                                    source={
                                                                        discipline.homebrewSource
                                                                    }
                                                                />
                                                            ) : null}
                                                        </>
                                                    }
                                                />
                                                <Summary>{discipline.summary}</Summary>
                                            </span>
                                        </OptionCard>
                                    )
                                })}
                            </div>
                        )}
                    </SelectScroll>
                    <SelectFooter
                        end={
                            <Button
                                variant="default"
                                leftSection={<IconPlus size={16} />}
                                onClick={() => {
                                    setCustomDisciplineModalOpened(true)
                                }}
                            >
                                Create Custom Discipline
                            </Button>
                        }
                    />
                </>
            ) : null}
            <CustomDisciplineModal
                opened={customDisciplineModalOpened}
                onClose={() => {
                    setCustomDisciplineModalOpened(false)
                }}
                options={options}
                editingDisciplineName={null}
                onSave={() => {
                    setCustomDisciplineModalOpened(false)
                    onClose()
                }}
            />
            <CustomPowerModal
                opened={customPowerModalOpened}
                onClose={() => setCustomPowerModalOpened(false)}
                onSave={handleCustomPowerSaved}
                options={options}
                disciplineName={
                    selectedDiscipline
                        ? (disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline)
                        : ""
                }
                disciplineHomebrewSource={
                    selectedDiscipline
                        ? disciplineCatalog[selectedDiscipline]?.homebrewSource
                        : undefined
                }
            />
        </SheetModal>
    )
}

type PowerPickerProps = {
    availablePowers: Power[]
    onSelectPower: (power: Power) => void
    onBack: () => void
    onCreateCustomPower: () => void
    hideBackButton?: boolean
    character: Character
    getPowerDisabledReasons: (power: Power) => string[]
    getPowerXpCost: (power: Power) => number | null
    onBlockedPick: (power: Power, reason: string) => void
    query: string
    onQueryChange: (query: string) => void
}

const PowerPicker = ({
    availablePowers,
    onSelectPower,
    onBack,
    onCreateCustomPower,
    hideBackButton,
    character,
    getPowerDisabledReasons,
    getPowerXpCost,
    onBlockedPick,
    query,
    onQueryChange
}: PowerPickerProps) => {
    const visiblePowers = availablePowers
        .filter((power) => matchesQuery(query, power.name, power.summary))
        .sort((a, b) => a.level - b.level)

    const powersByLevel = new Map<number, Array<{ power: Power; index: number }>>()
    visiblePowers.forEach((power, index) => {
        if (!powersByLevel.has(power.level)) powersByLevel.set(power.level, [])
        powersByLevel.get(power.level)!.push({ power, index })
    })
    const sortedLevels = Array.from(powersByLevel.keys()).sort((a, b) => a - b)

    const pick = (power: Power) => {
        const disabledTooltip = getPowerDisabledReasons(power).join(" · ") || null
        if (disabledTooltip !== null) onBlockedPick(power, disabledTooltip)
        else onSelectPower(power)
    }

    const nav = useListNav({ items: visiblePowers, onPick: pick, resetKey: query })

    return (
        <>
            <SelectToolbar>
                <SearchField
                    label="Search powers"
                    placeholder="Search powers"
                    value={query}
                    onChange={onQueryChange}
                    nav={nav}
                />
            </SelectToolbar>
            <SelectScroll listId={nav.listId} label="Powers">
                {availablePowers.length === 0 ? (
                    <SelectEmpty>No available powers to add for this discipline.</SelectEmpty>
                ) : visiblePowers.length === 0 ? (
                    <SelectEmpty>No power matches “{query.trim()}”.</SelectEmpty>
                ) : (
                    sortedLevels.map((level) => (
                        <OptionGroup key={level} label={`Level ${level}`}>
                            <div className={selectModalClasses.grid}>
                                {powersByLevel.get(level)!.map(({ power, index }) => {
                                    const disabledReasons = getPowerDisabledReasons(power)
                                    const disabled = disabledReasons.length > 0
                                    const xpCost = getPowerXpCost(power)
                                    const poolValues =
                                        power.dicePool && power.dicePool !== "-"
                                            ? calculateDicePoolValues(power.dicePool, character)
                                            : null
                                    return (
                                        <OptionCard
                                            key={getPowerIdentity(power)}
                                            disabled={disabled}
                                            {...nav.optionProps(index)}
                                        >
                                            <OptionHead
                                                name={power.name}
                                                tags={
                                                    <>
                                                        {power.homebrewSource ? (
                                                            <HomebrewBadge
                                                                source={power.homebrewSource}
                                                            />
                                                        ) : null}
                                                        {xpCost !== null ? (
                                                            <Tag tone="accent">{xpCost} XP</Tag>
                                                        ) : null}
                                                        <LevelTag level={power.level} />
                                                    </>
                                                }
                                            />
                                            <Summary>{power.summary}</Summary>
                                            <MetaRows
                                                rows={[
                                                    power.dicePool && power.dicePool !== "-"
                                                        ? [
                                                              "Pool",
                                                              <span
                                                                  key="pool"
                                                                  className={
                                                                      selectModalClasses.pool
                                                                  }
                                                                  title={poolValues ?? undefined}
                                                              >
                                                                  {power.dicePool}
                                                              </span>
                                                          ]
                                                        : null,
                                                    [
                                                        "Rouse",
                                                        power.rouseChecks > 0 ? (
                                                            <RouseDrops n={power.rouseChecks} />
                                                        ) : (
                                                            "Free"
                                                        )
                                                    ],
                                                    power.requiredTime
                                                        ? ["Time", power.requiredTime]
                                                        : null,
                                                    power.ingredients
                                                        ? ["Needs", power.ingredients]
                                                        : null
                                                ]}
                                            />
                                            {disabled ? (
                                                <DisabledLine>
                                                    {disabledReasons.join(" · ")}
                                                </DisabledLine>
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
                start={
                    !hideBackButton ? (
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={onBack}
                        >
                            Back
                        </Button>
                    ) : undefined
                }
                end={
                    <Button
                        variant="default"
                        leftSection={<IconPlus size={16} />}
                        onClick={onCreateCustomPower}
                    >
                        Create Custom Power
                    </Button>
                }
            />
        </>
    )
}

export default DisciplineSelectModal
