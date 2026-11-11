import { Anchor, Button, List, Popover, Text, UnstyledButton } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
    IconArrowLeft,
    IconArrowRight,
    IconArrowUpRight,
    IconChevronDown,
    IconPhoto
} from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"
import SupportConversationButton from "~/components/SupportConversationButton"
import { PageHeader, PageShell, Panel } from "~/components/ui"
import nicknameImage from "~/assets/feature-docs-images/account/1nickname.jpeg"
import charactersImage from "~/assets/feature-docs-images/account/2characters.jpeg"
import creatorImage from "~/assets/feature-docs-images/character-creation/creator.jpeg"
import exportImage from "~/assets/feature-docs-images/character-creation/export.png"
import importExportImage from "~/assets/feature-docs-images/character-creation/import-export.jpeg"
import landingImage from "~/assets/feature-docs-images/character-creation/landing.jpeg"
import coteriesImage from "~/assets/feature-docs-images/coteries/1coteries.jpeg"
import coterieDetailsImage from "~/assets/feature-docs-images/coteries/2details.jpeg"
import rollDiceImage from "~/assets/feature-docs-images/character-sheet/1roll-dice.png"
import rerollImage from "~/assets/feature-docs-images/character-sheet/2reroll.png"
import selectedPoolImage from "~/assets/feature-docs-images/character-sheet/3selected-pool.png"
import quickRollImage from "~/assets/feature-docs-images/character-sheet/4quickroll.png"
import modesImage from "~/assets/feature-docs-images/character-sheet/5modes.png"
import healthWillpowerHungerImage from "~/assets/feature-docs-images/character-sheet/6health-wp-hunger.png"
import menuImage from "~/assets/feature-docs-images/character-sheet/7menu.jpeg"
import chatImage from "~/assets/feature-docs-images/character-sheet/8chat.png"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { useAuth } from "~/hooks/useAuth"
import { trackFeatureGuideNavigationSelected } from "~/utils/analytics"
import "./FeaturesPage.css"

type FeatureSection = {
    id: string
    title: string
    content?: ReactNode
}

type FeaturePageId =
    | "character-creation"
    | "character-sheet"
    | "account-and-multiple-characters"
    | "coteries"
    | "credits-and-contact"

type FeaturePagePath = `/features/${FeaturePageId}`

type FeaturePage = {
    id: FeaturePageId
    title: string
    path: FeaturePagePath
    intro?: ReactNode
    sections: FeatureSection[]
}

