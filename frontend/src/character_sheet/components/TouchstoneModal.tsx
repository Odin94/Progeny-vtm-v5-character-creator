import { Button, TextInput, Textarea } from "@mantine/core"
import { useState, useEffect } from "react"
import { Touchstone } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import { DisabledReason } from "~/components/ui"
import { SheetModal, selectModalClasses as formClasses } from "./selectModalParts"

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
        <SheetModal
            opened={opened}
            onClose={onClose}
            title={initialTouchstone ? "Edit Touchstone" : "Add Touchstone"}
            size="md"
            fullScreenOnPhone={false}
        >
            <form
                className={formClasses.form}
                onSubmit={(event) => {
                    event.preventDefault()
                    handleSave()
                }}
            >
                <TextInput
                    label="Name"
                    placeholder="e.g., Sister Marguerite, my old confessor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-autofocus
                    color={primaryColor}
                />
                <Textarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    resize="vertical"
                    color={primaryColor}
                />
                <TextInput
                    label="Conviction"
                    placeholder="e.g., Never harm a child"
                    value={conviction}
                    onChange={(e) => setConviction(e.target.value)}
                    color={primaryColor}
                />
                <div className={formClasses.formFooter}>
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <DisabledReason
                        reason={!name.trim() ? "Give the touchstone a name" : undefined}
                    >
                        <Button type="submit" disabled={!name.trim()} color={primaryColor}>
                            Save
                        </Button>
                    </DisabledReason>
                </div>
            </form>
        </SheetModal>
    )
}

export default TouchstoneModal
