import { notifications } from "@mantine/notifications"
import { useDisclosure } from "@mantine/hooks"
import {
    IconAlertCircle,
    IconBook,
    IconCloud,
    IconCoffee,
    IconDownload,
    IconFileText,
    IconHeart,
    IconHelpHexagon,
    IconShare,
    IconTrash,
    IconUserPlus,
    IconX,
} from "@tabler/icons-react"
import { useAuth } from "../../hooks/useAuth"
import { Alert } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import ErrorDetails from "~/components/ErrorDetails"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import ResetModal from "../../components/ResetModal"
import { Character } from "../../data/Character"
import { trackEvent } from "../../utils/analytics"
import { createWoD5EVttJson } from "../foundryWoDJsonCreator"
import { createInconnuJson } from "../inconnuJsonCreator"
import { downloadCharacterSheet } from "../pdfCreator"
import { GeneratorStepId } from "../steps"
import { downloadJson, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"

type FinalProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: GeneratorStepId) => void
}

const COLORS = {
    foreground: "rgba(244, 236, 232, 0.95)",
    mutedForeground: "rgba(214, 204, 198, 0.7)",
    mutedForegroundSoft: "rgba(214, 204, 198, 0.6)",
    smoke: "rgba(214, 204, 198, 0.4)",
    smokeSoft: "rgba(214, 204, 198, 0.25)",
    primary: "rgba(224, 49, 49, 1)",
    primarySoft: "rgba(224, 49, 49, 0.5)",
    primaryMuted: "rgba(224, 49, 49, 0.1)",
    gold: "rgba(212, 175, 100, 1)",
    goldSoft: "rgba(212, 175, 100, 0.5)",
    border: "rgba(125, 91, 72, 0.4)",
    borderSoft: "rgba(125, 91, 72, 0.3)",
    cardBg: "rgba(30, 21, 24, 0.85)",
    cardBgHover: "rgba(40, 28, 32, 0.95)",
    background: "rgba(14, 10, 12, 0.98)",
}

const FONT_DISPLAY = "Cinzel, Georgia, serif"
const FONT_BODY = "Crimson Text, Georgia, serif"
const FONT_UI = "Inter, Segoe UI, sans-serif"

