import {
    beginSaveAndStartNewAttempt,
    reportCharacterOperationFailure
} from "~/utils/characterOperationAnalytics"
import AppTopbar from "~/components/AppTopbar"
import { Anchor, Button, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure, useLocalStorage } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconArrowDown, IconArrowRight, IconNotebook, IconUserCircle } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { useState, type ReactNode } from "react"
import StartNewCharacterModal from "~/components/StartNewCharacterModal"
import SupportConversationButton from "~/components/SupportConversationButton"
import { BrandMark } from "~/components/ui/BrandMark"
import { Ornament } from "~/components/ui/Ornament"
import { Panel } from "~/components/ui/Panel"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { getEmptyCharacter, isCharacterEmpty, type Character } from "~/data/Character"
import { defaultGeneratorStepId, type GeneratorStepId } from "~/generator/steps"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCharacters } from "~/hooks/useCharacters"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import embracePlate from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import sheetPlate from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import coteriePlate from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import fangs from "~/resources/icons/noun-fangs-5617700.svg"
import { characterPersistence, isOwnedSavedCharacter } from "~/modules/characterPersistence"
import { motion as motionTokens } from "~/theme/tokens"
import { trackFeatureGuideOpened } from "~/utils/analytics"
import { transitionCharacter } from "~/modules/characterTransition"
import "./LandingPage.css"

const GUIDE_CHAPTERS = [
    { to: "/features/character-creation", title: "Character creation" },
    { to: "/features/character-sheet", title: "Character sheet" },
    { to: "/features/account-and-multiple-characters", title: "Account & multiple characters" },
    { to: "/features/coteries", title: "Coteries & playing together" },
    { to: "/features/credits-and-contact", title: "Credits & contact" }
] as const

const HERO_CONTACT_LINKS = [CONTACT_LINKS.reddit, CONTACT_LINKS.bluesky, CONTACT_LINKS.kofi]

const FOOTER_LINKS = [
    CONTACT_LINKS.reddit,
    CONTACT_LINKS.bluesky,
    CONTACT_LINKS.github,
    CONTACT_LINKS.kofi,
    CONTACT_LINKS.website
]

const ROMAN = ["I", "II", "III"] as const

type ChapterProps = {
    index: number
    id: string
    plate: string
    plateFocus?: string
    title: string
    lead: string
    bullets: string[]
    body?: ReactNode
    action: ReactNode
}

/** One "rulebook spread": a full-bleed photographic plate facing a page of text. */
function Chapter({
    index,
    id,
    plate,
    plateFocus,
    title,
    lead,
    bullets,
    body,
    action
}: ChapterProps) {
    const numeral = ROMAN[index]
    const headingId = `${id}-title`

    return (
        <li className="landing__chapter" id={id} data-flip={index % 2 === 1 || undefined}>
            <article className="landing__spread" aria-labelledby={headingId}>
                <figure className="landing__plate" aria-hidden="true">
                    <img
                        src={plate}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={plateFocus ? { objectPosition: plateFocus } : undefined}
                    />
                    <span className="landing__plate-numeral">{numeral}</span>
                </figure>
                <div className="landing__page">
                    <p className="landing__chapter-label">Chapter {numeral}</p>
                    <h3 id={headingId} className="landing__chapter-title">
                        {title}
                    </h3>
                    <Ornament align="start" className="landing__chapter-ornament" />
                    <p className="landing__chapter-lead">{lead}</p>
                    <ul className="landing__chapter-list">
                        {bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                        ))}
                    </ul>
                    {body ? <div className="landing__chapter-body">{body}</div> : null}
                    <div className="landing__chapter-action">{action}</div>
                </div>
            </article>
        </li>
    )
}

/** Concentric lozenges behind the wordmark — the Progeny sigil drawn large and faint. */
function HeroSigil() {
    return (
        <svg
            className="landing__sigil"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M200 6 394 200 200 394 6 200Z" stroke="currentColor" strokeOpacity="0.5" />
            <path d="M200 40 360 200 200 360 40 200Z" stroke="currentColor" strokeOpacity="0.28" />
            <path
                d="M200 92 308 200 200 308 92 200Z"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray="2 6"
            />
            <path d="M200 0V400" stroke="currentColor" strokeOpacity="0.14" />
        </svg>
    )
}

