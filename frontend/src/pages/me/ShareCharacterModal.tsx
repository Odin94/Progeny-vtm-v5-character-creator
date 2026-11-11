import { Badge, Group, Modal, Skeleton, Stack, Text, TextInput } from "@mantine/core"
import { IconAt } from "@tabler/icons-react"
import NameTag from "~/components/NameTag"
import { useCharacterShares } from "~/hooks/useShares"
import { ModalFooter } from "./ModalFooter"
import classes from "./me.module.css"

type ShareCharacterModalProps = {
    opened: boolean
    characterToShare: { id: string; name: string } | null
    shareNickname: string
    setShareNickname: (value: string) => void
    isSharing: boolean
    handleConfirmShare: () => void
    onClose: () => void
}

const ShareCharacterModalContent = ({
    characterToShare,
    shareNickname,
    setShareNickname,
    isSharing,
    handleConfirmShare,
    onClose
}: Omit<ShareCharacterModalProps, "opened">) => {
    const { data: shares, isLoading: isLoadingShares } = useCharacterShares(
        characterToShare?.id || null
    )

    const sharedWithUsers = shares?.filter((share) => !!share.sharedWith.nickname) || []

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                if (shareNickname.trim()) handleConfirmShare()
            }}
        >
            <Stack gap="md">
                <Text ta="center">
                    Share <strong>{characterToShare?.name}</strong> with another user.
                </Text>
                <Text c="dimmed" size="sm">
                    This is a read-only share. The other user can view your character, and they can
                    store and edit their own copy of it. They can see updates you have made to your
                    character by clicking &quot;Load&quot;.
                </Text>
                <TextInput
                    data-autofocus
                    label="User Nickname"
                    placeholder="Enter the user's nickname"
                    leftSection={<IconAt size={15} />}
                    value={shareNickname}
                    onChange={(e) => setShareNickname(e.target.value)}
                    disabled={isSharing}
                />
                {isLoadingShares ? (
                    <Stack gap={6} aria-hidden="true">
                        <Skeleton height={10} width={120} radius="sm" />
                        <Group gap="xs">
                            <Skeleton height={20} width={72} radius="sm" />
                            <Skeleton height={20} width={56} radius="sm" />
                        </Group>
                    </Stack>
                ) : sharedWithUsers.length > 0 ? (
                    <Stack gap="xs">
                        <p className={classes.listLabel}>
                            Currently shared with <span>{sharedWithUsers.length}</span>
                        </p>
                        <Group gap="xs">
                            {sharedWithUsers.map((share) =>
                                share.sharedWith.showNameTag ? (
                                    <NameTag
                                        key={share.sharedWith.nickname}
                                        name={share.sharedWith.nickname!}
                                    />
                                ) : (
                                    <Badge
                                        key={share.sharedWith.nickname}
                                        color="gray"
                                        variant="light"
                                        tt="none"
                                    >
                                        {share.sharedWith.nickname}
                                    </Badge>
                                )
                            )}
                        </Group>
                    </Stack>
                ) : null}
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={handleConfirmShare}
                    confirmLabel="Share"
                    confirmType="submit"
                    loading={isSharing}
                    cancelDisabled={isSharing}
                    disabledReason={
                        !shareNickname.trim() && !isSharing ? "Enter a nickname first" : undefined
                    }
                />
            </Stack>
        </form>
    )
}

export const ShareCharacterModal = ({ opened, onClose, ...props }: ShareCharacterModalProps) => (
    <Modal opened={opened} onClose={onClose} title="Share Character" centered>
        <ShareCharacterModalContent onClose={onClose} {...props} />
    </Modal>
)
