// https://github.com/WoD5E-Developers/wod5e/issues/235#issuecomment-3372866896

import { z } from "zod"
import { AttributesKey } from "~/data/Attributes"
import { DisciplineName } from "~/data/NameSchemas"
import { SkillsKey } from "~/data/Skills"
import { Character } from "../data/Character"
import { clans } from "../data/Clans"
import { PredatorTypes } from "../data/PredatorType"
import { getValueForKey } from "./utils"

const WoD5EVttJsonSchema = z.object({
    name: z.string(),
    type: z.literal("vampire"),
    system: z.object({
        locked: z.boolean(),
        hasSkillAttributeData: z.boolean(),
        group: z.string(),
        biography: z.string(),
        appearance: z.string(),
        equipment: z.string(),
        notes: z.string(),
        privatenotes: z.string(),
        bio: z.object({
            age: z.object({
                trueage: z.string(),
                apparent: z.string(),
            }),
            dateof: z.object({
                birth: z.string(),
                death: z.string(),
            }),
            history: z.string(),
        }),
        headers: z.object({
            concept: z.string(),
            chronicle: z.string(),
            ambition: z.string(),
            desire: z.string(),
            touchstones: z.string(),
            tenets: z.string(),
            sire: z.string(),
            generation: z.string(),
        }),
        exp: z.object({
            value: z.number(),
            max: z.number(),
        }),
        humanity: z.object({
            value: z.number(),
            stains: z.number(),
        }),
        hunger: z.object({
            value: z.number(),
            max: z.number(),
        }),
        health: z.object({
            aggravated: z.number(),
            superficial: z.number(),
            max: z.number(),
            value: z.number(),
        }),
        willpower: z.object({
            aggravated: z.number(),
            superficial: z.number(),
            max: z.number(),
            value: z.number(),
        }),
        blood: z.object({
            potency: z.number(),
            resonance: z.string(),
        }),
        attributes: z.object({
            strength: z.object({ value: z.number() }),
            charisma: z.object({ value: z.number() }),
            intelligence: z.object({ value: z.number() }),
            dexterity: z.object({ value: z.number() }),
            manipulation: z.object({ value: z.number() }),
            wits: z.object({ value: z.number() }),
            stamina: z.object({ value: z.number() }),
            composure: z.object({ value: z.number() }),
            resolve: z.object({ value: z.number() }),
        }),
        skills: z.record(
            z.string(),
            z.object({
                value: z.number(),
                bonuses: z.array(z.record(z.string(), z.unknown())),
            })
        ),
        disciplines: z.object({
            animalism: z.object({ value: z.number(), powers: z.array(z.string()) }),
            auspex: z.object({ value: z.number(), powers: z.array(z.string()) }),
            celerity: z.object({ value: z.number(), powers: z.array(z.string()) }),
            dominate: z.object({ value: z.number(), powers: z.array(z.string()) }),
            fortitude: z.object({ value: z.number(), powers: z.array(z.string()) }),
            obfuscate: z.object({ value: z.number(), powers: z.array(z.string()) }),
            potence: z.object({ value: z.number(), powers: z.array(z.string()) }),
            presence: z.object({ value: z.number(), powers: z.array(z.string()) }),
            protean: z.object({ value: z.number(), powers: z.array(z.string()) }),
            sorcery: z.object({ value: z.number(), powers: z.array(z.string()) }),
            oblivion: z.object({ value: z.number(), powers: z.array(z.string()) }),
        }),
        settings: z.object({
            headerbg: z.string(),
            background: z.string(),
            limited: z.object({
                biography: z.boolean(),
                appearance: z.boolean(),
                touchstones: z.boolean(),
                tenets: z.boolean(),
            }),
            skillAttributeInputs: z.boolean(),
        }),
    }),
    items: z.array(z.record(z.string(), z.unknown())),
})

// TypeScript type derived from the Zod schema
export type WoD5EVttJson = z.infer<typeof WoD5EVttJsonSchema>

type WoD5EVtt_DisciplineKey =
    | "animalism"
    | "auspex"
    | "celerity"
    | "dominate"
    | "fortitude"
    | "obfuscate"
    | "potence"
    | "presence"
    | "protean"
    | "sorcery"
    | "oblivion"
    | "alchemy"
    | "rituals"
    | "ceremonies"

