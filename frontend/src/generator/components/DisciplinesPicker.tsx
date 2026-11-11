import { Accordion, Button, ScrollArea, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowBackUp,
    IconCheck,
    IconCircleCheck,
    IconLock,
    IconPlus,
    IconPoint
} from "@tabler/icons-react"
import { useState } from "react"
import { trackEvent } from "../../utils/analytics"
import {
    Character,
    containsBloodSorcery,
    decreaseDisciplineLevelForPower,
    increaseDisciplineLevelForPower
} from "../../data/Character"
import { canAccessOblivionCeremonies } from "../../data/Ceremonies"
import { Discipline, Power } from "../../data/Disciplines"
import { globals } from "../../globals"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { DisciplineName } from "~/data/NameSchemas"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import {
    GeneratorConfirmButton,
    GeneratorSectionDivider,
    GeneratorStepHero
} from "./sharedGeneratorUi"
import { getDisciplinePowerDisabledReasons } from "../disciplinePowerAvailability"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import {
    getHomebrewDisciplineOptions,
    getHomebrewSource,
    getPowerDisciplineIdentity,
    getPowerIdentity,
    type HomebrewDisciplineOption
} from "~/utils/homebrewOptions"
import type { HomebrewDiscipline } from "~/data/Homebrew"
import HomebrewBadge from "~/components/HomebrewBadge"
import alchemyLogo from "../../resources/Rombo_Disciplines/rombo_Alchemy.svg"
import { Dots } from "./generatorCardParts"
import classes from "./generatorCards.module.css"

type DisciplinesPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: (characterOverride?: Character) => void
    pickedPowers: Power[]
    setPickedPowers: (powers: Power[]) => void
    pickedPredatorTypePower: Power | undefined
    setPickedPredatorTypePower: (power: Power | undefined) => void
}

type PowerCardState = "available" | "picked" | "locked" | "elsewhere"

const accordionClassNames = {
    item: classes.tome,
    control: classes.tomeControl,
    icon: classes.tomeIcon,
    content: classes.tomeContent
}

const powerSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-")

