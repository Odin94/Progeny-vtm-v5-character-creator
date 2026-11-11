import { Burger, Button, Kbd, Text, Tooltip, UnstyledButton } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconLogout, IconSearch, IconUserShield } from "@tabler/icons-react"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "~/hooks/useAuth"
import { globals } from "~/globals"
import { api, type AdminUser } from "~/utils/api"
import { refreshIdentityBoundQueries } from "~/utils/impersonation"
import { quickNavigator } from "./QuickNavigator"
import { BrandMark } from "./ui/BrandMark"
import classes from "./AppTopbar.module.css"

export type AppTopbarProps = {
    asideBar?: {
        show: boolean
        onToggle: () => void
    }
}

const getUserLabel = (user: AdminUser) =>
    user.nickname || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

const isMacPlatform = () =>
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "")

const AppTopbar = ({ asideBar }: AppTopbarProps) => {
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()
    const { isAuthenticated, signIn, isSigningIn, user } = useAuth()
    const smallScreen = globals.isSmallScreen
    const impersonation = user?.impersonation
    const isImpersonating = !!impersonation?.active
    const canUseAdminTools = user?.actorIsSuperadmin && !isImpersonating

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

    const isSheetPage = location.pathname === "/sheet"
    const creatorNavLink = isSheetPage
        ? ({ to: "/create", label: "Generator" } as const)
        : ({ to: "/sheet", label: "Sheet" } as const)
    const isAccountPage = location.pathname === "/me"
    const isAdminPage = location.pathname.startsWith("/admin")

    const handleAccountClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (isAuthenticated) {
            navigate({ to: "/me" })
        } else {
            signIn()
        }
    }

    return (
        <div className={classes.bar} data-impersonating={isImpersonating || undefined}>
            <div className={classes.inner}>
                <Link to="/" className={classes.brand} aria-label="Progeny home">
                    <BrandMark size={22} className={classes.brandMark} />
                    <span className={classes.wordmark}>Progeny</span>
                </Link>

                <nav className={classes.nav} aria-label="Main">
                    <Link to={creatorNavLink.to} className={classes.navLink}>
                        {creatorNavLink.label}
                    </Link>
                    <a
                        href="#"
                        onClick={handleAccountClick}
                        aria-disabled={isSigningIn}
                        className={classes.navLink}
                        data-active={isAccountPage || undefined}
                        data-pending={isSigningIn || undefined}
                    >
                        {isAuthenticated ? "Account" : isSigningIn ? "Signing in…" : "Sign in"}
                    </a>
                    {canUseAdminTools ? (
                        <Link
                            to="/admin"
                            search={{ tab: "users" }}
                            className={classes.navLink}
                            data-active={isAdminPage || undefined}
                        >
                            Admin
                        </Link>
                    ) : null}

                    {impersonation?.active ? (
                        <div className={classes.impersonation}>
                            {!smallScreen ? (
                                <Text size="xs" fw={700} className={classes.impersonationLabel}>
                                    <IconUserShield size={14} />
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
                                className={classes.stopButton}
                            >
                                Stop
                            </Button>
                        </div>
                    ) : null}

                    <Tooltip
                        label={
                            <span className={classes.searchTooltip}>
                                Quick navigation <Kbd>{isMacPlatform() ? "⌘" : "Ctrl"}</Kbd>
                                <Kbd>K</Kbd>
                            </span>
                        }
                        position="bottom-end"
                    >
                        <UnstyledButton
                            className={classes.searchTrigger}
                            onClick={() => quickNavigator.open()}
                            aria-label="Open quick navigation"
                        >
                            <IconSearch size={16} stroke={1.8} />
                            <span className={classes.searchKbd} aria-hidden="true">
                                {isMacPlatform() ? "⌘K" : "Ctrl K"}
                            </span>
                        </UnstyledButton>
                    </Tooltip>

                    {asideBar && smallScreen && (
                        <Burger
                            opened={asideBar.show}
                            onClick={asideBar.onToggle}
                            aria-label={asideBar.show ? "Close side bar" : "Open side bar"}
                            size="sm"
                            color={isImpersonating ? "#261700" : "var(--pg-ink-2)"}
                            className={classes.burger}
                        />
                    )}
                </nav>
            </div>
        </div>
    )
}

export default AppTopbar