const Final = ({ character, setCharacter, setSelectedStep }: FinalProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Final" })
    }, [])

    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)
    const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)
    const { isAuthenticated, signIn, isLoading: authLoading } = useAuth()

    const charName = character.name?.trim() || ""
    const displayTitle = charName || "Your Kindred Awaits"

    const handleCharacterSheet = () => {
        window.history.pushState({}, "", "/sheet")
        window.location.reload()
    }

    const handleDownloadPDF = () => {
        downloadCharacterSheet(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        trackEvent({
            action: "PDF downloaded",
            category: "downloads",
            label: JSON.stringify(character),
        })
    }

    const handleDownloadJSON = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        downloadJson(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        trackEvent({
            action: "JSON downloaded (progeny)",
            category: "downloads",
            label: JSON.stringify(character),
        })
    }

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                overflowY: "auto",
                paddingTop: 85,
                paddingBottom: 40,
                paddingLeft: 16,
                paddingRight: 16,
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .nf-action-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border-radius: 10px;
                    border: 1px solid ${COLORS.border};
                    background: ${COLORS.cardBg};
                    cursor: pointer;
                    text-align: left;
                    transition: border-color 250ms ease, background 250ms ease;
                    width: 100%;
                    font-family: inherit;
                }
                .nf-action-card:hover {
                    border-color: ${COLORS.primarySoft};
                    background: ${COLORS.cardBgHover};
                }
                .nf-action-card .nf-icon-wrap {
                    flex-shrink: 0;
                    padding: 10px;
                    border-radius: 8px;
                    background: rgba(224, 49, 49, 0.18);
                    color: ${COLORS.primary};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 250ms ease;
                }
                .nf-action-card:hover .nf-icon-wrap {
                    background: rgba(224, 49, 49, 0.2);
                }
                .nf-reset-btn {
                    background: none;
                    border: 1px solid rgba(224, 49, 49, 0.3);
                    border-radius: 8px;
                    color: rgba(224, 49, 49, 0.7);
                    cursor: pointer;
                    font-family: ${FONT_UI};
                    font-size: 12px;
                    padding: 7px 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
                }
                .nf-reset-btn:hover {
                    color: rgba(224, 49, 49, 1);
                    border-color: rgba(224, 49, 49, 0.6);
                    background: rgba(224, 49, 49, 0.08);
                }
                .nf-account-card {
                    border-radius: 14px;
                    border: 1px solid rgba(212, 175, 100, 0.22);
                    background: linear-gradient(180deg, rgba(32, 24, 16, 0.72) 0%, rgba(22, 16, 12, 0.8) 100%);
                    padding: 18px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .nf-account-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .nf-account-icon {
                    flex-shrink: 0;
                    width: 38px;
                    height: 38px;
                    border-radius: 9px;
                    background: rgba(212, 175, 100, 0.1);
                    color: rgba(212, 175, 100, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(212, 175, 100, 0.18);
                }
                .nf-account-title {
                    margin: 0;
                    font-family: ${FONT_DISPLAY};
                    font-size: 0.95rem;
                    letter-spacing: 0.06em;
                    color: rgba(212, 175, 100, 0.85);
                }
                .nf-account-subtitle {
                    margin: 2px 0 0 0;
                    font-family: ${FONT_UI};
                    font-size: 10px;
                    color: rgba(214, 204, 198, 0.4);
                }
                .nf-account-list {
                    margin: 0;
                    padding: 0 0 0 4px;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-family: ${FONT_BODY};
                    font-size: 0.9rem;
                    color: rgba(244, 236, 232, 0.6);
                }
                .nf-account-list li {
                    position: relative;
                    padding-left: 16px;
                    line-height: 1.4;
                }
                .nf-account-list li::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0.6em;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: rgba(212, 175, 100, 0.55);
                }
                .nf-account-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 18px;
                    border-radius: 8px;
                    border: 1px solid rgba(212, 175, 100, 0.4);
                    background: rgba(212, 175, 100, 0.1);
                    color: rgba(212, 175, 100, 0.9);
                    font-family: ${FONT_DISPLAY};
                    font-size: 0.8rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
                    align-self: center;
                }
                .nf-account-btn:hover {
                    background: rgba(212, 175, 100, 0.2);
                    border-color: rgba(212, 175, 100, 0.65);
                    color: rgba(212, 175, 100, 1);
                }
                .nf-kofi-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    border: 1px solid rgba(212, 175, 100, 0.5);
                    background: rgba(40, 30, 20, 0.85);
                    text-decoration: none;
                    transition: background 300ms ease, border-color 300ms ease;
                    cursor: pointer;
                }
                .nf-kofi-link:hover {
                    background: rgba(60, 44, 28, 0.95);
                    border-color: rgba(212, 175, 100, 0.75);
                }
                .nf-kofi-link:hover .nf-kofi-coffee {
                    transform: scale(1.1);
                }
                .nf-kofi-coffee {
                    color: ${COLORS.gold};
                    transition: transform 300ms ease;
                }
                .nf-kofi-heart {
                    color: ${COLORS.primarySoft};
                    transition: color 300ms ease, transform 300ms ease;
                }
                .nf-kofi-link:hover .nf-kofi-heart {
                    color: ${COLORS.primary};
                    transform: scale(1.25);
                }
                .nf-social-link {
                    color: ${COLORS.mutedForegroundSoft};
                    text-decoration: underline;
                    text-underline-offset: 2px;
                    transition: color 200ms ease;
                }
                .nf-social-link:hover {
                    color: ${COLORS.foreground};
                }
                .nf-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .nf-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(14, 10, 12, 0.8);
                    backdrop-filter: blur(4px);
                }
                .nf-modal-content {
                    position: relative;
                    width: 100%;
                    max-width: 460px;
                    margin: 0 16px;
                    padding: 24px;
                    border-radius: 14px;
                    border: 1px solid ${COLORS.border};
                    background: linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, ${COLORS.background} 100%);
                    box-shadow: 0 24px 54px rgba(0, 0, 0, 0.5);
                }
                .nf-export-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px;
                    border-radius: 10px;
                    border: 1px solid ${COLORS.border};
                    background: rgba(20, 14, 16, 0.92);
                    cursor: pointer;
                    text-align: left;
                    transition: border-color 200ms ease, background 200ms ease;
                    font-family: inherit;
                    gap: 12px;
                }
                .nf-export-option:hover {
                    border-color: ${COLORS.primarySoft};
                    background: ${COLORS.cardBg};
                }
                .nf-export-option:hover .nf-export-action {
                    color: ${COLORS.primary};
                }
                .nf-export-action {
                    font-family: ${FONT_UI};
                    font-size: 12px;
                    color: rgba(224, 49, 49, 0.7);
                    transition: color 200ms ease;
                    flex-shrink: 0;
                }
                .nf-text-glow {
                    text-shadow: 0 0 20px rgba(224, 49, 49, 0.25);
                }
                .nf-close-btn {
                    background: none;
                    border: none;
                    color: ${COLORS.mutedForeground};
                    cursor: pointer;
                    transition: color 200ms ease;
                    display: flex;
                    align-items: center;
                }
                .nf-close-btn:hover {
                    color: ${COLORS.foreground};
                }
                .nf-help-icon {
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    margin-left: 6px;
                }
            `}</style>

            <div
                style={{
                    maxWidth: 640,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 40,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <h2
                        className="nf-text-glow"
                        style={{
                            fontFamily: FONT_DISPLAY,
                            fontSize: "1.75rem",
                            letterSpacing: "0.05em",
                            color: COLORS.foreground,
                            margin: 0,
                            fontWeight: 600,
                        }}
                    >
                        {displayTitle}
                    </h2>
                    <p
                        style={{
                            fontFamily: FONT_BODY,
                            fontSize: "0.92rem",
                            color: "rgba(214, 204, 198, 0.55)",
                            maxWidth: 440,
                            margin: "0 auto",
                            lineHeight: 1.55,
                        }}
                    >
                        Character creation complete. Save your work, export for your favourite tools, or jump straight
                        into play.
                    </p>
                </div>

                {/* Action cards grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 16,
                    }}
                >
                    <ActionCard
                        icon={<IconFileText size={20} />}
                        label="Download PDF"
                        description="Print-ready character sheet"
                        onClick={handleDownloadPDF}
                    />
                    <ActionCard
                        icon={<IconDownload size={20} />}
                        label="Save File"
                        description="JSON save file to load later"
                        onClick={handleDownloadJSON}
                    />
                    <ActionCard
                        icon={<IconShare size={20} />}
                        label="Export"
                        description="Foundry VTT, Inconnu & more"
                        onClick={openExportModal}
                    />
                    <ActionCard
                        icon={<IconBook size={20} />}
                        label="Character Sheet"
                        description="Use this character right away"
                        onClick={handleCharacterSheet}
                    />
                </div>

                {/* Reset */}
                <div
                    style={{
                        transition: "opacity 400ms ease, max-height 400ms ease",
                        opacity: !authLoading && !isAuthenticated ? 1 : 0,
                        maxHeight: !authLoading && !isAuthenticated ? 400 : 0,
                        overflow: "hidden",
                        pointerEvents: !authLoading && !isAuthenticated ? "auto" : "none",
                    }}
                >
                    <div className="nf-account-card">
                        <div className="nf-account-header">
                            <div className="nf-account-icon">
                                <IconCloud size={22} />
                            </div>
                            <div>
                                <p className="nf-account-title">Create a free account</p>
                                <p className="nf-account-subtitle">Unlock the full companion experience</p>
                            </div>
                        </div>
                        <ul className="nf-account-list">
                            <li>Manage multiple characters in the cloud</li>
                            <li>Run play sessions online</li>
                            <li>Share your characters with your friends</li>
                        </ul>
                        <button className="nf-account-btn" onClick={signIn}>
                            <IconUserPlus size={16} />
                            Create Account
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <button className="nf-reset-btn" onClick={openResetModal}>
                        <IconTrash size={14} />
                        Reset character
                    </button>
                </div>

                {/* Divider */}
                <div
                    style={{
                        width: 80,
                        height: 1,
                        margin: "0 auto",
                        background:
                            "linear-gradient(90deg, transparent 0%, rgba(125, 91, 72, 0.4) 50%, transparent 100%)",
                    }}
                />

                {/* Ko-fi CTA + socials */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 16,
                    }}
                >
                    <a
                        href={CONTACT_LINKS.kofi.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nf-kofi-link"
                    >
                        <IconCoffee size={20} className="nf-kofi-coffee" />
                        <div style={{ textAlign: "left" }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: FONT_DISPLAY,
                                    fontSize: "0.88rem",
                                    letterSpacing: "0.06em",
                                    color: COLORS.gold,
                                }}
                            >
                                Support on Ko-Fi
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: FONT_UI,
                                    fontSize: 10,
                                    color: "rgba(214, 204, 198, 0.5)",
                                }}
                            >
                                Help keep Progeny growing
                            </p>
                        </div>
                        <IconHeart size={16} className="nf-kofi-heart" />
                    </a>

                    <p
                        style={{
                            fontFamily: FONT_UI,
                            fontSize: 12,
                            color: "rgba(214, 204, 198, 0.4)",
                            textAlign: "center",
                            margin: 0,
                        }}
                    >
                        Feedback or ideas? Find Odin on{" "}
                        <a
                            href={CONTACT_LINKS.reddit.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nf-social-link"
                        >
                            Reddit
                        </a>
                        {", "}
                        <a
                            href={CONTACT_LINKS.bluesky.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nf-social-link"
                        >
                            Bluesky
                        </a>
                        {" or "}
                        <a
                            href={CONTACT_LINKS.github.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nf-social-link"
                        >
                            GitHub
                        </a>
                    </p>
                </div>

                {downloadError ? (
                    <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="outline" bg="rgba(0, 0, 0, 0.6)">
                        <ErrorDetails error={downloadError} />
                    </Alert>
                ) : null}

                <p
                    style={{
                        fontFamily: FONT_UI,
                        fontSize: 11,
                        color: "rgba(214, 204, 198, 0.35)",
                        textAlign: "center",
                        margin: 0,
                        letterSpacing: "0.02em",
                    }}
                >
                    You may need to refresh your browser to trigger multiple downloads.
                </p>
            </div>

            <ResetModal
                setCharacter={setCharacter}
                setSelectedStep={setSelectedStep}
                resetModalOpened={resetModalOpened}
                closeResetModal={closeResetModal}
            />

            {exportModalOpened && (
                <ExportModal
                    character={character}
                    onClose={closeExportModal}
                    setDownloadError={setDownloadError}
                />
            )}
        </div>
    )
}

function ActionCard({
    icon,
    label,
    description,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    description: string
    onClick?: () => void
}) {
    return (
        <button className="nf-action-card" onClick={onClick}>
            <div className="nf-icon-wrap">{icon}</div>
            <div>
                <p
                    style={{
                        margin: 0,
                        fontFamily: FONT_DISPLAY,
                        fontSize: "0.88rem",
                        letterSpacing: "0.06em",
                        color: COLORS.foreground,
                    }}
                >
                    {label}
                </p>
                <p
                    style={{
                        margin: "2px 0 0 0",
                        fontFamily: FONT_UI,
                        fontSize: 11,
                        color: "rgba(214, 204, 198, 0.55)",
                    }}
                >
                    {description}
                </p>
            </div>
        </button>
    )
}

function ExportModal({
    character,
    onClose,
    setDownloadError,
}: {
    character: Character
    onClose: () => void
    setDownloadError: (e: Error | undefined) => void
}) {
    const [popoverOpen, setPopoverOpen] = useState(false)

    const exportFoundry = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        try {
            const { json: vtt, validationErrors } = createWoD5EVttJson(character)
            const blob = new Blob([JSON.stringify(vtt, null, 2)], { type: "application/json" })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `foundry_wod5e_${character.name}.json`
            link.click()
            setTimeout(() => window.URL.revokeObjectURL(link.href), 100)

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
                    autoClose: 10000,
                })
            }

            trackEvent({
                action: "JSON downloaded (foundry_wod5e vtt)",
                category: "downloads",
                label: JSON.stringify(character),
            })
            onClose()
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
        }
    }

    const exportInconnu = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        try {
            const inconnuJson = createInconnuJson(character)
            const blob = new Blob([JSON.stringify(inconnuJson, null, 2)], { type: "application/json" })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `inconnu_${character.name}.json`
            link.click()
            setTimeout(() => window.URL.revokeObjectURL(link.href), 100)

            trackEvent({
                action: "JSON downloaded (inconnu)",
                category: "downloads",
                label: JSON.stringify(character),
            })
            onClose()
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
        }
    }

    return (
        <div className="nf-modal-backdrop">
            <div className="nf-modal-overlay" onClick={onClose} />
            <div className="nf-modal-content">
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: FONT_DISPLAY,
                            fontSize: "1.1rem",
                            letterSpacing: "0.05em",
                            color: COLORS.foreground,
                            fontWeight: 600,
                        }}
                    >
                        Export Character
                    </h3>
                    <button className="nf-close-btn" onClick={onClose}>
                        <IconX size={20} />
                    </button>
                </div>

                <p
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: 12,
                        color: "rgba(214, 204, 198, 0.6)",
                        margin: "0 0 20px 0",
                    }}
                >
                    Export your character for use in other VtM platforms and tools.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button className="nf-export-option" onClick={exportFoundry}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontFamily: FONT_DISPLAY,
                                        fontSize: "0.88rem",
                                        letterSpacing: "0.05em",
                                        color: COLORS.foreground,
                                    }}
                                >
                                    <a
                                        href="https://foundryvtt.com/packages/vtm5e"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ color: COLORS.gold, textDecoration: "underline" }}
                                    >
                                        Foundry VTT (WoD5E)
                                    </a>
                                </p>
                                <span
                                    className="nf-help-icon"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setPopoverOpen(!popoverOpen)
                                    }}
                                >
                                    <IconHelpHexagon size={18} color={COLORS.primary} />
                                </span>
                            </div>
                            <p
                                style={{
                                    margin: "2px 0 0 0",
                                    fontFamily: FONT_UI,
                                    fontSize: 10,
                                    color: "rgba(214, 204, 198, 0.4)",
                                }}
                            >
                                Download a JSON file compatible with the WoD5E Foundry module
                            </p>
                            {popoverOpen && (
                                <div
                                    style={{
                                        marginTop: 10,
                                        padding: 12,
                                        borderRadius: 8,
                                        border: `1px solid ${COLORS.borderSoft}`,
                                        background: "rgba(14, 10, 12, 0.85)",
                                        fontFamily: FONT_UI,
                                        fontSize: 11,
                                        color: COLORS.mutedForeground,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    <div>1. Export to JSON</div>
                                    <div>2. Create Vampire character in Foundry</div>
                                    <div>3. Right click that character in &quot;Actors&quot;</div>
                                    <div>4. Select &quot;Import Data&quot; and upload JSON</div>
                                </div>
                            )}
                        </div>
                        <span className="nf-export-action">Download →</span>
                    </button>

                    <button className="nf-export-option" onClick={exportInconnu}>
                        <div style={{ flex: 1 }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: FONT_DISPLAY,
                                    fontSize: "0.88rem",
                                    letterSpacing: "0.05em",
                                    color: COLORS.foreground,
                                }}
                            >
                                <a
                                    href="https://docs.inconnu.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: COLORS.gold, textDecoration: "underline" }}
                                >
                                    Inconnu (Discord Bot)
                                </a>
                            </p>
                            <p
                                style={{
                                    margin: "2px 0 0 0",
                                    fontFamily: FONT_UI,
                                    fontSize: 10,
                                    color: "rgba(214, 204, 198, 0.4)",
                                }}
                            >
                                Export for use with the Inconnu Discord character manager
                            </p>
                        </div>
                        <span className="nf-export-action">Download →</span>
                    </button>
                </div>

                <p
                    style={{
                        marginTop: 20,
                        marginBottom: 0,
                        fontFamily: FONT_UI,
                        fontSize: 10,
                        color: "rgba(214, 204, 198, 0.3)",
                        textAlign: "center",
                    }}
                >
                    More export options coming soon
                </p>
            </div>
        </div>
    )
}

export default Final
