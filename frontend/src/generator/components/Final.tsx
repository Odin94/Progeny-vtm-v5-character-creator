import { downloadFile } from "~/utils/fileDownload"
import { notifications } from "@mantine/notifications"
import { useDisclosure } from "@mantine/hooks"
import {
    IconAlertCircle,
    IconBook,
    IconCheck,
    IconChevronRight,
    IconCloud,
    IconCoffee,
    IconCookie,
    IconDownload,
    IconFileText,
    IconHeart,
    IconHelpHexagon,
    IconMessageCircle,
    IconQuestionMark,
    IconTrash,
    IconUserPlus
} from "@tabler/icons-react"
import { useAuth } from "../../hooks/useAuth"
import { Alert, Button, Popover, ScrollArea } from "@mantine/core"
import { useEffect, useRef, useState, type ReactNode } from "react"
import ErrorDetails from "~/components/ErrorDetails"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import ResetModal from "../../components/ResetModal"
import { Character } from "../../data/Character"
import { clans } from "../../data/Clans"
import type { ClanName } from "../../data/NameSchemas"
import {
    openSupportConversation,
    showSupportUnavailableNotification
} from "../../utils/supportConversations"
import { createWoD5EVttJson } from "../foundryWoDJsonCreator"
import { createInconnuCommandExport } from "../inconnuCommandCreator"
import { createInconnuJson } from "../inconnuJsonCreator"
import { GeneratorStepId } from "../steps"
import { downloadJson, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { openCookiePreferences } from "~/utils/cookiePreferences"
import { trackFeatureGuideOpened } from "~/utils/analytics"
import { useAnalyticsConsent } from "~/hooks/useAnalyticsConsent"
import { motion, useReducedMotion } from "framer-motion"
import { BrandMark, IconButton, Ornament, Panel, SectionHeader } from "~/components/ui"
import { motion as motionTokens } from "~/theme/tokens"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { Dots } from "./generatorCardParts"
import classes from "./Final.module.css"

type FinalProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: GeneratorStepId) => void
    onCharacterReset: () => void
}

type PdfStage = "idle" | "loading" | "filling" | "done"
type ExportKey = "foundry" | "inconnu" | "inconnu-commands"

const DONE_FLASH_MS = 2600
const MAX_LISTED_TRAITS = 6

const titleCase = (value: string) => value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())

