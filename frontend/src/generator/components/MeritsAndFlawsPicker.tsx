import {
    Button,
    CloseButton,
    ScrollArea,
    SegmentedControl,
    Tabs,
    TextInput,
    Tooltip,
    VisuallyHidden
} from "@mantine/core"
import {
    IconBolt,
    IconBrain,
    IconCoin,
    IconCrown,
    IconDots,
    IconDroplet,
    IconDropletHalf2,
    IconFeather,
    IconFlame,
    IconHome,
    IconHourglass,
    IconLanguage,
    IconLink,
    IconMask,
    IconMoon,
    IconRotate,
    IconScale,
    IconScript,
    IconSearch,
    IconSparkles,
    IconStar,
    IconUsers,
    IconX,
    type Icon
} from "@tabler/icons-react"
import { Dispatch, memo, SetStateAction, useEffect, useMemo, useRef, useState } from "react"
import { trackEvent } from "../../utils/analytics"
import { Character, getCharacterExcludedMeritsAndFlaws, MeritFlaw } from "../../data/Character"
import {
    addMeritFlawExclusions,
    getMeritFlawPointCost,
    getPredatorTypeMeritsByName,
    isMeritFlawCoveredByPredatorTypeGrant
} from "../../data/meritsAndFlawsResolution"
import {
    advancedMeritsAndFlaws,
    advancedThinbloodMeritsAndFlaws,
    essentialMeritsAndFlaws,
    essentialThinbloodMeritsAndFlaws,
    isThinbloodFlaw,
    isThinbloodMerit,
    MeritOrFlaw
} from "../../data/MeritsAndFlaws"
import { getCharacterPredatorType } from "~/data/predatorTypeOptions"
import { globals } from "../../globals"
import { Loresheets } from "./Loresheets"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { GeneratorConfirmButton, GeneratorStepFooter, GeneratorStepHero } from "./sharedGeneratorUi"
import { useProgressiveRendering } from "./useProgressiveRendering"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewMeritFlaw, HomebrewSource } from "~/data/Homebrew"
import { getHomebrewSource, getMeritFlawIdentity } from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { IconButton } from "~/components/ui"
import { Dots } from "./generatorCardParts"
import classes from "./generatorCards.module.css"

type MeritsAndFlawsPickerProps = {
    character: Character
    setCharacter: SetCharacter
    nextStep: () => void
}

type ResetTarget = "merit" | "flaw" | null

const matchesMeritFlawSearch = (
    meritOrFlaw: MeritOrFlaw,
    category: string,
    normalizedQuery: string
) =>
    !normalizedQuery ||
    category.toLowerCase().includes(normalizedQuery) ||
    meritOrFlaw.name.toLowerCase().includes(normalizedQuery) ||
    meritOrFlaw.summary.toLowerCase().includes(normalizedQuery)

type TypeFilter = "all" | "merit" | "flaw"

// Category titles in the data carry emoji prefixes ("💄 Looks"). Show the plain name with a
// consistent line icon instead; search still matches the full title.
const getCategoryName = (title: string) => title.replace(/^[^\p{L}\p{N}]+/u, "").trim() || title

const categoryIcons: Record<string, Icon> = {
    looks: IconSparkles,
    haven: IconHome,
    resources: IconCoin,
    feeding: IconDroplet,
    "keeping up with the times": IconHourglass,
    mythic: IconMoon,
    mask: IconMask,
    linguistics: IconLanguage,
    kindred: IconCrown,
    bonding: IconLink,
    mortals: IconUsers,
    fame: IconStar,
    cult: IconFlame,
    influence: IconBolt,
    "boons and debts": IconScale,
    mental: IconBrain,
    other: IconDots,
    homebrew: IconFeather
}

const CategoryHeading = ({ title }: { title: string }) => {
    const name = getCategoryName(title)
    const lowered = name.toLowerCase()
    const CategoryIcon = lowered.startsWith("thin-blood")
        ? IconDropletHalf2
        : (categoryIcons[lowered] ?? IconScript)

    // The label is drawn from `data-label` so the heading's DOM text never collides with an
    // item of the same name ("Haven" the category vs "Haven" the merit) in text lookups.
    return (
        <h3 className={classes.categoryHead} aria-label={name}>
            <CategoryIcon size={16} stroke={1.6} aria-hidden />
            <span className={classes.categoryName} data-label={name} aria-hidden="true" />
        </h3>
    )
}