const DisciplinesPicker = ({
    character,
    setCharacter,
    nextStep,
    pickedPowers,
    setPickedPowers,
    pickedPredatorTypePower,
    setPickedPredatorTypePower
}: DisciplinesPickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const [blockedPowerAttempts, setBlockedPowerAttempts] = useState<Set<string>>(() => new Set())
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)

    let allPickedPowers = pickedPredatorTypePower
        ? [...pickedPowers, pickedPredatorTypePower]
        : pickedPowers

    const disciplinesForClan = getHomebrewDisciplineOptions(
        homebrewCollections,
        character.homebrewClan?.nativeDisciplineRefs ?? character.availableDisciplineNames
    )
    const officialDisciplinesForClan = Object.entries(disciplinesForClan).filter(
        ([, discipline]) => !discipline.homebrewSource
    )
    const homebrewDisciplinesForClan = Object.entries(disciplinesForClan).filter(
        ([, discipline]) => discipline.homebrewSource
    )
    const homebrewDisciplineItems = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewDiscipline & { id: string } => item.kind === "discipline"
            )
            .map((item) => ({ item, collection }))
    )
    const hasPredatorType = character.predatorType.name !== ""
    const predatorReference = character.predatorType.pickedDisciplineRef ?? {
        type: "official" as const,
        name: character.predatorType.pickedDiscipline
    }
    const predatorTypeDiscipline = Object.values(
        getHomebrewDisciplineOptions(homebrewCollections, [
            { ...predatorReference, type: predatorReference.type ?? "official" }
        ])
    )[0]

    const isPicked = (power: Power) =>
        allPickedPowers.some(
            (pickedPower) => getPowerIdentity(pickedPower) === getPowerIdentity(power)
        )

    const missingAmalgamPrereq = (power: Power) => {
        for (const { discipline, level } of power.amalgamPrerequisites) {
            const pickedDisciplineLevel = allPickedPowers
                .map((p) => p.discipline)
                .filter((d) => d === discipline).length
            if (pickedDisciplineLevel < level) return true
        }
        return false
    }

    const allPowersPicked = () => pickedPowers.length >= 3
    const confirmReason = (() => {
        if (pickedPowers.length < 2) return "Pick two clan disciplines"
        if (!allPowersPicked()) return "Pick another clan discipline"
        if (hasPredatorType && !pickedPredatorTypePower) return "Pick predator type discipline"
        return undefined
    })()
    const confirmDisabled = Boolean(confirmReason)
    const getPickedPowerCountForDiscipline = (
        disciplineName: string,
        discipline: Discipline | HomebrewDisciplineOption,
        isPredatorType: boolean
    ) => {
        const powersForTab = isPredatorType
            ? pickedPredatorTypePower
                ? [pickedPredatorTypePower]
                : []
            : pickedPowers
        const disciplineIdentity =
            "homebrewSource" in discipline && discipline.homebrewSource
                ? `homebrew:${discipline.homebrewSource.collectionId}:${discipline.homebrewSource.itemId}`
                : `official:${"name" in discipline ? discipline.name : disciplineName}`
        return powersForTab.filter(
            (power) => getPowerDisciplineIdentity(power) === disciplineIdentity
        ).length
    }

    // Check prerequisites using an explicit set of picked powers (not the closure variable)
    const hasMissingPrerequisites = (
        power: Power,
        clanPowers: Power[],
        predPower: Power | undefined
    ): boolean => {
        const all = predPower ? [...clanPowers, predPower] : clanPowers
        const sameDisciplinePowers = all.filter(
            (candidate) =>
                getPowerDisciplineIdentity(candidate) === getPowerDisciplineIdentity(power)
        )
        if (sameDisciplinePowers.length < power.level - 1) return true
        for (const { discipline, level } of power.amalgamPrerequisites) {
            if (all.filter((p) => p.discipline === discipline).length < level) return true
        }
        return false
    }

    // Cascade: remove a power and iteratively drop any that now have missing prerequisites
    const cascadeRemove = (toRemove: Power, isForPredatorType: boolean) => {
        const beforeCount = pickedPowers.length + (pickedPredatorTypePower ? 1 : 0)
        let clanPowers = isForPredatorType
            ? pickedPowers
            : pickedPowers.filter((p) => getPowerIdentity(p) !== getPowerIdentity(toRemove))
        let predPower: Power | undefined = isForPredatorType ? undefined : pickedPredatorTypePower

        // Fixpoint: keep removing invalidated powers until stable
        let changed = true
        while (changed) {
            changed = false
            // Check predator type power
            if (predPower && hasMissingPrerequisites(predPower, clanPowers, undefined)) {
                predPower = undefined
                changed = true
            }
            // Check clan powers
            const next = clanPowers.filter((p) =>
                !hasMissingPrerequisites(
                    p,
                    clanPowers.filter((q) => getPowerIdentity(q) !== getPowerIdentity(p)),
                    predPower
                )
                    ? true
                    : ((changed = true), false)
            )
            if (next.length !== clanPowers.length) {
                clanPowers = next
                changed = true
            }
        }

        setPickedPowers(clanPowers)
        setPickedPredatorTypePower(predPower)

        // The undo/cascade path was previously unmeasured, yet take-then-undo churn
        // dominates this step. Track it, and count any dependent powers dropped alongside
        // the one the user actually clicked so the removal isn't silent.
        const afterCount = clanPowers.length + (predPower ? 1 : 0)
        const droppedDependents = beforeCount - afterCount - 1
        trackEvent({
            action: "power removed",
            category: "disciplines",
            label: toRemove.name,
            value: droppedDependents
        })
        if (droppedDependents > 0) {
            notifications.show({
                title: "Removed dependent powers",
                message: `Undoing ${toRemove.name} also dropped ${droppedDependents} power${
                    droppedDependents > 1 ? "s" : ""
                } that required it`,
                color: "red",
                autoClose: 3500
            })
        }
    }

    const renderPowerCard = (power: Power, isForPredatorType = false) => {
        const picked = isPicked(power)
        const takeDisabledReasons = getDisciplinePowerDisabledReasons({
            power,
            isForPredatorType,
            pickedClanPowers: pickedPowers,
            pickedPredatorTypePower
        })
        const takeDisabled = takeDisabledReasons.length > 0
        const isPickedAsPredatorType =
            !isForPredatorType &&
            pickedPredatorTypePower !== undefined &&
            getPowerIdentity(pickedPredatorTypePower) === getPowerIdentity(power)
        const isPickedAsClan =
            isForPredatorType &&
            pickedPowers.some((p) => getPowerIdentity(p) === getPowerIdentity(power))
        const showUndo = picked && !isPickedAsPredatorType && !isPickedAsClan
        const takeButtonKey = `${isForPredatorType ? "predator" : "clan"}-${getPowerIdentity(power)}`
        const showBlockedReasons = takeDisabled && blockedPowerAttempts.has(takeButtonKey)
        const state: PowerCardState = showUndo
            ? "picked"
            : picked
              ? "elsewhere"
              : takeDisabled
                ? "locked"
                : "available"
        const slug = powerSlug(power.name)

        const takeButton = (
            <Button
                data-testid={`take-power-${slug}-button`}
                aria-disabled={takeDisabled}
                data-disabled={takeDisabled || undefined}
                size="xs"
                variant="light"
                color="red"
                fullWidth
                leftSection={
                    takeDisabled ? (
                        <IconLock size={13} stroke={1.8} />
                    ) : (
                        <IconPlus size={13} stroke={2} />
                    )
                }
                onClick={(event) => {
                    if (takeDisabled) {
                        event.preventDefault()
                        setBlockedPowerAttempts((attempted) =>
                            new Set(attempted).add(takeButtonKey)
                        )
                        return
                    }

                    trackEvent({
                        action: "power clicked",
                        category: "disciplines",
                        label: power.name
                    })
                    if (isForPredatorType) setPickedPredatorTypePower(power)
                    else setPickedPowers([...pickedPowers, power])
                }}
            >
                Take
            </Button>
        )

        return (
            <div
                data-testid={`power-card-${slug}`}
                key={getPowerIdentity(power)}
                className={classes.power}
                data-state={state}
            >
                <div className={classes.powerHead}>
                    <span className={classes.powerName}>{power.name}</span>
                    {power.homebrewSource ? <HomebrewBadge source={power.homebrewSource} /> : null}
                    {state === "picked" ? (
                        <IconCircleCheck className={classes.powerGlyph} size={16} stroke={1.8} />
                    ) : state === "locked" ? (
                        <IconLock className={classes.powerGlyph} size={14} stroke={1.8} />
                    ) : null}
                </div>

                <p className={classes.powerSummary}>{upcase(power.summary)}</p>

                {power.amalgamPrerequisites.length > 0 ? (
                    <div className={classes.amalgam}>
                        <span className={classes.amalgamLabel}>Amalgam</span>
                        {power.amalgamPrerequisites.map((prereq) => {
                            const met = !missingAmalgamPrereq({
                                ...power,
                                amalgamPrerequisites: [prereq]
                            })
                            return (
                                <span
                                    key={power.name + prereq.discipline}
                                    className={classes.amalgamReq}
                                    data-met={met || undefined}
                                >
                                    {met ? (
                                        <IconCheck size={12} stroke={2.2} />
                                    ) : (
                                        <IconPoint size={12} />
                                    )}
                                    {upcase(prereq.discipline)} {prereq.level}
                                </span>
                            )
                        })}
                    </div>
                ) : null}

                <div className={classes.powerFooter}>
                    {state === "available" || state === "locked" ? (
                        takeDisabled ? (
                            <Tooltip
                                multiline
                                maw={260}
                                label={takeDisabledReasons.join(" · ")}
                                events={{ hover: true, focus: true, touch: false }}
                            >
                                {takeButton}
                            </Tooltip>
                        ) : (
                            takeButton
                        )
                    ) : null}
                    {state === "picked" ? (
                        <>
                            <span className={classes.powerStatus}>
                                <IconCheck size={13} stroke={2.2} />
                                Taken
                            </span>
                            <Button
                                size="compact-xs"
                                variant="subtle"
                                color="gray"
                                leftSection={<IconArrowBackUp size={13} stroke={1.8} />}
                                onClick={() => cascadeRemove(power, isForPredatorType)}
                            >
                                Undo
                            </Button>
                        </>
                    ) : null}
                    {isPickedAsClan ? (
                        <span className={classes.powerStatus}>Taken as clan power</span>
                    ) : null}
                    {isPickedAsPredatorType ? (
                        <span className={classes.powerStatus}>Taken as predator power</span>
                    ) : null}
                </div>

                {showBlockedReasons ? (
                    <div className={classes.blocked} data-testid={`take-power-${slug}-blocked`}>
                        {takeDisabledReasons.map((reason) => (
                            <p key={reason} className={classes.reason}>
                                <IconLock size={12} stroke={1.8} aria-hidden />
                                {reason}
                            </p>
                        ))}
                    </div>
                ) : null}
            </div>
        )
    }

    const renderDisciplineAccordionItem = (
        disciplineName: string,
        discipline: Discipline,
        isPredatorType = false
    ) => {
        const option = discipline as Partial<HomebrewDisciplineOption>
        const actualDisciplineName = option.name ?? disciplineName
        const disciplineLabel = option.label ?? actualDisciplineName
        const clanHasPrereqDisciplines = (power: Power) => {
            for (const disc of power.amalgamPrerequisites.map((p) => p.discipline)) {
                if (!Object.values(disciplinesForClan).some((candidate) => candidate.name === disc))
                    return false
            }
            return true
        }
        const clanHasDiscipline = (name: DisciplineName) =>
            Object.values(disciplinesForClan).some((candidate) => candidate.name === name)

        const eligiblePowers = discipline.powers.filter(clanHasPrereqDisciplines)
        const lvl1 = eligiblePowers.filter((p) => p.level === 1)
        const lvl2 = eligiblePowers.filter((p) => p.level === 2)
        const lvl3 = eligiblePowers.filter((p) => p.level === 3)

        // Level-3 powers are only reachable as the predator-type pick: a level-3 clan pick
        // needs two lower picks in the same discipline, which immediately trips the
        // 2-per-discipline clan cap. So only surface the level-3 column in the predator
        // accordion, and only when the clan actually has the discipline to fund the two
        // lower picks it requires.
        const canReachLvl3 =
            isPredatorType &&
            actualDisciplineName === character.predatorType.pickedDiscipline &&
            clanHasDiscipline(actualDisciplineName)

        const columnGroups = canReachLvl3 ? [lvl1, lvl2, lvl3] : [lvl1, lvl2]
        const pickedPowerCount = getPickedPowerCountForDiscipline(
            disciplineName,
            discipline,
            isPredatorType
        )
        const slotCount = isPredatorType ? 1 : 2

        return (
            <Accordion.Item
                key={disciplineName + isPredatorType}
                value={disciplineName + isPredatorType}
                data-has-picks={pickedPowerCount > 0 || undefined}
                data-predator={isPredatorType || undefined}
            >
                <Accordion.Control
                    data-testid={`discipline-${powerSlug(disciplineName)}-accordion`}
                    icon={
                        <span className={classes.sigil}>
                            <img src={discipline.logo} alt="" />
                        </span>
                    }
                >
                    <span className={classes.tomeLabel}>
                        <span className={classes.tomeText}>
                            <span className={classes.tomeName}>{upcase(disciplineLabel)}</span>
                            {discipline.summary && !phoneScreen ? (
                                <span className={classes.tomeSummary}>
                                    {upcase(discipline.summary)}
                                </span>
                            ) : null}
                        </span>
                        <span className={classes.tomeMeta}>
                            {pickedPowerCount > 0 ? `${pickedPowerCount} picked` : null}
                            <Dots filled={pickedPowerCount} total={slotCount} size="lg" />
                        </span>
                    </span>
                </Accordion.Control>
                <Accordion.Panel>
                    <div
                        className={classes.levels}
                        style={{ ["--cols" as string]: columnGroups.length }}
                    >
                        {columnGroups.map((powers, i) => (
                            <div key={i} className={classes.levelColumn}>
                                <p className={classes.levelHeading}>
                                    Level {i + 1}
                                    <Dots filled={i + 1} />
                                </p>
                                {powers.map((p) => renderPowerCard(p, isPredatorType))}
                            </div>
                        ))}
                    </div>
                </Accordion.Panel>
            </Accordion.Item>
        )
    }

    // Thin-blood
    if (character.clan === "Thin-blood") {
        return (
            <div style={generatorScrollableShellStyle}>
                <div
                    className={`${classes.thinBlood} ${classes.enter}`}
                    style={generatorScrollableAreaStyle}
                >
                    <img src={alchemyLogo} alt="" />
                    <h2 className={classes.thinBloodTitle}>No Disciplines to pick</h2>
                    <p className={classes.thinBloodText}>
                        Thin-bloods don&apos;t learn Disciplines here. You gain them from blood
                        resonance during play.
                    </p>
                    <GeneratorConfirmButton
                        onClick={() => {
                            trackEvent({
                                action: "power clicked",
                                category: "disciplines",
                                label: "thin-blood - no disciplines"
                            })
                            nextStep()
                        }}
                    >
                        Continue
                    </GeneratorConfirmButton>
                </div>
            </div>
        )
    }

    const clanPowersComplete = pickedPowers.length >= 3

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
                        leadText="Pick your"
                        accentText="Disciplines"
                        description={
                            hasPredatorType
                                ? `2 powers in one discipline · 1 in another · 1 from your predator type (${upcase(character.predatorType.pickedDiscipline)})`
                                : "2 powers in one discipline · 1 in another"
                        }
                        marginBottom={8}
                    />
                    <div className={classes.tally}>
                        <span
                            className={classes.tallyItem}
                            data-complete={clanPowersComplete || undefined}
                        >
                            <Dots filled={Math.min(pickedPowers.length, 3)} total={3} size="lg" />
                            <span>Clan powers {pickedPowers.length}/3</span>
                            <IconCheck className={classes.tallyCheck} size={14} stroke={2.2} />
                        </span>
                        {hasPredatorType && predatorTypeDiscipline ? (
                            <span
                                className={classes.tallyItem}
                                data-complete={pickedPredatorTypePower ? true : undefined}
                            >
                                <Dots
                                    filled={pickedPredatorTypePower ? 1 : 0}
                                    total={1}
                                    size="lg"
                                />
                                <span>Predator power {pickedPredatorTypePower ? 1 : 0}/1</span>
                                <IconCheck className={classes.tallyCheck} size={14} stroke={2.2} />
                            </span>
                        ) : null}
                    </div>

                    <div className={classes.stepBody} style={{ marginTop: phoneScreen ? 12 : 20 }}>
                        <GeneratorSectionDivider
                            label="Clan Disciplines"
                            lineHeight={1}
                            accentAlpha={0.38}
                            titleSize="0.88rem"
                            marginY="sm"
                        />

                        <Accordion
                            variant="separated"
                            transitionDuration={0}
                            classNames={accordionClassNames}
                            className={classes.tomes}
                        >
                            {officialDisciplinesForClan.map(([name, discipline]) =>
                                renderDisciplineAccordionItem(name, discipline)
                            )}
                        </Accordion>

                        {homebrewDisciplinesForClan.length > 0 ? (
                            <>
                                <GeneratorSectionDivider
                                    label="Homebrew"
                                    lineHeight={1}
                                    accentAlpha={0.38}
                                    titleSize="0.88rem"
                                    marginY="sm"
                                />
                                <Accordion
                                    variant="separated"
                                    transitionDuration={0}
                                    classNames={accordionClassNames}
                                    className={classes.tomes}
                                >
                                    {homebrewDisciplinesForClan.map(([name, discipline]) =>
                                        renderDisciplineAccordionItem(name, discipline)
                                    )}
                                </Accordion>
                            </>
                        ) : null}

                        {hasPredatorType && predatorTypeDiscipline ? (
                            <>
                                <GeneratorSectionDivider
                                    label={`Predator Type · ${upcase(character.predatorType.pickedDiscipline)}`}
                                    lineHeight={1}
                                    accentAlpha={0.38}
                                    titleSize="0.88rem"
                                    marginY="sm"
                                />

                                <Accordion
                                    variant="separated"
                                    transitionDuration={0}
                                    classNames={accordionClassNames}
                                    className={classes.tomes}
                                >
                                    {renderDisciplineAccordionItem(
                                        character.predatorType.pickedDiscipline,
                                        predatorTypeDiscipline,
                                        true
                                    )}
                                </Accordion>
                            </>
                        ) : null}

                        <div className={classes.confirmArea}>
                            {confirmReason ? (
                                <p
                                    data-testid="disciplines-confirm-reason"
                                    className={classes.confirmReason}
                                >
                                    <IconLock size={13} stroke={1.8} aria-hidden />
                                    {confirmReason}
                                </p>
                            ) : null}
                            <GeneratorConfirmButton
                                data-testid="disciplines-confirm-button"
                                disabled={confirmDisabled}
                                disabledReason={confirmReason}
                                onClick={() => {
                                    updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                                    const pickedDisciplineIdentities = new Set(
                                        allPickedPowers.map(getPowerDisciplineIdentity)
                                    )
                                    const existingPowerIdentities = new Set(
                                        character.disciplines.map(getPowerIdentity)
                                    )
                                    const pickedPowerIdentities = new Set(
                                        allPickedPowers.map(getPowerIdentity)
                                    )
                                    const addedPowers = allPickedPowers.filter(
                                        (power) =>
                                            !existingPowerIdentities.has(getPowerIdentity(power))
                                    )
                                    const removedPowers = character.disciplines.filter(
                                        (power) =>
                                            !pickedPowerIdentities.has(getPowerIdentity(power))
                                    )
                                    const remainingPowerCounts = allPickedPowers.reduce(
                                        (counts, power) => {
                                            const identity = getPowerDisciplineIdentity(power)
                                            counts.set(identity, (counts.get(identity) ?? 0) + 1)
                                            return counts
                                        },
                                        new Map<string, number>()
                                    )
                                    const disciplineLevels = removedPowers.reduce(
                                        (levels, power) =>
                                            decreaseDisciplineLevelForPower(
                                                { disciplineLevels: levels },
                                                power,
                                                remainingPowerCounts.get(
                                                    getPowerDisciplineIdentity(power)
                                                ) ?? 0
                                            ),
                                        addedPowers.reduce(
                                            (levels, power) =>
                                                increaseDisciplineLevelForPower(
                                                    { disciplineLevels: levels },
                                                    power
                                                ),
                                            character.disciplineLevels
                                        )
                                    )
                                    const retainedCustomDisciplines = Object.entries(
                                        character.customDisciplines
                                    ).filter(([, definition]) => !definition.homebrewSource)
                                    const pickedHomebrewDisciplines = homebrewDisciplineItems
                                        .map(({ item, collection }) => {
                                            const homebrewSource = getHomebrewSource(
                                                item,
                                                collection
                                            )
                                            const identity = `homebrew:${homebrewSource.collectionId}:${homebrewSource.itemId}`
                                            return [
                                                identity,
                                                {
                                                    name: item.name,
                                                    summary: item.summary,
                                                    logo: item.logo,
                                                    homebrewSource
                                                }
                                            ] as const
                                        })
                                        .filter(([identity]) =>
                                            pickedDisciplineIdentities.has(identity)
                                        )
                                    const updatedCharacter = {
                                        ...character,
                                        disciplines: allPickedPowers,
                                        disciplineLevels,
                                        customDisciplines: {
                                            ...Object.fromEntries(retainedCustomDisciplines),
                                            ...Object.fromEntries(pickedHomebrewDisciplines)
                                        },
                                        rituals: containsBloodSorcery(allPickedPowers)
                                            ? character.rituals
                                            : [],
                                        ceremonies: canAccessOblivionCeremonies({
                                            disciplineLevels,
                                            merits: character.merits
                                        })
                                            ? character.ceremonies
                                            : []
                                    }
                                    trackEvent({
                                        action: "disciplines confirm clicked",
                                        category: "disciplines",
                                        label: allPickedPowers
                                            .map(
                                                (pickedPower) =>
                                                    `${pickedPower.discipline}: ${pickedPower.name}`
                                            )
                                            .join(", ")
                                    })
                                    setCharacter(updatedCharacter)
                                    nextStep(updatedCharacter)
                                }}
                            >
                                Confirm
                            </GeneratorConfirmButton>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

export default DisciplinesPicker
