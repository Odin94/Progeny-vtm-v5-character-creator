import { replacePredatorSkillBonuses } from "~/data/predatorTypeOptions"
import { Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core"
import { IconChevronLeft } from "@tabler/icons-react"
import { Ornament } from "~/components/ui"
import { GeneratorConfirmButton } from "./sharedGeneratorUi"
import { useEffect, useMemo, useRef, useState } from "react"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import { Skills, SkillsKey, allSkills, skillsKeySchema } from "../../data/Skills"
import { Specialty } from "../../data/Specialties"
import { globals } from "../../globals"
import { lowcase, upcase } from "../utils"

type SpecialtyModalProps = {
    modalOpened: boolean
    closeModal: () => void
    onBack: () => void
    character: Character
    pickedSkillNames: SkillsKey[]
    skills: Skills
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const BONUS_SPECIALTY_SKILLS = ["academics", "craft", "performance", "science"] as const

export const SpecialtyModal = ({
    modalOpened,
    closeModal,
    onBack,
    setCharacter,
    nextStep,
    character,
    pickedSkillNames,
    skills
}: SpecialtyModalProps) => {
    const phoneScreen = globals.isPhoneScreen

    const bonusSkills = useMemo(
        () => BONUS_SPECIALTY_SKILLS.filter((s) => pickedSkillNames.includes(s as SkillsKey)),
        [pickedSkillNames]
    )
    const freeSkills = useMemo(
        () =>
            pickedSkillNames.filter(
                (s) => !(BONUS_SPECIALTY_SKILLS as readonly string[]).includes(s)
            ),
        [pickedSkillNames]
    )

    const [freeEntries, setFreeEntries] = useState<{ skill: string; text: string }[]>([
        { skill: "", text: "" }
    ])
    const [bonusTexts, setBonusTexts] = useState<Record<string, string>>(() =>
        Object.fromEntries(BONUS_SPECIALTY_SKILLS.map((s) => [s, ""]))
    )

    useEffect(() => {
        if (!modalOpened) return
        trackEvent({ action: "specialty step reached", category: "specialties" })
    }, [modalOpened])

    const initializedForOpening = useRef(false)

    useEffect(() => {
        if (!modalOpened) {
            initializedForOpening.current = false
            return
        }
        // Parent renders can recreate the arrays below. Restore saved values only
        // when opening the modal so those renders cannot overwrite in-progress edits.
        if (initializedForOpening.current) return
        initializedForOpening.current = true

        // The one free specialty belongs to the character rather than a particular skill
        // allocation, so preserve its skill and text even when that skill was removed. Bonus
        // specialties only remain available while their matching skill is still selected.
        const previousFreeSpecialty = character.skillSpecialties.find(
            (specialty) =>
                !BONUS_SPECIALTY_SKILLS.includes(
                    specialty.skill as (typeof BONUS_SPECIALTY_SKILLS)[number]
                )
        )
        setFreeEntries([
            {
                skill: previousFreeSpecialty?.skill ?? "",
                text: previousFreeSpecialty?.name ?? ""
            }
        ])
        setBonusTexts(
            Object.fromEntries(
                BONUS_SPECIALTY_SKILLS.map((skill) => [
                    skill,
                    bonusSkills.includes(skill)
                        ? (character.skillSpecialties.find((specialty) => specialty.skill === skill)
                              ?.name ?? "")
                        : ""
                ])
            )
        )
    }, [bonusSkills, character.skillSpecialties, modalOpened])

    const usedFreeSkills = freeEntries.map((e) => e.skill).filter(Boolean)

    const updateFreeEntry = (i: number, field: "skill" | "text", value: string) => {
        const next = [...freeEntries]
        next[i] = { ...next[i], [field]: value }
        setFreeEntries(next)
    }

    const handleDismiss = () => {
        trackEvent({ action: "specialty modal dismissed", category: "specialties" })
        onBack()
    }

    const handleConfirm = () => {
        const result: Specialty[] = []

        for (const entry of freeEntries) {
            const skill = lowcase(entry.skill)
            if (skill && entry.text.trim() && allSkills.includes(skill as SkillsKey)) {
                result.push({
                    skill: skillsKeySchema.parse(skill),
                    name: lowcase(entry.text.trim())
                })
            }
        }

        for (const s of bonusSkills) {
            const text = bonusTexts[s]
            if (text.trim()) {
                result.push({
                    skill: skillsKeySchema.parse(s),
                    name: lowcase(text.trim())
                })
            }
        }

        trackEvent({
            action: "specialty confirm clicked",
            category: "specialties",
            value: result.length
        })

        closeModal()
        setCharacter({
            ...character,
            ...replacePredatorSkillBonuses(
                {
                    ...character,
                    skills,
                    predatorType: { ...character.predatorType, appliedSkillBonuses: undefined }
                },
                character.predatorType
            ),
            skillSpecialties: result
        })
        nextStep()
    }

    return (
        <Modal
            title="Skill Specialties"
            withCloseButton={false}
            size="md"
            opened={modalOpened}
            onClose={handleDismiss}
            closeOnClickOutside={false}
            centered
        >
            <Stack gap="lg">
                <Stack gap={8} align="center">
                    <Ornament style={{ width: 150, height: 14, color: "var(--pg-blood)" }} />
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "var(--pg-font-lore)",
                            fontSize: "1.05rem",
                            color: "var(--pg-ink-3)",
                            lineHeight: 1.45
                        }}
                    >
                        Specialties represent focused expertise within a skill —{" "}
                        <span style={{ color: "var(--pg-ink)" }}>Performance: Dancing</span> or{" "}
                        <span style={{ color: "var(--pg-ink)" }}>Academics: History</span>.
                    </Text>
                </Stack>

                {/* Free specialty */}
                <Stack gap={6}>
                    <Text
                        style={{
                            fontFamily: "var(--pg-font-body)",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "var(--pg-tracking-caps)",
                            textTransform: "uppercase",
                            color: "var(--pg-gold)"
                        }}
                    >
                        Free specialty
                    </Text>
                    {freeEntries.map((entry, i) => (
                        <Group key={i} gap={8} wrap={phoneScreen ? "wrap" : "nowrap"}>
                            <Select
                                placeholder="Choose a skill…"
                                value={entry.skill || null}
                                onChange={(v) => updateFreeEntry(i, "skill", v ?? "")}
                                data={Array.from(new Set([...freeSkills, entry.skill]))
                                    .filter(
                                        (s) =>
                                            s && (s === entry.skill || !usedFreeSkills.includes(s))
                                    )
                                    .map((s) => ({ value: s, label: upcase(s) }))}
                                color="red"
                                style={{ flex: 1, minWidth: phoneScreen ? "100%" : 0 }}
                                styles={{
                                    input: { textTransform: entry.skill ? "capitalize" : undefined }
                                }}
                                aria-label="Free specialty skill"
                            />
                            <TextInput
                                value={entry.text}
                                onChange={(e) => updateFreeEntry(i, "text", e.target.value)}
                                placeholder="e.g. Dancing"
                                maxLength={40}
                                color="red"
                                style={{ flex: 1, minWidth: phoneScreen ? "100%" : 0 }}
                                aria-label="Free specialty name"
                            />
                        </Group>
                    ))}
                </Stack>

                {/* Bonus specialties (academics, craft, performance, science) */}
                {bonusSkills.length > 0 && (
                    <Stack gap={8}>
                        <Text
                            style={{
                                fontFamily: "var(--pg-font-body)",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "var(--pg-tracking-caps)",
                                textTransform: "uppercase",
                                color: "var(--pg-gold)"
                            }}
                        >
                            Required for your skills
                        </Text>
                        {bonusSkills.map((s) => (
                            <Group key={s} gap={8} align="center" wrap="nowrap">
                                <Text
                                    style={{
                                        fontFamily: "var(--pg-font-display)",
                                        fontSize: "0.86rem",
                                        fontWeight: 600,
                                        letterSpacing: "0.04em",
                                        color: "var(--pg-ink-2)",
                                        minWidth: phoneScreen ? 96 : 116,
                                        textTransform: "capitalize"
                                    }}
                                >
                                    {upcase(s)}
                                </Text>
                                <TextInput
                                    value={bonusTexts[s]}
                                    onChange={(e) => {
                                        const value = e.currentTarget.value
                                        setBonusTexts((prev) => ({
                                            ...prev,
                                            [s]: value
                                        }))
                                    }}
                                    placeholder={`e.g. ${s === "academics" ? "History" : s === "craft" ? "Sculpture" : s === "performance" ? "Violin" : "Biology"}`}
                                    maxLength={40}
                                    color="red"
                                    style={{ flex: 1 }}
                                    aria-label={`${upcase(s)} specialty`}
                                />
                            </Group>
                        ))}
                    </Stack>
                )}

                {/* Footer */}
                <Group justify="space-between" mt={4}>
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconChevronLeft size={16} />}
                        onClick={handleDismiss}
                    >
                        Back
                    </Button>
                    <GeneratorConfirmButton
                        data-testid="skill-specialty-confirm-button"
                        onClick={handleConfirm}
                    />
                </Group>
            </Stack>
        </Modal>
    )
}