type MeritOrFlawCardProps = {
    meritOrFlaw: MeritOrFlaw & { homebrewSource?: HomebrewSource; text?: string }
    type: "flaw" | "merit"
    pickedByIdentity: Map<string, MeritFlaw>
    exclusionMap: Map<string, string[]>
    predatorTypeMeritsByName: Map<string, MeritFlaw>
    remainingMerits: number
    remainingFlaws: number
    remainingThinbloodMeritPoints: number
    phoneScreen: boolean
    setPickedMeritsAndFlaws: Dispatch<SetStateAction<MeritFlaw[]>>
    setRemainingMerits: Dispatch<SetStateAction<number>>
    setRemainingFlaws: Dispatch<SetStateAction<number>>
    setRemainingThinbloodMeritPoints: Dispatch<SetStateAction<number>>
}

const MeritOrFlawCard = memo(
    ({
        meritOrFlaw,
        type,
        pickedByIdentity,
        exclusionMap,
        predatorTypeMeritsByName,
        remainingMerits,
        remainingFlaws,
        remainingThinbloodMeritPoints,
        setPickedMeritsAndFlaws,
        setRemainingMerits,
        setRemainingFlaws,
        setRemainingThinbloodMeritPoints
    }: MeritOrFlawCardProps) => {
        const [attemptedUnaffordableLevel, setAttemptedUnaffordableLevel] = useState<number | null>(
            null
        )
        const buttonColor = type === "flaw" ? "red" : "teal"
        const meritFlawIdentity = getMeritFlawIdentity(meritOrFlaw, type)
        const lineKey = meritFlawIdentity

        const alreadyPickedItem = pickedByIdentity.get(meritFlawIdentity)
        const wasPickedLevel = alreadyPickedItem?.level ?? 0
        const excludingItems = exclusionMap.get(meritOrFlaw.name) ?? []
        const isExcluded = excludingItems.length > 0

        const meritInPredatorType = meritOrFlaw.homebrewSource
            ? undefined
            : predatorTypeMeritsByName.get(meritOrFlaw.name)
        const meritInPredatorTypeLevel = meritInPredatorType?.level ?? 0
        const isPicked = Boolean(alreadyPickedItem ?? meritInPredatorType)

        // Persistent per-card cost/budget indicator, so the affordability rule is
        // visible on the page instead of hidden behind a hover tooltip. `cost` is the
        // points already reserved by the current pick and is refunded when re-picking,
        // so it is added back into the budget the buttons are checked against.
        const isFlaw = type === "flaw"
        const isTbMerit = isThinbloodMerit(meritOrFlaw.name)
        const isTbFlaw = isThinbloodFlaw(meritOrFlaw.name)
        const pointTypeLabel = isTbMerit
            ? "thin-blood merit points"
            : isFlaw
              ? "flaw points"
              : "advantage points"
        const createButton = (level: number) => {
            const nextCost = Math.max(0, level - meritInPredatorTypeLevel)
            const previousCost = Math.max(0, wasPickedLevel - meritInPredatorTypeLevel)
            const availablePoints = isThinbloodMerit(meritOrFlaw.name)
                ? remainingThinbloodMeritPoints + previousCost
                : type === "flaw"
                  ? remainingFlaws + previousCost
                  : remainingMerits + previousCost
            const hasEnoughPoints = isThinbloodFlaw(meritOrFlaw.name) || availablePoints >= nextCost
            const isUnavailable =
                isExcluded ||
                (meritInPredatorType && meritInPredatorType.level >= level) ||
                wasPickedLevel === level

            const isActiveLevel =
                alreadyPickedItem?.level === level || meritInPredatorType?.level === level
            const button = (
                <Button
                    key={meritOrFlaw.name + level}
                    disabled={isUnavailable}
                    aria-disabled={!hasEnoughPoints || undefined}
                    data-active={isActiveLevel || undefined}
                    className={classes.levelButton}
                    onClick={() => {
                        if (!hasEnoughPoints) {
                            setAttemptedUnaffordableLevel(level)
                            return
                        }

                        setAttemptedUnaffordableLevel(null)
                        if (isThinbloodFlaw(meritOrFlaw.name)) {
                            setRemainingThinbloodMeritPoints((prev) => prev + 1)
                        } else if (isThinbloodMerit(meritOrFlaw.name)) {
                            setRemainingThinbloodMeritPoints((prev) => prev - 1)
                        } else if (type === "flaw") {
                            setRemainingFlaws((prev) => prev + previousCost - nextCost)
                        } else {
                            setRemainingMerits((prev) => prev + previousCost - nextCost)
                        }
                        setPickedMeritsAndFlaws((prev) => [
                            ...prev.filter(
                                (item) =>
                                    getMeritFlawIdentity(item, item.type) !== meritFlawIdentity
                            ),
                            {
                                name: meritOrFlaw.name,
                                level,
                                type,
                                summary: meritOrFlaw.summary,
                                excludes: meritOrFlaw.excludes,
                                text: meritOrFlaw.text,
                                homebrewSource: meritOrFlaw.homebrewSource
                            }
                        ])
                        trackEvent({
                            action: "merits pick clicked",
                            category: "merits",
                            label: `${meritOrFlaw.name}: ${level} (${type})`,
                            value: level
                        })
                    }}
                    size="xs"
                    variant="outline"
                    color={buttonColor}
                >
                    <span className={classes.levelDots} aria-hidden="true">
                        {Array.from({ length: Math.min(level, 6) }, (_, index) => (
                            <span key={index} />
                        ))}
                    </span>
                    <VisuallyHidden>{level}</VisuallyHidden>
                </Button>
            )

            if (!hasEnoughPoints && !isUnavailable) {
                return (
                    <Tooltip
                        key={meritOrFlaw.name + level}
                        label={`Not enough ${pointTypeLabel} for ${level} dot${level === 1 ? "" : "s"}`}
                    >
                        {button}
                    </Tooltip>
                )
            }

            return button
        }

        const cost = Math.max(0, wasPickedLevel - meritInPredatorTypeLevel)
        const summaryText = meritInPredatorType
            ? "Already picked in Predator Type"
            : isExcluded
              ? `Excluded by: ${excludingItems.join(", ")}`
              : meritOrFlaw.summary

        const availableForCard = isTbMerit
            ? remainingThinbloodMeritPoints + cost
            : isFlaw
              ? remainingFlaws + cost
              : remainingMerits + cost
        const levelCosts = meritOrFlaw.cost.map((l) => Math.max(0, l - meritInPredatorTypeLevel))
        const minLevelCost = Math.min(...levelCosts)
        const maxLevelCost = Math.max(...levelCosts)
        const costLabel =
            minLevelCost === maxLevelCost
                ? `${minLevelCost} pt${minLevelCost === 1 ? "" : "s"}`
                : `${minLevelCost}–${maxLevelCost} pts`
        const attemptedCost =
            attemptedUnaffordableLevel === null
                ? null
                : Math.max(0, attemptedUnaffordableLevel - meritInPredatorTypeLevel)
        const showAffordabilityWarning =
            attemptedCost !== null && !isTbFlaw && availableForCard < attemptedCost
        // Thin-blood flaws grant points rather than cost them, and fully
        // predator-covered / excluded items have nothing to spend, so skip the caption.
        const showCostCaption =
            !isTbFlaw &&
            !isExcluded &&
            !(meritInPredatorType && meritInPredatorType.level >= maxLevelCost)

        const textContent = (
            <div
                key={lineKey}
                className={classes.merit}
                data-type={type}
                data-picked={isPicked || undefined}
                data-excluded={isExcluded || undefined}
            >
                <div className={classes.meritHead}>
                    <span className={classes.meritName}>{meritOrFlaw.name}</span>
                    {meritOrFlaw.homebrewSource ? (
                        <HomebrewBadge source={meritOrFlaw.homebrewSource} />
                    ) : null}
                    <span className={classes.meritKind}>{type}</span>
                </div>

                <p
                    className={classes.meritSummary}
                    data-note={meritInPredatorType ? "predator" : undefined}
                >
                    {summaryText}
                </p>

                <div className={classes.meritActions}>
                    {meritOrFlaw.cost.map((i) => createButton(i))}
                    {alreadyPickedItem ? (
                        <Button
                            onClick={() => {
                                setPickedMeritsAndFlaws((prev) =>
                                    prev.filter(
                                        (item) =>
                                            getMeritFlawIdentity(item, item.type) !==
                                            meritFlawIdentity
                                    )
                                )
                                if (isThinbloodFlaw(meritOrFlaw.name)) {
                                    setRemainingThinbloodMeritPoints((prev) => prev - 1)
                                } else if (isThinbloodMerit(meritOrFlaw.name)) {
                                    setRemainingThinbloodMeritPoints((prev) => prev + 1)
                                } else if (type === "flaw") {
                                    setRemainingFlaws((prev) => prev + cost)
                                } else {
                                    setRemainingMerits((prev) => prev + cost)
                                }
                                trackEvent({
                                    action: "merits unpick clicked",
                                    category: "merits",
                                    label: `${meritOrFlaw.name}: ${wasPickedLevel} (${type})`,
                                    value: wasPickedLevel
                                })
                            }}
                            size="compact-xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconX size={12} stroke={2} />}
                        >
                            Unpick
                        </Button>
                    ) : null}
                </div>

                {showCostCaption ? (
                    <p className={classes.costCaption}>
                        {`Costs ${costLabel} · ${availableForCard} ${pointTypeLabel} left`}
                    </p>
                ) : null}
                {showAffordabilityWarning ? (
                    <p className={classes.reason}>
                        {`Not enough points — costs ${attemptedCost} pt${attemptedCost === 1 ? "" : "s"}, you have ${availableForCard} ${pointTypeLabel} left`}
                    </p>
                ) : null}
            </div>
        )

        if (isExcluded) {
            return (
                <Tooltip
                    key={lineKey}
                    label={`This ${type} is excluded because you already have: ${excludingItems.join(", ")}`}
                    multiline
                    maw={300}
                >
                    {textContent}
                </Tooltip>
            )
        }

        return textContent
    }
)

