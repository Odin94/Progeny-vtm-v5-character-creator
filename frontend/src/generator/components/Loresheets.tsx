import { Button, CloseButton, TextInput } from "@mantine/core"
import { IconChevronLeft, IconChevronRight, IconCircleCheck, IconSearch } from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { essentialLoresheets, Loresheet, MeritOrFlaw } from "../../data/MeritsAndFlaws"
import { Character, MeritFlaw } from "../../data/Character"
import { intersection } from "../utils"
import { useProgressiveRendering } from "./useProgressiveRendering"
import { GeneratorSectionDivider } from "./sharedGeneratorUi"
import type { HomebrewCollection, HomebrewLoresheet, HomebrewSource } from "~/data/Homebrew"
import { getHomebrewSource } from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"
import { IconButton } from "~/components/ui"
import { useReducedMotion } from "framer-motion"
import { Dots } from "./generatorCardParts"
import classes from "./generatorCards.module.css"

type DisplayMerit = MeritOrFlaw & { homebrewSource?: HomebrewSource; text?: string }
type DisplayLoresheet = Omit<Loresheet, "merits"> & { merits: DisplayMerit[] }

type LoresheetProps = {
    character: Character
    getMeritOrFlawLine: (meritOrFlaw: DisplayMerit, type: "flaw" | "merit") => React.JSX.Element
    pickedMeritsAndFlaws: MeritFlaw[]
    homebrewCollections: HomebrewCollection[]
}

export const Loresheets = ({
    character,
    getMeritOrFlawLine,
    pickedMeritsAndFlaws,
    homebrewCollections
}: LoresheetProps) => {
    const [openLoresheetTitle, setOpenLoresheetTitle] = useState("")
    const [loresheetQuery, setLoresheetQuery] = useState("")
    const rootRef = useRef<HTMLDivElement>(null)
    const shouldReduceMotion = useReducedMotion()
    const availableLoresheets: DisplayLoresheet[] = [
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
    const openLoresheet = availableLoresheets.find((sheet) => sheet.title === openLoresheetTitle)
    const normalizedLoresheetQuery = loresheetQuery.trim().toLocaleLowerCase()

    const filteredLoresheets = useMemo(
        () =>
            availableLoresheets.filter((loresheet) => {
                const requirementsMet = loresheet.requirementFunctions.every((fun) =>
                    fun(character)
                )
                const titleMatches =
                    normalizedLoresheetQuery.length === 0 ||
                    loresheet.title.toLocaleLowerCase().includes(normalizedLoresheetQuery)

                return requirementsMet && titleMatches
            }),
        [availableLoresheets, character, normalizedLoresheetQuery]
    )
    const { visibleCount, sentinelRef } = useProgressiveRendering(filteredLoresheets.length, 9, 6)
    const visibleLoresheets = filteredLoresheets.slice(0, visibleCount)
    const visibleOfficialLoresheets = visibleLoresheets.filter(
        (loresheet) => !loresheet.merits[0]?.homebrewSource
    )
    const visibleHomebrewLoresheets = visibleLoresheets.filter(
        (loresheet) => loresheet.merits[0]?.homebrewSource
    )
    const pickedNames = pickedMeritsAndFlaws.map((m) => m.name)

    // Opening or closing a sheet swaps a long grid for a short page (or back); bring the top of
    // the panel into view so the reader doesn't land mid-way down an unrelated scroll position.
    const hasMounted = useRef(false)
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true
            return
        }
        rootRef.current?.scrollIntoView({
            block: "start",
            behavior: shouldReduceMotion ? "auto" : "smooth"
        })
    }, [openLoresheetTitle, shouldReduceMotion])

    const renderLoresheetCard = (loresheet: DisplayLoresheet) => {
        const pickedTiers = intersection(
            pickedNames,
            loresheet.merits.map((m) => m.name)
        ).length
        const sheetPicked = pickedTiers > 0

        return (
            <button
                type="button"
                key={loresheet.title}
                className={`${classes.loreCard} ${classes.enter}`}
                data-picked={sheetPicked || undefined}
                onClick={() => setOpenLoresheetTitle(loresheet.title)}
            >
                <span className={classes.loreSource}>
                    <span>{loresheet.source}</span>
                    {loresheet.merits[0]?.homebrewSource ? (
                        <HomebrewBadge source={loresheet.merits[0].homebrewSource} />
                    ) : null}
                </span>
                <span className={classes.loreTitle}>{loresheet.title}</span>
                <span className={classes.loreSummary}>{loresheet.summary}</span>
                <span className={classes.loreFooter}>
                    {sheetPicked ? (
                        <span className={`${classes.loreOpen} ${classes.pickedMark}`}>
                            <IconCircleCheck size={13} stroke={1.8} />
                            Picked
                        </span>
                    ) : (
                        <Dots filled={0} total={loresheet.merits.length} />
                    )}
                    <span className={classes.loreOpen}>
                        Open
                        <IconChevronRight size={13} stroke={2} />
                    </span>
                </span>
            </button>
        )
    }

    return (
        <div ref={rootRef} className={classes.loreRoot}>
            {openLoresheet ? (
                <OpenedLoresheet
                    loresheet={openLoresheet}
                    getMeritOrFlawLine={getMeritOrFlawLine}
                    setOpenLoresheetTitle={setOpenLoresheetTitle}
                />
            ) : (
                <div className={classes.loreDetail}>
                    <TextInput
                        aria-label="Search loresheets"
                        leftSection={<IconSearch size={16} stroke={1.7} />}
                        rightSection={
                            loresheetQuery ? (
                                <CloseButton
                                    size="sm"
                                    aria-label="Clear search"
                                    onClick={() => setLoresheetQuery("")}
                                />
                            ) : null
                        }
                        placeholder="Search loresheets by title"
                        value={loresheetQuery}
                        onChange={(event) => setLoresheetQuery(event.currentTarget.value)}
                        mb="sm"
                    />
                    {filteredLoresheets.length > 0 ? (
                        <>
                            {visibleOfficialLoresheets.length > 0 ? (
                                <>
                                    <GeneratorSectionDivider
                                        label="Loresheets"
                                        lineHeight={1}
                                        marginY="xs"
                                    />
                                    <div className={classes.loreGrid}>
                                        {visibleOfficialLoresheets.map(renderLoresheetCard)}
                                    </div>
                                </>
                            ) : null}
                            {visibleHomebrewLoresheets.length > 0 ? (
                                <>
                                    <GeneratorSectionDivider
                                        label="Homebrew"
                                        lineHeight={1}
                                        marginY="xs"
                                    />
                                    <div className={classes.loreGrid}>
                                        {visibleHomebrewLoresheets.map(renderLoresheetCard)}
                                    </div>
                                </>
                            ) : null}
                        </>
                    ) : (
                        <div className={classes.empty}>
                            <p className={classes.emptyText}>No loresheets match that title.</p>
                            <Button
                                variant="subtle"
                                color="gray"
                                size="compact-sm"
                                onClick={() => setLoresheetQuery("")}
                            >
                                Reset search
                            </Button>
                        </div>
                    )}
                    {visibleCount < filteredLoresheets.length ? (
                        <div ref={sentinelRef} aria-hidden="true" />
                    ) : null}
                </div>
            )}
        </div>
    )
}

