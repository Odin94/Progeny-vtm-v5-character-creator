import {
    AppShell,
    Badge,
    Box,
    Button,
    Center,
    Container,
    Group,
    Loader,
    Modal,
    Pagination,
    Paper,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    Tabs,
    Title
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconBellRinging, IconSearch, IconUserShield } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import Topbar from "~/topbar/Topbar"
import NameTag from "~/components/NameTag"
import { useAuth } from "~/hooks/useAuth"
import { api, type AdminUser } from "~/utils/api"
import HomebrewModerationPanel from "~/components/HomebrewModerationPanel"
import { refreshIdentityBoundQueries } from "~/utils/impersonation"
import AdminRecentChangesPanel from "~/components/AdminRecentChangesPanel"
import { Route, type AdminTab } from "~/routes/admin.impersonation"

const topbarHeight = 52

const getUserLabel = (user: AdminUser) =>
    user.nickname || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

const AdminImpersonationPage = () => {
    const { user, isLoading, isAuthenticated, signIn } = useAuth()
    const navigate = Route.useNavigate()
    const { tab: activeTab } = Route.useSearch()
    const queryClient = useQueryClient()
    const [query, setQuery] = useState("")
    const [page, setPage] = useState(1)
    const [superadminCandidate, setSuperadminCandidate] = useState<AdminUser | null>(null)
    const canUseAdminTools = user?.actorIsSuperadmin && !user.impersonation?.active

    const usersQuery = useQuery({
        queryKey: ["admin", "users", query, page],
        queryFn: () => api.getAdminUsers({ query, page }),
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

    const rows = usersQuery.isSuccess
        ? usersQuery.data.users.map((candidate) => {
              const isSelf = candidate.id === user?.id
              const canImpersonate = !isSelf && !candidate.isSuperadmin
              const lastActiveLabel = candidate.lastActiveAt
                  ? new Date(candidate.lastActiveAt).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short"
                    })
                  : null

              return (
                  <Table.Tr key={candidate.id}>
                      <Table.Td>
                          <Stack gap={2}>
                              <Group gap="xs">
                                  {candidate.nameTagEnabled && candidate.nameTagVisible ? (
                                      <NameTag name={getUserLabel(candidate)} size="xs" />
                                  ) : (
                                      <Text fw={600}>{getUserLabel(candidate)}</Text>
                                  )}
                                  {candidate.isSuperadmin ? (
                                      <Badge color="yellow" variant="light">
                                          Superadmin
                                      </Badge>
                                  ) : null}
                                  {candidate.isActive ? (
                                      <Badge color="green" variant="light">
                                          Active
                                      </Badge>
                                  ) : lastActiveLabel ? (
                                      <Badge color="gray" variant="light">
                                          Seen {lastActiveLabel}
                                      </Badge>
                                  ) : null}
                              </Group>
                              <Text size="sm" c="dimmed">
                                  {candidate.email}
                              </Text>
                          </Stack>
                      </Table.Td>
                      <Table.Td>
                          <Switch
                              checked={candidate.isSuperadmin}
                              disabled={isSelf || toggleSuperadminMutation.isPending}
                              onChange={(event) => {
                                  const isSuperadmin = event.currentTarget.checked
                                  if (isSuperadmin) {
                                      setSuperadminCandidate(candidate)
                                      return
                                  }

                                  toggleSuperadminMutation.mutate({
                                      id: candidate.id,
                                      isSuperadmin
                                  })
                              }}
                              aria-label={`Set ${candidate.email} superadmin status`}
                          />
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
                      <Table.Td>
                          <Button
                              size="xs"
                              variant="light"
                              color="yellow"
                              leftSection={<IconUserShield size={14} />}
                              disabled={!canImpersonate}
                              loading={
                                  startImpersonationMutation.isPending &&
                                  startImpersonationMutation.variables === candidate.id
                              }
                              onClick={() => startImpersonationMutation.mutate(candidate.id)}
                          >
                              Impersonate
                          </Button>
                      </Table.Td>
                  </Table.Tr>
              )
          })
        : []
    const usersQueryError = usersQuery.error as (Error & { status?: number }) | null
    const usersQueryErrorMessage = usersQueryError
        ? `${usersQueryError.message}${usersQueryError.status ? ` (HTTP ${usersQueryError.status})` : ""}`
        : "Could not load users."

    return (
        <AppShell header={{ height: topbarHeight }}>
            <Modal
                opened={!!superadminCandidate}
                onClose={() => setSuperadminCandidate(null)}
                title="Make user a superadmin?"
                centered
            >
                <Stack gap="md">
                    <Text size="sm">
                        This grants full superadmin access to{" "}
                        <strong>
                            {superadminCandidate ? getUserLabel(superadminCandidate) : "this user"}
                        </strong>
                        .
                    </Text>
                    {superadminCandidate ? (
                        <Text size="sm" c="dimmed">
                            {superadminCandidate.email}
                        </Text>
                    ) : null}
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setSuperadminCandidate(null)}
                            disabled={toggleSuperadminMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="yellow"
                            loading={toggleSuperadminMutation.isPending}
                            onClick={() => {
                                if (!superadminCandidate) return
                                toggleSuperadminMutation.mutate({
                                    id: superadminCandidate.id,
                                    isSuperadmin: true
                                })
                            }}
                        >
                            Make superadmin
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <AppShell.Header style={{ background: "rgba(13, 11, 15, 0.96)", borderBottom: "none" }}>
                <Topbar />
            </AppShell.Header>
            <AppShell.Main bg="#100d13" mih="100vh">
                <Box py="xl">
                    <Container size="lg">
                        {isLoading ? (
                            <Center py="xl">
                                <Loader color="yellow" />
                            </Center>
                        ) : !isAuthenticated ? (
                            <Paper p="lg" withBorder>
                                <Stack>
                                    <Title order={2}>Admin</Title>
                                    <Text c="dimmed">Sign in to continue.</Text>
                                    <Button onClick={signIn}>Sign in</Button>
                                </Stack>
                            </Paper>
                        ) : !canUseAdminTools ? (
                            <Paper p="lg" withBorder>
                                <Stack>
                                    <Title order={2}>Admin</Title>
                                    <Text c="dimmed">
                                        Superadmin access is required, and admin tools are disabled
                                        while impersonating.
                                    </Text>
                                </Stack>
                            </Paper>
                        ) : (
                            <Stack gap="lg">
                                <Tabs value={activeTab} onChange={selectTab}>
                                    <Tabs.List>
                                        <Tabs.Tab value="users">Users</Tabs.Tab>
                                        <Tabs.Tab value="recent-changes">Recent changes</Tabs.Tab>
                                        <Tabs.Tab
                                            value="homebrew-review"
                                            leftSection={
                                                <IconBellRinging
                                                    size={16}
                                                    color={
                                                        pendingHomebrewRequestCount
                                                            ? "var(--mantine-color-yellow-5)"
                                                            : undefined
                                                    }
                                                />
                                            }
                                        >
                                            Homebrew review
                                            {pendingHomebrewRequestCount
                                                ? ` (${pendingHomebrewRequestCount})`
                                                : ""}
                                        </Tabs.Tab>
                                    </Tabs.List>
                                    <Tabs.Panel value="users" pt="lg">
                                        <Stack gap="lg">
                                            <Group justify="space-between" align="flex-end">
                                                <Stack gap={4}>
                                                    <Title order={1}>User administration</Title>
                                                    <Text c="dimmed">
                                                        Manage name tags, superadmins, and 10 minute
                                                        impersonation sessions.
                                                    </Text>
                                                </Stack>
                                                <TextInput
                                                    w={{ base: "100%", sm: 320 }}
                                                    leftSection={<IconSearch size={16} />}
                                                    placeholder="Search users"
                                                    value={query}
                                                    onChange={(event) => {
                                                        setQuery(event.currentTarget.value)
                                                        setPage(1)
                                                    }}
                                                />
                                            </Group>

                                            <Paper p="md" withBorder>
                                                {usersQuery.isLoading ? (
                                                    <Center py="xl">
                                                        <Loader color="yellow" />
                                                    </Center>
                                                ) : usersQuery.isError ? (
                                                    <Center py="xl">
                                                        <Stack align="center" gap="sm">
                                                            <Text fw={600}>
                                                                Could not load users
                                                            </Text>
                                                            <Text size="sm" c="dimmed" ta="center">
                                                                {usersQueryErrorMessage}
                                                            </Text>
                                                            <Button
                                                                size="xs"
                                                                variant="light"
                                                                color="yellow"
                                                                onClick={() => usersQuery.refetch()}
                                                            >
                                                                Retry
                                                            </Button>
                                                        </Stack>
                                                    </Center>
                                                ) : (
                                                    <Stack gap="md">
                                                        <Table.ScrollContainer minWidth={720}>
                                                            <Table verticalSpacing="sm">
                                                                <Table.Thead>
                                                                    <Table.Tr>
                                                                        <Table.Th>User</Table.Th>
                                                                        <Table.Th>
                                                                            Superadmin
                                                                        </Table.Th>
                                                                        <Table.Th>
                                                                            Name tag
                                                                        </Table.Th>
                                                                        <Table.Th>
                                                                            Impersonation
                                                                        </Table.Th>
                                                                    </Table.Tr>
                                                                </Table.Thead>
                                                                <Table.Tbody>{rows}</Table.Tbody>
                                                            </Table>
                                                        </Table.ScrollContainer>
                                                        {usersQuery.data.total === 0 ? (
                                                            <Text c="dimmed" ta="center">
                                                                No users found.
                                                            </Text>
                                                        ) : (
                                                            <Group justify="space-between">
                                                                <Text size="sm" c="dimmed">
                                                                    Showing{" "}
                                                                    {(page - 1) *
                                                                        usersQuery.data.pageSize +
                                                                        1}
                                                                    –
                                                                    {Math.min(
                                                                        page *
                                                                            usersQuery.data
                                                                                .pageSize,
                                                                        usersQuery.data.total
                                                                    )}{" "}
                                                                    of {usersQuery.data.total} users
                                                                </Text>
                                                                <Pagination
                                                                    total={
                                                                        usersQuery.data.totalPages
                                                                    }
                                                                    value={page}
                                                                    onChange={setPage}
                                                                    color="yellow"
                                                                />
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                )}
                                            </Paper>
                                        </Stack>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="recent-changes" pt="lg">
                                        <AdminRecentChangesPanel />
                                    </Tabs.Panel>
                                    <Tabs.Panel value="homebrew-review" pt="lg">
                                        <HomebrewModerationPanel />
                                    </Tabs.Panel>
                                </Tabs>
                            </Stack>
                        )}
                    </Container>
                </Box>
            </AppShell.Main>
        </AppShell>
    )
}

export default AdminImpersonationPage
