import { Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core"
import { RAW_GOLD, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { IconSparkles } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { Character } from "../../data/Character"
import { Skills, SkillsKey, allSkills, skillsKeySchema } from "../../data/Skills"
import { Specialty } from "../../data/Specialties"
import { globals } from "../../globals"
import { lowcase, upcase } from "../utils"

type SpecialtyModalProps = {
    modalOpened: boolean
    closeModal: () => void
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
    setCharacter,
    nextStep,
    character,
    pickedSkillNames,
    skills
}: SpecialtyModalProps) => {
    const phoneScreen = globals.isPhoneScreen

    const RED = rgba(RAW_RED, 1)

    const bonusSkills = useMemo(
        () => BONUS_SPECIALTY_SKILLS.filter((s) => pickedSkillNames.includes(s as SkillsKey)),
        [pickedSkillNames]
    )
    const freeSkills = useMemo(
        () =>
            pickedSkillNames.filter(
                (s) =>
                    !BONUS_SPECIALTY_SKILLS.includes(s as (typeof BONUS_SPECIALTY_SKILLS)[number])
            ),
        [pickedSkillNames]
    )

    const [freeEntries, setFreeEntries] = useState<{ skill: string; text: string }[]>([
        { skill: "", text: "" }
    ])
    const [bonusTexts, setBonusTexts] = useState<Record<string, string>>(() =>
        Object.fromEntries(BONUS_SPECIALTY_SKILLS.map((s) => [s, ""]))
    )

    const usedFreeSkills = freeEntries.map((e) => e.skill).filter(Boolean)

    const updateFreeEntry = (i: number, field: "skill" | "text", value: string) => {
        const next = [...freeEntries]
        next[i] = { ...next[i], [field]: value }
        setFreeEntries(next)
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

        closeModal()
        setCharacter({ ...character, skills, skillSpecialties: result })
        nextStep()
    }

    return (
        <Modal
            withCloseButton={false}
            size="md"
            opened={modalOpened}
            onClose={closeModal}
            centered
            styles={{
                content: {
                    background: "rgba(18, 15, 14, 0.97)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12
                },
                body: { padding: phoneScreen ? "16px" : "24px" }
            }}
            overlayProps={{ backgroundOpacity: 0.7 }}
        >
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap={8} mb={8}>
                        <IconSparkles size={18} color={RED} />
                        <Text
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                fontSize: "1.15rem",
                                fontWeight: 600,
                                letterSpacing: "0.06em"
                            }}
                        >
                            Skill Specialties
                        </Text>
                    </Group>
                    <Text
                        style={{
                            fontFamily: "Crimson Text, Georgia, serif",
                            fontSize: "0.95rem",
                            color: rgba(RAW_GREY, 0.55),
                            lineHeight: 1.55
                        }}
                    >
                        Specialties represent focused expertise within a skill Ã¢â‚¬â€{" "}
                        <span style={{ color: "rgba(244, 236, 232, 0.8)" }}>
                            Performance: Dancing
                        </span>{" "}
                        or{" "}
                        <span style={{ color: "rgba(244, 236, 232, 0.8)" }}>
                            Academics: History
                        </span>
                        .
                    </Text>
                </div>

                <div
                    style={{
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${rgba(RAW_RED, 0.25)}, transparent)`
                    }}
                />

                {/* Free specialty */}
                <Stack gap={8}>
                    {freeEntries.map((entry, i) => (
                        <Group key={i} gap={8} wrap="nowrap">
                            <Select
                                placeholder="Choose a skillÃ¢â‚¬Â¦"
                                value={entry.skill || null}
                                onChange={(v) => updateFreeEntry(i, "skill", v ?? "")}
                                data={freeSkills
                                    .filter((s) => s === entry.skill || !usedFreeSkills.includes(s))
                                    .map((s) => ({ value: s, label: upcase(s) }))}
                                color={RED}
                                style={{ flex: 1 }}
                                styles={{ input: { textTransform: "capitalize" } }}
                            />{" "}
                            <TextInput
                                value={entry.text}
                                onChange={(e) => updateFreeEntry(i, "text", e.target.value)}
                                placeholder="e.g. Dancing"
                                maxLength={40}
                                color={RED}
                                style={{ flex: 1 }}
                            />
                        </Group>
                    ))}
                </Stack>

                {/* Bonus specialties (academics, craft, performance, science) */}
                {bonusSkills.length > 0 && (
                    <>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                        <Stack gap={8}>
                            {bonusSkills.map((s) => (
                                <Group key={s} gap={8} align="center" wrap="nowrap">
                                    <Text
                                        style={{
                                            fontFamily: "Cinzel, Georgia, serif",
                                            fontSize: "0.82rem",
                                            letterSpacing: "0.04em",
                                            color: rgba(RAW_GOLD, 0.85),
                                            minWidth: phoneScreen ? 90 : 110,
                                            textTransform: "capitalize"
                                        }}
                                    >
                                        {upcase(s)}
                                    </Text>
                                    <TextInput
                                        value={bonusTexts[s]}
                                        onChange={(e) =>
                                            setBonusTexts((prev) => ({
                                                ...prev,
                                                [s]: e.currentTarget.value
                                            }))
                                        }
                                        placeholder={`e.g. ${s === "academics" ? "History" : s === "craft" ? "Sculpture" : s === "performance" ? "Violin" : "Biology"}`}
                                        maxLength={40}
                                        color={RED}
                                        style={{ flex: 1 }}
                                    />
                                </Group>
                            ))}
                        </Stack>
                    </>
                )}

                {/* Footer */}
                <Group justify="space-between" mt={4}>
                    <Button variant="subtle" color="gray" onClick={closeModal}>
                        Back
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        color="red"
                        styles={{
                            root: {
                                letterSpacing: "0.06em",
                                textTransform: "uppercase"
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
