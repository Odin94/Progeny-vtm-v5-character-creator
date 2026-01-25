import { Character } from "../data/Character"
import { AttributesKey } from "../data/Attributes"
import { SkillsKey } from "../data/Skills"
import { DisciplineName } from "../data/NameSchemas"

type InconnuTrait = {
    name: string
    rating: number
    type: "attribute" | "skill" | "discipline" | "custom"
    subtraits?: string[]
}

type InconnuVChar = {
    _name: string
    splat: "vampire" | "thin-blood" | "ghoul" | "mortal"
    _humanity: number
    stains: number
    health: string
    willpower: string
    _hunger: number
    potency: number
    _traits: InconnuTrait[]
    profile: {
        biography: string
        description: string
        images: string[]
    }
    convictions: string[]
    header: {
        blush: number
        location: string
        merits: string
        flaws: string
        temp: string
    }
    macros: Array<{
        name: string
        pool: string[]
        hunger: boolean
        difficulty: number
        rouses: number
        reroll_rouses: boolean
        staining: string
        hunt: boolean
        comment: string | null
    }>
    experience: {
        unspent: number
        lifetime: number
        log: Array<{
            event: string
            amount: number
            reason: string
            admin: number
            date: string
        }>
    }
    stat_log: Record<string, number>
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
    resolve: "Resolve",
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
    technology: "Technology",
}

const disciplineNameToInconnu: Record<DisciplineName, string> = {
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
    "": "",
}

const customDisciplineNameToInconnu = (name: string): string => {
    const normalized = name.toLowerCase().trim()
    if (normalized in disciplineNameToInconnu) {
        return disciplineNameToInconnu[normalized as DisciplineName]
    }
    return name
}

const createDamageString = (max: number, superficial: number, aggravated: number): string => {
    const none = max - superficial - aggravated
    return ".".repeat(none) + "/".repeat(superficial) + "x".repeat(aggravated)
}

