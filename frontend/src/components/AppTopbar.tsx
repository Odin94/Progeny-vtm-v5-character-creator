import { Anchor, Box, Burger, Button, Container, Group, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconLogout, IconUserShield } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RAW_GREY, rgba } from "~/theme/colors"
import { useAuth } from "~/hooks/useAuth"
import { globals } from "~/globals"
import { api, type AdminUser } from "~/utils/api"
import { refreshIdentityBoundQueries } from "~/utils/impersonation"

export type AppTopbarProps = {
    asideBar?: {
        show: boolean
        onToggle: () => void
    }
}

const getUserLabel = (user: AdminUser) =>
    user.nickname || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

const AppTopbar = ({ asideBar }: AppTopbarProps) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { isAuthenticated, signIn, user } = useAuth()
    const smallScreen = globals.isSmallScreen
    const impersonation = user?.impersonation
    const isImpersonating = !!impersonation?.active
    const canUseAdminTools = user?.actorIsSuperadmin && !isImpersonating
    const navTextColor = isImpersonating
        ? "#261700"
        : "var(--landing-text, rgba(244, 236, 232, 0.9))"

    const stopMutation = useMutation({
        mutationFn: () => api.stopImpersonation(),
        onSuccess: async () => {
            await refreshIdentityBoundQueries(queryClient)
            notifications.show({
                title: "Impersonation stopped",
                message: "You are back in your superadmin account.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not stop impersonation",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })

    const navLinkStyle = {
        fontFamily: "Inter, Segoe UI, sans-serif",
        fontSize: "0.78rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: navTextColor
    }

    const handleAccountClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (isAuthenticated) {
            navigate({ to: "/me" })
        } else {
            signIn()
        }
    }

    return (
        <Box h="100%" bg={isImpersonating ? "#f2c94c" : "transparent"}>
            <Container size="lg" py="md" px="md" h="100%">
                <Group justify="space-between" align="center" h="100%" wrap="nowrap">
                    <Anchor component={Link} to="/" underline="never">
                        <Text
                            size="sm"
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: navTextColor
                            }}
                        >
                            Progeny
                        </Text>
                    </Anchor>

                    <Group gap="md" align="center" wrap="nowrap">
                        <Anchor component={Link} to="/sheet" underline="never" style={navLinkStyle}>
                            Sheet
                        </Anchor>
                        <Anchor
                            href="#"
                            underline="never"
                            onClick={handleAccountClick}
                            style={navLinkStyle}
                        >
                            {isAuthenticated ? "Account" : "Sign in"}
                        </Anchor>
                        {canUseAdminTools ? (
                            <Anchor
                                component={Link}
                                to="/admin/impersonation"
                                underline="never"
                                style={navLinkStyle}
                            >
                                Admin
                            </Anchor>
                        ) : null}
                        {impersonation?.active ? (
                            <Group gap="xs" wrap="nowrap">
                                {!smallScreen ? (
                                    <Text
                                        size="xs"
                                        fw={700}
                                        style={{
                                            color: navTextColor,
                                            fontFamily: "Inter, Segoe UI, sans-serif",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        <IconUserShield size={14} style={{ verticalAlign: -2 }} />{" "}
                                        {getUserLabel(impersonation.impersonatedUser)}
                                    </Text>
                                ) : null}
                                <Button
                                    size="xs"
                                    variant="filled"
                                    color="dark"
                                    leftSection={<IconLogout size={14} />}
                                    loading={stopMutation.isPending}
                                    onClick={() => stopMutation.mutate()}
                                    styles={{
                                        root: {
                                            color: "#f7d76a",
                                            borderRadius: 4
                                        }
                                    }}
                                >
                                    Stop
                                </Button>
                            </Group>
                        ) : null}

                        {asideBar && smallScreen && (
                            <Burger
                                opened={asideBar.show}
                                onClick={asideBar.onToggle}
                                aria-label={asideBar.show ? "Close side bar" : "Open side bar"}
                                size="sm"
                                color={isImpersonating ? navTextColor : rgba(RAW_GREY, 0.7)}
                            />
                        )}
                    </Group>
                </Group>
            </Container>
        </Box>
    )
}

export default AppTopbar