export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { isAuthenticated, signIn, isSigningIn } = useAuth()
    const [character, setCharacter] = useCharacterLocalStorage()
    const [, setStoredSelectedStep] = useLocalStorage<GeneratorStepId>({
        key: "selectedGeneratorStep",
        defaultValue: defaultGeneratorStepId
    })
    const { data: characters } = useCharacters(isAuthenticated)
    const [creditsOpened, { open: openCredits, close: closeCredits }] = useDisclosure(false)
    const [
        startNewCharacterModalOpened,
        { open: openStartNewCharacterModal, close: closeStartNewCharacterModal }
    ] = useDisclosure(false)
    const [currentCharacterName, setCurrentCharacterName] = useState(character.name)
    const [isSavingCurrentCharacter, setIsSavingCurrentCharacter] = useState(false)
    const isCurrentCharacterEmpty = () => isCharacterEmpty(character)

    const openAccountArea = () => {
        if (isAuthenticated) {
            navigate({ to: "/me" })
            return
        }

        signIn()
    }

    const continueCurrentCharacter = () => {
        closeStartNewCharacterModal()
        navigate({ to: "/create" })
    }

    const startNewCharacter = async (
        isCurrent: () => boolean,
        persistence: ReturnType<typeof characterPersistence>
    ) => {
        await persistence.settle(character.id)
        if (!isCurrent()) return
        closeStartNewCharacterModal()
        persistence.startDraft()
        setCharacter(getEmptyCharacter())
        setStoredSelectedStep(defaultGeneratorStepId)
        await navigate({ to: "/create", hash: defaultGeneratorStepId })
    }

    const openGenerator = () => {
        if (!isAuthenticated || isCurrentCharacterEmpty()) {
            navigate({ to: "/create" })
            return
        }

        setCurrentCharacterName(character.name)
        openStartNewCharacterModal()
    }

    const saveCurrentCharacterAndStartNew = async () => {
        const finish = beginSaveAndStartNewAttempt()
        let outcome: Parameters<typeof finish>[0] = "cancelled"
        let reason: Parameters<typeof finish>[1] = "interrupted"
        try {
            await transitionCharacter(
                queryClient,
                async (isCurrent, persistence) => {
                    const trimmedName = currentCharacterName.trim()

                    if (!trimmedName) {
                        outcome = "refused"
                        reason = "name_required"
                        reportCharacterOperationFailure("save-and-start-new", undefined, {
                            reason: "name_required"
                        })
                        notifications.show({
                            title: "Name required",
                            message:
                                "Give the current character a name before saving it to your account.",
                            color: "red"
                        })
                        return
                    }

                    setIsSavingCurrentCharacter(true)

                    try {
                        const characterToSave: Character = { ...character, name: trimmedName }
                        const saved = await persistence.save(characterToSave, {
                            owned: isOwnedSavedCharacter(characterToSave.id, characters),
                            ownershipLoaded: characters !== undefined,
                            beforeSwitch: true,
                            allowCopy: characters?.some(
                                (candidate) =>
                                    candidate.id === character.id &&
                                    (candidate.shared || candidate.canEdit === false)
                            )
                        })
                        if (!isCurrent()) return
                        setCharacter((current) =>
                            current.id === characterToSave.id
                                ? {
                                      ...current,
                                      id: saved.id,
                                      name:
                                          current.name === character.name
                                              ? trimmedName
                                              : current.name,
                                      characterVersion: saved.characterVersion
                                  }
                                : current
                        )

                        notifications.show({
                            title: "Character saved",
                            message: `"${trimmedName}" was saved to your account.`,
                            color: "green",
                            autoClose: 3000
                        })

                        await startNewCharacter(isCurrent, persistence)
                        outcome = "success"
                        reason = undefined
                    } catch (error) {
                        outcome = "failure"
                        reason = "save_failed"
                        reportCharacterOperationFailure("save-and-start-new", error, {
                            characterId: character.id
                        })
                        notifications.show({
                            title: "Error saving character",
                            message:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to save current character",
                            color: "red"
                        })
                    } finally {
                        setIsSavingCurrentCharacter(false)
                    }
                },
                (refusal) => {
                    outcome = "refused"
                    reason = refusal === "busy" ? "busy" : "account_changed"
                }
            )
        } finally {
            finish(outcome, reason)
        }
    }

    const accountLabel = isAuthenticated ? "Your account" : isSigningIn ? "Signing in…" : "Sign in"

    const heroContainer: Variants = {
        hidden: {},
        shown: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.07 } }
    }
    const heroItem: Variants = {
        hidden: {
            opacity: 0,
            transform: shouldReduceMotion ? "translateY(0px)" : "translateY(14px)"
        },
        shown: {
            opacity: 1,
            transform: "translateY(0px)",
            transition: { duration: shouldReduceMotion ? 0.2 : 0.42, ease: motionTokens.curve.out }
        }
    }
    const heroTitle: Variants = {
        hidden: { opacity: 0, transform: shouldReduceMotion ? "scale(1)" : "scale(0.96)" },
        shown: {
            opacity: 1,
            transform: "scale(1)",
            transition: { duration: shouldReduceMotion ? 0.2 : 0.6, ease: motionTokens.curve.out }
        }
    }

    return (
        <div className="landing">
            <header className="landing__topbar">
                <AppTopbar />
            </header>

            <main>
                <section className="landing__hero" aria-labelledby="landing-title">
                    <div className="landing__hero-art" aria-hidden="true">
                        <img src={alley} alt="" decoding="async" />
                    </div>

                    <motion.div
                        className="landing__hero-inner"
                        variants={heroContainer}
                        initial="hidden"
                        animate="shown"
                    >
                        <HeroSigil />
                        <motion.p className="landing__eyebrow" variants={heroItem}>
                            Vampire: The Masquerade V5
                        </motion.p>
                        <motion.h1
                            id="landing-title"
                            className="landing__title"
                            variants={heroTitle}
                        >
                            Progeny
                        </motion.h1>
                        <motion.div variants={heroItem}>
                            <Ornament className="landing__hero-ornament" />
                        </motion.div>
                        <motion.p className="landing__lede" variants={heroItem}>
                            Guided and simplified character creation
                        </motion.p>
                        <motion.p className="landing__kicker" variants={heroItem}>
                            Create your character here and use it anywhere: export to PDF and
                            virtual tabletops, or play from the Progeny online character sheet.
                        </motion.p>

                        <motion.div className="landing__ctas" variants={heroItem}>
                            <Button
                                size="lg"
                                color="red"
                                className="landing__cta-primary"
                                leftSection={
                                    <img
                                        alt=""
                                        aria-hidden="true"
                                        className="landing__fangs"
                                        src={fangs}
                                    />
                                }
                                onClick={openGenerator}
                            >
                                Embrace a new character
                            </Button>
                            <Button
                                size="lg"
                                variant="default"
                                component={Link}
                                to="/sheet"
                                leftSection={<IconNotebook size={18} stroke={1.6} />}
                                className="landing__cta-secondary"
                            >
                                Open the sheet
                            </Button>
                            <Button
                                size="lg"
                                variant="subtle"
                                color="gray"
                                leftSection={<IconUserCircle size={18} stroke={1.6} />}
                                loading={!isAuthenticated && isSigningIn}
                                onClick={openAccountArea}
                                className="landing__cta-secondary"
                            >
                                {accountLabel}
                            </Button>
                        </motion.div>

                        <motion.p className="landing__meta" variants={heroItem}>
                            Feedback, requests or questions? Reach out to Odin on{" "}
                            {HERO_CONTACT_LINKS.map((link, index) => (
                                <span key={link.href}>
                                    <a href={link.href} target="_blank" rel="noreferrer">
                                        {link.label}
                                    </a>
                                    {index === HERO_CONTACT_LINKS.length - 2
                                        ? " or "
                                        : index < HERO_CONTACT_LINKS.length - 1
                                          ? ", "
                                          : ""}
                                </span>
                            ))}
                            <span className="landing__meta-break">
                                {" "}
                                Source code on{" "}
                                <a
                                    href={CONTACT_LINKS.github.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {CONTACT_LINKS.github.label}
                                </a>
                            </span>
                        </motion.p>
                    </motion.div>

                    <a href="#chapters" className="landing__scroll-cue">
                        <span>Read on</span>
                        <IconArrowDown size={14} stroke={1.6} aria-hidden="true" />
                    </a>
                </section>

                <section
                    id="chapters"
                    className="landing__chapters"
                    aria-labelledby="chapters-title"
                >
                    <div className="landing__container">
                        <div className="landing__intro">
                            <div className="landing__intro-heading">
                                <p className="landing__section-label">Stay a while and listen</p>
                                <h2 id="chapters-title" className="landing__section-title">
                                    Everything Progeny has to offer
                                </h2>
                            </div>
                            <p className="landing__intro-copy">
                                The creator is the first step. Progeny also gives you a dedicated
                                sheet for active play and account features for keeping your
                                chronicles organized.
                            </p>
                        </div>

                        <ol className="landing__chapter-index">
                            <Chapter
                                index={0}
                                id="creation-explainer"
                                plate={embracePlate}
                                plateFocus="58% 40%"
                                title="Guided character creation"
                                lead="Dead simple character creation."
                                bullets={[
                                    "Save and edit your character in your browser",
                                    "Export to PDF, an importable save file or to Foundry"
                                ]}
                                action={
                                    <Button
                                        color="red"
                                        rightSection={<IconArrowRight size={16} />}
                                        onClick={openGenerator}
                                    >
                                        Start creating
                                    </Button>
                                }
                            />
                            <Chapter
                                index={1}
                                id="sheet-explainer"
                                plate={sheetPlate}
                                plateFocus="50% 45%"
                                title="Character sheet"
                                lead="Move from creation into play."
                                bullets={[
                                    "Highly automated online character sheet",
                                    "Use free-edit or XP-spending mode to grow your character",
                                    "Powerful dice roller, including one-click rouse check and remorse rolls"
                                ]}
                                body={
                                    <p>
                                        The sheet is where a finished character becomes a table
                                        companion: review stats, manage Disciplines and merits,
                                        track play-state changes, and keep the character in front of
                                        you during sessions.
                                    </p>
                                }
                                action={
                                    <Button
                                        variant="default"
                                        component={Link}
                                        to="/sheet"
                                        rightSection={<IconArrowRight size={16} />}
                                    >
                                        Open sheet
                                    </Button>
                                }
                            />
                            <Chapter
                                index={2}
                                id="account-explainer"
                                plate={coteriePlate}
                                plateFocus="50% 50%"
                                title="Play online"
                                lead="Keep your chronicles organized online."
                                bullets={[
                                    "Create an account to manage your characters in the cloud",
                                    "Share your characters with your coterie",
                                    "Chat and auto-share dice rolls in play sessions"
                                ]}
                                body={
                                    <p>
                                        The account hub saves your characters, arranges them into
                                        coteries and shares read-only versions with your friends.
                                        Account features, like all of Progeny, are completely free.
                                    </p>
                                }
                                action={
                                    <Button
                                        variant="default"
                                        rightSection={<IconArrowRight size={16} />}
                                        loading={!isAuthenticated && isSigningIn}
                                        onClick={openAccountArea}
                                    >
                                        {isAuthenticated ? "Account" : accountLabel}
                                    </Button>
                                }
                            />
                        </ol>
                    </div>
                </section>

                <section className="landing__guide" aria-labelledby="guide-title">
                    <div className="landing__container">
                        <Panel
                            tone="ornate"
                            grain
                            p={{ base: 24, sm: 40, lg: 56 }}
                            className="landing__guide-panel"
                        >
                            <div className="landing__guide-copy">
                                <p className="landing__section-label">Feature guide</p>
                                <h2 id="guide-title" className="landing__section-title">
                                    Explore Progeny at your own pace
                                </h2>
                                <p className="landing__intro-copy">
                                    Walkthroughs, tips and visual references for every part of
                                    Progeny.
                                </p>
                                <Button
                                    variant="default"
                                    component={Link}
                                    to="/features"
                                    rightSection={<IconArrowRight size={16} />}
                                    onClick={() => trackFeatureGuideOpened("landing-page")}
                                    className="landing__guide-button"
                                >
                                    Explore the feature guide
                                </Button>
                            </div>
                            <nav className="landing__toc" aria-label="Feature guide contents">
                                <p className="landing__toc-label">Contents</p>
                                <ol>
                                    {GUIDE_CHAPTERS.map((chapter, index) => (
                                        <li key={chapter.to}>
                                            <Link
                                                to={chapter.to}
                                                className="landing__toc-link"
                                                onClick={() =>
                                                    trackFeatureGuideOpened("landing-page")
                                                }
                                            >
                                                <span className="landing__toc-title">
                                                    {chapter.title}
                                                </span>
                                                <span className="landing__toc-leader" />
                                                <span className="landing__toc-number">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                        </Panel>
                    </div>
                </section>
            </main>

            <footer className="landing__footer">
                <div className="landing__container landing__footer-inner">
                    <div className="landing__footer-brand">
                        <span className="landing__footer-wordmark">
                            <BrandMark size={20} />
                            Progeny
                        </span>
                        <Button
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                            onClick={openCredits}
                            className="landing__footer-credits"
                        >
                            Credits
                        </Button>
                    </div>

                    <nav className="landing__footer-links" aria-label="Contact">
                        <span className="landing__footer-label">Contact</span>
                        <SupportConversationButton
                            source="landing-page"
                            color="gray"
                            variant="subtle"
                            size="compact-sm"
                            className="landing__footer-support"
                        >
                            Contact Odin
                        </SupportConversationButton>
                        {FOOTER_LINKS.map((link) => (
                            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </footer>

            <Modal opened={creditsOpened} onClose={closeCredits} title="Credits" size="lg">
                <Stack gap="md" className="landing__credits">
                    <Text>
                        PDF template, FavIcon, discipline icons, and dice result icons by{" "}
                        <Anchor href="https://linktr.ee/nerdbert" target="_blank" rel="noreferrer">
                            Nerdbert
                        </Anchor>
                        .
                    </Text>
                    <Text>
                        Progeny is an independent project created under the{" "}
                        <Anchor
                            href="https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Dark Pack License
                        </Anchor>
                        .
                    </Text>
                    <Text>
                        Background images by Aleksandr Popov, Amber Kipp, Dominik Hofbauer, Marcus
                        Bellamy, Peter Scherbatykh, and Thomas Le on{" "}
                        <Anchor href="https://unsplash.com" target="_blank" rel="noreferrer">
                            Unsplash
                        </Anchor>
                        .
                    </Text>
                    <Text>
                        <Anchor
                            href="https://thenounproject.com/browse/icons/term/fangs/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Fangs icon
                        </Anchor>{" "}
                        by 선식 양 from the{" "}
                        <Anchor href="https://thenounproject.com" target="_blank" rel="noreferrer">
                            Noun Project
                        </Anchor>{" "}
                        (
                        <Anchor
                            href="https://creativecommons.org/licenses/by/3.0/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            CC BY 3.0
                        </Anchor>
                        ).
                    </Text>
                </Stack>
            </Modal>

            <StartNewCharacterModal
                opened={startNewCharacterModalOpened}
                onClose={closeStartNewCharacterModal}
                characterName={currentCharacterName}
                setCharacterName={setCurrentCharacterName}
                isCharacterNameEditable={!character.name.trim()}
                isSaving={isSavingCurrentCharacter}
                onContinueCurrent={continueCurrentCharacter}
                onSaveAndStartNew={saveCurrentCharacterAndStartNew}
            />
        </div>
    )
}
