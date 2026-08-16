import {
    Anchor,
    AppShell,
    Box,
    Burger,
    Container,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconArrowUpRight, IconBook2, IconPhoto } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import AppTopbar from "~/components/AppTopbar"
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
        sections: [
            { id: "playing-online", title: "Playing online" },
            { id: "rolling-dice", title: "Rolling dice" }
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

function ImagePlaceholder() {
    return (
        <Paper className="features-page__placeholder" radius="md">
            <IconPhoto size={22} stroke={1.4} />
            <Text>Image coming soon</Text>
        </Paper>
    )
}

type FeaturesPageProps = {
    pageId: FeaturePageId
}

export default function FeaturesPage({ pageId }: FeaturesPageProps) {
    const [
        mobileNavigationOpened,
        { toggle: toggleMobileNavigation, close: closeMobileNavigation }
    ] = useDisclosure(false)

    const closeNavigation = () => closeMobileNavigation()

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
                                <Anchor
                                    component={Link}
                                    to="/create"
                                    className="features-page__creator-link"
                                >
                                    Create a character <IconArrowUpRight size={16} />
                                </Anchor>
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
                            {featurePages
                                .filter((page) => page.id === pageId)
                                .map((page) => (
                                    <section
                                        key={page.id}
                                        id={page.id}
                                        className="features-page__page"
                                    >
                                        <Text className="features-page__page-number">
                                            {String(featurePages.indexOf(page) + 1).padStart(
                                                2,
                                                "0"
                                            )}
                                        </Text>
                                        <Title order={2} className="features-page__page-title">
                                            {page.title}
                                        </Title>
                                        <Stack gap="xl" mt="xl">
                                            {page.sections.map((section) => (
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
                                                            <Text>
                                                                Content and screenshots coming soon
                                                            </Text>
                                                        </Paper>
                                                    )}
                                                </section>
                                            ))}
                                        </Stack>
                                    </section>
                                ))}

                            <Paper className="features-page__contribute" radius="md">
                                <IconBook2 size={20} />
                                <Text>More feature pages can be added here as Progeny grows.</Text>
                            </Paper>
                        </main>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </Box>
    )
}
