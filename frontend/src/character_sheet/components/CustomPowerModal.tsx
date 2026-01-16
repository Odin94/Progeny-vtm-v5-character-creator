import { Alert, Button, Group, Modal, NumberInput, Stack, TextInput, Textarea, useMantineTheme } from "@mantine/core"
import { useEffect, useState } from "react"
import { Power } from "~/data/Disciplines"
import { DisciplineName } from "~/data/NameSchemas"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { attributeNameTo_WoD5EVtt_Key, skillNameTo_WoD5EVtt_Key, disciplineNameTo_WoD5EVtt_Key } from "~/generator/foundryWoDJsonCreator"
import { AttributesKey } from "~/data/Attributes"
import { SkillsKey } from "~/data/Skills"
import { SheetOptions } from "../CharacterSheet"
import { getDisciplineCost } from "../utils/xp"
import FocusBorderWrapper from "./FocusBorderWrapper"

type CustomPowerModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    disciplineName: DisciplineName
    editingPower?: Power | null
}

const CustomPowerModal = ({ opened, onClose, options, disciplineName, editingPower }: CustomPowerModalProps) => {
    const { character, setCharacter, mode, primaryColor } = options
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const [name, setName] = useState("")
    const [summary, setSummary] = useState("")
    const [dicePool, setDicePool] = useState("")
    const [level, setLevel] = useState<number | string>(1)
    const [rouseChecks, setRouseChecks] = useState<number | string>(0)
    const [error, setError] = useState<string | null>(null)
    const [dicePoolWarning, setDicePoolWarning] = useState<string | null>(null)

    const validateDicePool = (dicePoolString: string): string | null => {
        if (!dicePoolString || dicePoolString.trim() === "" || dicePoolString === "-") {
            return null
        }

        const components = dicePoolString.split("+").map((comp) => comp.trim()).filter((comp) => comp !== "")

        if (components.length === 0) {
            return null
        }

        const customDisciplineNames = character.customDisciplines ? Object.keys(character.customDisciplines).map((name) => name.toLowerCase()) : []

        const invalidKeys: string[] = []

        for (const component of components) {
            const alternatives = component.split("/").map((alt) => alt.trim().toLowerCase()).filter((alt) => alt !== "")

            if (alternatives.length === 0) {
                invalidKeys.push(component)
                continue
            }

            let hasValidAlternative = false
            for (const alt of alternatives) {
                if (
                    attributeNameTo_WoD5EVtt_Key[alt as AttributesKey] ||
                    skillNameTo_WoD5EVtt_Key[alt as SkillsKey] ||
                    disciplineNameTo_WoD5EVtt_Key[alt as DisciplineName] ||
                    customDisciplineNames.includes(alt)
                ) {
                    hasValidAlternative = true
                    break
                }
            }

            if (!hasValidAlternative) {
                invalidKeys.push(component)
            }
        }

        if (invalidKeys.length > 0) {
            return `Unable to parse: ${invalidKeys.join(", ")}. Make sure these are valid attributes, skills, or disciplines.`
        }

        return null
    }

    useEffect(() => {
        if (opened) {
            if (editingPower) {
                setName(editingPower.name)
                setSummary(editingPower.summary)
                setDicePool(editingPower.dicePool)
                setLevel(editingPower.level)
                setRouseChecks(editingPower.rouseChecks)
                setError(null)
                setDicePoolWarning(validateDicePool(editingPower.dicePool))
            } else {
                const currentLevel = character.disciplines.filter((p) => p.discipline === disciplineName).length
                setName("")
                setSummary("")
                setDicePool("")
                setLevel(currentLevel === 0 ? 1 : currentLevel + 1)
                setRouseChecks(0)
                setError(null)
                setDicePoolWarning(null)
            }
        }
    }, [opened, editingPower, disciplineName, character.disciplines])

    const handleSave = () => {
        if (!name.trim()) {
            setError("Power name is required")
            return
        }

        const levelNum = typeof level === "string" ? parseInt(level) || 1 : level
        const rouseChecksNum = typeof rouseChecks === "string" ? parseInt(rouseChecks) || 0 : rouseChecks

        if (levelNum < 1) {
            setError("Level must be at least 1")
            return
        }

        if (rouseChecksNum < 0) {
            setError("Rouse checks must be 0 or greater")
            return
        }

        const power: Power = {
            name: name.trim(),
            summary: summary.trim(),
            description: "",
            dicePool: dicePool.trim(),
            level: levelNum,
            discipline: disciplineName,
            rouseChecks: rouseChecksNum,
            amalgamPrerequisites: [],
            isCustom: true,
        }

        let updatedCharacter
        if (editingPower) {
            updatedCharacter = {
                ...character,
                disciplines: character.disciplines.map((p) => (p === editingPower ? power : p)),
            }
        } else {
            updatedCharacter = {
                ...character,
                disciplines: [...character.disciplines, power],
            }

            if (mode === "xp") {
                const cost = getDisciplineCost(character, disciplineName)
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent: updatedCharacter.ephemeral.experienceSpent + cost,
                }
            }
        }

        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        setCharacter(updatedCharacter)
        onClose()
    }

    const handleDelete = () => {
        if (!editingPower) return

        const updatedCharacter = {
            ...character,
            disciplines: character.disciplines.filter((p) => p !== editingPower),
        }

        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        setCharacter(updatedCharacter)
        onClose()
    }

    return (
        <Modal opened={opened} onClose={onClose} title={editingPower ? "Edit Custom Power" : "Create Custom Power"} size="md">
            <Stack gap="md">
                <FocusBorderWrapper colorValue={colorValue}>
                    <TextInput
                        label="Power Name"
                        placeholder="e.g., Time Stop"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={error}
                        required
                    />
                </FocusBorderWrapper>
                <FocusBorderWrapper colorValue={colorValue}>
                    <Textarea
                        label="Summary"
                        placeholder="Brief description of the power"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={2}
                    />
                </FocusBorderWrapper>
                <FocusBorderWrapper colorValue={colorValue}>
                    <TextInput
                        label="Dice Pool"
                        placeholder="e.g., Intelligence + Occult"
                        value={dicePool}
                        onChange={(e) => {
                            setDicePool(e.target.value)
                        }}
                        onBlur={() => {
                            setDicePoolWarning(validateDicePool(dicePool))
                        }}
                    />
                </FocusBorderWrapper>
                {dicePoolWarning ? (
                    <Alert color="yellow" title="Dice Pool Warning">
                        {dicePoolWarning}
                    </Alert>
                ) : null}
                <FocusBorderWrapper colorValue={colorValue}>
                    <NumberInput label="Level" value={level} onChange={setLevel} min={1} required />
                </FocusBorderWrapper>
                <FocusBorderWrapper colorValue={colorValue}>
                    <NumberInput label="Rouse Checks" value={rouseChecks} onChange={setRouseChecks} min={0} required />
                </FocusBorderWrapper>
                <Group justify="space-between">
                    {editingPower ? (
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
                        <Button onClick={handleSave} color={primaryColor}>Save</Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default CustomPowerModal