const featurePages: FeaturePage[] = [
    {
        id: "character-creation",
        title: "Character creation",
        path: "/features/character-creation",
        sections: [
            {
                id: "guided-creation",
                title: "Guided creation",
                content: (
                    <>
                        <Text component="p">
                            The character generator is purpose-built for helping beginners create
                            fully fleshed out characters. Experienced players can still use it to
                            create characters quickly, or use the free-edit mode on the{" "}
                            <Anchor component={Link} to="/sheet">
                                Character Sheet
                            </Anchor>{" "}
                            to create their character without constraints.
                        </Text>
                        <Text component="p">
                            Simply click “Embrace a new Character” on the{" "}
                            <Anchor component={Link} to="/">
                                home page
                            </Anchor>{" "}
                            to get started, and then follow the prompts.
                        </Text>
                        <FeatureImage
                            src={landingImage}
                            alt="Progeny landing page with the Embrace a New Character button"
                        />
                        <Text component="p">
                            You can use the side bar to navigate between steps and change your mind
                            on previous entries, for example, change attributes after picking your
                            disciplines. Some choices will reset other choices. If you pick a
                            different clan, it will reset your chosen discipline as the new clan has
                            access to a different set of disciplines.
                        </Text>
                        <Text component="p">
                            On the left you will see a live-updated overview of your character as
                            you build it (not shown on small screens).
                        </Text>
                        <FeatureImage
                            src={creatorImage}
                            alt="Progeny guided character creator with a character overview"
                        />
                    </>
                )
            },
            {
                id: "saving-and-exporting",
                title: "Saving and exporting",
                content: (
                    <>
                        <Text component="p">
                            By default, your character will be saved in your browser. This means
                            that clearing your browser data may delete your character. To keep your
                            character safe, you can download it as a <code>.json</code> file, and
                            re-import it later.
                        </Text>
                        <FeatureImage
                            src={importExportImage}
                            alt="Progeny import and export options"
                        />
                        <Text component="p">
                            You can also sign up for a free account to save your character in the
                            cloud. This also lets you easily create and manage multiple characters
                            in Progeny.
                        </Text>
                        <Text component="p">
                            If you want to use your character outside of Progeny, you can export it
                            to Inconnu or Foundry VTT (WoD5E). You can find detailed instructions on
                            the export page.
                        </Text>
                        <FeatureImage src={exportImage} alt="Progeny character export options" />
                    </>
                )
            }
        ]
    },
    {
        id: "character-sheet",
        title: "Character sheet",
        path: "/features/character-sheet",
        intro: (
            <Text component="p">
                The{" "}
                <Anchor component={Link} to="/sheet">
                    character sheet
                </Anchor>{" "}
                allows you to play online, roll dice, and edit your character by spending XP or
                using the free edit mode.
            </Text>
        ),
        sections: [
            {
                id: "rolling-dice",
                title: "Rolling dice",
                content: (
                    <>
                        <Text component="p">
                            By clicking the dice button on the top right, you can open the dice roll
                            modal. Here you can either free-roll a number of dice, or roll with a
                            pool selected from your attributes, skills, and disciplines.
                        </Text>
                        <FeatureImage
                            src={rollDiceImage}
                            alt="Character sheet dice rolling modal"
                        />
                        <Text component="p">
                            After a roll, you can click non-hunger dice to reroll them using
                            willpower.
                        </Text>
                        <FeatureImage
                            src={rerollImage}
                            alt="Character sheet dice roll results with reroll options"
                        />
                        <Text component="p">
                            You can also click the blood drop icon to quickly roll a rouse check.
                            Your hunger will be updated automatically.
                        </Text>
                        <Text component="p">
                            While on the “Selected Pool” tab, you can click attributes, skills, or
                            disciplines on your sheet to roll their value. The dice roller will
                            automatically offer other modifiers that may apply, like Blood Surge,
                            bonuses from merits, and bonuses from disciplines.
                        </Text>
                        <FeatureImage
                            src={selectedPoolImage}
                            alt="Character sheet selected dice pool tab"
                        />
                        <Text component="p">
                            The character sheet has quick-roll buttons for rouse checks next to your
                            hunger, and for remorse checks next to your humanity.
                        </Text>
                        <FeatureImage
                            src={quickRollImage}
                            alt="Character sheet quick-roll controls"
                        />
                    </>
                )
            },
            {
                id: "editing-your-character",
                title: "Editing your character",
                content: (
                    <>
                        <FeatureImage src={modesImage} alt="Character sheet play mode selector" />
                        <Text component="p">
                            While in play mode, you can only edit the dynamic parts of your
                            character: taken damage on your health, willpower, humanity, and hunger.
                            Health and willpower damage is filled from left to right. One click
                            indicates superficial damage, two clicks indicate aggravated damage.
                            Clicking again clears the damage. Humanity stains fill from right to
                            left.
                        </Text>
                        <FeatureImage
                            src={healthWillpowerHungerImage}
                            alt="Character sheet health, willpower, and hunger controls"
                        />
                        <Text component="p">
                            In XP mode and Free edit mode you can change all aspects of your
                            character. XP is spent automatically in XP mode, and you can’t spend
                            more than you have.
                        </Text>
                        <Text component="p">
                            Free edit mode lets you switch your clan bane to the alternative bane
                            option.
                        </Text>
                        <Text component="p">
                            To remove skill specialties, click the specialty to edit it, then remove
                            the text to leave an empty input box and confirm. You can’t manually
                            remove specialties that you got through predator types.
                        </Text>
                    </>
                )
            },
            {
                id: "managing-your-character",
                title: "Managing your character",
                content: (
                    <>
                        <Text component="p">
                            For proper multi-character management, use the{" "}
                            <Anchor component={Link} to="/features/account-and-multiple-characters">
                                Account page
                            </Anchor>
                            . In the character sheet, you can open the menu with the hamburger
                            button on the bottom right. Here you can download your character as a
                            PDF, save it to a file or load it, or export to other VtM character
                            keepers.
                        </Text>
                        <Text component="p">
                            You can also change your preferred character sheet color here, provide
                            feedback or ask for support (requires that you accepted cookies), and
                            open the dialog to see recent changes to Progeny.
                        </Text>
                        <FeatureImage src={menuImage} alt="Character sheet menu" />
                    </>
                )
            },
            {
                id: "playing-online",
                title: "Playing online",
                content: (
                    <>
                        <Text component="p">
                            You can create and join chats to play with friends online. These chat
                            messages are not stored long-term and will be deleted after the chat was
                            inactive for some time for privacy. By default, all your dice rolls are
                            shared automatically in chat.
                        </Text>
                        <FeatureImage src={chatImage} alt="Character sheet chat" />
                        <Text component="p">Using chat requires that you are signed in.</Text>
                    </>
                )
            }
        ]
    },
    {
        id: "account-and-multiple-characters",
        title: "Account & Multiple Characters",
        path: "/features/account-and-multiple-characters",
        sections: [
            {
                id: "account",
                title: "Account",
                content: (
                    <>
                        <Text component="p">
                            You can <AccountLink>create a free account</AccountLink> either via SSO
                            or just email and password. Progeny features that rely on the server
                            require you to be signed in:
                        </Text>
                        <List withPadding>
                            <List.Item>
                                Storing characters in the cloud and switching between them
                            </List.Item>
                            <List.Item>Creating or joining a friend’s Coterie</List.Item>
                            <List.Item>Creating or joining chats</List.Item>
                            <List.Item>Using the live-updating Coterie page</List.Item>
                            <List.Item>
                                Taking personal notes on your character or Coterie
                            </List.Item>
                        </List>
                        <Text component="p">And then some more.</Text>
                    </>
                )
            },
            {
                id: "managing-your-account",
                title: "Managing your account",
                content: (
                    <>
                        <List withPadding>
                            <List.Item>
                                Give yourself a nickname to be displayed to other players you
                                interact with on Progeny—this way your email address stays private.
                            </List.Item>
                            <List.Item>
                                If you don’t set a username, parts of your email address may be used
                                as a placeholder nickname.
                            </List.Item>
                            <List.Item>
                                You can delete your account by sending me a message on any platform
                                or in support chat.{" "}
                                <Anchor component={Link} to="/features/credits-and-contact">
                                    See more.
                                </Anchor>
                            </List.Item>
                        </List>
                        <FeatureImage src={nicknameImage} alt="Account page nickname settings" />
                    </>
                )
            },
            {
                id: "managing-characters",
                title: "Managing characters",
                content: (
                    <>
                        <Text component="p">
                            On the account page, you can save your current character, create an
                            empty character, or load one of your existing characters. You can also
                            load a new character from a <code>json</code> save file.
                        </Text>
                        <FeatureImage
                            src={charactersImage}
                            alt="Account page character management"
                        />
                        <Text component="p">
                            Loading a new character automatically saves your previous character, so
                            you won’t lose your changes.
                        </Text>
                        <Text component="p">
                            You can also share your characters with other players by their nickname.
                            Those players will be able to see your character and any changes you
                            make to it, but they won’t be able to make edits to your character.
                        </Text>
                    </>
                )
            },
            {
                id: "coteries",
                title: "Coteries",
                content: (
                    <Text component="p">
                        You can create and manage coteries on the{" "}
                        <AccountLink>account page</AccountLink>. For details, see{" "}
                        <Anchor component={Link} to="/features/coteries">
                            Coteries features.
                        </Anchor>
                    </Text>
                )
            }
        ]
    },
    {
        id: "coteries",
        title: "Coteries & Playing Together",
        path: "/features/coteries",
        sections: [
            {
                id: "coteries",
                title: "Coteries",
                content: (
                    <>
                        <Text component="p">
                            You can create and manage coteries on your{" "}
                            <AccountLink>account page</AccountLink>. You can invite your friends to
                            a coterie to play together. Everyone can add their character and share a
                            live summary and updates of their characters. Everyone can see the
                            current level of health, hunger, and willpower of all characters.
                        </Text>
                        <FeatureImage src={coteriesImage} alt="Account page coterie management" />
                        <Text component="p">
                            Coteries come with a coterie-specific chat that all members can join at
                            any time. This chat works like any other chat on Progeny: auto-shared
                            dice rolls and ephemeral messages that will be deleted after the chat is
                            inactive for a bit.
                        </Text>
                    </>
                )
            },
            {
                id: "coterie-details-view",
                title: "Coterie details view",
                content: (
                    <>
                        <Text component="p">
                            Every member of a coterie can go to the coterie’s details view by
                            clicking the “View” button. Here you can see a summary of everyone’s
                            character sheet and the coterie chat. Everyone can also take private
                            notes on the coterie or chronicle here. These notes are <em>not</em>{" "}
                            shared with other players or the Storyteller.
                        </Text>
                        <FeatureImage
                            src={coterieDetailsImage}
                            alt="Coterie details page with character summaries and chat"
                        />
                    </>
                )
            }
        ]
    },
    {
        id: "credits-and-contact",
        title: "Credits & Contact",
        path: "/features/credits-and-contact",
        sections: [
            {
                id: "contact-odin",
                title: "Contact Odin",
                content: (
                    <>
                        <Text component="p">
                            You can contact me with feedback, support requests or anything else
                            that&apos;s on your mind. I love hearing from you!
                        </Text>
                        <Text component="p">
                            I may take up to a week to reply.{" "}
                            <Anchor href={CONTACT_LINKS.kofi.href} target="_blank" rel="noreferrer">
                                Ko-Fi
                            </Anchor>{" "}
                            supporters get priority support &lt;3
                        </Text>
                        <List withPadding>
                            <List.Item>
                                <Anchor
                                    href={CONTACT_LINKS.website.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Odin&apos;s blog
                                </Anchor>
                            </List.Item>
                            <List.Item>
                                <Anchor
                                    href={CONTACT_LINKS.reddit.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {CONTACT_LINKS.reddit.label}
                                </Anchor>
                            </List.Item>
                            <List.Item>
                                <Anchor
                                    href={CONTACT_LINKS.github.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Progeny on GitHub
                                </Anchor>
                            </List.Item>
                            <List.Item>
                                <Anchor
                                    href={CONTACT_LINKS.bluesky.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {CONTACT_LINKS.bluesky.label}
                                </Anchor>
                            </List.Item>
                            <List.Item>
                                <Anchor
                                    href={CONTACT_LINKS.kofi.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {CONTACT_LINKS.kofi.label}
                                </Anchor>
                            </List.Item>
                            <List.Item>
                                <SupportConversationButton source="features-page">
                                    Open support chat
                                </SupportConversationButton>
                            </List.Item>
                        </List>
                    </>
                )
            },
            {
                id: "credits",
                title: "Credits",
                content: (
                    <>
                        <Text component="p">
                            This is an independent production and is not affiliated with or endorsed
                            by World of Darkness, Paradox Interactive, or any of their subsidiaries.
                        </Text>
                        <Text component="p">
                            This tool is created under the{" "}
                            <Anchor
                                href="https://www.worldofdarkness.com/dark-pack"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Dark Pack License
                            </Anchor>
                            .
                        </Text>
                        <Text component="p">
                            Vampire: The Masquerade and World of Darkness are trademarks of Paradox
                            Interactive. All rights reserved.
                        </Text>
                        <List withPadding>
                            <List.Item>
                                The PDF template used for exporting was provided by{" "}
                                <Anchor
                                    href="https://linktr.ee/nerdbert"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Nerdbert
                                </Anchor>
                                .
                            </List.Item>
                            <List.Item>
                                FavIcon, discipline icons, and dice result icons were provided by{" "}
                                <Anchor
                                    href="https://drive.google.com/drive/folders/166CN03nsT6VF-cjjttS0uBfvMZRoNqgK"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Nerdbert
                                </Anchor>
                                .
                            </List.Item>
                            <List.Item>CheckSolid.base64 is converted from Font Awesome.</List.Item>
                            <List.Item>
                                <Anchor
                                    href="https://thenounproject.com/browse/icons/term/fangs/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Fangs icon
                                </Anchor>{" "}
                                by 선식 양 from the{" "}
                                <Anchor
                                    href="https://thenounproject.com"
                                    target="_blank"
                                    rel="noreferrer"
                                >
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
                            </List.Item>
                            <List.Item>
                                Background images by Aleksandr Popov, Amber Kipp, Dominik Hofbauer,
                                Marcus Bellamy, Peter Scherbatykh, and Thomas Le on{" "}
                                <Anchor
                                    href="https://unsplash.com"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Unsplash
                                </Anchor>
                                .
                            </List.Item>
                            <List.Item>
                                <Anchor
                                    href="https://fonts.google.com/specimen/Roboto"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Roboto
                                </Anchor>{" "}
                                font by Google Fonts.
                            </List.Item>
                        </List>
                    </>
                )
            }
        ]
    }
]

const chapterNumber = (index: number) => String(index + 1).padStart(2, "0")

function ImagePlaceholder({ label = "Image coming soon" }: { label?: string }) {
    return (
        <div className="features__placeholder">
            <IconPhoto size={22} stroke={1.4} />
            <span>{label}</span>
        </div>
    )
}

/** A screenshot set like a plate in a rulebook: framed, with its description as caption. */
function FeatureImage({ src, alt }: { src: string; alt: string }) {
    return (
        <figure className="features__plate">
            <img src={src} alt={alt} loading="lazy" decoding="async" />
            <figcaption aria-hidden="true">{alt}</figcaption>
        </figure>
    )
}

function AccountLink({ children }: { children: ReactNode }) {
    const { isAuthenticated, signIn } = useAuth()

    return isAuthenticated ? (
        <Anchor component={Link} to="/me">
            {children}
        </Anchor>
    ) : (
        <Anchor component="button" type="button" onClick={signIn}>
            {children}
        </Anchor>
    )
}

/** Tracks which section of the current chapter is being read, for the contents highlight. */
function useActiveSection(sectionIds: string[]) {
    const [activeId, setActiveId] = useState<string | undefined>(sectionIds[0])
    const key = sectionIds.join("|")

    useEffect(() => {
        const ids = key.split("|")
        setActiveId(ids[0])
        if (typeof IntersectionObserver === "undefined") return

        const visible = new Map<string, boolean>()
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
                const firstVisible = ids.find((id) => visible.get(id))
                if (firstVisible) setActiveId(firstVisible)
            },
            { rootMargin: "-96px 0px -55% 0px" }
        )
        for (const id of ids) {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        }
        return () => observer.disconnect()
    }, [key])

    return activeId
}

type FeaturesPageProps = {
    pageId: FeaturePageId
}

export default function FeaturesPage({ pageId }: FeaturesPageProps) {
    const { isAuthenticated, isSigningIn, signIn } = useAuth()
    const [mobileNavigationOpened, { toggle: toggleMobileNavigation, close: closeNavigation }] =
        useDisclosure(false)

    const currentPageIndex = featurePages.findIndex((page) => page.id === pageId)
    const currentPage = featurePages[currentPageIndex]
    const previousPage = currentPageIndex > 0 ? featurePages[currentPageIndex - 1] : undefined
    const nextPage = featurePages[(currentPageIndex + 1) % featurePages.length]
    const nextWrapsAround = currentPageIndex === featurePages.length - 1
    const showsAccountAction = pageId === "account-and-multiple-characters" || pageId === "coteries"
    const activeSectionId = useActiveSection(currentPage.sections.map((section) => section.id))
    const activeSection = currentPage.sections.find((section) => section.id === activeSectionId)

    const navigation = (
        <nav className="features__contents" aria-label="Feature guide">
            <p className="features__contents-label">Contents</p>
            <ol className="features__chapters">
                {featurePages.map((page, pageIndex) => {
                    const isCurrent = page.id === pageId
                    return (
                        <li key={page.id} data-current={isCurrent || undefined}>
                            <Link
                                to={page.path}
                                aria-current={isCurrent ? "page" : undefined}
                                onClick={() => {
                                    trackFeatureGuideNavigationSelected({ page: page.id })
                                    closeNavigation()
                                }}
                                className="features__chapter-link"
                            >
                                <span className="features__chapter-number">
                                    {chapterNumber(pageIndex)}
                                </span>
                                <span>{page.title}</span>
                            </Link>
                            <ol className="features__sections">
                                {page.sections.map((section) => (
                                    <li key={section.id}>
                                        <Link
                                            to={page.path}
                                            hash={section.id}
                                            data-active={
                                                (isCurrent && section.id === activeSectionId) ||
                                                undefined
                                            }
                                            onClick={() => {
                                                trackFeatureGuideNavigationSelected({
                                                    page: page.id,
                                                    section: section.id
                                                })
                                                closeNavigation()
                                            }}
                                            className="features__section-link"
                                        >
                                            {section.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )

    const contextAction =
        pageId === "character-sheet" ? (
            <Button
                variant="default"
                component={Link}
                to="/sheet"
                rightSection={<IconArrowUpRight size={16} />}
            >
                Open character sheet
            </Button>
        ) : showsAccountAction && isAuthenticated ? (
            <Button
                variant="default"
                component={Link}
                to="/me"
                rightSection={<IconArrowUpRight size={16} />}
            >
                Your account
            </Button>
        ) : showsAccountAction ? (
            <Button
                variant="default"
                onClick={signIn}
                loading={isSigningIn}
                rightSection={<IconArrowUpRight size={16} />}
            >
                {isSigningIn ? "Signing up…" : "Sign up"}
            </Button>
        ) : (
            <Button
                variant="default"
                component={Link}
                to="/create"
                rightSection={<IconArrowUpRight size={16} />}
            >
                Create a character
            </Button>
        )

    return (
        <PageShell size="lg">
            <div className="features">
                <PageHeader
                    eyebrow={`Progeny feature guide · Chapter ${chapterNumber(currentPageIndex)}`}
                    title={currentPage.title}
                    actions={contextAction}
                />

                <div className="features__mobile-navigation">
                    <Popover
                        opened={mobileNavigationOpened}
                        onChange={(opened) => (opened ? undefined : closeNavigation())}
                        position="bottom"
                        width="target"
                        offset={6}
                        trapFocus={false}
                    >
                        <Popover.Target>
                            <UnstyledButton
                                className="features__mobile-toggle"
                                onClick={toggleMobileNavigation}
                                aria-label="Toggle feature guide navigation"
                                aria-expanded={mobileNavigationOpened}
                                data-opened={mobileNavigationOpened || undefined}
                            >
                                <span className="features__mobile-toggle-label">Contents</span>
                                <span className="features__mobile-toggle-current">
                                    {activeSection?.title ?? currentPage.title}
                                </span>
                                <IconChevronDown size={16} className="features__mobile-chevron" />
                            </UnstyledButton>
                        </Popover.Target>
                        <Popover.Dropdown className="features__mobile-dropdown">
                            {navigation}
                        </Popover.Dropdown>
                    </Popover>
                </div>

                <div className="features__layout">
                    <aside className="features__sidebar">{navigation}</aside>

                    <article className="features__article" id={currentPage.id}>
                        {currentPage.intro ? (
                            <div className="features__intro">{currentPage.intro}</div>
                        ) : null}

                        {currentPage.sections.map((section, sectionIndex) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="features__section"
                                aria-labelledby={`${section.id}-title`}
                            >
                                <h2 id={`${section.id}-title`} className="features__section-title">
                                    <span className="features__section-number">
                                        {currentPageIndex + 1}.{sectionIndex + 1}
                                    </span>
                                    {section.title}
                                </h2>
                                {section.content ? (
                                    <div className="features__prose">{section.content}</div>
                                ) : (
                                    <ImagePlaceholder label="Content and screenshots coming soon" />
                                )}
                            </section>
                        ))}

                        <nav className="features__pager" aria-label="Chapters">
                            {previousPage ? (
                                <Panel
                                    component={Link}
                                    to={previousPage.path}
                                    interactive
                                    p="lg"
                                    className="features__pager-link"
                                    data-direction="previous"
                                    onClick={() =>
                                        trackFeatureGuideNavigationSelected({
                                            page: previousPage.id
                                        })
                                    }
                                >
                                    <IconArrowLeft size={18} className="features__pager-icon" />
                                    <span className="features__pager-text">
                                        <span className="features__pager-label">
                                            Previous chapter
                                        </span>
                                        <span className="features__pager-title">
                                            {previousPage.title}
                                        </span>
                                    </span>
                                </Panel>
                            ) : (
                                <span aria-hidden="true" />
                            )}
                            <Panel
                                component={Link}
                                to={nextPage.path}
                                interactive
                                p="lg"
                                className="features__pager-link"
                                data-direction="next"
                                onClick={() =>
                                    trackFeatureGuideNavigationSelected({
                                        page: nextPage.id
                                    })
                                }
                            >
                                <span className="features__pager-text">
                                    <span className="features__pager-label">
                                        {nextWrapsAround ? "Back to the start" : "Next chapter"}
                                    </span>
                                    <span className="features__pager-title">{nextPage.title}</span>
                                </span>
                                <IconArrowRight size={18} className="features__pager-icon" />
                            </Panel>
                        </nav>
                    </article>
                </div>
            </div>
        </PageShell>
    )
}