const MeritsAndFlawsPicker = ({ character, setCharacter, nextStep }: MeritsAndFlawsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const [showAllMerits, setShowAllMerits] = useState(false)
    const homebrewMerits = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewMeritFlaw & { id: string } =>
                    item.kind === "merit" || item.kind === "flaw"
            )
            .map((item) => ({
                item: {
                    name: item.name,
                    cost: item.costs,
                    summary: item.summary || item.description,
                    excludes: item.excludes,
                    homebrewSource: getHomebrewSource(item, collection)
                },
                type: item.kind
            }))
    )
    const meritFlawCategories = useMemo(
        () => [
            ...essentialMeritsAndFlaws,
            ...(showAllMerits ? advancedMeritsAndFlaws : []),
            ...(homebrewMerits.length
                ? [
                      {
                          title: "Homebrew",
                          merits: homebrewMerits
                              .filter(({ type }) => type === "merit")
                              .map(({ item }) => item),
                          flaws: homebrewMerits
                              .filter(({ type }) => type === "flaw")
                              .map(({ item }) => item)
                      }
                  ]
                : [])
        ],
        [homebrewMerits, showAllMerits]
    )

    const [activeTab, setActiveTab] = useState<string | null>("merits")
    const [resetTarget, setResetTarget] = useState<ResetTarget>(null)
    const [meritFlawQuery, setMeritFlawQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
    const normalizedMeritFlawQuery = meritFlawQuery.trim().toLowerCase()
    const filteredMeritFlawCategories = useMemo(() => {
        if (!normalizedMeritFlawQuery && typeFilter === "all") return meritFlawCategories

        return meritFlawCategories.flatMap((category) => {
            const itemMatches = (item: MeritOrFlaw) =>
                matchesMeritFlawSearch(item, category.title, normalizedMeritFlawQuery)
            const merits = typeFilter === "flaw" ? [] : category.merits.filter(itemMatches)
            const flaws = typeFilter === "merit" ? [] : category.flaws.filter(itemMatches)

            return merits.length || flaws.length ? [{ ...category, merits, flaws }] : []
        })
    }, [meritFlawCategories, normalizedMeritFlawQuery, typeFilter])
    const { visibleCount: visibleCategoryCount, sentinelRef: categorySentinelRef } =
        useProgressiveRendering(filteredMeritFlawCategories.length, 4, 2)

    const [pickedMeritsAndFlaws, setPickedMeritsAndFlaws] = useState<MeritFlaw[]>([
        ...character.merits,
        ...character.flaws
    ])
    const persistedSelection = useRef(pickedMeritsAndFlaws)

    // A merits pick used to remain only in this component until Confirm. Persisting each edit
    // means the draft survives sidebar navigation while the explicit Confirm button still
    // represents advancing to the next generator step.
    useEffect(() => {
        if (persistedSelection.current === pickedMeritsAndFlaws) return
        persistedSelection.current = pickedMeritsAndFlaws

        setCharacter((current) => ({
            ...current,
            merits: pickedMeritsAndFlaws.filter((item) => item.type === "merit"),
            flaws: pickedMeritsAndFlaws.filter((item) => item.type === "flaw")
        }))
    }, [pickedMeritsAndFlaws, setCharacter])

    const predatorTypeMeritsByName = useMemo(
        () => getPredatorTypeMeritsByName(character),
        [character]
    )

    const usedMeritsLevel = character.merits
        .filter((m) => !isThinbloodMerit(m.name))
        .reduce((acc, merit) => acc + getMeritFlawPointCost(merit, predatorTypeMeritsByName), 0)
    const usedFLawsLevel = character.flaws
        .filter((f) => !isThinbloodFlaw(f.name))
        .reduce((acc, flaw) => acc + getMeritFlawPointCost(flaw, predatorTypeMeritsByName), 0)

    const meritPoints = character.generation === 10 || character.generation === 11 ? 9 : 7
    const flawPoints = character.generation === 10 || character.generation === 11 ? 4 : 2

    const [remainingMerits, setRemainingMerits] = useState(meritPoints - usedMeritsLevel)
    const [remainingFlaws, setRemainingFlaws] = useState(flawPoints - usedFLawsLevel)

    const isThinBlood = character.clan === "Thin-blood"
    const thinbloodMeritFlawCatalog = showAllMerits
        ? {
              merits: [
                  ...essentialThinbloodMeritsAndFlaws.merits,
                  ...advancedThinbloodMeritsAndFlaws.merits
              ],
              flaws: [
                  ...essentialThinbloodMeritsAndFlaws.flaws,
                  ...advancedThinbloodMeritsAndFlaws.flaws
              ]
          }
        : essentialThinbloodMeritsAndFlaws
    const filteredThinbloodMerits =
        typeFilter === "flaw"
            ? []
            : thinbloodMeritFlawCatalog.merits.filter((merit) =>
                  matchesMeritFlawSearch(merit, "Thin-blood merits", normalizedMeritFlawQuery)
              )
    const filteredThinbloodFlaws =
        typeFilter === "merit"
            ? []
            : thinbloodMeritFlawCatalog.flaws.filter((flaw) =>
                  matchesMeritFlawSearch(flaw, "Thin-blood flaws", normalizedMeritFlawQuery)
              )
    const hasSearchResults =
        filteredMeritFlawCategories.length > 0 ||
        (isThinBlood && (filteredThinbloodMerits.length > 0 || filteredThinbloodFlaws.length > 0))
    const showEveryFilteredCategory =
        showAllMerits || normalizedMeritFlawQuery.length > 0 || typeFilter !== "all"
    const displayedCategoryCount = showEveryFilteredCategory
        ? filteredMeritFlawCategories.length
        : visibleCategoryCount
    const tbMeritCount = character.merits.filter((m) => isThinbloodMerit(m.name)).length
    const tbFlawCount = character.flaws.filter((f) => isThinbloodFlaw(f.name)).length
    const [remainingThinbloodMeritPoints, setRemainingThinbloodMeritPoints] = useState(
        tbFlawCount - tbMeritCount
    )

    const pickedByIdentity = useMemo(
        () =>
            new Map(
                pickedMeritsAndFlaws.map((item) => [getMeritFlawIdentity(item, item.type), item])
            ),
        [pickedMeritsAndFlaws]
    )

    const exclusionMap = useMemo(() => {
        const map = new Map<string, string[]>()
        pickedMeritsAndFlaws.forEach((meritFlaw) => {
            addMeritFlawExclusions(
                map,
                meritFlaw,
                isMeritFlawCoveredByPredatorTypeGrant(meritFlaw, predatorTypeMeritsByName)
            )
        })
        const predatorType = getCharacterPredatorType(character)
        const predatorTypeItems = [
            ...(predatorType?.meritsAndFlaws ?? []),
            ...character.predatorType.pickedMeritsAndFlaws
        ]
        predatorTypeItems.forEach((meritFlaw) => {
            addMeritFlawExclusions(map, meritFlaw, true)
        })
        const clanExclusions = getCharacterExcludedMeritsAndFlaws(character)
        if (clanExclusions.length > 0) {
            clanExclusions.forEach((excludedName) => {
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
        pickedMeritsAndFlaws,
        character.predatorType.name,
        character.predatorType.pickedMeritsAndFlaws,
        character.clan,
        character.homebrewClan
    ])

    const cardProps: Omit<MeritOrFlawCardProps, "meritOrFlaw" | "type"> = {
        pickedByIdentity,
        exclusionMap,
        predatorTypeMeritsByName,
        remainingMerits,
        remainingFlaws,
        remainingThinbloodMeritPoints,
        phoneScreen,
        setPickedMeritsAndFlaws,
        setRemainingMerits,
        setRemainingFlaws,
        setRemainingThinbloodMeritPoints
    }

    const getMeritOrFlawLine = (
        meritOrFlaw: MeritOrFlaw & { homebrewSource?: HomebrewSource; text?: string },
        type: "flaw" | "merit"
    ): React.JSX.Element => (
        <MeritOrFlawCard
            key={getMeritFlawIdentity(meritOrFlaw, type)}
            meritOrFlaw={meritOrFlaw}
            type={type}
            {...cardProps}
        />
    )

    const isConfirmDisabled = isThinBlood && remainingThinbloodMeritPoints < 0
    const handleReset = () => {
        if (resetTarget) {
            trackEvent({
                action: "merits reset confirmed",
                category: "merits",
                label: resetTarget
            })
        }

        if (resetTarget === "merit") {
            const nextPickedMeritsAndFlaws = pickedMeritsAndFlaws.filter(
                (item) => item.type !== "merit"
            )
            setPickedMeritsAndFlaws(nextPickedMeritsAndFlaws)
            setRemainingMerits(meritPoints)
            setRemainingThinbloodMeritPoints(tbFlawCount)
            setCharacter({
                ...character,
                merits: [],
                flaws: nextPickedMeritsAndFlaws.filter((item) => item.type === "flaw")
            })
        }

        if (resetTarget === "flaw") {
            const nextPickedMeritsAndFlaws = pickedMeritsAndFlaws.filter(
                (item) => item.type !== "flaw"
            )
            setPickedMeritsAndFlaws(nextPickedMeritsAndFlaws)
            setRemainingFlaws(flawPoints)
            setRemainingThinbloodMeritPoints(-tbMeritCount)
            setCharacter({
                ...character,
                merits: nextPickedMeritsAndFlaws.filter((item) => item.type === "merit"),
                flaws: []
            })
        }

        setResetTarget(null)
    }

    const filtersActive = normalizedMeritFlawQuery.length > 0 || typeFilter !== "all"
    const pickedMeritCount = pickedMeritsAndFlaws.filter((item) => item.type === "merit").length
    const pickedFlawCount = pickedMeritsAndFlaws.length - pickedMeritCount
    const pickedSummary =
        pickedMeritsAndFlaws.length === 0
            ? "Nothing picked yet"
            : [
                  pickedMeritCount
                      ? `${pickedMeritCount} merit${pickedMeritCount === 1 ? "" : "s"}`
                      : null,
                  pickedFlawCount
                      ? `${pickedFlawCount} flaw${pickedFlawCount === 1 ? "" : "s"}`
                      : null
              ]
                  .filter(Boolean)
                  .join(" · ") + " picked"

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={phoneScreen ? 12 : 20}
                pt={4}
                pb={8}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    <GeneratorStepHero
                        leadText="Shape your"
                        accentText="Merits & Flaws"
                        description="Define what empowers you, what complicates your unlife, and which loresheets still fit your story."
                        maxWidth={720}
                        marginBottom={phoneScreen ? 14 : 20}
                    />

                    <div className={classes.ledger} aria-label="Point budget" role="group">
                        <Budget
                            label="Advantage Points"
                            remaining={remainingMerits}
                            total={meritPoints}
                            tone="merit"
                            onReset={() => setResetTarget("merit")}
                        />
                        <span className={classes.budgetDivider} aria-hidden="true" />
                        <Budget
                            label="Flaw Points"
                            remaining={remainingFlaws}
                            total={flawPoints}
                            tone="flaw"
                            onReset={() => setResetTarget("flaw")}
                        />
                        {isThinBlood ? (
                            <>
                                <span className={classes.budgetDivider} aria-hidden="true" />
                                <Budget
                                    label="Thin-blood Balance"
                                    remaining={remainingThinbloodMeritPoints}
                                    tone={remainingThinbloodMeritPoints < 0 ? "warning" : "neutral"}
                                    hint="Gain merit points by taking thin-blood flaws."
                                />
                            </>
                        ) : null}
                        <span className={classes.ledgerSummary}>{pickedSummary}</span>
                    </div>

                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        keepMounted={false}
                        mt="lg"
                        classNames={{ panel: classes.tabPanel }}
                    >
                        <Tabs.List>
                            <Tabs.Tab value="merits">Merits & Flaws</Tabs.Tab>
                            <Tabs.Tab value="loresheets">Loresheets</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="merits">
                            <div className={classes.toolbar}>
                                <TextInput
                                    className={classes.toolbarSearch}
                                    aria-label="Search merits and flaws"
                                    placeholder="Search by title, description, or category"
                                    leftSection={<IconSearch size={16} stroke={1.7} />}
                                    rightSection={
                                        meritFlawQuery ? (
                                            <CloseButton
                                                size="sm"
                                                aria-label="Clear search"
                                                onClick={() => setMeritFlawQuery("")}
                                            />
                                        ) : null
                                    }
                                    value={meritFlawQuery}
                                    onChange={(event) =>
                                        setMeritFlawQuery(event.currentTarget.value)
                                    }
                                />
                                <SegmentedControl
                                    aria-label="Show merits, flaws or both"
                                    value={typeFilter}
                                    onChange={(value) => setTypeFilter(value as TypeFilter)}
                                    data={[
                                        { value: "all", label: "All" },
                                        { value: "merit", label: "Merits" },
                                        { value: "flaw", label: "Flaws" }
                                    ]}
                                />
                                <Button
                                    data-testid="toggle-all-merits-button"
                                    variant="default"
                                    onClick={() => setShowAllMerits((showingAll) => !showingAll)}
                                >
                                    {showAllMerits ? "Show essential merits" : "Show all merits"}
                                </Button>
                            </div>

                            {isThinBlood ? (
                                <div className={classes.thinBloodBanner}>
                                    <p className="pg-lore">
                                        Pick Thin-blood flaws to gain Thin-blood merit points
                                    </p>
                                    <p className="pg-eyebrow">
                                        Balance: {remainingThinbloodMeritPoints}
                                    </p>
                                </div>
                            ) : null}

                            {!hasSearchResults ? (
                                <div className={classes.empty}>
                                    <p className={classes.emptyText}>
                                        {meritFlawQuery.trim()
                                            ? `No ${typeFilter === "all" ? "merits or flaws" : `${typeFilter}s`} match “${meritFlawQuery.trim()}”.`
                                            : `No ${typeFilter}s to show.`}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        color="gray"
                                        size="compact-sm"
                                        leftSection={<IconRotate size={14} stroke={1.7} />}
                                        onClick={() => {
                                            setMeritFlawQuery("")
                                            setTypeFilter("all")
                                        }}
                                    >
                                        {filtersActive ? "Reset search" : "Show everything"}
                                    </Button>
                                </div>
                            ) : null}

                            <div className={classes.categoryGrid}>
                                {isThinBlood
                                    ? thinBloodMeritsAndFlawsComponent(
                                          getMeritOrFlawLine,
                                          filteredThinbloodMerits,
                                          filteredThinbloodFlaws
                                      )
                                    : null}

                                {filteredMeritFlawCategories
                                    .slice(0, displayedCategoryCount)
                                    .map((category) => (
                                        <section key={category.title} className={classes.category}>
                                            <CategoryHeading title={category.title} />
                                            {category.merits.map((merit) =>
                                                getMeritOrFlawLine(merit, "merit")
                                            )}
                                            {category.flaws.map((flaw) =>
                                                getMeritOrFlawLine(flaw, "flaw")
                                            )}
                                        </section>
                                    ))}
                            </div>
                            {!showEveryFilteredCategory &&
                            visibleCategoryCount < filteredMeritFlawCategories.length ? (
                                <div ref={categorySentinelRef} aria-hidden="true" />
                            ) : null}
                        </Tabs.Panel>

                        <Tabs.Panel value="loresheets">
                            <Loresheets
                                character={character}
                                getMeritOrFlawLine={getMeritOrFlawLine}
                                pickedMeritsAndFlaws={pickedMeritsAndFlaws}
                                homebrewCollections={homebrewCollections}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </ScrollArea>

            <GeneratorStepFooter>
                {isConfirmDisabled ? (
                    <p className={classes.reason}>Need to balance Thin-blood merit points</p>
                ) : null}
                <GeneratorConfirmButton
                    data-testid="merits-confirm-button"
                    disabled={isConfirmDisabled}
                    disabledReason={
                        isConfirmDisabled
                            ? "Take Thin-blood flaws until your Thin-blood balance is 0 or more"
                            : undefined
                    }
                    onClick={() => {
                        const pickedMeritsAndFlawsWithPointCost = pickedMeritsAndFlaws.filter(
                            (meritFlaw) =>
                                getMeritFlawPointCost(meritFlaw, predatorTypeMeritsByName) > 0
                        )
                        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                        setCharacter({
                            ...character,
                            merits: pickedMeritsAndFlawsWithPointCost.filter(
                                (l) => l.type === "merit"
                            ),
                            flaws: pickedMeritsAndFlawsWithPointCost.filter(
                                (l) => l.type === "flaw"
                            )
                        })

                        trackEvent({
                            action: "merits confirm clicked",
                            category: "merits",
                            label: pickedMeritsAndFlawsWithPointCost
                                .map((m) => `${m.name}: ${m.level}`)
                                .join(", ")
                        })

                        nextStep()
                    }}
                >
                    Confirm
                </GeneratorConfirmButton>
            </GeneratorStepFooter>

            <ConfirmActionModal
                opened={resetTarget !== null}
                onClose={() => setResetTarget(null)}
                onConfirm={handleReset}
                title={`Reset ${resetTarget === "merit" ? "Advantages" : "Flaws"}?`}
                body={`This will remove your picked ${resetTarget === "merit" ? "advantages" : "flaws"} from this step. Predator type picks are kept.`}
                confirmLabel="Reset"
            />
        </div>
    )
}

const Budget = ({
    label,
    remaining,
    total,
    tone,
    hint,
    onReset
}: {
    label: string
    remaining: number
    total?: number
    tone: "merit" | "flaw" | "warning" | "neutral"
    hint?: string
    onReset?: () => void
}) => {
    const content = (
        <div className={classes.budget} data-tone={tone}>
            <span className={classes.budgetLabel}>
                {label}
                {onReset ? (
                    <IconButton
                        size="sm"
                        label={`Reset ${label.toLowerCase()}`}
                        icon={<IconRotate size={13} stroke={1.8} />}
                        onClick={onReset}
                    />
                ) : null}
            </span>
            <span className={classes.budgetRow}>
                <span className={classes.budgetValue}>
                    {total === undefined ? remaining : `${remaining}/${total}`}
                </span>
                {total !== undefined ? (
                    <Dots filled={Math.max(0, remaining)} total={total} size="lg" />
                ) : null}
            </span>
        </div>
    )

    return hint ? (
        <Tooltip label={hint} multiline maw={240}>
            {content}
        </Tooltip>
    ) : (
        content
    )
}

function thinBloodMeritsAndFlawsComponent(
    getMeritOrFlawLine: (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => React.JSX.Element,
    merits: MeritOrFlaw[],
    flaws: MeritOrFlaw[]
) {
    const hasMerits = merits.length > 0
    const hasFlaws = flaws.length > 0

    if (!hasMerits && !hasFlaws) return null

    return (
        <>
            {hasMerits ? (
                <section className={classes.category}>
                    <CategoryHeading title="Thin-blood merits" />
                    {merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
                </section>
            ) : null}
            {hasFlaws ? (
                <section className={classes.category}>
                    <CategoryHeading title="Thin-blood flaws" />
                    {flaws.map((flaw) => getMeritOrFlawLine(flaw, "flaw"))}
                </section>
            ) : null}
        </>
    )
}

export default MeritsAndFlawsPicker