export const disciplineNameTo_WoD5EVtt_Key: Record<DisciplineName, WoD5EVtt_DisciplineKey | undefined> = {
    animalism: "animalism",
    auspex: "auspex",
    celerity: "celerity",
    dominate: "dominate",
    fortitude: "fortitude",
    obfuscate: "obfuscate",
    potence: "potence",
    presence: "presence",
    protean: "protean",
    "blood sorcery": "sorcery",
    oblivion: "oblivion",
    "thin-blood alchemy": "alchemy",
    "": undefined,
}

type WoD5EVtt_AttributesKey =
    | "strength"
    | "dexterity"
    | "stamina"
    | "charisma"
    | "manipulation"
    | "composure"
    | "intelligence"
    | "wits"
    | "resolve"

export const attributeNameTo_WoD5EVtt_Key: Record<AttributesKey, WoD5EVtt_AttributesKey | undefined> = {
    strength: "strength",
    dexterity: "dexterity",
    stamina: "stamina",
    charisma: "charisma",
    manipulation: "manipulation",
    composure: "composure",
    intelligence: "intelligence",
    wits: "wits",
    resolve: "resolve",
}

type WoD5EVtt_SkillsKey =
    | "athletics"
    | "animalken"
    | "academics"
    | "brawl"
    | "etiquette"
    | "awareness"
    | "craft"
    | "insight"
    | "finance"
    | "drive"
    | "intimidation"
    | "investigation"
    | "firearms"
    | "leadership"
    | "medicine"
    | "larceny"
    | "performance"
    | "occult"
    | "melee"
    | "persuasion"
    | "politics"
    | "stealth"
    | "streetwise"
    | "science"
    | "survival"
    | "subterfuge"
    | "technology"

export const skillNameTo_WoD5EVtt_Key: Record<SkillsKey, WoD5EVtt_SkillsKey> = {
    athletics: "athletics",
    "animal ken": "animalken",
    academics: "academics",
    brawl: "brawl",
    etiquette: "etiquette",
    awareness: "awareness",
    craft: "craft",
    science: "science",
    survival: "survival",
    subterfuge: "subterfuge",
    technology: "technology",
    drive: "drive",
    stealth: "stealth",
    politics: "politics",
    streetwise: "streetwise",
    investigation: "investigation",
    medicine: "medicine",
    occult: "occult",
    performance: "performance",
    persuasion: "persuasion",
    insight: "insight",
    intimidation: "intimidation",
    leadership: "leadership",
    larceny: "larceny",
    melee: "melee",
    firearms: "firearms",
    finance: "finance",
}

const parseDicePool = (dicePoolString: string, character: Character): Record<string, { path: string }> => {
    // This assumes that dicePoolStrings are in one of these formats:
    // "Thing [ / Thing]"
    // "Thing [ / Thing] + Thing [ / Thing]"

    if (!dicePoolString || dicePoolString.trim() === "") {
        return {}
    }

    const dicePool: Record<string, { path: string }> = {}

    const components = dicePoolString.split("+").map((comp) => comp.trim().toLowerCase())

    for (const component of components) {
        // Handle alternatives (e.g., "Charisma / Manipulation")
        const alternatives = component.split("/").map((alt) => alt.trim())

        if (alternatives.length === 1) {
            const key = alternatives[0]
            const path = findPathForKey(key)
            if (path) {
                dicePool[alternatives[0]] = { path }
            }
        } else {
            // Multiple alternatives - pick the one with higher value
            let bestAlternative = alternatives[0]
            let bestValue = getValueForKey(alternatives[0], character)

            for (let i = 1; i < alternatives.length; i++) {
                const value = getValueForKey(alternatives[i], character)
                if (value > bestValue) {
                    bestAlternative = alternatives[i]
                    bestValue = value
                }
            }

            const path = findPathForKey(bestAlternative)
            if (path) {
                dicePool[bestAlternative] = { path }
            }
        }
    }

    return dicePool
}

const findPathForKey = (key: string): string | null => {
    const attribute = attributeNameTo_WoD5EVtt_Key[key as AttributesKey]
    if (attribute) {
        return `attributes.${attribute}`
    }

    const skill = skillNameTo_WoD5EVtt_Key[key as SkillsKey]
    if (skill) {
        return `skills.${skill}`
    }

    const discipline = disciplineNameTo_WoD5EVtt_Key[key as DisciplineName]
    if (discipline) {
        return `disciplines.${discipline}`
    }

    return null
}

