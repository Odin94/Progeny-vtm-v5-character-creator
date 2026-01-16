import { Button, Group, Modal, Stack, TextInput, Textarea, useMantineTheme } from "@mantine/core"
import { useState, useEffect } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { CustomDiscipline } from "~/data/Disciplines"
import { Character } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import FocusBorderWrapper from "./FocusBorderWrapper"

type CustomDisciplineModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    editingDisciplineName?: DisciplineName | null
    onSave?: () => void
}

const CustomDisciplineModal = ({ opened, onClose, options, editingDisciplineName, onSave }: CustomDisciplineModalProps) => {
    const { character, setCharacter, primaryColor } = options
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const [name, setName] = useState("")
    const [summary, setSummary] = useState("")
    const [logo, setLogo] = useState("")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (opened) {
            if (editingDisciplineName && character.customDisciplines?.[editingDisciplineName]) {
                const customDiscipline = character.customDisciplines[editingDisciplineName]
                setName(customDiscipline.name)
                setSummary(customDiscipline.summary)
                setLogo(customDiscipline.logo || "")
                setError(null)
            } else {
                setName("")
                setSummary("")
                setLogo("")
                setError(null)
            }
        }
    }, [opened, editingDisciplineName, character.customDisciplines])

    const handleSave = () => {
        if (!name.trim()) {
            setError("Discipline name is required")
            return
        }

        const disciplineNameKey = editingDisciplineName || name.toLowerCase().trim()
        const customDiscipline: CustomDiscipline = {
            name: name.trim(),
            summary: summary.trim(),
            logo: logo.trim(),
        }

        const updatedCustomDisciplines = {
            ...(character.customDisciplines || {}),
            [disciplineNameKey]: customDiscipline,
        }

        if (editingDisciplineName && editingDisciplineName !== disciplineNameKey) {
            delete updatedCustomDisciplines[editingDisciplineName]
        }

        const updatedCharacter = {
            ...character,
            customDisciplines: updatedCustomDisciplines,
        }

        if (!character.availableDisciplineNames.includes(disciplineNameKey)) {
            updatedCharacter.availableDisciplineNames = [...character.availableDisciplineNames, disciplineNameKey]
        }

        setCharacter(updatedCharacter)
        if (onSave) {
            onSave()
        } else {
            onClose()
        }
    }

    const handleDelete = () => {
        if (!editingDisciplineName) return

        const updatedCustomDisciplines = { ...(character.customDisciplines || {}) }
        delete updatedCustomDisciplines[editingDisciplineName]

        const updatedCharacter = {
            ...character,
            customDisciplines: updatedCustomDisciplines,
            availableDisciplineNames: character.availableDisciplineNames.filter((n) => n !== editingDisciplineName),
            disciplines: character.disciplines.filter((p) => p.discipline !== editingDisciplineName),
        }

        setCharacter(updatedCharacter)
        onClose()
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingDisciplineName ? "Edit Custom Discipline" : "Create Custom Discipline"}
            size="md"
        >
            <Stack gap="md">
                <FocusBorderWrapper colorValue={colorValue}>
                    <TextInput
                        label="Discipline Name"
                        placeholder="e.g., Chronomancy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={error}
                        required
                    />
                </FocusBorderWrapper>
                <FocusBorderWrapper colorValue={colorValue}>
                    <Textarea
                        label="Summary"
                        placeholder="Brief description of the discipline"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={3}
                    />
                </FocusBorderWrapper>
                <FocusBorderWrapper colorValue={colorValue}>
                    <TextInput
                        label="Logo URL (optional)"
                        placeholder="URL to an image for the discipline logo"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                    />
                </FocusBorderWrapper>
                <Group justify="space-between">
                    {editingDisciplineName ? (
                        <Button color="red" variant="subtle" onClick={handleDelete}>
                            Delete
                        </Button>
                    ) : (
                        <div />
                    )}
                    <Group>
                        <Button variant="subtle" onClick={onClose} color={primaryColor}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} color={primaryColor}>
                            Save
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default CustomDisciplineModal
