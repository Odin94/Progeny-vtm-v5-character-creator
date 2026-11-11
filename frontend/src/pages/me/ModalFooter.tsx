import { Button, Divider, Group } from "@mantine/core"
import type { ReactNode } from "react"
import { confirmationModalCancelButtonStyles } from "~/components/ConfirmActionModal"
import { DisabledReason } from "~/components/ui"

type ModalFooterProps = {
    onCancel: () => void
    onConfirm: () => void
    confirmLabel: ReactNode
    loading?: boolean
    cancelDisabled?: boolean
    /** Disables the confirm button and explains why on hover. */
    disabledReason?: string
    confirmColor?: string
    confirmType?: "button" | "submit"
}

/** Cancel (ghost, left) + confirm (right) — the same footer as `ConfirmActionModal`. */
export const ModalFooter = ({
    onCancel,
    onConfirm,
    confirmLabel,
    loading,
    cancelDisabled,
    disabledReason,
    confirmColor,
    confirmType = "button"
}: ModalFooterProps) => (
    <>
        <Divider />
        <Group justify="space-between" gap="sm">
            <Button
                variant="subtle"
                color="gray"
                onClick={onCancel}
                disabled={cancelDisabled}
                styles={confirmationModalCancelButtonStyles}
            >
                Cancel
            </Button>
            <DisabledReason reason={disabledReason}>
                <Button
                    type={confirmType}
                    color={confirmColor}
                    onClick={confirmType === "submit" ? undefined : onConfirm}
                    loading={loading}
                    disabled={Boolean(disabledReason)}
                >
                    {confirmLabel}
                </Button>
            </DisabledReason>
        </Group>
    </>
)
