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
import AppTopbar from "~/components/AppTopbar"
import "./FeaturesPage.css"

type FeatureSection = {
    id: string
    title: string
}

type FeaturePage = {
    id: string
    title: string
    sections: FeatureSection[]
}

const featurePages: FeaturePage[] = [
    {
        id: "getting-started",
        title: "Getting started",
        sections: [
            { id: "welcome", title: "Welcome to Progeny" },
            { id: "your-character", title: "Your character" }
        ]
    },
    {
        id: "character-creation",
        title: "Character creation",
        sections: [
            { id: "guided-creation", title: "Guided creation" },
            { id: "saving-and-exporting", title: "Saving and exporting" }
        ]
    },
    {
        id: "character-sheet",
        title: "Character sheet",
        sections: [
            { id: "playing-online", title: "Playing online" },
            { id: "rolling-dice", title: "Rolling dice" }
        ]
    },
    {
        id: "account-and-coteries",
        title: "Account & coteries",
        sections: [
            { id: "your-account", title: "Your account" },
            { id: "playing-together", title: "Playing together" }
        ]
    }
]

export default function FeaturesPage() {
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
                        href={`#${page.id}`}
                        onClick={closeNavigation}
                        className="features-page__page-link"
                    >
                        {page.title}
                    </Anchor>
                    <Stack gap={2} mt={5} className="features-page__section-links">
                        {page.sections.map((section) => (
                            <Anchor
                                key={section.id}
                                href={`#${section.id}`}
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
                            {featurePages.map((page, pageIndex) => (
                                <section key={page.id} id={page.id} className="features-page__page">
                                    {pageIndex > 0 ? (
                                        <Divider className="features-page__page-divider" />
                                    ) : null}
                                    <Text className="features-page__page-number">
                                        {String(pageIndex + 1).padStart(2, "0")}
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
                                                <Paper
                                                    className="features-page__placeholder"
                                                    radius="md"
                                                >
                                                    <IconPhoto size={22} stroke={1.4} />
                                                    <Text>Content and screenshots coming soon</Text>
                                                </Paper>
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
