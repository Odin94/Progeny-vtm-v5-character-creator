import { Alert, Button, Group, Modal, NumberInput, Stack, TextInput, Textarea } from "@mantine/core"
import { useEffect, useState } from "react"
import { Ritual } from "~/data/Disciplines"
import { DisciplineName } from "~/data/NameSchemas"
import {
    attributeNameTo_WoD5EVtt_Key,
    disciplineNameTo_WoD5EVtt_Key,
    skillNameTo_WoD5EVtt_Key
} from "~/generator/foundryWoDJsonCreator"
import { AttributesKey } from "~/data/Attributes"
import { SkillsKey } from "~/data/Skills"
import { SheetOptions } from "../CharacterSheet"
import { getAvailableXP, getRitualCost } from "../utils/xp"

type CustomRitualModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    editingRitual?: Ritual | null
    onSave?: () => void
}

const CustomRitualModal = ({
    opened,
    onClose,
    options,
    editingRitual,
    onSave
}: CustomRitualModalProps) => {
    const { character, setCharacter, mode, primaryColor } = options
    const [name, setName] = useState("")
    const [summary, setSummary] = useState("")
    const [dicePool, setDicePool] = useState("")
    const [requiredTime, setRequiredTime] = useState("")
    const [ingredients, setIngredients] = useState("")
    const [level, setLevel] = useState<number | string>(1)
    const [rouseChecks, setRouseChecks] = useState<number | string>(1)
    const [error, setError] = useState<string | null>(null)
    const [dicePoolWarning, setDicePoolWarning] = useState<string | null>(null)

    const validateDicePool = (dicePoolString: string): string | null => {
        if (!dicePoolString || dicePoolString.trim() === "" || dicePoolString === "-") {
            return null
        }

        const components = dicePoolString
            .split("+")
            .map((comp) => comp.trim())
            .filter((comp) => comp !== "")

        const customDisciplineNames = character.customDisciplines
            ? Object.keys(character.customDisciplines).map((name) => name.toLowerCase())
            : []
        const invalidKeys: string[] = []

        for (const component of components) {
            const alternatives = component
                .split("/")
                .map((alt) => alt.trim().toLowerCase())
                .filter((alt) => alt !== "")

            if (alternatives.length === 0) {
                invalidKeys.push(component)
                continue
            }

            const hasValidAlternative = alternatives.some(
                (alt) =>
                    attributeNameTo_WoD5EVtt_Key[alt as AttributesKey] ||
                    skillNameTo_WoD5EVtt_Key[alt as SkillsKey] ||
                    disciplineNameTo_WoD5EVtt_Key[alt as DisciplineName] ||
                    customDisciplineNames.includes(alt)
            )

            if (!hasValidAlternative) {
                invalidKeys.push(component)
            }
        }

        return invalidKeys.length > 0
            ? `Unable to parse: ${invalidKeys.join(", ")}. Make sure these are valid attributes, skills, or disciplines.`
            : null
    }

    useEffect(() => {
        if (!opened) return

        if (editingRitual) {
            setName(editingRitual.name)
            setSummary(editingRitual.summary)
            setDicePool(editingRitual.dicePool)
            setRequiredTime(editingRitual.requiredTime)
            setIngredients(editingRitual.ingredients)
            setLevel(editingRitual.level)
            setRouseChecks(editingRitual.rouseChecks)
            setDicePoolWarning(validateDicePool(editingRitual.dicePool))
        } else {
            setName("")
            setSummary("")
            setDicePool("Intelligence + Blood Sorcery")
            setRequiredTime("")
            setIngredients("")
            setLevel(1)
            setRouseChecks(1)
            setDicePoolWarning(null)
        }

        setError(null)
    }, [opened, editingRitual])

    const handleSave = () => {
        if (!name.trim()) {
            setError("Ritual name is required")
            return
        }

        const levelNum = typeof level === "string" ? parseInt(level) || 1 : level
        const rouseChecksNum =
            typeof rouseChecks === "string" ? parseInt(rouseChecks) || 0 : rouseChecks

        if (levelNum < 1) {
            setError("Level must be at least 1")
            return
        }

        if (rouseChecksNum < 0) {
            setError("Rouse checks must be 0 or greater")
            return
        }

        const existingRitual = character.rituals.find(
            (ritual) =>
                ritual !== editingRitual &&
                ritual.name.trim().toLowerCase() === name.trim().toLowerCase()
        )

        if (existingRitual) {
            setError("This character already has a ritual with that name")
            return
        }

        if (!editingRitual && mode === "xp") {
            const cost = getRitualCost(levelNum)
            const availableXP = getAvailableXP(character)

            if (availableXP < cost) {
                setError(`Insufficient XP. Need ${cost}, have ${availableXP}`)
                return
            }
        }

        const ritual: Ritual = {
            name: name.trim(),
            summary: summary.trim(),
            rouseChecks: rouseChecksNum,
            requiredTime: requiredTime.trim(),
            dicePool: dicePool.trim(),
            ingredients: ingredients.trim(),
            level: levelNum,
            discipline: "blood sorcery",
            isCustom: true
        }

        const updatedCharacter = {
            ...character,
            rituals: editingRitual
                ? character.rituals.map((existing) =>
                      existing === editingRitual ? ritual : existing
                  )
                : [...character.rituals, ritual]
        }

        if (!editingRitual && mode === "xp") {
            updatedCharacter.ephemeral = {
                ...updatedCharacter.ephemeral,
                experienceSpent:
                    updatedCharacter.ephemeral.experienceSpent + getRitualCost(ritual.level)
            }
        }

        setCharacter(updatedCharacter)
        if (onSave) {
            onSave()
        } else {
            onClose()
        }
    }

    const handleDelete = () => {
        if (!editingRitual) return

        setCharacter({
            ...character,
            rituals: character.rituals.filter((ritual) => ritual !== editingRitual)
        })
        onClose()
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingRitual ? "Edit Custom Ritual" : "Create Custom Ritual"}
            size="md"
        >
            <Stack gap="md">
                <TextInput
                    label="Ritual Name"
                    placeholder="e.g., Ward Against Mirrors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={error}
                    required
                    color={primaryColor}
                />
                <Textarea
                    label="Summary"
                    placeholder="Brief description of the ritual"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    color={primaryColor}
                />
                <TextInput
                    label="Dice Pool"
                    placeholder="e.g., Intelligence + Blood Sorcery"
                    value={dicePool}
                    onChange={(e) => setDicePool(e.target.value)}
                    onBlur={() => setDicePoolWarning(validateDicePool(dicePool))}
                    color={primaryColor}
                />
                {dicePoolWarning ? (
                    <Alert color="yellow" title="Dice Pool Warning">
                        {dicePoolWarning}
                    </Alert>
                ) : null}
                <TextInput
                    label="Time"
                    placeholder="e.g., 1 hour"
                    value={requiredTime}
                    onChange={(e) => setRequiredTime(e.target.value)}
                    color={primaryColor}
                />
                <Textarea
                    label="Ingredients"
                    placeholder="Required ingredients"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={2}
                    color={primaryColor}
                />
                <NumberInput
                    label="Level"
                    value={level}
                    onChange={setLevel}
                    min={1}
                    required
                    color={primaryColor}
                />
                <NumberInput
                    label="Rouse Checks"
                    value={rouseChecks}
                    onChange={setRouseChecks}
                    min={0}
                    required
                />
                <Group justify="space-between">
                    {editingRitual ? (
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

export default CustomRitualModal
