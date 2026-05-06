import type { AttributesKey } from "~/data/Attributes"
import type { Character, MeritFlaw } from "~/data/Character"
import type { SkillsKey } from "~/data/Skills"

export type ApplicableMeritFlawModifier = {
    meritFlaw: MeritFlaw
    bonusDice: number
    reason: string
    key: string
}

const socialAttributes = new Set<AttributesKey>(["charisma", "manipulation", "composure"])
const socialSkills = new Set<SkillsKey>([
    "animal ken",
    "etiquette",
    "insight",
    "intimidation",
    "leadership",
    "performance",
    "persuasion",
    "streetwise",
    "subterfuge"
])

const isSocialPool = (attribute: AttributesKey | null, skill: SkillsKey | null) =>
    (attribute !== null && socialAttributes.has(attribute)) ||
    (skill !== null && socialSkills.has(skill))

const meritFlawModifierRules: Array<{
    name: string
    bonusDice: number
    reason: string
    matches: (attribute: AttributesKey | null, skill: SkillsKey | null) => boolean
}> = [
    {
        name: "Beautiful",
        bonusDice: 1,
        reason: "Social roll",
        matches: isSocialPool
    },
    {
        name: "Stunning",
        bonusDice: 2,
        reason: "Social roll",
        matches: isSocialPool
    },
    {
        name: "Ugly",
        bonusDice: -1,
        reason: "Social roll",
        matches: isSocialPool
    },
    {
        name: "Repulsive",
        bonusDice: -2,
        reason: "Social roll",
        matches: isSocialPool
    },
    {
        name: "Dead Flesh",
        bonusDice: -1,
        reason: "Social test with mortals",
        matches: isSocialPool
    },
    {
        name: "Luxury",
        bonusDice: 2,
        reason: "Social roll in your haven",
        matches: isSocialPool
    },
    {
        name: "Suspect",
        bonusDice: -2,
        reason: "Social test with the affected faction",
        matches: isSocialPool
    },
    {
        name: "Disliked",
        bonusDice: -1,
        reason: "Social test with most local groups",
        matches: isSocialPool
    },
    {
        name: "Addiction",
        bonusDice: -1,
        reason: "Last vessel was not on your drug",
        matches: () => true
    },
    {
        name: "Hopeless Addiction",
        bonusDice: -2,
        reason: "Last vessel was not on your drug",
        matches: () => true
    },
    {
        name: "Bond Junkie",
        bonusDice: -1,
        reason: "Action goes against your blood bond",
        matches: () => true
    },
    {
        name: "Transparent",
        bonusDice: -1,
        reason: "Subterfuge roll",
        matches: (_attribute, skill) => skill === "subterfuge"
    }
]

const getCharacterMeritsAndFlaws = (character: Character): MeritFlaw[] => [
    ...character.merits,
    ...character.flaws,
    ...character.predatorType.pickedMeritsAndFlaws
]

export const getApplicableMeritFlawModifiers = (
    character: Character | undefined,
    attribute: AttributesKey | null,
    skill: SkillsKey | null
): ApplicableMeritFlawModifier[] => {
    if (!character) return []

    const modifiers: ApplicableMeritFlawModifier[] = []
    const characterMeritsAndFlaws = getCharacterMeritsAndFlaws(character)

    for (const meritFlaw of characterMeritsAndFlaws) {
        const rule = meritFlawModifierRules.find((candidate) => candidate.name === meritFlaw.name)
        if (!rule || !rule.matches(attribute, skill)) continue

        modifiers.push({
            meritFlaw,
            bonusDice: rule.bonusDice,
            reason: rule.reason,
            key: `${meritFlaw.type}-${meritFlaw.name}`
        })
    }

    return modifiers
}

export const getSelectedMeritFlawModifierBonus = (
    character: Character | undefined,
    attribute: AttributesKey | null,
    skill: SkillsKey | null,
    selectedMeritFlaws: string[]
): number => {
    const applicableModifierByKey = new Map(
        getApplicableMeritFlawModifiers(character, attribute, skill).map((modifier) => [
            modifier.key,
            modifier
        ])
    )

    return selectedMeritFlaws.reduce((bonus, modifierKey) => {
        return bonus + (applicableModifierByKey.get(modifierKey)?.bonusDice ?? 0)
    }, 0)
}
