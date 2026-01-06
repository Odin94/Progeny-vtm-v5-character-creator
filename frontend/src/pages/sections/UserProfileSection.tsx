import { ActionIcon, Button, Card, Group, Stack, Text, TextInput, Title, useMantineTheme } from "@mantine/core"
import { IconEdit, IconUser } from "@tabler/icons-react"
import FocusBorderWrapper from "~/character_sheet/components/FocusBorderWrapper"

type UserProfileSectionProps = {
    user: {
        email?: string | null
        firstName?: string | null
        lastName?: string | null
        nickname?: string | null
    } | null
    isEditingNickname: boolean
    nicknameValue: string
    setNicknameValue: (value: string) => void
    setIsEditingNickname: (value: boolean) => void
    isUpdatingProfile: boolean
    redColorValue: string
    handleSaveNickname: () => void
    handleCancelNickname: () => void
}

const UserProfileSection = ({
    user,
    isEditingNickname,
    nicknameValue,
    setNicknameValue,
    setIsEditingNickname,
    isUpdatingProfile,
    redColorValue,
    handleSaveNickname,
    handleCancelNickname,
}: UserProfileSectionProps) => {
    return (
        <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
            <Group gap="md" mb="md">
                <IconUser size={32} />
                <Title order={2}>User Profile</Title>
            </Group>
            <Stack gap="sm">
                <Group gap="xs">
                    <Text fw={500}>Email:</Text>
                    <Text>{user?.email}</Text>
                </Group>
                {user?.firstName || user?.lastName ? (
                    <Group gap="xs">
                        <Text fw={500}>Name:</Text>
                        <Text>{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</Text>
                    </Group>
                ) : null}
                <Group gap="xs" align="flex-start">
                    <Text fw={500} style={{ minWidth: "80px" }}>
                        Nickname:
                    </Text>
                    {isEditingNickname ? (
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <FocusBorderWrapper colorValue={redColorValue}>
                                <TextInput
                                    value={nicknameValue}
                                    onChange={(e) => setNicknameValue(e.target.value)}
                                    placeholder="Enter nickname"
                                    maxLength={255}
                                    disabled={isUpdatingProfile}
                                />
                            </FocusBorderWrapper>
                            <Group gap="xs">
                                <Button size="xs" color="red" onClick={handleSaveNickname} loading={isUpdatingProfile}>
                                    Save
                                </Button>
                                <Button size="xs" variant="subtle" onClick={handleCancelNickname} disabled={isUpdatingProfile} color="gray">
                                    Cancel
                                </Button>
                            </Group>
                        </Stack>
                    ) : (
                        <Group gap="xs" style={{ flex: 1 }}>
                            <Text>{user?.nickname || <Text c="dimmed">No nickname set</Text>}</Text>
                            <ActionIcon color="red" size="sm" variant="subtle" onClick={() => setIsEditingNickname(true)}>
                                <IconEdit size={16} />
                            </ActionIcon>
                        </Group>
                    )}
                </Group>
            </Stack>
        </Card>
    )
}

export default UserProfileSection
