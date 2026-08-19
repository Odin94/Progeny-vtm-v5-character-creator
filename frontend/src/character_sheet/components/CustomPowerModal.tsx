import { Alert, Button, Group, Modal, NumberInput, Stack, TextInput, Textarea } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { Power } from "~/data/Disciplines"
import { DisciplineName } from "~/data/NameSchemas"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import {
    attributeNameTo_WoD5EVtt_Key,
    skillNameTo_WoD5EVtt_Key,
    disciplineNameTo_WoD5EVtt_Key
} from "~/generator/foundryWoDJsonCreator"
import { AttributesKey } from "~/data/Attributes"
import { SkillsKey } from "~/data/Skills"
import { SheetOptions } from "../CharacterSheet"
import { getDisciplineCost } from "../utils/xp"
import type { HomebrewSource } from "~/data/Homebrew"
import { getPowerDisciplineIdentity } from "~/utils/homebrewOptions"
import { confirmationModalWithHeaderStyles } from "~/components/ConfirmActionModal"

type CustomPowerModalProps = {
    opened: boolean
    onClose: () => void
    onSave?: () => void
    options: SheetOptions
    disciplineName: DisciplineName
    disciplineHomebrewSource?: HomebrewSource
    editingPower?: Power | null
}

const CustomPowerModal = ({
    opened,
    onClose,
    onSave,
    options,
    disciplineName,
    disciplineHomebrewSource,
    editingPower
}: CustomPowerModalProps) => {
    const { character, setCharacter, mode, primaryColor } = options
    const phoneScreen = useMediaQuery("(max-width: 48em)")
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

        const components = dicePoolString
            .split("+")
            .map((comp) => comp.trim())
            .filter((comp) => comp !== "")

        if (components.length === 0) {
            return null
        }

        const customDisciplineNames = character.customDisciplines
            ? Object.values(character.customDisciplines).map((item) => item.name.toLowerCase())
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
                const currentLevel = character.disciplines.filter(
                    (power) =>
                        getPowerDisciplineIdentity(power) ===
                        getPowerDisciplineIdentity({
                            discipline: disciplineName,
                            isCustom: true,
                            disciplineHomebrewSource
                        })
                ).length
                setName("")
                setSummary("")
                setDicePool("")
                setLevel(currentLevel === 0 ? 1 : currentLevel + 1)
                setRouseChecks(0)
                setError(null)
                setDicePoolWarning(null)
            }
        }
    }, [opened, editingPower, disciplineName, disciplineHomebrewSource, character.disciplines])

    const handleSave = () => {
        if (!name.trim()) {
            setError("Power name is required")
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
            disciplineHomebrewSource:
                disciplineHomebrewSource ?? editingPower?.disciplineHomebrewSource
        }

        setCharacter((current) => {
            let updatedCharacter
            if (editingPower) {
                updatedCharacter = {
                    ...current,
                    disciplines: current.disciplines.map((p) => (p === editingPower ? power : p))
                }
            } else {
                updatedCharacter = {
                    ...current,
                    disciplines: [...current.disciplines, power]
                }

                if (mode === "xp") {
                    const cost = getDisciplineCost(
                        current,
                        disciplineName,
                        getPowerDisciplineIdentity(power)
                    )
                    updatedCharacter.ephemeral = {
                        ...updatedCharacter.ephemeral,
                        experienceSpent: updatedCharacter.ephemeral.experienceSpent + cost
                    }
                }
            }

            updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
            return updatedCharacter
        })
        if (onSave) {
            onSave()
        } else {
            onClose()
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingPower ? "Edit Custom Power" : "Create Custom Power"}
            size="md"
            centered
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={confirmationModalWithHeaderStyles(phoneScreen)}
        >
            <Stack gap="md">
                <TextInput
                    label="Power Name"
                    placeholder="e.g., Time Stop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={error}
                    required
                    color={primaryColor}
                />
                <Textarea
                    label="Summary"
                    placeholder="Brief description of the power"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    color={primaryColor}
                />
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
                    color={primaryColor}
                />
                {dicePoolWarning ? (
                    <Alert color="yellow" title="Dice Pool Warning">
                        {dicePoolWarning}
                    </Alert>
                ) : null}
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
                <Group justify="flex-end">
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

export default CustomPowerModal
