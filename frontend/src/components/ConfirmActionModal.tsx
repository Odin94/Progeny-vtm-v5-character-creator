import { useFileSavePromptOpen } from "~/utils/fileSavePromptStore"
import { useMediaQuery } from "@mantine/hooks"
import { Button, Divider, Group, Modal, ModalStylesNames, Stack, Text } from "@mantine/core"
import { CSSProperties, ReactNode } from "react"
import { COLOR_MODAL_DIVIDER } from "~/theme/colors"
import { confirmationModalDangerConfirmButtonStyles } from "~/generator/components/sharedGeneratorConfirmButtonStyles"
import { Ornament } from "./ui/Ornament"

/**
 * Surface, border, shadow and scale-in/out transition come from the Modal theme
 * (src/theme/modal.ts). These helpers only keep the historical paddings so existing
 * callers render the same layout.
 */
export const ConfirmationModalStyle = (
    phoneScreen: boolean
): Partial<Record<ModalStylesNames, CSSProperties>> => ({
    body: {
        padding: phoneScreen ? "1.1rem" : "1.35rem"
    }
})

export const confirmationModalWithHeaderStyles = (
    phoneScreen: boolean
): Partial<Record<ModalStylesNames, CSSProperties>> => ({
    ...ConfirmationModalStyle(phoneScreen),
    header: {
        padding: phoneScreen ? "1.1rem 1.1rem 0" : "1.35rem 1.35rem 0",
        justifyContent: "center"
    },
    title: confirmationModalHeadingStyle(phoneScreen)
})

export const confirmationModalHeadingStyle = (phoneScreen: boolean) => ({
    fontFamily: "var(--pg-font-display)",
    fontWeight: 600,
    fontSize: phoneScreen ? "1.15rem" : "1.3rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--pg-ink)"
})

export const confirmationModalBodyStyle = {
    fontFamily: "var(--pg-font-body)",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    color: "var(--pg-ink-3)",
    textWrap: "pretty"
} as const

export const confirmationModalCancelButtonStyles = {
    root: {
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        fontFamily: "var(--pg-font-display)"
    }
} as const

type ConfirmActionModalProps = {
    opened: boolean
    onClose: () => void
    onConfirm: () => void
    title: ReactNode
    body: ReactNode
    confirmLabel: ReactNode
    cancelLabel?: ReactNode
    confirmColor?: string
    loading?: boolean
    disabled?: boolean
    children?: ReactNode
    footer?: ReactNode
    size?: string | number
    /** Raise above fixed overlays such as the docked coterie chat. */
    zIndex?: number
}

const ConfirmActionModal = ({
    opened,
    onClose,
    onConfirm,
    title,
    body,
    confirmLabel,
    cancelLabel = "Cancel",
    confirmColor = "red",
    loading = false,
    disabled = false,
    children,
    footer,
    size,
    zIndex
}: ConfirmActionModalProps) => {
    const fileSaveOpen = useFileSavePromptOpen()
    const phoneScreen = useMediaQuery("(max-width: 48em)")

    return (
        <Modal
            opened={opened}
            trapFocus={!fileSaveOpen}
            aria-hidden={fileSaveOpen || undefined}
            closeOnEscape={!fileSaveOpen}
            size={size}
            zIndex={zIndex}
            onClose={onClose}
            title=""
            centered
            withCloseButton={false}
            styles={ConfirmationModalStyle(phoneScreen)}
        >
            <Stack gap="md">
                <Stack gap={8} align="center">
                    <Text ta="center" style={confirmationModalHeadingStyle(phoneScreen)}>
                        {title}
                    </Text>
                    <Ornament
                        style={{
                            width: 120,
                            height: 10,
                            color:
                                confirmColor === "red"
                                    ? "var(--pg-blood-bright)"
                                    : "var(--pg-gold-dim)"
                        }}
                    />
                    <Text ta="center" style={confirmationModalBodyStyle}>
                        {body}
                    </Text>
                </Stack>

                {children}

                <Divider color={COLOR_MODAL_DIVIDER} />

                {footer ?? (
                    <Group justify="space-between">
                        <Button
                            color="gray"
                            variant="subtle"
                            onClick={onClose}
                            styles={confirmationModalCancelButtonStyles}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            color={confirmColor}
                            onClick={onConfirm}
                            loading={loading}
                            disabled={disabled}
                            styles={
                                confirmColor === "red"
                                    ? confirmationModalDangerConfirmButtonStyles
                                    : undefined
                            }
                        >
                            {confirmLabel}
                        </Button>
                    </Group>
                )}
            </Stack>
        </Modal>
    )
}

export default ConfirmActionModal
