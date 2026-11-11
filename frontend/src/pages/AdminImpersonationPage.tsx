import { useDebouncedValue } from "@mantine/hooks"
import { Badge, Button, Pagination, Skeleton, Switch, Table, Tabs, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconAlertTriangle,
    IconBellRinging,
    IconCopy,
    IconLock,
    IconLogin,
    IconRefresh,
    IconSearch,
    IconShieldCheck,
    IconShieldOff,
    IconSparkles,
    IconUserSearch,
    IconUserShield
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import NameTag from "~/components/NameTag"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import {
    DisabledReason,
    EmptyState,
    PageHeader,
    PageShell,
    Panel,
    SectionHeader,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import { useAuth } from "~/hooks/useAuth"
import { api, type AdminUser } from "~/utils/api"
import HomebrewModerationPanel from "~/components/HomebrewModerationPanel"
import { refreshIdentityBoundQueries } from "~/utils/impersonation"
import AdminRecentChangesPanel from "~/components/AdminRecentChangesPanel"
import { Route, type AdminTab } from "~/routes/admin"
import classes from "./AdminPage.module.css"

const getUserLabel = (user: AdminUser) =>
    user.nickname || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

const UsersSkeleton = ({ rows = 8 }: { rows?: number }) => (
    <div className={classes.skeletonRows} aria-busy="true" aria-label="Loading users">
        {Array.from({ length: rows }, (_, index) => (
            <div key={index} className={classes.skeletonRow}>
                <div className={classes.skeletonLead}>
                    <Skeleton height={12} width="30%" radius="sm" />
                    <Skeleton height={10} width="45%" radius="sm" />
                </div>
                <Skeleton height={20} width={36} radius="xl" />
                <Skeleton height={20} width={36} radius="xl" />
                <Skeleton height={28} width={112} radius="md" />
            </div>
        ))}
    </div>
)

const AdminImpersonationPage = () => {
    const { user, isLoading, isAuthenticated, signIn, refreshAuth } = useAuth()
    const navigate = Route.useNavigate()
    const { tab: activeTab } = Route.useSearch()
    const queryClient = useQueryClient()
    const contextMenu = useContextMenu()
    const [isVerifyingAdminSession, setIsVerifyingAdminSession] = useState(true)
    const [query, setQuery] = useState("")
    const [searchQuery] = useDebouncedValue(query, 200)
    const [page, setPage] = useState(1)
    const [superadminCandidate, setSuperadminCandidate] = useState<AdminUser | null>(null)
    const canUseAdminTools =
        !isVerifyingAdminSession && user?.actorIsSuperadmin && !user.impersonation?.active

    // A browser may retain an impersonation cookie after the in-memory session has
    // expired or been lost. `/auth/me` intentionally clears that cookie and returns
    // the actor's identity, while other protected endpoints correctly reject the
    // first request. Verify here before enabling admin queries so opening this page
    // never leaves the user with a transient 401 that disappears after a refresh.
    useEffect(() => {
        let mounted = true

        void refreshAuth().finally(() => {
            if (mounted) setIsVerifyingAdminSession(false)
        })

        return () => {
            mounted = false
        }
    }, [refreshAuth])

    const usersQuery = useQuery({
        queryKey: ["admin", "users", searchQuery, page],
        queryFn: () => api.getAdminUsers({ query: searchQuery, page }),
        enabled: !!canUseAdminTools
    })
    const homebrewRequestsQuery = useQuery({
        queryKey: ["admin", "homebrew", "publish-requests"],
        queryFn: api.getAdminHomebrewPublishRequests,
        enabled: !!canUseAdminTools
    })
    const pendingHomebrewRequestCount =
        homebrewRequestsQuery.data?.filter((request) => request.status === "pending").length ?? 0

    const selectTab = (tab: string | null) => {
        if (!tab) return
        navigate({ search: { tab: tab as AdminTab } })
    }

    const toggleSuperadminMutation = useMutation({
        mutationFn: ({ id, isSuperadmin }: { id: string; isSuperadmin: boolean }) =>
            api.updateSuperadmin(id, { isSuperadmin }),
        onSuccess: () => {
            setSuperadminCandidate(null)
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not update superadmin",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })

    const toggleNameTagMutation = useMutation({
        mutationFn: ({ id, nameTagEnabled }: { id: string; nameTagEnabled: boolean }) =>
            api.updateNameTagAccess(id, { nameTagEnabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not update name tag access",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })

    const startImpersonationMutation = useMutation({
        mutationFn: (userId: string) => api.startImpersonation(userId),
        onSuccess: async (data) => {
            await refreshIdentityBoundQueries(queryClient)
            notifications.show({
                title: "Impersonation started",
                message: `Now acting as ${getUserLabel(data.impersonatedUser)}.`,
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not start impersonation",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })

    const setSuperadmin = (candidate: AdminUser, isSuperadmin: boolean) => {
        if (isSuperadmin) {
            setSuperadminCandidate(candidate)
            return
        }

        toggleSuperadminMutation.mutate({
            id: candidate.id,
            isSuperadmin
        })
    }

    const copyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email)
            notifications.show({ title: "Copied", message: email, color: "green" })
        } catch {
            notifications.show({
                title: "Copy failed",
                message: "Your browser blocked the copy.",
                color: "yellow"
            })
        }
    }

    const impersonationBlockReason = (candidate: AdminUser) =>
        candidate.id === user?.id
            ? "You can't impersonate yourself"
            : candidate.isSuperadmin
              ? "Superadmins can't be impersonated"
              : undefined

    const userMenuEntries = (candidate: AdminUser): ContextMenuEntry[] => {
        const isSelf = candidate.id === user?.id
        const blockReason = impersonationBlockReason(candidate)
        return [
            { type: "label", key: "label", label: getUserLabel(candidate) },
            {
                key: "impersonate",
                label: "Impersonate",
                icon: <IconUserShield size={14} />,
                disabled: !!blockReason,
                onClick: () => startImpersonationMutation.mutate(candidate.id)
            },
            {
                key: "name-tag",
                label: candidate.nameTagEnabled ? "Disable name tag" : "Enable name tag",
                icon: <IconSparkles size={14} />,
                disabled: toggleNameTagMutation.isPending,
                onClick: () =>
                    toggleNameTagMutation.mutate({
                        id: candidate.id,
                        nameTagEnabled: !candidate.nameTagEnabled
                    })
            },
            {
                key: "copy",
                label: "Copy email",
                icon: <IconCopy size={14} />,
                onClick: () => void copyEmail(candidate.email)
            },
            { type: "divider", key: "divider" },
            candidate.isSuperadmin
                ? {
                      key: "superadmin",
                      label: "Revoke superadmin",
                      color: "red",
                      icon: <IconShieldOff size={14} />,
                      disabled: isSelf || toggleSuperadminMutation.isPending,
                      onClick: () => setSuperadmin(candidate, false)
                  }
                : {
                      key: "superadmin",
                      label: "Make superadmin…",
                      icon: <IconShieldCheck size={14} />,
                      disabled: toggleSuperadminMutation.isPending,
                      onClick: () => setSuperadmin(candidate, true)
                  }
        ]
    }

    const rows = usersQuery.isSuccess
        ? usersQuery.data.users.map((candidate) => {
              const isSelf = candidate.id === user?.id
              const blockReason = impersonationBlockReason(candidate)
              const lastActiveLabel = candidate.lastActiveAt
                  ? new Date(candidate.lastActiveAt).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short"
                    })
                  : null

              return (
                  <Table.Tr
                      key={candidate.id}
                      className={classes.row}
                      onContextMenu={(event) => contextMenu.open(event, userMenuEntries(candidate))}
                  >
                      <Table.Td>
                          <div className={classes.userCell}>
                              <div className={classes.userName}>
                                  {candidate.nameTagEnabled && candidate.nameTagVisible ? (
                                      <NameTag name={getUserLabel(candidate)} size="xs" />
                                  ) : (
                                      <span>{getUserLabel(candidate)}</span>
                                  )}
                                  {candidate.isSuperadmin ? (
                                      <Badge color="gold" variant="light" size="sm">
                                          Superadmin
                                      </Badge>
                                  ) : null}
                              </div>
                              <span className={classes.userEmail}>{candidate.email}</span>
                          </div>
                      </Table.Td>
                      <Table.Td>
                          {candidate.isActive ? (
                              <span className={classes.presence} data-active>
                                  <span className={classes.presenceDot} />
                                  Active
                              </span>
                          ) : lastActiveLabel ? (
                              <span className={classes.presence}>
                                  <span className={classes.presenceDot} />
                                  Seen {lastActiveLabel}
                              </span>
                          ) : (
                              <span className={classes.presence}>—</span>
                          )}
                      </Table.Td>
                      <Table.Td>
                          <DisabledReason
                              reason={
                                  isSelf ? "You can't change your own superadmin status" : undefined
                              }
                          >
                              <Switch
                                  checked={candidate.isSuperadmin}
                                  disabled={isSelf || toggleSuperadminMutation.isPending}
                                  onChange={(event) =>
                                      setSuperadmin(candidate, event.currentTarget.checked)
                                  }
                                  aria-label={`Set ${candidate.email} superadmin status`}
                              />
                          </DisabledReason>
                      </Table.Td>
                      <Table.Td>
                          <Switch
                              checked={candidate.nameTagEnabled}
                              disabled={toggleNameTagMutation.isPending}
                              onChange={(event) =>
                                  toggleNameTagMutation.mutate({
                                      id: candidate.id,
                                      nameTagEnabled: event.currentTarget.checked
                                  })
                              }
                              aria-label={`Set ${candidate.email} name tag access`}
                          />
                      </Table.Td>
                      <Table.Td ta="right">
                          <DisabledReason reason={blockReason}>
                              <Button
                                  size="xs"
                                  variant="light"
                                  color="gold"
                                  leftSection={<IconUserShield size={14} />}
                                  disabled={!!blockReason}
                                  loading={
                                      startImpersonationMutation.isPending &&
                                      startImpersonationMutation.variables === candidate.id
                                  }
                                  onClick={() => startImpersonationMutation.mutate(candidate.id)}
                              >
                                  Impersonate
                              </Button>
                          </DisabledReason>
                      </Table.Td>
                  </Table.Tr>
              )
          })
        : []
    const usersQueryError = usersQuery.error as (Error & { status?: number }) | null
    const usersQueryErrorMessage = usersQueryError
        ? `${usersQueryError.message}${usersQueryError.status ? ` (HTTP ${usersQueryError.status})` : ""}`
        : "Could not load users."
    const usersData = usersQuery.data

    const header = (
        <PageHeader
            eyebrow="Admin"
            title="Administration"
            icon={<IconUserShield size={30} stroke={1.5} />}
        />
    )

    return (
        <PageShell size="xl">
            <ConfirmActionModal
                opened={!!superadminCandidate}
                onClose={() => setSuperadminCandidate(null)}
                onConfirm={() => {
                    if (!superadminCandidate) return
                    toggleSuperadminMutation.mutate({
                        id: superadminCandidate.id,
                        isSuperadmin: true
                    })
                }}
                title="Make user a superadmin?"
                body={
                    <>
                        This grants full superadmin access to{" "}
                        <strong>
                            {superadminCandidate ? getUserLabel(superadminCandidate) : "this user"}
                        </strong>
                        {superadminCandidate &&
                        getUserLabel(superadminCandidate) !== superadminCandidate.email
                            ? ` (${superadminCandidate.email})`
                            : ""}
                        .
                    </>
                }
                confirmLabel="Make superadmin"
                confirmColor="gold"
                loading={toggleSuperadminMutation.isPending}
            />

            {isLoading || isVerifyingAdminSession ? (
                <>
                    {header}
                    <Skeleton height={36} width={420} radius="sm" mb="xl" />
                    <Panel p={0}>
                        <UsersSkeleton rows={6} />
                    </Panel>
                </>
            ) : !isAuthenticated ? (
                <Panel p={0} className={classes.gate}>
                    <EmptyState
                        icon={<IconLock size={26} stroke={1.5} />}
                        title="Admin"
                        description="Sign in to continue."
                        actions={
                            <Button onClick={signIn} leftSection={<IconLogin size={16} />}>
                                Sign in
                            </Button>
                        }
                    />
                </Panel>
            ) : !canUseAdminTools ? (
                <Panel p={0} className={classes.gate}>
                    <EmptyState
                        icon={<IconLock size={26} stroke={1.5} />}
                        title="Admin"
                        description="Superadmin access is required, and admin tools are disabled while impersonating."
                    />
                </Panel>
            ) : (
                <>
                    {header}
                    <Tabs
                        value={activeTab}
                        onChange={selectTab}
                        keepMounted={false}
                        className={classes.tabs}
                        classNames={{ list: classes.tabList }}
                    >
                        <Tabs.List mb="xl">
                            <Tabs.Tab value="users">Users</Tabs.Tab>
                            <Tabs.Tab value="recent-changes">Recent changes</Tabs.Tab>
                            <Tabs.Tab
                                value="homebrew-review"
                                leftSection={
                                    pendingHomebrewRequestCount ? (
                                        <IconBellRinging
                                            size={16}
                                            color="var(--pg-gold)"
                                            aria-hidden="true"
                                        />
                                    ) : undefined
                                }
                            >
                                Homebrew review
                                {pendingHomebrewRequestCount ? (
                                    <span className={classes.tabCount}>
                                        {pendingHomebrewRequestCount}
                                    </span>
                                ) : null}
                            </Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="users">
                            <div className={classes.panelStack}>
                                <SectionHeader
                                    title="User administration"
                                    description="Manage name tags, superadmins, and 10 minute impersonation sessions."
                                />
                                <div className={classes.toolbar}>
                                    <TextInput
                                        className={classes.search}
                                        leftSection={<IconSearch size={16} />}
                                        placeholder="Search users"
                                        aria-label="Search users"
                                        value={query}
                                        onChange={(event) => {
                                            setQuery(event.currentTarget.value)
                                            setPage(1)
                                        }}
                                    />
                                    {usersData ? (
                                        <span className={classes.footerText}>
                                            {usersData.total} users
                                        </span>
                                    ) : null}
                                </div>

                                <Panel p={0} className={classes.tablePanel}>
                                    {usersQuery.isLoading ? (
                                        <UsersSkeleton />
                                    ) : usersQuery.isError ? (
                                        <EmptyState
                                            compact
                                            icon={<IconAlertTriangle size={24} stroke={1.5} />}
                                            title="Could not load users"
                                            description={usersQueryErrorMessage}
                                            actions={
                                                <Button
                                                    size="xs"
                                                    variant="default"
                                                    leftSection={<IconRefresh size={14} />}
                                                    onClick={() => usersQuery.refetch()}
                                                >
                                                    Retry
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <>
                                            <Table.ScrollContainer minWidth={760}>
                                                <Table verticalSpacing="sm" highlightOnHover>
                                                    <Table.Thead>
                                                        <Table.Tr>
                                                            <Table.Th>User</Table.Th>
                                                            <Table.Th>Activity</Table.Th>
                                                            <Table.Th>Superadmin</Table.Th>
                                                            <Table.Th>Name tag</Table.Th>
                                                            <Table.Th ta="right">
                                                                Impersonation
                                                            </Table.Th>
                                                        </Table.Tr>
                                                    </Table.Thead>
                                                    <Table.Tbody>{rows}</Table.Tbody>
                                                </Table>
                                            </Table.ScrollContainer>
                                            {!usersData ? null : usersData.total === 0 ? (
                                                <EmptyState
                                                    compact
                                                    icon={<IconUserSearch size={24} stroke={1.5} />}
                                                    title="No users found."
                                                    actions={
                                                        query ? (
                                                            <Button
                                                                size="xs"
                                                                variant="default"
                                                                onClick={() => {
                                                                    setQuery("")
                                                                    setPage(1)
                                                                }}
                                                            >
                                                                Clear search
                                                            </Button>
                                                        ) : undefined
                                                    }
                                                />
                                            ) : (
                                                <div className={classes.footer}>
                                                    <span className={classes.footerText}>
                                                        Showing{" "}
                                                        {(page - 1) * usersData.pageSize + 1}–
                                                        {Math.min(
                                                            page * usersData.pageSize,
                                                            usersData.total
                                                        )}{" "}
                                                        of {usersData.total} users
                                                    </span>
                                                    <Pagination
                                                        total={usersData.totalPages}
                                                        value={page}
                                                        onChange={setPage}
                                                        color="gold"
                                                        size="sm"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Panel>
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="recent-changes">
                            <AdminRecentChangesPanel />
                        </Tabs.Panel>
                        <Tabs.Panel value="homebrew-review">
                            <HomebrewModerationPanel />
                        </Tabs.Panel>
                    </Tabs>
                </>
            )}
            {contextMenu.menu}
        </PageShell>
    )
}

export default AdminImpersonationPage
