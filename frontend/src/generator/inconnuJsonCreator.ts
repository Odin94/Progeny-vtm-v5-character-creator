import type { Character } from "../data/Character"
import type { AttributesKey } from "../data/Attributes"
import type { SkillsKey } from "../data/Skills"
import type { DisciplineName } from "../data/NameSchemas"

type InconnuSplat = "vampire" | "thin-blood" | "ghoul" | "mortal"

type InconnuTrait = {
    name: string
    rating: number
    type: "attribute" | "skill" | "discipline" | "custom"
    subtraits: string[]
}

export type InconnuCreationBody = {
    name: string
    splat: InconnuSplat
    health: number
    willpower: number
    humanity: number
    blood_potency: number
    convictions: string[]
    biography: string
    description: string
    traits: InconnuTrait[]
}

const attributeNameToInconnu: Record<AttributesKey, string> = {
    strength: "Strength",
    dexterity: "Dexterity",
    stamina: "Stamina",
    charisma: "Charisma",
    manipulation: "Manipulation",
    composure: "Composure",
    intelligence: "Intelligence",
    wits: "Wits",
    resolve: "Resolve"
}

const skillNameToInconnu: Record<SkillsKey, string> = {
    athletics: "Athletics",
    brawl: "Brawl",
    craft: "Craft",
    drive: "Drive",
    firearms: "Firearms",
    melee: "Melee",
    larceny: "Larceny",
    stealth: "Stealth",
    survival: "Survival",
    "animal ken": "AnimalKen",
    etiquette: "Etiquette",
    insight: "Insight",
    intimidation: "Intimidation",
    leadership: "Leadership",
    performance: "Performance",
    persuasion: "Persuasion",
    streetwise: "Streetwise",
    subterfuge: "Subterfuge",
    academics: "Academics",
    awareness: "Awareness",
    finance: "Finance",
    investigation: "Investigation",
    medicine: "Medicine",
    occult: "Occult",
    politics: "Politics",
    science: "Science",
    technology: "Technology"
}

const disciplineNameToInconnu: Partial<Record<DisciplineName, string>> = {
    animalism: "Animalism",
    auspex: "Auspex",
    celerity: "Celerity",
    dominate: "Dominate",
    fortitude: "Fortitude",
    obfuscate: "Obfuscate",
    potence: "Potence",
    presence: "Presence",
    protean: "Protean",
    "blood sorcery": "BloodSorcery",
    oblivion: "Oblivion",
    "thin-blood alchemy": "ThinBloodAlchemy",
    "": ""
}

const INCONNU_MAX_NAME_LENGTH = 30
const INCONNU_MAX_TEXT_LENGTH = 1024
const INCONNU_MAX_CONVICTION_LENGTH = 200
const INCONNU_MAX_TRAIT_LENGTH = 20
const reservedTraitNames = new Set([
    "willpower",
    "hunger",
    "humanity",
    "surge",
    "potency",
    "bane",
    "current_hunger"
])

const hasOwn = <T extends object>(object: T, key: PropertyKey): key is keyof T =>
    Object.prototype.hasOwnProperty.call(object, key)

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const toNumber = (value: unknown): number => (typeof value === "number" ? value : Number(value))

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value))

const toFiniteInteger = (value: unknown, fallback: number): number => {
    const numeric = toNumber(value)
    return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback
}

const clampInt = (value: unknown, min: number, max: number, fallback = min): number => {
    const numeric = toNumber(value)
    if (numeric === Number.POSITIVE_INFINITY) return max
    if (numeric === Number.NEGATIVE_INFINITY) return min
    return clamp(toFiniteInteger(value, fallback), min, max)
}

const nonNegativeInt = (value: unknown): number => Math.max(0, toFiniteInteger(value, 0))

const truncate = (value: unknown, maxLength: number): string => {
    const stringValue = String(value ?? "")
    return stringValue.length > maxLength ? stringValue.slice(0, maxLength) : stringValue
}

