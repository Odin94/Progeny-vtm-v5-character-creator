import { Button, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useState, useEffect } from "react"
import { Touchstone } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import { confirmationModalWithHeaderStyles } from "~/components/ConfirmActionModal"

type TouchstoneModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    initialTouchstone?: Touchstone | null
    initialIndex?: number | null
}

const TouchstoneModal = ({
    opened,
    onClose,
    options,
    initialTouchstone,
    initialIndex
}: TouchstoneModalProps) => {
    const { character, setCharacter, primaryColor } = options
    const phoneScreen = useMediaQuery("(max-width: 48em)")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [conviction, setConviction] = useState("")

    useEffect(() => {
        if (opened) {
            if (initialTouchstone) {
                setName(initialTouchstone.name)
                setDescription(initialTouchstone.description)
                setConviction(initialTouchstone.conviction)
            } else {
                setName("")
                setDescription("")
                setConviction("")
            }
        }
    }, [opened, initialTouchstone])

    const handleSave = () => {
        if (!name.trim()) return

        const newTouchstone: Touchstone = {
            name: name.trim(),
            description: description.trim(),
            conviction: conviction.trim()
        }

        if (initialTouchstone && initialIndex != null) {
            // Update by index. Matching on exact name/description/conviction equality dropped the
            // edit whenever the field changed (or when two touchstones were identical), silently
            // discarding the user's change while the modal closed.
            setCharacter((current) => {
                if (initialIndex < 0 || initialIndex >= current.touchstones.length) {
                    return current
                }
                const updatedTouchstones = [...current.touchstones]
                updatedTouchstones[initialIndex] = newTouchstone
                return {
                    ...current,
                    touchstones: updatedTouchstones
                }
            })
        } else {
            setCharacter((current) => ({
                ...current,
                touchstones: [...current.touchstones, newTouchstone]
            }))
        }

        onClose()
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={initialTouchstone ? "Edit Touchstone" : "Add Touchstone"}
            size="md"
            centered
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={confirmationModalWithHeaderStyles(phoneScreen)}
        >
            <Stack gap="md">
                <TextInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    color={primaryColor}
                />
                <Textarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minRows={3}
                    color={primaryColor}
                />
                <TextInput
                    label="Conviction"
                    value={conviction}
                    onChange={(e) => setConviction(e.target.value)}
                    color={primaryColor}
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={onClose} color={primaryColor}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim()} color={primaryColor}>
                        Save
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default TouchstoneModal