export const createWoD5EVttJson = (character: Character): { json: WoD5EVttJson; validationErrors: string[] } => {
    // JSON for https://foundryvtt.com/packages/vtm5e
    // Based on template at https://github.com/WoD5E-Developers/wod5e/blob/main/template.json (commit 5e35fc1 / Version 5.2.2)
    const disciplineValues: Record<WoD5EVtt_DisciplineKey, { value: number; powers: string[] }> = {
        animalism: { value: 0, powers: [] },
        auspex: { value: 0, powers: [] },
        celerity: { value: 0, powers: [] },
        dominate: { value: 0, powers: [] },
        fortitude: { value: 0, powers: [] },
        obfuscate: { value: 0, powers: [] },
        potence: { value: 0, powers: [] },
        presence: { value: 0, powers: [] },
        protean: { value: 0, powers: [] },
        sorcery: { value: 0, powers: [] },
        oblivion: { value: 0, powers: [] },
        alchemy: { value: 0, powers: [] },
        rituals: { value: 0, powers: [] },
        ceremonies: { value: 0, powers: [] },
    }

    for (const disc of character.disciplines) {
        const key = disciplineNameTo_WoD5EVtt_Key[disc.discipline]
        if (!key) continue
        disciplineValues[key].powers.push(disc.name)
        disciplineValues[key].value = Math.max(disciplineValues[key].value, disc.level)
    }

    const skills = Object.entries(character.skills).reduce(
        (acc, [k, value]) => {
            const foundrySkillKey = skillNameTo_WoD5EVtt_Key[k as SkillsKey]
            acc[foundrySkillKey] = { value, bonuses: [] }

            return acc
        },
        {} as Record<WoD5EVtt_SkillsKey, { value: number; bonuses: Record<string, unknown>[] }>
    )

    const specialtySources = [
        ...(character.skillSpecialties || []),
        ...((character.predatorType?.pickedSpecialties as unknown as { skill?: string; name?: string }[]) || []),
    ]
    for (const spec of specialtySources) {
        const foundrySkillKey = skillNameTo_WoD5EVtt_Key[spec.skill as SkillsKey]

        const foundrySpecialty = {
            source: `${spec.name ?? ""}`,
            value: 1,
            paths: [`skills.${foundrySkillKey}`],
            displayWhenInactive: true,
            activeWhen: { check: "never" },
        }
        skills[foundrySkillKey].bonuses.push(foundrySpecialty)
    }

    const items: Record<string, unknown>[] = []

    // Clan item
    if (character.clan) {
        const clanDef = clans[character.clan as keyof typeof clans]
        items.push({
            name: character.clan,
            type: "clan",
            system: {
                description: clanDef?.description ?? "",
                gamesystem: "vampire",
                bane: clanDef?.bane ?? "",
                bonuses: [],
            },
        })
    }

    // Predator type item
    if (character.predatorType?.name) {
        const predDef = PredatorTypes[character.predatorType.name as keyof typeof PredatorTypes]
        items.push({
            name: character.predatorType.name,
            type: "predatorType",
            system: {
                description: predDef?.summary ?? "",
                gamesystem: "vampire",
                bonuses: [],
                dicepool: { path: "", value: 0 },
            },
        })
    }

    // Power items from picked disciplines
    for (const p of character.disciplines) {
        const key = disciplineNameTo_WoD5EVtt_Key[p.discipline]
        if (!key) continue
        items.push({
            name: p.name,
            type: "power",
            system: {
                description: p.summary || p.description || "",
                gamesystem: "vampire",
                discipline: key,
                level: p.level,
                duration: "",
                cost: "",
                dicepool: parseDicePool(p.dicePool, character),
                bonuses: [],
                uses: { max: 0, current: 0, enabled: false },
            },
        })
    }

    // Merit items
    const allMerits = [
        ...(character.merits || []),
        ...(character.predatorType?.pickedMeritsAndFlaws?.filter((m) => m.type === "merit") || []),
    ]
    for (const merit of allMerits) {
        items.push({
            name: merit.name,
            type: "feature",
            system: {
                description: merit.summary || "",
                featuretype: "merit",
                points: merit.level,
                bonuses: [],
                uses: { max: 0, current: 0, enabled: false },
            },
        })
    }

    // Flaw items
    const allFlaws = [...(character.flaws || []), ...(character.predatorType?.pickedMeritsAndFlaws?.filter((m) => m.type === "flaw") || [])]
    for (const flaw of allFlaws) {
        items.push({
            name: flaw.name,
            type: "feature",
            system: {
                description: flaw.summary || "",
                featuretype: "flaw",
                points: flaw.level,
                bonuses: [],
                uses: { max: 0, current: 0, enabled: false },
            },
        })
    }

    // Ritual items
    for (const ritual of character.rituals || []) {
        items.push({
            name: ritual.name,
            type: "power",
            system: {
                description: ritual.summary || "",
                gamesystem: "vampire",
                discipline: "rituals",
                level: ritual.level,
                duration: "",
                cost: ritual.rouseChecks > 0 ? `${ritual.rouseChecks} Rouse Check${ritual.rouseChecks > 1 ? "s" : ""}` : "Free",
                dicepool: {},
                bonuses: [],
            },
        })
    }

    const foundry_WoD5E_json = {
        name: character.name,
        type: "vampire",
        system: {
            locked: false,
            hasSkillAttributeData: true,
            group: "",
            biography: "",
            appearance: "",
            equipment: "",
            notes: "",
            privatenotes: "",

            bio: {
                age: { trueage: "", apparent: "" },
                dateof: { birth: "", death: "" },
                history: "",
            },

            headers: {
                concept: character.description ?? "",
                chronicle: "",
                ambition: character.ambition ?? "",
                desire: character.desire ?? "",
                touchstones: character.touchstones.map((t) => `${t.name} (${t.conviction})`).join(", "),
                tenets: "",
                sire: character.sire ?? "",
                generation: String(character.generation ?? ""),
            },

            exp: {
                value: character.experience ?? 0,
                max: 0,
            },

            humanity: { value: character.humanity ?? 7, stains: 0 },
            hunger: { value: 1, max: 5 },
            health: {
                aggravated: 0,
                superficial: 0,
                max: character.maxHealth ?? 5,
                value: character.maxHealth ?? 5,
            },
            willpower: {
                aggravated: 0,
                superficial: 0,
                max: character.willpower ?? 5,
                value: character.willpower ?? 5,
            },

            blood: { potency: character.bloodPotency ?? 0, resonance: "" },

            attributes: {
                strength: { value: character.attributes.strength },
                charisma: { value: character.attributes.charisma },
                intelligence: { value: character.attributes.intelligence },
                dexterity: { value: character.attributes.dexterity },
                manipulation: { value: character.attributes.manipulation },
                wits: { value: character.attributes.wits },
                stamina: { value: character.attributes.stamina },
                composure: { value: character.attributes.composure },
                resolve: { value: character.attributes.resolve },
            },

            skills,

            disciplines: {
                animalism: disciplineValues.animalism,
                auspex: disciplineValues.auspex,
                celerity: disciplineValues.celerity,
                dominate: disciplineValues.dominate,
                fortitude: disciplineValues.fortitude,
                obfuscate: disciplineValues.obfuscate,
                potence: disciplineValues.potence,
                presence: disciplineValues.presence,
                protean: disciplineValues.protean,
                sorcery: disciplineValues.sorcery,
                oblivion: disciplineValues.oblivion,
            },

            settings: {
                headerbg: "",
                background: "",
                limited: { biography: true, appearance: true, touchstones: false, tenets: false },
                skillAttributeInputs: false,
            },
        },

        items,
    }

    try {
        const validatedJson = WoD5EVttJsonSchema.parse(foundry_WoD5E_json)
        return { json: validatedJson, validationErrors: [] }
    } catch (validationError) {
        console.error("WoD5E VTT JSON validation failed:", validationError)
        console.error("Generated JSON that failed validation:", foundry_WoD5E_json)

        const validationErrors: string[] = []
        if (validationError && typeof validationError === "object" && "issues" in validationError) {
            const zodError = validationError as { issues: Array<{ path: string[]; message: string }> }
            validationErrors.push(...zodError.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`))
        } else {
            const errorMessage = validationError instanceof Error ? validationError.message : String(validationError)
            validationErrors.push(errorMessage)
        }

        console.error("Validation errors:", validationErrors)

        return { json: foundry_WoD5E_json as WoD5EVttJson, validationErrors }
    }
}
