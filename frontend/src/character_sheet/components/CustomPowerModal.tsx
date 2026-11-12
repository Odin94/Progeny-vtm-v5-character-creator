import { Alert, Button, NumberInput, TextInput, Textarea } from "@mantine/core"
import { useEffect, useState } from "react"
import { Power } from "~/data/Disciplines"
import { getDisciplineLevel, increaseDisciplineLevelForPower } from "~/data/Character"
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
import { SheetModal, selectModalClasses as formClasses } from "./selectModalParts"

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
                const disciplineIdentity = getPowerDisciplineIdentity({
                    discipline: disciplineName,
                    isCustom: true,
                    disciplineHomebrewSource
                })
                const currentLevel = getDisciplineLevel(character, disciplineIdentity)
                setName("")
                setSummary("")
                setDicePool("")
                setLevel(currentLevel === 0 ? 1 : currentLevel + 1)
                setRouseChecks(0)
                setError(null)
                setDicePoolWarning(null)
            }
        }
    }, [opened, editingPower, disciplineName, disciplineHomebrewSource, character.disciplineLevels])

    // Show each validation message on the field it is about.
    const errorField = !error
        ? null
        : error.startsWith("Power name")
          ? "name"
          : error.startsWith("Rouse")
            ? "rouse"
            : "level"

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

        if (levelNum > 5) {
            setError("Level cannot exceed 5")
            return
        }

        if (!editingPower) {
            const disciplineIdentity = getPowerDisciplineIdentity({
                discipline: disciplineName,
                isCustom: true,
                disciplineHomebrewSource
            })
            const currentLevel = getDisciplineLevel(character, disciplineIdentity)
            if (currentLevel >= 5) {
                setError("This Discipline is already at Level 5")
                return
            }
            if (levelNum > currentLevel + 1) {
                setError(`New powers can be at most Level ${currentLevel + 1}`)
                return
            }
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
                const disciplineIdentity = getPowerDisciplineIdentity(power)
                updatedCharacter = {
                    ...current,
                    disciplines: current.disciplines.map((p) => (p === editingPower ? power : p)),
                    disciplineLevels: {
                        ...current.disciplineLevels,
                        [disciplineIdentity]: Math.max(
                            getDisciplineLevel(current, disciplineIdentity),
                            power.level
                        )
                    }
                }
            } else {
                updatedCharacter = {
                    ...current,
                    disciplines: [...current.disciplines, power],
                    disciplineLevels: increaseDisciplineLevelForPower(current, power)
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
        <SheetModal
            opened={opened}
            onClose={onClose}
            title={editingPower ? "Edit Custom Power" : "Create Custom Power"}
            size="lg"
            fullScreenOnPhone={false}
        >
            <form
                noValidate
                className={formClasses.form}
                onSubmit={(event) => {
                    event.preventDefault()
                    handleSave()
                }}
            >
                <TextInput
                    label="Power Name"
                    placeholder="e.g., Time Stop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errorField === "name" ? error : undefined}
                    required
                    data-autofocus
                    color={primaryColor}
                />
                <Textarea
                    label="Summary"
                    placeholder="Brief description of the power"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    resize="vertical"
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
                <div className={`${formClasses.formRow} ${formClasses.formRowTight}`}>
                    <NumberInput
                        label="Level"
                        value={level}
                        onChange={setLevel}
                        min={1}
                        max={5}
                        error={errorField === "level" ? error : undefined}
                        required
                        color={primaryColor}
                    />
                    <NumberInput
                        label="Rouse Checks"
                        value={rouseChecks}
                        onChange={setRouseChecks}
                        min={0}
                        error={errorField === "rouse" ? error : undefined}
                        required
                        color={primaryColor}
                    />
                </div>
                <div className={formClasses.formFooter}>
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" color={primaryColor} ml="auto">
                        Save
                    </Button>
                </div>
            </form>
        </SheetModal>
    )
}

export default CustomPowerModal