export const createInconnuJson = (character: Character): InconnuVChar => {
    const traits: InconnuTrait[] = []

    for (const [key, value] of Object.entries(character.attributes)) {
        const inconnuName = attributeNameToInconnu[key as AttributesKey]
        if (inconnuName) {
            traits.push({
                name: inconnuName,
                rating: value,
                type: "attribute",
            })
        }
    }

    for (const [key, value] of Object.entries(character.skills)) {
        if (value > 0) {
            const inconnuName = skillNameToInconnu[key as SkillsKey]
            if (inconnuName) {
                const skillSpecialties = character.skillSpecialties
                    .filter((spec) => spec.skill === key)
                    .map((spec) => spec.name)

                const predatorSpecialties =
                    character.predatorType?.pickedSpecialties
                        ?.filter((spec) => spec.skill === key)
                        .map((spec) => spec.name) || []

                const allSpecialties = [...skillSpecialties, ...predatorSpecialties]

                traits.push({
                    name: inconnuName,
                    rating: value,
                    type: "skill",
                    subtraits: allSpecialties.length > 0 ? allSpecialties : undefined,
                })
            }
        }
    }

    const disciplineMap = new Map<string, { rating: number; powers: string[] }>()

    for (const power of character.disciplines) {
        let inconnuDisciplineName: string
        if (power.discipline in disciplineNameToInconnu) {
            inconnuDisciplineName = disciplineNameToInconnu[power.discipline as DisciplineName]
        } else {
            inconnuDisciplineName = customDisciplineNameToInconnu(power.discipline)
        }
        if (!inconnuDisciplineName || inconnuDisciplineName === "") continue

        if (!disciplineMap.has(inconnuDisciplineName)) {
            disciplineMap.set(inconnuDisciplineName, { rating: 0, powers: [] })
        }

        const disc = disciplineMap.get(inconnuDisciplineName)!
        disc.powers.push(power.name)
        disc.rating = Math.max(disc.rating, power.level)
    }

    if (character.customDisciplines) {
        for (const [discName, customDisc] of Object.entries(character.customDisciplines)) {
            const inconnuDisciplineName = customDisciplineNameToInconnu(discName)
            if (!disciplineMap.has(inconnuDisciplineName)) {
                disciplineMap.set(inconnuDisciplineName, { rating: 0, powers: [] })
            }
            const disc = disciplineMap.get(inconnuDisciplineName)!
            for (const power of customDisc.powers) {
                disc.powers.push(power.name)
                disc.rating = Math.max(disc.rating, power.level)
            }
        }
    }

    for (const ritual of character.rituals || []) {
        const bloodSorceryName = "BloodSorcery"
        if (!disciplineMap.has(bloodSorceryName)) {
            disciplineMap.set(bloodSorceryName, { rating: 0, powers: [] })
        }
        const disc = disciplineMap.get(bloodSorceryName)!
        disc.powers.push(ritual.name)
    }

    for (const [disciplineName, { rating, powers }] of disciplineMap.entries()) {
        traits.push({
            name: disciplineName,
            rating,
            type: "discipline",
            subtraits: powers.length > 0 ? powers : undefined,
        })
    }

    for (const merit of character.merits) {
        traits.push({
            name: merit.name,
            rating: merit.level,
            type: "custom",
        })
    }

    for (const flaw of character.flaws) {
        traits.push({
            name: flaw.name,
            rating: flaw.level,
            type: "custom",
        })
    }

    for (const meritFlaw of character.predatorType?.pickedMeritsAndFlaws || []) {
        traits.push({
            name: meritFlaw.name,
            rating: meritFlaw.level,
            type: "custom",
        })
    }

    const healthString = createDamageString(
        character.maxHealth,
        character.ephemeral.superficialDamage,
        character.ephemeral.aggravatedDamage
    )

    const willpowerString = createDamageString(
        character.willpower,
        character.ephemeral.superficialWillpowerDamage,
        character.ephemeral.aggravatedWillpowerDamage
    )

    const convictions = character.touchstones.map((touchstone) => touchstone.conviction)

    const biography = [
        character.description ? `Concept: ${character.description}` : "",
        character.clan ? `Clan: ${character.clan}` : "",
        character.sect ? `Sect: ${character.sect}` : "",
        character.chronicle ? `Chronicle: ${character.chronicle}` : "",
        character.sire ? `Sire: ${character.sire}` : "",
        character.ambition ? `Ambition: ${character.ambition}` : "",
        character.desire ? `Desire: ${character.desire}` : "",
        character.notes ? `Notes: ${character.notes}` : "",
    ]
        .filter(Boolean)
        .join("\n\n")

    const touchstonesText = character.touchstones
        .map((t) => `${t.name} (${t.conviction})${t.description ? `: ${t.description}` : ""}`)
        .join("\n")

    const description = touchstonesText || ""

    const meritsText = [
        ...character.merits,
        ...(character.predatorType?.pickedMeritsAndFlaws?.filter((m) => m.type === "merit") || []),
    ]
        .map((m) => `${m.name} (${m.level})`)
        .join(", ")

    const flawsText = [
        ...character.flaws,
        ...(character.predatorType?.pickedMeritsAndFlaws?.filter((m) => m.type === "flaw") || []),
    ]
        .map((f) => `${f.name} (${f.level})`)
        .join(", ")

    let splat: "vampire" | "thin-blood" | "ghoul" | "mortal" = "vampire"
    if (character.clan === "Thin-blood") {
        splat = "thin-blood"
    } else if (character.clan) {
        splat = "vampire"
    } else {
        splat = "mortal"
    }

    const inconnuJson: InconnuVChar = {
        _name: character.name,
        splat,
        _humanity: character.humanity,
        stains: character.ephemeral.humanityStains,
        health: healthString,
        willpower: willpowerString,
        _hunger: character.ephemeral.hunger,
        potency: character.bloodPotency,
        _traits: traits,
        profile: {
            biography,
            description,
            images: [],
        },
        convictions,
        header: {
            blush: 0,
            location: "",
            merits: meritsText,
            flaws: flawsText,
            temp: "",
        },
        macros: [],
        experience: {
            unspent: character.experience - character.ephemeral.experienceSpent,
            lifetime: character.experience,
            log: [],
        },
        stat_log: {},
    }

    return inconnuJson
}
