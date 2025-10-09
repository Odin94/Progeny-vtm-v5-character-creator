// https://github.com/WoD5E-Developers/wod5e/issues/235#issuecomment-3372866896

import { Character } from "../data/Character"
import { clans } from "../data/Clans"
import { PredatorTypes } from "../data/PredatorType"

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

const disciplineNameTo_WoD5EVtt_Key: Record<string, WoD5EVtt_DisciplineKey | undefined> = {
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
}

export const createWoD5EVttJson = (character: Character) => {
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
    }

    for (const p of character.disciplines) {
        const key = disciplineNameTo_WoD5EVtt_Key[p.discipline]
        if (!key) continue
        disciplineValues[key].powers.push(p.name)
        disciplineValues[key].value = Math.max(disciplineValues[key].value, p.level)
    }

    const skills: Record<string, { value: number; bonuses: Record<string, unknown>[] }> = {}
    Object.entries(character.skills).forEach(([k, v]) => {
        skills[k] = { value: v as number, bonuses: [] }
    })

    // TODOdin: Double check this
    const specialtySources = [
        ...(character.skillSpecialties || []),
        ...((character.predatorType?.pickedSpecialties as unknown as { skill?: string; name?: string }[]) || []),
    ]
    for (const spec of specialtySources) {
        const skillKey = spec && spec.skill ? String(spec.skill) : ""
        if (!skillKey || !skills[skillKey]) continue
        const modifiedSpecialty = {
            source: `${spec.name ?? ""}`,
            value: 1,
            paths: [`skills.${skillKey}`],
            displayWhenInactive: true,
            activeWhen: { check: "never" },
        }
        skills[skillKey].bonuses.push(modifiedSpecialty)
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
                dicepool: { path: "", value: 0 },
                bonuses: [],
                uses: { max: 0, current: 0, enabled: false },
            },
        })
    }

    // TODOdin: Double check this
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
                discipline: "sorcery",
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
                touchstones: character.touchstones.map((t) => t.name).join(", "),
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

    return foundry_WoD5E_json
}

export type VttJson = ReturnType<typeof createWoD5EVttJson>
