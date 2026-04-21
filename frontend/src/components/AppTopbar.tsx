import { Anchor, Burger, Container, Group, Text } from "@mantine/core"
import { RAW_GREY, rgba } from "~/theme/colors"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAuth } from "~/hooks/useAuth"
import { globals } from "~/globals"

export type AppTopbarProps = {
    /** Pass when the aside/step bar burger is needed (generator page) */
    asideBar?: {
        show: boolean
        onToggle: () => void
    }
}

/**
 * Shared top navigation bar used on both the Landing page and the Creator page.
 * Background / positioning is handled by the parent (sticky wrapper or AppShell.Header).
 */
const AppTopbar = ({ asideBar }: AppTopbarProps) => {
    const navigate = useNavigate()
    const { isAuthenticated, signIn } = useAuth()
    const smallScreen = globals.isSmallScreen

    const handleAccountClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (isAuthenticated) {
            navigate({ to: "/me" })
        } else {
            signIn()
        }
    }

    return (
        <Container size="lg" py="md" px="md">
            <Group justify="space-between" align="center" h="100%">
                {/* Brand */}
                <Anchor component={Link} to="/" underline="never">
                    <Text
                        size="sm"
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--landing-text, rgba(244, 236, 232, 0.9))",
                        }}
                    >
                        Progeny
                    </Text>
                </Anchor>

                {/* Right side */}
                <Group gap="md" align="center">
                    <Anchor
                        component={Link}
                        to="/sheet"
                        underline="never"
                        style={{
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            fontSize: "0.78rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--landing-text, rgba(244, 236, 232, 0.9))",
                        }}
                    >
                        Sheet
                    </Anchor>
                    <Anchor
                        href="#"
                        underline="never"
                        onClick={handleAccountClick}
                        style={{
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            fontSize: "0.78rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--landing-text, rgba(244, 236, 232, 0.9))",
                        }}
                    >
                        {isAuthenticated ? "Account" : "Sign in"}
                    </Anchor>

                    {/* Burger — only shown on small screens when aside bar is configured */}
                    {asideBar && smallScreen && (
                        <Burger
                            opened={asideBar.show}
                            onClick={asideBar.onToggle}
                            aria-label={asideBar.show ? "Close side bar" : "Open side bar"}
                            size="sm"
                            color={rgba(RAW_GREY, 0.7)}
                        />
                    )}
                </Group>
            </Group>
        </Container>
    )
}

export default AppTopbar
