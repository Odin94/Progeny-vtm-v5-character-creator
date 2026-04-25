import { useMediaQuery } from "@mantine/hooks"
import { Button, Divider, Group, Modal, ModalStylesNames, Stack, Text } from "@mantine/core"
import { CSSProperties, ReactNode } from "react"
import { RAW_GREY, rgba } from "~/theme/colors"
import { confirmationModalDangerConfirmButtonStyles } from "~/generator/components/sharedGeneratorConfirmButtonStyles"

export const ConfirmationModalStyle = (
    phoneScreen: boolean
): Partial<Record<ModalStylesNames, CSSProperties>> => ({
    content: {
        border: "1px solid rgba(125, 91, 72, 0.38)",
        background:
            "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
        boxShadow: "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
    },
    body: {
        padding: phoneScreen ? "1.1rem" : "1.35rem"
    }
})

export const confirmationModalHeadingStyle = (phoneScreen: boolean) => ({
    fontFamily: "Cinzel, Georgia, serif",
    fontSize: phoneScreen ? "1.2rem" : "1.35rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(244, 236, 232, 0.95)"
})

export const confirmationModalBodyStyle = {
    fontFamily: "Inter, Segoe UI, sans-serif",
    fontSize: "0.9rem",
    color: rgba(RAW_GREY, 0.62)
} as const

export const confirmationModalCancelButtonStyles = {
    root: {
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        fontFamily: "Cinzel, Georgia, serif"
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
    children
}: ConfirmActionModalProps) => {
    const phoneScreen = useMediaQuery("(max-width: 48em)")

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title=""
            centered
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={ConfirmationModalStyle(phoneScreen)}
        >
            <Stack gap="md">
                <Stack gap={6} align="center">
                    <Text ta="center" style={confirmationModalHeadingStyle(phoneScreen)}>
                        {title}
                    </Text>
                    <Text ta="center" style={confirmationModalBodyStyle}>
                        {body}
                    </Text>
                </Stack>

                {children}

                <Divider color="rgba(125, 91, 72, 0.28)" />

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
            </Stack>
        </Modal>
    )
}

export default ConfirmActionModal