const OpenedLoresheet = ({
    loresheet,
    getMeritOrFlawLine,
    setOpenLoresheetTitle
}: {
    loresheet: DisplayLoresheet
    getMeritOrFlawLine: (meritOrFlaw: DisplayMerit, type: "flaw" | "merit") => React.JSX.Element
    setOpenLoresheetTitle: (t: string) => void
}) => (
    <article className={`${classes.loreDetail} ${classes.enter}`}>
        <header className={classes.loreDetailHead}>
            <IconButton
                className={classes.loreBack}
                variant="default"
                label="Back"
                tooltipPosition="right"
                icon={<IconChevronLeft size={16} stroke={2} />}
                onClick={() => setOpenLoresheetTitle("")}
            />
            {loresheet.source ? <span className="pg-eyebrow">{loresheet.source}</span> : null}
            <h3 className={classes.loreDetailTitle}>{loresheet.title}</h3>
            <p className={classes.loreDetailSummary}>{loresheet.summary}</p>
        </header>

        <GeneratorSectionDivider label="Tiers" lineHeight={1} marginY="xs" />
        <div className={classes.loreTiers}>
            {loresheet.merits.map((merit) => getMeritOrFlawLine(merit, "merit"))}
        </div>

        <div className={classes.loreDetailFooter}>
            <Button
                variant="default"
                leftSection={<IconChevronLeft size={15} stroke={2} />}
                onClick={() => setOpenLoresheetTitle("")}
            >
                All loresheets
            </Button>
        </div>
    </article>
)