const ordinal = (value: number) => {
    const mod100 = value % 100
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`
    return `${value}${{ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th"}`
}

const Final = ({ character, setCharacter, setSelectedStep, onCharacterReset }: FinalProps) => {
    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] =
        useDisclosure(false)
    const [pdfStage, setPdfStage] = useState<PdfStage>("idle")
    const [jsonDone, setJsonDone] = useState(false)
    const hasAnalyticsConsent = useAnalyticsConsent()
    const { isAuthenticated, signIn, isLoading: authLoading } = useAuth()
    const shouldReduceMotion = useReducedMotion()
    const timers = useRef<number[]>([])

    useEffect(() => {
        const pending = timers.current
        return () => pending.forEach((id) => window.clearTimeout(id))
    }, [])
    const later = (fn: () => void) => {
        timers.current.push(window.setTimeout(fn, DONE_FLASH_MS))
    }

    const charName = character.name?.trim() || ""
    const displayTitle = charName || "Your Kindred Awaits"
    const clanLogo = character.clan ? clans[character.clan as ClanName]?.logo : undefined
    const clanName = character.homebrewClan?.name ?? character.clan
    const lineage = [
        clanName || null,
        character.generation ? `${ordinal(character.generation)} generation` : null,
        character.predatorType.name || null,
        character.sire?.trim() ? `Childe of ${character.sire.trim()}` : null
    ].filter((part): part is string => Boolean(part))

    const reveal = (delay: number) => ({
        initial: { opacity: 0, transform: shouldReduceMotion ? "none" : "translateY(10px)" },
        animate: { opacity: 1, transform: "none" },
        transition: {
            duration: shouldReduceMotion ? 0.14 : 0.26,
            delay: shouldReduceMotion ? 0 : delay,
            ease: motionTokens.curve.out
        }
    })

    const handleCharacterSheet = () => {
        window.history.pushState({}, "", "/sheet")
        window.location.reload()
    }

    const handleOpenFeatures = () => {
        trackFeatureGuideOpened("character-creation-complete")
        window.history.pushState({}, "", "/features")
        window.location.reload()
    }

    const handleDownloadPDF = async () => {
        if (pdfStage === "loading" || pdfStage === "filling") return
        setPdfStage("loading")
        try {
            const { downloadCharacterSheet } = await import("../pdfCreator")
            setPdfStage("filling")
            await downloadCharacterSheet(character, "generator")
            setPdfStage("done")
            later(() => setPdfStage("idle"))
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
            setPdfStage("idle")
        }
    }

    const handleDownloadJSON = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        downloadJson(character, undefined, "generator")
            .then(() => {
                setJsonDone(true)
                later(() => setJsonDone(false))
            })
            .catch((e) => {
                console.error(e)
                setDownloadError(e as Error)
            })
    }

    const handleOpenSupport = async () => {
        const result = await openSupportConversation("character-creation-complete")
        if (result === "unavailable") {
            showSupportUnavailableNotification()
        }
    }

    const pdfBusy = pdfStage === "loading" || pdfStage === "filling"
    const pdfDescription: ReactNode =
        pdfStage === "loading" ? (
            <>
                <Dots filled={1} total={2} />
                Loading the sheet…
            </>
        ) : pdfStage === "filling" ? (
            <>
                <Dots filled={2} total={2} />
                Filling in {charName || "your character"}…
            </>
        ) : pdfStage === "done" ? (
            "PDF ready"
        ) : (
            "Print-ready character sheet"
        )

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={20}
                pt={4}
                pb={8}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    <div className={classes.page}>
                        <motion.header className={classes.hero} {...reveal(0)}>
                            <span className="pg-eyebrow">Character complete</span>
                            <span className={classes.sigil} aria-hidden="true">
                                {clanLogo ? (
                                    <span
                                        className={classes.sigilMark}
                                        style={{ ["--sigil" as string]: `url("${clanLogo}")` }}
                                    />
                                ) : (
                                    <BrandMark size={40} />
                                )}
                            </span>
                            <h2 data-testid="final-character-name" className={classes.name}>
                                {displayTitle}
                            </h2>
                            <Ornament className={classes.ornament} />
                            {lineage.length > 0 ? (
                                <p className={classes.lineage}>
                                    {lineage.map((part) => (
                                        <span key={part}>{part}</span>
                                    ))}
                                </p>
                            ) : null}
                            <p className={classes.saved}>
                                <IconCheck size={14} stroke={2.2} />
                                Saved in this browser. Take it to the table, or export it for your
                                favourite tools.
                            </p>
                        </motion.header>

                        <motion.div {...reveal(0.06)}>
                            <Panel tone="ornate" grain p="xl">
                                <Dossier character={character} />
                            </Panel>
                        </motion.div>

                        <motion.div className={classes.groups} {...reveal(0.12)}>
                            <section className={classes.group}>
                                <SectionHeader title="Take it to the table" />
                                <ActionCard
                                    primary
                                    icon={<IconBook size={20} stroke={1.7} />}
                                    label="Character Sheet"
                                    description="Play this character right away"
                                    onClick={handleCharacterSheet}
                                />
                                <ActionCard
                                    testId="final-download-pdf-button"
                                    icon={
                                        pdfStage === "done" ? (
                                            <IconCheck size={20} stroke={2} />
                                        ) : (
                                            <IconFileText size={20} stroke={1.7} />
                                        )
                                    }
                                    label="Download PDF"
                                    description={pdfDescription}
                                    state={pdfStage === "done" ? "done" : undefined}
                                    busy={pdfBusy}
                                    onClick={handleDownloadPDF}
                                />
                                <ActionCard
                                    icon={
                                        jsonDone ? (
                                            <IconCheck size={20} stroke={2} />
                                        ) : (
                                            <IconDownload size={20} stroke={1.7} />
                                        )
                                    }
                                    label="Save File"
                                    description={
                                        jsonDone
                                            ? "Save file ready"
                                            : "JSON save file to load later"
                                    }
                                    state={jsonDone ? "done" : undefined}
                                    onClick={handleDownloadJSON}
                                />
                            </section>

                            <section className={classes.group}>
                                <SectionHeader title="Export to other tools" />
                                <ExportList
                                    character={character}
                                    setDownloadError={setDownloadError}
                                />
                            </section>
                        </motion.div>

                        {downloadError ? (
                            <Alert
                                icon={<IconAlertCircle size="1rem" />}
                                color="red"
                                title="The download didn't work"
                                withCloseButton
                                onClose={() => setDownloadError(undefined)}
                            >
                                <ErrorDetails error={downloadError} />
                            </Alert>
                        ) : null}

                        {!authLoading && !isAuthenticated ? (
                            <motion.div {...reveal(0.18)}>
                                <Panel tone="raised" p="lg">
                                    <div className={classes.account}>
                                        <span className={classes.accountIcon} aria-hidden="true">
                                            <IconCloud size={22} stroke={1.6} />
                                        </span>
                                        <div>
                                            <p className={classes.accountTitle}>
                                                Create a free account
                                            </p>
                                            <ul className={classes.accountList}>
                                                <li>Manage multiple characters in the cloud</li>
                                                <li>Run play sessions online</li>
                                                <li>Share your characters with your friends</li>
                                            </ul>
                                        </div>
                                        <Button
                                            variant="light"
                                            color="gold"
                                            leftSection={<IconUserPlus size={16} stroke={1.8} />}
                                            onClick={signIn}
                                        >
                                            Create Account
                                        </Button>
                                    </div>
                                </Panel>
                            </motion.div>
                        ) : null}

                        <div className={classes.secondaryRow}>
                            <Button
                                variant="default"
                                leftSection={<IconHelpHexagon size={16} stroke={1.7} />}
                                onClick={handleOpenFeatures}
                            >
                                Feature Guide
                            </Button>
                            {hasAnalyticsConsent ? (
                                <Button
                                    variant="default"
                                    leftSection={<IconMessageCircle size={16} stroke={1.7} />}
                                    onClick={handleOpenSupport}
                                >
                                    Feedback & support
                                </Button>
                            ) : (
                                <Button
                                    variant="default"
                                    leftSection={<IconCookie size={16} stroke={1.7} />}
                                    onClick={openCookiePreferences}
                                >
                                    Cookie preferences
                                </Button>
                            )}
                            <Button
                                variant="subtle"
                                color="red"
                                leftSection={<IconTrash size={15} stroke={1.7} />}
                                onClick={openResetModal}
                            >
                                Reset character
                            </Button>
                        </div>

                        <footer className={classes.footer}>
                            <a
                                href={CONTACT_LINKS.kofi.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes.kofi}
                            >
                                <IconCoffee size={20} className={classes.kofiCoffee} />
                                <span>
                                    <span className={classes.kofiTitle}>Support on Ko-Fi</span>
                                    <span className={classes.kofiSub}>
                                        Help keep Progeny growing
                                    </span>
                                </span>
                                <IconHeart size={16} className={classes.kofiHeart} />
                            </a>
                            <p className={classes.social}>
                                Feedback or ideas? Find Odin on{" "}
                                <a
                                    href={CONTACT_LINKS.reddit.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Reddit
                                </a>
                                {", "}
                                <a
                                    href={CONTACT_LINKS.bluesky.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Bluesky
                                </a>
                                {" or "}
                                <a
                                    href={CONTACT_LINKS.github.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub
                                </a>
                            </p>
                            <p className={classes.note}>
                                You may need to refresh your browser to trigger multiple downloads.
                            </p>
                        </footer>
                    </div>
                </div>
            </ScrollArea>

            <ResetModal
                onCharacterReset={onCharacterReset}
                setCharacter={setCharacter}
                setSelectedStep={setSelectedStep}
                resetModalOpened={resetModalOpened}
                closeResetModal={closeResetModal}
            />
        </div>
    )
}

function Dossier({ character }: { character: Character }) {
    const disciplineCounts = character.disciplines.reduce((counts, power) => {
        counts.set(power.discipline, (counts.get(power.discipline) ?? 0) + 1)
        return counts
    }, new Map<string, number>())
    const traits = [
        ...character.merits.map((item) => ({ ...item, type: "merit" as const })),
        ...character.flaws.map((item) => ({ ...item, type: "flaw" as const }))
    ]
    const vitals = [
        { label: "Health", value: character.maxHealth, total: Math.max(character.maxHealth, 5) },
        { label: "Willpower", value: character.willpower, total: Math.max(character.willpower, 5) },
        { label: "Humanity", value: character.humanity, total: 10 },
        { label: "Blood Potency", value: character.bloodPotency, total: 5 }
    ]
    const extraPowers = [
        ...character.rituals.map((ritual) => ({ ...ritual, kind: "Ritual" })),
        ...character.ceremonies.map((ceremony) => ({ ...ceremony, kind: "Ceremony" }))
    ]

    return (
        <div className={classes.dossier}>
            <div className={classes.dossierBlock}>
                <p className={classes.dossierTitle}>Disciplines</p>
                {disciplineCounts.size === 0 ? (
                    <p className={classes.muted}>Gained through blood resonance</p>
                ) : (
                    [...disciplineCounts.entries()].map(([name, count]) => (
                        <span key={name} className={classes.trait}>
                            <span className={classes.traitName}>{titleCase(name)}</span>
                            <Dots filled={count} />
                        </span>
                    ))
                )}
                {extraPowers.map((power) => (
                    <span key={`${power.kind}-${power.name}`} className={classes.trait}>
                        <span className={classes.traitName}>
                            {power.name}
                            <small>{power.kind}</small>
                        </span>
                        <Dots filled={power.level} />
                    </span>
                ))}
            </div>

            <div className={classes.dossierBlock}>
                <p className={classes.dossierTitle}>Vitals</p>
                {vitals.map((vital) => (
                    <span key={vital.label} className={classes.trait}>
                        <span className={classes.traitName}>
                            {vital.label} <small>{vital.value}</small>
                        </span>
                        <Dots filled={vital.value} total={vital.total} />
                    </span>
                ))}
            </div>

            <div className={classes.dossierBlock}>
                <p className={classes.dossierTitle}>Touchstones & Convictions</p>
                {character.touchstones.length === 0 ? (
                    <p className={classes.muted}>None yet</p>
                ) : (
                    character.touchstones.map((touchstone, index) => (
                        <span key={index} className={classes.touchstone}>
                            <span className={classes.touchstoneName}>
                                {touchstone.name || "Unnamed touchstone"}
                            </span>
                            {touchstone.conviction ? (
                                <span className={classes.conviction}>
                                    “{touchstone.conviction}”
                                </span>
                            ) : null}
                        </span>
                    ))
                )}
            </div>

            <div className={classes.dossierBlock}>
                <p className={classes.dossierTitle}>Merits & Flaws</p>
                {traits.length === 0 ? (
                    <p className={classes.muted}>None taken</p>
                ) : (
                    <>
                        {traits.slice(0, MAX_LISTED_TRAITS).map((trait) => (
                            <span
                                key={`${trait.type}-${trait.name}`}
                                className={classes.trait}
                                data-tone={trait.type}
                            >
                                <span className={classes.traitName}>
                                    {trait.name}
                                    {trait.type === "flaw" ? <small>Flaw</small> : null}
                                </span>
                                <Dots filled={trait.level} />
                            </span>
                        ))}
                        {traits.length > MAX_LISTED_TRAITS ? (
                            <span className={classes.more}>
                                +{traits.length - MAX_LISTED_TRAITS} more on your sheet
                            </span>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    )
}

function ActionCard({
    icon,
    label,
    description,
    onClick,
    testId,
    primary,
    busy,
    state
}: {
    icon: ReactNode
    label: string
    description: ReactNode
    onClick?: () => void
    testId?: string
    primary?: boolean
    busy?: boolean
    state?: "done"
}) {
    return (
        <button
            type="button"
            className={classes.action}
            data-testid={testId}
            data-primary={primary || undefined}
            data-state={state}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={onClick}
        >
            <span className={classes.actionIcon} aria-hidden="true">
                {icon}
            </span>
            <span className={classes.actionText}>
                <span className={classes.actionLabel}>{label}</span>
                <span className={classes.actionDescription} aria-live="polite">
                    {description}
                </span>
            </span>
            <IconChevronRight className={classes.actionArrow} size={18} stroke={1.8} />
        </button>
    )
}

function ExportList({
    character,
    setDownloadError
}: {
    character: Character
    setDownloadError: (e: Error | undefined) => void
}) {
    const [busy, setBusy] = useState<ExportKey | null>(null)
    const [done, setDone] = useState<ExportKey | null>(null)
    const doneTimer = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(doneTimer.current), [])

    const run = async (key: ExportKey, task: () => Promise<void>) => {
        setBusy(key)
        try {
            await task()
            setDone(key)
            window.clearTimeout(doneTimer.current)
            doneTimer.current = window.setTimeout(() => setDone(null), DONE_FLASH_MS)
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
        } finally {
            setBusy(null)
        }
    }

    const exportFoundry = () =>
        run("foundry", async () => {
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
            let validationErrors: string[] = []
            await downloadFile(
                {
                    filename: `foundry_wod5e_${character.name}.json`,
                    format: "foundry-json",
                    source: "generator"
                },
                () => {
                    const result = createWoD5EVttJson(character)
                    validationErrors = result.validationErrors
                    return new Blob([JSON.stringify(result.json, null, 2)], {
                        type: "application/json"
                    })
                }
            )

            if (validationErrors.length > 0) {
                const errorCount = validationErrors.length
                const firstError = validationErrors[0]
                const message =
                    errorCount === 1
                        ? `Validation error: ${firstError}`
                        : `${errorCount} validation errors found. First error: ${firstError}`
                notifications.show({
                    title: "Validation Warning",
                    message: `The exported JSON may not be fully compatible with Foundry VTT. ${message}`,
                    color: "orange",
                    autoClose: 10000
                })
            }
        })

    const exportInconnu = () =>
        run("inconnu", async () => {
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
            await downloadFile(
                {
                    filename: `inconnu_${character.name}.json`,
                    format: "inconnu-json",
                    source: "generator"
                },
                () =>
                    new Blob([JSON.stringify(createInconnuJson(character), null, 2)], {
                        type: "application/json"
                    })
            )
        })

    const exportInconnuCommands = () =>
        run("inconnu-commands", async () => {
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
            await downloadFile(
                {
                    filename: `inconnu_${character.name}_discord_commands_progeny.txt`,
                    format: "inconnu-commands",
                    source: "generator"
                },
                () =>
                    new Blob([createInconnuCommandExport(createInconnuJson(character))], {
                        type: "text/plain"
                    })
            )
        })

    const downloadButton = (key: ExportKey, name: string, onClick: () => void) => (
        <Button
            size="xs"
            variant={done === key ? "light" : "default"}
            color={done === key ? "green" : undefined}
            loading={busy === key}
            disabled={busy !== null && busy !== key}
            leftSection={
                done === key ? <IconCheck size={14} stroke={2} /> : <IconDownload size={14} />
            }
            aria-label={`Download ${name}`}
            onClick={onClick}
        >
            {done === key ? "Done" : "Download"}
        </Button>
    )

    return (
        <div className={classes.exportList}>
            <div className={classes.exportRow}>
                <div className={classes.exportText}>
                    <span className={classes.exportName}>
                        <a
                            href="https://foundryvtt.com/packages/vtm5e"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Foundry VTT (WoD5E)
                        </a>
                        <Popover position="bottom" width={260} withArrow shadow="md">
                            <Popover.Target>
                                <IconButton
                                    size="sm"
                                    label="How to import into Foundry"
                                    icon={<IconQuestionMark size={14} stroke={2} />}
                                />
                            </Popover.Target>
                            <Popover.Dropdown>
                                <ol className={classes.steps}>
                                    <li>Export to JSON</li>
                                    <li>Create Vampire character in Foundry</li>
                                    <li>Right click that character in &quot;Actors&quot;</li>
                                    <li>Select &quot;Import Data&quot; and upload JSON</li>
                                </ol>
                            </Popover.Dropdown>
                        </Popover>
                    </span>
                    <span className={classes.exportDescription}>
                        JSON file for the WoD5E Foundry module
                    </span>
                </div>
                {downloadButton("foundry", "Foundry VTT JSON", exportFoundry)}
            </div>

            <div className={classes.exportRow}>
                <div className={classes.exportText}>
                    <span className={classes.exportName}>
                        <a
                            href="https://docs.inconnu.app"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Inconnu (Discord Bot)
                        </a>
                    </span>
                    <span className={classes.exportDescription}>
                        For the Inconnu Discord character manager
                    </span>
                </div>
                {downloadButton("inconnu", "Inconnu JSON", exportInconnu)}
            </div>

            <div className={classes.exportRow}>
                <div className={classes.exportText}>
                    <span className={classes.exportName}>Inconnu Discord Commands</span>
                    <span className={classes.exportDescription}>
                        Setup commands to run after /character wizard
                    </span>
                </div>
                {downloadButton(
                    "inconnu-commands",
                    "Inconnu Discord commands",
                    exportInconnuCommands
                )}
            </div>
        </div>
    )
}

export default Final
