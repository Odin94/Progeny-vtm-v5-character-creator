import { Alert, Button, NumberInput, TextInput, Textarea } from "@mantine/core"
import { useEffect, useState } from "react"
import { Ceremony } from "~/data/Ceremonies"
import { SheetOptions } from "../CharacterSheet"
import { getAvailableXP, getRitualCost } from "../utils/xp"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { DeleteIconButton } from "~/components/ui"
import { SheetModal, selectModalClasses as formClasses } from "./selectModalParts"

type CustomCeremonyModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    editingCeremony?: Ceremony | null
    onSave?: () => void
}

const CustomCeremonyModal = ({
    opened,
    onClose,
    options,
    editingCeremony,
    onSave
}: CustomCeremonyModalProps) => {
    const { character, setCharacter, mode, primaryColor } = options
    const [name, setName] = useState("")
    const [summary, setSummary] = useState("")
    const [dicePool, setDicePool] = useState("")
    const [requiredTime, setRequiredTime] = useState("")
    const [ingredients, setIngredients] = useState("")
    const [prerequisitePowers, setPrerequisitePowers] = useState("")
    const [level, setLevel] = useState<number | string>(1)
    const [rouseChecks, setRouseChecks] = useState<number | string>(1)
    const [error, setError] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        if (!opened) return

        if (editingCeremony) {
            setName(editingCeremony.name)
            setSummary(editingCeremony.summary)
            setDicePool(editingCeremony.dicePool)
            setRequiredTime(editingCeremony.requiredTime)
            setIngredients(editingCeremony.ingredients)
            setPrerequisitePowers(editingCeremony.prerequisitePowers.join(", "))
            setLevel(editingCeremony.level)
            setRouseChecks(editingCeremony.rouseChecks)
        } else {
            setName("")
            setSummary("")
            setDicePool("Resolve + Oblivion")
            setRequiredTime("")
            setIngredients("")
            setPrerequisitePowers("")
            setLevel(1)
            setRouseChecks(1)
        }

        setError(null)
    }, [opened, editingCeremony])

    const handleSave = () => {
        if (!name.trim()) {
            setError("Ceremony name is required")
            return
        }

        const levelNum = typeof level === "string" ? parseInt(level) || 1 : level
        const rouseChecksNum =
            typeof rouseChecks === "string" ? parseInt(rouseChecks) || 0 : rouseChecks
        const prerequisitePowerList = prerequisitePowers
            .split(/[\n,]+/)
            .map((power) => power.trim())
            .filter(Boolean)

        if (levelNum < 1) {
            setError("Level must be at least 1")
            return
        }

        if (rouseChecksNum < 0) {
            setError("Rouse checks must be 0 or greater")
            return
        }

        const existingCeremony = character.ceremonies.find(
            (ceremony) =>
                ceremony !== editingCeremony &&
                ceremony.name.trim().toLowerCase() === name.trim().toLowerCase()
        )

        if (existingCeremony) {
            setError("This character already has a ceremony with that name")
            return
        }

        if (!editingCeremony && mode === "xp") {
            const cost = getRitualCost(levelNum)
            const availableXP = getAvailableXP(character)

            if (availableXP < cost) {
                setError(`Insufficient XP. Need ${cost}, have ${availableXP}`)
                return
            }
        }

        const ceremony: Ceremony = {
            name: name.trim(),
            summary: summary.trim(),
            rouseChecks: rouseChecksNum,
            requiredTime: requiredTime.trim(),
            dicePool: dicePool.trim(),
            ingredients: ingredients.trim(),
            prerequisitePowers: prerequisitePowerList,
            level: levelNum,
            discipline: "oblivion",
            isCustom: true
        }

        setCharacter((current) => {
            const updatedCharacter = {
                ...current,
                ceremonies: editingCeremony
                    ? current.ceremonies.map((existing) =>
                          existing === editingCeremony ? ceremony : existing
                      )
                    : [...current.ceremonies, ceremony]
            }

            if (!editingCeremony && mode === "xp") {
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent:
                        updatedCharacter.ephemeral.experienceSpent + getRitualCost(ceremony.level)
                }
            }

            return updatedCharacter
        })
        if (onSave) {
            onSave()
        } else {
            onClose()
        }
    }

    const handleDelete = () => {
        if (!editingCeremony) return

        setCharacter((current) => ({
            ...current,
            ceremonies: current.ceremonies.filter((ceremony) => ceremony !== editingCeremony)
        }))
        onClose()
    }

    // Show each validation message on the field it is about.
    const errorField = !error
        ? null
        : /name/i.test(error)
          ? "name"
          : error.startsWith("Level")
            ? "level"
            : error.startsWith("Rouse")
              ? "rouse"
              : "form"

    return (
        <SheetModal
            opened={opened}
            onClose={onClose}
            title={editingCeremony ? "Edit Custom Ceremony" : "Create Custom Ceremony"}
            size="lg"
        >
            <form
                className={formClasses.form}
                onSubmit={(event) => {
                    event.preventDefault()
                    handleSave()
                }}
            >
                <TextInput
                    label="Ceremony Name"
                    placeholder="e.g., Toll the Empty Bell"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errorField === "name" ? error : undefined}
                    required
                    data-autofocus
                    color={primaryColor}
                />
                <Textarea
                    label="Summary"
                    placeholder="Brief description of the ceremony"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    resize="vertical"
                    color={primaryColor}
                />
                <div className={formClasses.formRow}>
                    <TextInput
                        label="Dice Pool"
                        placeholder="e.g., Resolve + Oblivion"
                        value={dicePool}
                        onChange={(e) => setDicePool(e.target.value)}
                        color={primaryColor}
                    />
                    <TextInput
                        label="Time"
                        placeholder="e.g., 10min"
                        value={requiredTime}
                        onChange={(e) => setRequiredTime(e.target.value)}
                        color={primaryColor}
                    />
                </div>
                <TextInput
                    label="Prerequisite Powers"
                    placeholder="e.g., Where the Shroud Thins, Shadow Cast"
                    value={prerequisitePowers}
                    onChange={(e) => setPrerequisitePowers(e.target.value)}
                    color={primaryColor}
                />
                <Textarea
                    label="Ingredients"
                    placeholder="Required ingredients"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={2}
                    resize="vertical"
                    color={primaryColor}
                />
                <div className={`${formClasses.formRow} ${formClasses.formRowTight}`}>
                    <NumberInput
                        label="Level"
                        value={level}
                        onChange={setLevel}
                        min={1}
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
                {errorField === "form" ? (
                    <Alert color="red" variant="light">
                        {error}
                    </Alert>
                ) : null}
                <div className={formClasses.formFooter}>
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    {editingCeremony ? (
                        <DeleteIconButton
                            label="Delete ceremony"
                            onClick={() => setConfirmDelete(true)}
                        />
                    ) : null}
                    {mode === "xp" && !editingCeremony ? (
                        <span className={formClasses.metaLabel}>
                            Spends {getRitualCost(Number(level) || 1)} XP
                        </span>
                    ) : null}
                    <Button type="submit" color={primaryColor} ml="auto">
                        Save
                    </Button>
                </div>
            </form>
            <ConfirmActionModal
                opened={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    setConfirmDelete(false)
                    handleDelete()
                }}
                title="Delete ceremony?"
                body={`“${editingCeremony?.name ?? ""}” will be removed from this character.`}
                confirmLabel="Delete"
            />
        </SheetModal>
    )
}

export default CustomCeremonyModal
