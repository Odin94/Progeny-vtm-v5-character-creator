import {
    Anchor,
    AppShell,
    Box,
    Burger,
    Button,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconArrowRight, IconArrowUpRight, IconPhoto } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import AppTopbar from "~/components/AppTopbar"
import { useAuth } from "~/hooks/useAuth"
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
                        <ImagePlaceholder />
                        <Text component="p">
                            Simply click “Embrace a new Character” on the{" "}
                            <Anchor component={Link} to="/">
                                home page
                            </Anchor>{" "}
                            to get started, and then follow the prompts.
                        </Text>
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
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
                        <Text component="p">
                            After a roll, you can click non-hunger dice to reroll them using
                            willpower.
                        </Text>
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
                        <Text component="p">
                            The character sheet has quick-roll buttons for rouse checks next to your
                            hunger, and for remorse checks next to your humanity.
                        </Text>
                        <ImagePlaceholder />
                    </>
                )
            },
            {
                id: "editing-your-character",
                title: "Editing your character",
                content: (
                    <>
                        <ImagePlaceholder label="Play modes image coming soon" />
                        <Text component="p">
                            While in play mode, you can only edit the dynamic parts of your
                            character: taken damage on your health, willpower, humanity, and hunger.
                            Health and willpower damage is filled from left to right. One click
                            indicates superficial damage, two clicks indicate aggravated damage.
                            Clicking again clears the damage. Humanity stains fill from right to
                            left.
                        </Text>
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
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
                        <ImagePlaceholder />
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
        sections: [{ id: "your-account", title: "Your account" }]
    },
    {
        id: "coteries",
        title: "Coteries",
        path: "/features/coteries",
        sections: [{ id: "playing-together", title: "Playing together" }]
    }
]

function ImagePlaceholder({ label = "Image coming soon" }: { label?: string }) {
    return (
        <Paper className="features-page__placeholder" radius="md">
            <IconPhoto size={22} stroke={1.4} />
            <Text>{label}</Text>
        </Paper>
    )
}

type FeaturesPageProps = {
    pageId: FeaturePageId
}

export default function FeaturesPage({ pageId }: FeaturesPageProps) {
    const { isAuthenticated, isSigningIn, signIn } = useAuth()
    const [
        mobileNavigationOpened,
        { toggle: toggleMobileNavigation, close: closeMobileNavigation }
    ] = useDisclosure(false)

    const closeNavigation = () => closeMobileNavigation()
    const currentPageIndex = featurePages.findIndex((page) => page.id === pageId)
    const currentPage = featurePages[currentPageIndex]
    const nextPage = featurePages[(currentPageIndex + 1) % featurePages.length]
    const showsAccountAction = pageId === "account-and-multiple-characters" || pageId === "coteries"

    const navigation = (
        <Stack gap="xs" className="features-page__navigation">
            <Text className="features-page__navigation-label">Feature guide</Text>
            {featurePages.map((page) => (
                <Box key={page.id}>
                    <Anchor
                        component={Link}
                        to={page.path}
                        onClick={closeNavigation}
                        className="features-page__page-link"
                    >
                        {page.title}
                    </Anchor>
                    <Stack gap={2} mt={5} className="features-page__section-links">
                        {page.sections.map((section) => (
                            <Anchor
                                key={section.id}
                                component={Link}
                                to={page.path}
                                hash={section.id}
                                onClick={closeNavigation}
                                className="features-page__section-link"
                            >
                                {section.title}
                            </Anchor>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    )

    return (
        <Box className="features-page">
            <AppShell header={{ height: 64 }} padding={0}>
                <AppShell.Header className="features-page__header">
                    <AppTopbar />
                </AppShell.Header>

                <AppShell.Main>
                    <Box className="features-page__masthead">
                        <Container size="lg" className="features-page__masthead-inner">
                            <Group justify="space-between" align="flex-end" gap="md">
                                <Stack gap="xs">
                                    <Text className="features-page__eyebrow">Progeny guide</Text>
                                    <Title order={1} className="features-page__title">
                                        Features
                                    </Title>
                                </Stack>
                                {pageId === "character-sheet" ? (
                                    <Anchor
                                        component={Link}
                                        to="/sheet"
                                        className="features-page__creator-link"
                                    >
                                        Open character sheet <IconArrowUpRight size={16} />
                                    </Anchor>
                                ) : showsAccountAction && isAuthenticated ? (
                                    <Anchor
                                        component={Link}
                                        to="/me"
                                        className="features-page__creator-link"
                                    >
                                        Your account <IconArrowUpRight size={16} />
                                    </Anchor>
                                ) : showsAccountAction ? (
                                    <Anchor
                                        component="button"
                                        type="button"
                                        onClick={signIn}
                                        className="features-page__creator-link"
                                    >
                                        {isSigningIn ? "Signing up…" : "Sign up"}{" "}
                                        <IconArrowUpRight size={16} />
                                    </Anchor>
                                ) : (
                                    <Anchor
                                        component={Link}
                                        to="/create"
                                        className="features-page__creator-link"
                                    >
                                        Create a character <IconArrowUpRight size={16} />
                                    </Anchor>
                                )}
                            </Group>
                        </Container>
                    </Box>

                    <Container size="lg" className="features-page__layout">
                        <aside className="features-page__sidebar">{navigation}</aside>

                        <Box className="features-page__mobile-navigation">
                            <Group justify="space-between">
                                <Text fw={600}>Browse this guide</Text>
                                <Burger
                                    opened={mobileNavigationOpened}
                                    onClick={toggleMobileNavigation}
                                    aria-label="Toggle feature guide navigation"
                                    color="var(--features-gold)"
                                    size="sm"
                                />
                            </Group>
                            {mobileNavigationOpened ? <Box mt="md">{navigation}</Box> : null}
                        </Box>

                        <main className="features-page__content">
                            <section id={currentPage.id} className="features-page__page">
                                <Text className="features-page__page-number">
                                    {String(currentPageIndex + 1).padStart(2, "0")}
                                </Text>
                                <Title order={2} className="features-page__page-title">
                                    {currentPage.title}
                                </Title>
                                {currentPage.intro ? (
                                    <Stack
                                        gap="md"
                                        mt="md"
                                        className="features-page__section-content"
                                    >
                                        {currentPage.intro}
                                    </Stack>
                                ) : null}
                                <Stack gap="xl" mt="xl">
                                    {currentPage.sections.map((section) => (
                                        <section
                                            key={section.id}
                                            id={section.id}
                                            className="features-page__section"
                                        >
                                            <Title
                                                order={3}
                                                className="features-page__section-title"
                                            >
                                                {section.title}
                                            </Title>
                                            {section.content ? (
                                                <Stack
                                                    gap="md"
                                                    mt="md"
                                                    className="features-page__section-content"
                                                >
                                                    {section.content}
                                                </Stack>
                                            ) : (
                                                <Paper
                                                    className="features-page__placeholder"
                                                    radius="md"
                                                >
                                                    <IconPhoto size={22} stroke={1.4} />
                                                    <Text>Content and screenshots coming soon</Text>
                                                </Paper>
                                            )}
                                        </section>
                                    ))}
                                </Stack>
                            </section>

                            <Group justify="flex-end" mt="5rem">
                                <Button
                                    component={Link}
                                    to={nextPage.path}
                                    rightSection={<IconArrowRight size={16} />}
                                    className="features-page__next-page"
                                >
                                    {nextPage.title}
                                </Button>
                            </Group>
                        </main>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </Box>
    )
}
