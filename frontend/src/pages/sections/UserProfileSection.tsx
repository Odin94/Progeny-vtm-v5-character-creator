import {
    ActionIcon,
    Button,
    Card,
    Group,
    Stack,
    Switch,
    Text,
    TextInput,
    Title
} from "@mantine/core"
import { IconEdit, IconEye, IconEyeOff, IconUser } from "@tabler/icons-react"
import { useState } from "react"
import NameTag from "~/components/NameTag"

type UserProfileSectionProps = {
    user: {
        email?: string | null
        firstName?: string | null
        lastName?: string | null
        nickname?: string | null
        nameTagEnabled: boolean
        nameTagVisible: boolean
    } | null
    isEditingNickname: boolean
    nicknameValue: string
    setNicknameValue: (value: string) => void
    setIsEditingNickname: (value: boolean) => void
    isUpdatingProfile: boolean
    redColorValue: string
    handleSaveNickname: () => void
    handleCancelNickname: () => void
    handleNameTagToggle: (visible: boolean) => void
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
    handleNameTagToggle
}: UserProfileSectionProps) => {
    const [emailVisible, setEmailVisible] = useState(false)
    const nameTagLabel =
        user?.nickname || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Player"

    return (
        <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
            <Group gap="md" mb="md">
                <IconUser size={32} />
                <Title order={2}>User Profile</Title>
            </Group>
            <Stack gap="sm">
                <Group gap="xs" align="center">
                    <Text fw={500}>Email:</Text>
                    <Text>{emailVisible ? (user?.email ?? "No email available") : "Hidden"}</Text>
                    <ActionIcon
                        color="red"
                        size="sm"
                        variant="subtle"
                        onClick={() => setEmailVisible((current) => !current)}
                        aria-label={emailVisible ? "Hide email" : "Show email"}
                    >
                        {emailVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </ActionIcon>
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
                            <TextInput
                                value={nicknameValue}
                                onChange={(e) => setNicknameValue(e.target.value)}
                                placeholder="Enter nickname"
                                maxLength={255}
                                disabled={isUpdatingProfile}
                            />
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    color="red"
                                    onClick={handleSaveNickname}
                                    loading={isUpdatingProfile}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    onClick={handleCancelNickname}
                                    disabled={isUpdatingProfile}
                                    color="gray"
                                >
                                    Cancel
                                </Button>
                            </Group>
                        </Stack>
                    ) : (
                        <Group gap="xs" style={{ flex: 1 }}>
                            <Text>{user?.nickname || <Text c="dimmed">No nickname set</Text>}</Text>
                            <ActionIcon
                                color="red"
                                size="sm"
                                variant="subtle"
                                onClick={() => setIsEditingNickname(true)}
                            >
                                <IconEdit size={16} />
                            </ActionIcon>
                        </Group>
                    )}
                </Group>
                {user?.nameTagEnabled ? (
                    <Group gap="md" align="center" mt="xs">
                        <Switch
                            color="grape"
                            checked={user.nameTagVisible}
                            disabled={isUpdatingProfile}
                            onChange={(event) => handleNameTagToggle(event.currentTarget.checked)}
                            label="Show my name tag to other players"
                            description="Adds a highlighted player tag beside your name in chats and coteries."
                        />
                        {user.nameTagVisible ? <NameTag name={nameTagLabel} /> : null}
                    </Group>
                ) : null}
            </Stack>
        </Card>
    )
}

export default UserProfileSection
