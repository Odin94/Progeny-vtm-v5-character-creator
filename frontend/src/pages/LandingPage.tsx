import { Anchor, Box, Button, Card, Container, Grid, Group, List, Modal, Stack, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
    IconBook2,
    IconChevronDown,
    IconDropletFilled,
    IconSparkles,
} from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { useRef, type ReactNode } from "react"
import { useAuth } from "~/hooks/useAuth"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import "./LandingPage.css"

type FeatureCardProps = {
    title: string
    bullets: string[]
    primaryLabel: string
    onPrimaryClick: () => void
    secondaryLabel?: string
    onSecondaryClick?: () => void
}

function FeatureCard({ title, bullets, primaryLabel, onPrimaryClick, secondaryLabel, onSecondaryClick }: FeatureCardProps) {
    return (
        <Card radius="lg" p="xl" className="landing-page__feature-card">
            <Stack gap="xl" className="landing-page__feature-card-inner">
                <Box className="landing-page__feature-heading">
                    <Title order={3} size="h2" className="landing-page__card-title">
                        {title}
                    </Title>
                </Box>
                <Box className="landing-page__feature-bullets">
                    <List spacing="sm" className="landing-page__feature-list">
                        {bullets.map((bullet) => (
                            <List.Item key={bullet}>
                                <Text size="lg" className="landing-page__body">
                                    {bullet}
                                </Text>
                            </List.Item>
                        ))}
                    </List>
                </Box>
                <Group gap="lg" className="landing-page__feature-actions">
                    <Button color="red" variant="transparent" className="landing-page__card-button" onClick={onPrimaryClick}>
                        {primaryLabel}
                    </Button>
                    {secondaryLabel && onSecondaryClick ? (
                        <Button color="red" variant="transparent" className="landing-page__card-button" onClick={onSecondaryClick}>
                            {secondaryLabel}
                        </Button>
                    ) : null}
                </Group>
            </Stack>
        </Card>
    )
}