const sanitizeCharacterName = (name: unknown): string => {
    const normalized = String(name ?? "")
        .replace(/[^A-Za-z0-9 _'-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    return truncate(normalized || "Unnamed Character", INCONNU_MAX_NAME_LENGTH).trim()
}

const toIdentifier = (value: unknown, fallback: string): string => {
    const words = String(value ?? "").match(/[A-Za-z]+/g) ?? []
    const identifier = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("_")

    return truncate(identifier || fallback, INCONNU_MAX_TRAIT_LENGTH)
}

const toTraitIdentifier = (value: string, fallback: string): string => {
    const identifier = toIdentifier(value, fallback)
    const normalized = identifier.toLowerCase()
    if (
        reservedTraitNames.has(normalized) ||
        normalized === "powerbonus" ||
        normalized === "power_bonus"
    ) {
        return truncate(`${identifier}_Trait`, INCONNU_MAX_TRAIT_LENGTH)
    }

    return identifier
}

const uniqueIdentifier = (base: string, used: Set<string>): string => {
    if (!used.has(base.toLowerCase())) {
        used.add(base.toLowerCase())
        return base
    }

    const suffixes = [
        "Alt",
        "Extra",
        "Other",
        "More",
        "Next",
        "New",
        "Also",
        "Again",
        "Plus",
        "Spare"
    ]

    for (const suffix of suffixes) {
        const suffixText = `_${suffix}`
        const candidate = `${base.slice(0, INCONNU_MAX_TRAIT_LENGTH - suffixText.length)}${suffixText}`
        if (!used.has(candidate.toLowerCase())) {
            used.add(candidate.toLowerCase())
            return candidate
        }
    }

    for (const first of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        for (const second of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
            const suffixText = `_${first}${second}`
            const candidate = `${base.slice(0, INCONNU_MAX_TRAIT_LENGTH - suffixText.length)}${suffixText}`
            if (!used.has(candidate.toLowerCase())) {
                used.add(candidate.toLowerCase())
                return candidate
            }
        }
    }

    throw new Error("Unable to create a unique Inconnu identifier.")
}

const sanitizeSubtraits = (subtraits: string[]): string[] => {
    const used = new Set<string>()

    return subtraits
        .map((subtrait) => toIdentifier(subtrait, "Subtrait"))
        .map((subtrait) => uniqueIdentifier(subtrait, used))
}

const customDisciplineNameToInconnu = (name: string): string => {
    const normalized = name.toLowerCase().trim()
    if (hasOwn(disciplineNameToInconnu, normalized)) {
        return disciplineNameToInconnu[normalized as DisciplineName] ?? ""
    }
    return toTraitIdentifier(name, "Discipline")
}

const createSplat = (character: Character): InconnuSplat => {
    if (character.clan === "Thin-blood") return "thin-blood"
    if (character.clan) return "vampire"
    return "mortal"
}

const createBloodPotency = (character: Character, splat: InconnuSplat): number => {
    if (splat === "mortal" || splat === "ghoul") return 0
    if (splat === "thin-blood") return clampInt(character.bloodPotency, 0, 2, 0)
    return clampInt(character.bloodPotency, 0, 10, 0)
}

const createBiography = (character: Character): string => {
    const touchstonesText = asArray<{
        name?: unknown
        conviction?: unknown
        description?: unknown
    }>(character.touchstones)
        .map((t) => `${t.name} (${t.conviction})${t.description ? `: ${t.description}` : ""}`)
        .join("\n")

    const biography = [
        character.clan ? `Clan: ${character.clan}` : "",
        character.predatorType?.name ? `Predator Type: ${character.predatorType.name}` : "",
        character.sect ? `Sect: ${character.sect}` : "",
        character.chronicle ? `Chronicle: ${character.chronicle}` : "",
        character.sire ? `Sire: ${character.sire}` : "",
        character.ambition ? `Ambition: ${character.ambition}` : "",
        character.desire ? `Desire: ${character.desire}` : "",
        touchstonesText ? `Touchstones:\n${touchstonesText}` : "",
        character.notes ? `Notes:\n${character.notes}` : ""
    ]
        .filter(Boolean)
        .join("\n\n")

    return truncate(biography, INCONNU_MAX_TEXT_LENGTH)
}

export const createInconnuJson = (character: Character): InconnuCreationBody => {
    const traits: InconnuTrait[] = []
    const usedTraitNames = new Set<string>()
    const skillSpecialties = asArray<{ skill?: unknown; name?: unknown }>(
        character.skillSpecialties
    )
    const predatorSpecialties = asArray<{ skill?: unknown; name?: unknown }>(
        character.predatorType?.pickedSpecialties
    )

    const addTrait = (trait: InconnuTrait) => {
        traits.push({
            ...trait,
            name: uniqueIdentifier(trait.name, usedTraitNames),
            subtraits: sanitizeSubtraits(trait.subtraits)
        })
    }

    for (const [key, value] of Object.entries(character.attributes ?? {})) {
        const inconnuName = attributeNameToInconnu[key as AttributesKey]
        if (inconnuName) {
            addTrait({
                name: inconnuName,
                rating: clampInt(value, 1, 5, 1),
                type: "attribute",
                subtraits: []
            })
        }
    }

    for (const [key, value] of Object.entries(character.skills ?? {})) {
        const inconnuName = skillNameToInconnu[key as SkillsKey]
        if (inconnuName) {
            const directSpecialties = skillSpecialties
                .filter((spec) => spec.skill === key)
                .map((spec) => String(spec.name ?? ""))

            const selectedPredatorSpecialties = predatorSpecialties
                .filter((spec) => spec.skill === key)
                .map((spec) => String(spec.name ?? ""))

            const allSpecialties = [...directSpecialties, ...selectedPredatorSpecialties]

            if (value > 0 || allSpecialties.length > 0) {
                addTrait({
                    name: inconnuName,
                    rating: clampInt(value, 0, 5, 0),
                    type: "skill",
                    subtraits: allSpecialties
                })
            }
        }
    }

    const disciplineMap = new Map<string, { rating: number; powers: string[] }>()

    for (const power of asArray<{ discipline?: unknown; name?: unknown; level?: unknown }>(
        character.disciplines
    )) {
        const inconnuDisciplineName = customDisciplineNameToInconnu(String(power.discipline ?? ""))

        if (!inconnuDisciplineName) continue

        if (!disciplineMap.has(inconnuDisciplineName)) {
            disciplineMap.set(inconnuDisciplineName, { rating: 0, powers: [] })
        }

        const discipline = disciplineMap.get(inconnuDisciplineName)!
        discipline.powers.push(String(power.name ?? ""))
        discipline.rating = Math.max(discipline.rating, clampInt(power.level, 0, 5, 0))
    }

    for (const ritual of asArray<{ name?: unknown }>(character.rituals)) {
        if (!disciplineMap.has("BloodSorcery")) {
            disciplineMap.set("BloodSorcery", { rating: 0, powers: [] })
        }
        disciplineMap.get("BloodSorcery")!.powers.push(String(ritual.name ?? ""))
    }

    for (const ceremony of asArray<{ name?: unknown }>(character.ceremonies)) {
        if (!disciplineMap.has("Oblivion")) {
            disciplineMap.set("Oblivion", { rating: 0, powers: [] })
        }
        disciplineMap.get("Oblivion")!.powers.push(String(ceremony.name ?? ""))
    }

    for (const [disciplineName, { rating, powers }] of disciplineMap.entries()) {
        addTrait({
            name: disciplineName,
            rating,
            type: "discipline",
            subtraits: powers
        })
    }

    for (const meritFlaw of [
        ...asArray<{ name?: unknown; level?: unknown }>(character.merits),
        ...asArray<{ name?: unknown; level?: unknown }>(character.flaws),
        ...asArray<{ name?: unknown; level?: unknown }>(
            character.predatorType?.pickedMeritsAndFlaws
        )
    ]) {
        addTrait({
            name: toTraitIdentifier(meritFlaw.name, "Trait"),
            rating: nonNegativeInt(meritFlaw.level),
            type: "custom",
            subtraits: []
        })
    }

    const splat = createSplat(character)

    return {
        name: sanitizeCharacterName(character.name),
        splat,
        health: clampInt(character.maxHealth, 4, 20, 4),
        willpower: clampInt(character.willpower, 2, 10, 2),
        humanity: clampInt(character.humanity, 0, 10, 0),
        blood_potency: createBloodPotency(character, splat),
        convictions: asArray<{ conviction?: unknown }>(character.touchstones)
            .map((touchstone) => truncate(touchstone.conviction, INCONNU_MAX_CONVICTION_LENGTH))
            .filter(Boolean)
            .slice(0, 3),
        biography: createBiography(character),
        description: truncate(character.description, INCONNU_MAX_TEXT_LENGTH),
        traits
    }
}
