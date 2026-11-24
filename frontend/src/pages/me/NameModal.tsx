import { Modal, Stack, TextInput } from "@mantine/core"
import { ModalFooter } from "./ModalFooter"

type NameModalProps = {
    opened: boolean
    onClose: () => void
    title: string
    label: string
    placeholder: string
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    submitLabel: string
    loading?: boolean
}

/** One-field dialog for naming things (new character, new/renamed coterie). */
export const NameModal = ({
    opened,
    onClose,
    title,
    label,
    placeholder,
    value,
    onChange,
    onSubmit,
    submitLabel,
    loading
}: NameModalProps) => (
    <Modal opened={opened} onClose={onClose} title={title} centered>
        <form
            onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
            }}
        >
            <Stack gap="md">
                <TextInput
                    data-autofocus
                    label={label}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={onSubmit}
                    confirmLabel={submitLabel}
                    confirmType="submit"
                    loading={loading}
                />
            </Stack>
        </form>
    </Modal>
)