export default function LandingPage() {
    const navigate = useNavigate()
    const { isAuthenticated, signIn } = useAuth()
    const featureSectionRef = useRef<HTMLDivElement | null>(null)
    const [creditsOpened, { open: openCredits, close: closeCredits }] = useDisclosure(false)

    const scrollToSelector = (selector: string) => {
        const target = document.querySelector(selector)
        if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    const openAccountArea = () => {
        if (isAuthenticated) {
            navigate({ to: "/me" })
            return
        }

        signIn()
    }

    return (
        <Box className="landing-page">
            <Box className="landing-page__nav">
                <Container size="lg" py="md">
                    <Group justify="space-between" align="center">
                        <Anchor component={Link} to="/" underline="never">
                            <Group gap="sm">
                                <Text size="sm" className="landing-page__brand">
                                    Progeny
                                </Text>
                            </Group>
                        </Anchor>
                        <Anchor
                            href="#"
                            underline="never"
                            className="landing-page__link"
                            onClick={(event) => {
                                event.preventDefault()
                                openAccountArea()
                            }}
                        >
                            {isAuthenticated ? "Account" : "Sign in"}
                        </Anchor>
                    </Group>
                </Container>
            </Box>

            <Box className="landing-page__section landing-page__hero">
                <Box className="landing-page__hero-bg" style={{ backgroundImage: `url(${alley})` }} />
                <Container size="md" className="landing-page__hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                    >
                        <Stack gap="lg" align="center">
                            <Text size="xs" className="landing-page__eyebrow">
                              Vampire: The Masquerade V5
                            </Text>
                            <Title order={1} size="3.8rem" className="landing-page__title">
                              Progeny
                            </Title>
                            <div className="landing-page__divider" />
                            <Text size="2rem" maw={760} className="landing-page__lede">
                              Guided and simplified character creation
                            </Text>
                            <Text size="sm" maw={680} className="landing-page__kicker">
                              Create your character here and use it anywhere - Export to PDF, Virtual Tabletops or use the Progeny Online Character Sheet
                            </Text>
                            <Group gap="md" justify="center" className="landing-page__cta-group">
                                <Button
                                    size="lg"
                                    radius="md"
                                    px="xl"
                                    className="landing-page__primary-button"
                                    leftSection={<IconSparkles size={18} />}
                                    onClick={() => navigate({ to: "/create" })}
                                >
                                    Embrace a new character
                                </Button>
                                <Button
                                    size="lg"
                                    radius="md"
                                    px="xl"
                                    variant="default"
                                    className="landing-page__secondary-button"
                                    leftSection={<IconBook2 size={18} />}
                                    onClick={() => featureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                >
                                  Explore more
                                </Button>
                            </Group>
                        </Stack>
                    </motion.div>
                </Container>

                <motion.div
                    className="landing-page__scroll-button"
                    animate={{ y: [0, 9, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Button
                        variant="subtle"
                        color="gray"
                        radius="xl"
                        onClick={() => featureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                        <IconChevronDown size={22} />
                    </Button>
                </motion.div>
            </Box>

            <Box ref={featureSectionRef} className="landing-page__section landing-page__grid-section">
                <Container size="lg">
                    <Stack gap="xl" mb="xl">
                        <Text size="xs" className="landing-page__small-label">
                            Continue the night
                        </Text>
                        <Title order={2} size="2.5rem" className="landing-page__section-title">
                            Everything Progeny has to offer
                        </Title>
                        <Text size="xl" maw={780} className="landing-page__body">
                            The creator is the first step. Progeny also gives you a dedicated sheet for active play and account features for keeping your
                            chronicles organized.
                        </Text>
                    </Stack>

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <FeatureCard
                                title="Guided character creation"
                                bullets={[
                                    "Dead simple character creation",
                                    "Save and edit your character in your browser",
                                    "Export to PDF, an importable save file or to Foundry",
                                ]}
                                primaryLabel="Start creating"
                                onPrimaryClick={() => navigate({ to: "/create" })}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <FeatureCard
                                title="Character sheet"
                                bullets={[
                                    "Highly automated online character sheet",
                                    "Use free-edit or XP-spending mode to grow your character",
                                    "Powerful dice roller, including one-click rouse check and remorse rolls",
                                ]}
                                primaryLabel="Open sheet"
                                onPrimaryClick={() => navigate({ to: "/sheet" })}
                                secondaryLabel="Learn more"
                                onSecondaryClick={() => scrollToSelector("#sheet-explainer")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <FeatureCard
                                title="Play online"
                                bullets={[
                                    "Create an account to manage your characters in the cloud",
                                    "Share your characters with your coterie",
                                    "Chat and auto-share dice rolls in play sessions",
                                ]}
                                primaryLabel={isAuthenticated ? "Account" : "Sign in"}
                                onPrimaryClick={openAccountArea}
                                secondaryLabel="Learn more"
                                onSecondaryClick={() => scrollToSelector("#account-explainer")}
                            />
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>

            <Box className="landing-page__section landing-page__explainers">
                <Container size="md">
                    <Card id="sheet-explainer" radius="lg" p="xl" mb="xl" className="landing-page__explainer">
                        <Stack gap="md" className="landing-page__explainer-inner">
                            <Text size="xs" className="landing-page__small-label">
                                Character sheet
                            </Text>
                            <Title order={2} size="2.15rem" className="landing-page__section-title">
                                Move from creation into play
                            </Title>
                            <Text size="xl" className="landing-page__body">
                                The sheet is where a finished character becomes a table companion. Open it to review stats, manage disciplines and merits,
                                track play-state changes, and keep the character in front of you during sessions.
                            </Text>
                            <Text size="lg" className="landing-page__body">
                                It is designed as the next step after creation: build the character, open the sheet, and use that page as the place you return
                                to during play.
                            </Text>
                            <Group gap="lg" mt="xs">
                                <Anchor component={Link} to="/sheet" underline="never" className="landing-page__link">
                                    Open the sheet
                                </Anchor>
                            </Group>
                        </Stack>
                    </Card>

                    <Card
                        id="account-explainer"
                        radius="lg"
                        p="xl"
                        className="landing-page__explainer"
                        style={{ backgroundImage: `linear-gradient(180deg, rgba(35, 27, 27, 0.9), rgba(12, 10, 10, 0.96)), url(${alley})`, backgroundSize: "cover" }}
                    >
                        <Stack gap="md" className="landing-page__explainer-inner">
                            <Text size="xs" className="landing-page__small-label">
                                Logged-in account
                            </Text>
                            <Title order={2} size="2.15rem" className="landing-page__section-title">
                                Keep your chronicles organized online
                            </Title>
                            <Text size="xl" className="landing-page__body">
                                Signing in opens the account hub at <code>/me</code>, where you can save characters to your account, revisit them later,
                                arrange them into coteries, and share read-only versions with other users.
                            </Text>
                            <Text size="lg" className="landing-page__body">
                                It also gives you a place to manage your profile details while keeping the creator and sheet connected to the same ongoing set
                                of characters.
                            </Text>
                            <Group gap="lg" mt="xs">
                                <Anchor
                                    href="#"
                                    underline="never"
                                    className="landing-page__link"
                                    onClick={(event) => {
                                        event.preventDefault()
                                        openAccountArea()
                                    }}
                                >
                                  Sign In
                                </Anchor>
                            </Group>
                        </Stack>
                    </Card>
                </Container>
            </Box>

            <Box component="footer" className="landing-page__footer">
                <Container size="lg">
                    <Group justify="space-between" align="flex-start" gap="xl" className="landing-page__footer-layout">
                        <Stack gap="xs">
                            <Button variant="subtle" color="gray" className="landing-page__footer-button" onClick={openCredits}>
                                Credits
                            </Button>
                        </Stack>

                        <Group gap="lg" className="landing-page__footer-links">
                          <Text className="landing-page__link">Contact me:</Text>
                            <Anchor href="https://www.reddit.com/user/Odin94" target="_blank" rel="noreferrer" underline="never" className="landing-page__link">
                                Reddit
                            </Anchor>
                            <Anchor href="https://bsky.app/profile/odin-dev.bsky.social" target="_blank" rel="noreferrer" underline="never" className="landing-page__link">
                                Bluesky
                            </Anchor>
                            <Anchor
                                href="https://github.com/Odin94/Progeny-vtm-v5-character-creator"
                                target="_blank"
                                rel="noreferrer"
                                underline="never"
                                className="landing-page__link"
                            >
                                GitHub
                            </Anchor>
                            <Anchor href="https://ko-fi.com/odin_dev" target="_blank" rel="noreferrer" underline="never" className="landing-page__link">
                                Ko-fi
                            </Anchor>
                            <Anchor href="https://odin-matthias.de" target="_blank" rel="noreferrer" underline="never" className="landing-page__link">
                                Website
                            </Anchor>
                        </Group>
                    </Group>
                </Container>
            </Box>

            <Modal
                opened={creditsOpened}
                onClose={closeCredits}
                centered
                title="Credits"
                radius="xl"
                padding="xl"
                size="lg"
                overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
                classNames={{
                    content: "landing-page__modal",
                    header: "landing-page__modal-header",
                    title: "landing-page__modal-title",
                    body: "landing-page__modal-body",
                }}
            >
                <Stack gap="xl">
                    <Text className="landing-page__body">
                        PDF template, FavIcon, discipline icons, and dice result icons by{" "}
                        <Anchor href="https://linktr.ee/nerdbert" target="_blank" rel="noreferrer">
                            Nerdbert.
                        </Anchor>
                    </Text>
                    <Text className="landing-page__body">
                        Progeny is an independent project and created under the{" "}
                        <Anchor
                            href="https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Dark Pack License.
                        </Anchor>
                    </Text>
                    <Text className="landing-page__body">
                        Background images by Aleksandr Popov, Amber Kipp, Dominik Hofbauer, Marcus Bellamy, Peter Scherbatykh, and Thomas Le on{" "}
                        <Anchor href="https://unsplash.com" target="_blank" rel="noreferrer">
                            Unsplash.
                        </Anchor>
                    </Text>
                </Stack>
            </Modal>
        </Box>
    )
}
