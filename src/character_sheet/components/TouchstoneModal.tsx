import { Button, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core"
import { useState, useEffect } from "react"
import { Touchstone } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"

type TouchstoneModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    initialTouchstone?: Touchstone | null
}

const TouchstoneModal = ({ opened, onClose, options, initialTouchstone }: TouchstoneModalProps) => {
    const { character, setCharacter, primaryColor } = options
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
            conviction: conviction.trim(),
        }

        if (initialTouchstone) {
            const index = character.touchstones.findIndex(
                (t) =>
                    t.name === initialTouchstone.name &&
                    t.description === initialTouchstone.description &&
                    t.conviction === initialTouchstone.conviction
            )
            if (index !== -1) {
                const updatedTouchstones = [...character.touchstones]
                updatedTouchstones[index] = newTouchstone
                setCharacter({
                    ...character,
                    touchstones: updatedTouchstones,
                })
            }
        } else {
            setCharacter({
                ...character,
                touchstones: [...character.touchstones, newTouchstone],
            })
        }

        onClose()
    }

    return (
        <Modal opened={opened} onClose={onClose} title={initialTouchstone ? "Edit Touchstone" : "Add Touchstone"} size="md">
            <Stack gap="md">
                <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} minRows={3} />
                <TextInput label="Conviction" value={conviction} onChange={(e) => setConviction(e.target.value)} />
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
