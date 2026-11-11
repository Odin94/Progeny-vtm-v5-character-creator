import { Button, Divider, Group, Modal, Stack, Text, TextInput } from "@mantine/core"
import { IconCopy, IconEyeOff, IconLink } from "@tabler/icons-react"
import type { CoterieInviteResponse } from "~/utils/api"
import classes from "./me.module.css"

type CoterieInvitesModalProps = {
    opened: boolean
    onClose: () => void
    coterieName?: string
    invites?: CoterieInviteResponse[]
    generatedInviteUrl?: string | null
    isGenerating: boolean
    onGenerate: () => void
    onCopy: () => void
    onHide: () => void
    onRevoke: (invite: CoterieInviteResponse) => void
}

const formatCoterieDate = (value: string | Date) => new Date(value).toLocaleString()

export const CoterieInvitesModal = ({
    opened,
    onClose,
    coterieName,
    invites,
    generatedInviteUrl,
    isGenerating,
    onGenerate,
    onCopy,
    onHide,
    onRevoke
}: CoterieInvitesModalProps) => (
    <Modal
        opened={opened}
        onClose={onClose}
        title={`Invites for ${coterieName || "Coterie"}`}
        centered
        size="lg"
    >
        <Stack gap="md">
            <Button
                leftSection={<IconLink size={16} />}
                onClick={onGenerate}
                loading={isGenerating}
            >
                Generate Invite Link
            </Button>

            {generatedInviteUrl ? (
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        This full invite link is shown only once.
                    </Text>
                    <Group gap="xs" align="flex-end" wrap="wrap">
                        <TextInput
                            label="New invite link"
                            value={generatedInviteUrl}
                            readOnly
                            onFocus={(event) => event.currentTarget.select()}
                            style={{ flex: "1 1 260px" }}
                        />
                        <Group gap="xs">
                            <Button
                                variant="light"
                                leftSection={<IconCopy size={16} />}
                                onClick={onCopy}
                            >
                                Copy
                            </Button>
                            <Button
                                color="gray"
                                variant="subtle"
                                leftSection={<IconEyeOff size={16} />}
                                onClick={onHide}
                            >
                                Hide
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            ) : null}

            <Divider />

            <Stack gap="xs">
                <p className={classes.listLabel}>
                    Invite links <span>{invites?.length ?? 0}</span>
                </p>
                {invites && invites.length > 0 ? (
                    invites.map((invite) => (
                        <div key={invite.id} className={classes.invite}>
                            <Stack gap={2}>
                                <Text size="sm">Expires {formatCoterieDate(invite.expiresAt)}</Text>
                                <Text size="xs" c="dimmed">
                                    Created {formatCoterieDate(invite.createdAt)}
                                </Text>
                            </Stack>
                            <Group gap="sm">
                                <span
                                    className={classes.inviteState}
                                    data-active={invite.active || undefined}
                                >
                                    {invite.active ? "Active" : "Inactive"}
                                </span>
                                {invite.active ? (
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="light"
                                        onClick={() => onRevoke(invite)}
                                    >
                                        Revoke
                                    </Button>
                                ) : null}
                            </Group>
                        </div>
                    ))
                ) : (
                    <Text c="dimmed" size="sm">
                        No invite links yet.
                    </Text>
                )}
            </Stack>
        </Stack>
    </Modal>
)
