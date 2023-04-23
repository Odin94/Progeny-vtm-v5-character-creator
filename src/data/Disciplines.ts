import { z } from "zod";
import { clanNameSchema } from "./Clans";

export const disciplineNameSchema = z.union([
    z.literal("animalism"),
    z.literal("auspex"),
    z.literal("celerity"),
    z.literal("dominate"),
    z.literal("fortitude"),
    z.literal("obfuscate"),
    z.literal("potence"),
    z.literal("presence"),
    z.literal("protean"),
    z.literal("blood sorcery"),

    z.literal("oblivion"),
])
export type DisciplineName = z.infer<typeof disciplineNameSchema>

export const amalgamPrerequisiteSchema = z.object({
    discipline: disciplineNameSchema,
    level: z.number().min(1).int(),
})
export type AmalgamPrerequisite = z.infer<typeof amalgamPrerequisiteSchema>

export const powerSchema = z.object({
    name: z.string(),
    description: z.string(),
    summary: z.string(),
    dicePool: z.string(),
    level: z.number().min(1).int(),
    discipline: disciplineNameSchema,
    amalgamPrerequisites: amalgamPrerequisiteSchema.array(),
})
export type Power = z.infer<typeof powerSchema>


export const disciplineSchema = z.object({
    clans: clanNameSchema.array(),
    summary: z.string(),
    powers: powerSchema.array(),
})
export type Discipline = z.infer<typeof disciplineSchema>


export const disciplines: Record<DisciplineName, Discipline> = {
    animalism: {
        clans: ["Nosferatu", "Gangrel", "Ravnos", "Tzimisce"],
        summary: "",
        powers: [
            { name: "Bond Famulus", description: "", amalgamPrerequisites: [], summary: "bond an animal companion", dicePool: "", level: 1, discipline: "animalism" },
            { name: "Sense the Beast", description: "", amalgamPrerequisites: [], summary: "sense hostility and supernatural traits", dicePool: "", level: 1, discipline: "animalism" },
            { name: "Feral Whispers", description: "", amalgamPrerequisites: [], summary: "communicate with animals", dicePool: "", level: 2, discipline: "animalism" },
            { name: "Atavism", description: "", amalgamPrerequisites: [], summary: "make an animal enrage or flee", dicePool: "", level: 2, discipline: "animalism" },
        ],
    },
    auspex: {
        clans: ["Toreador", "Tremere", "Malkavian", "Hecata", "Salubri"],
        summary: "",
        powers: [
            { name: "Heightened Senses", description: "", amalgamPrerequisites: [], summary: "add Auspex rating to perception rolls", dicePool: "", level: 1, discipline: "auspex" },
            { name: "Sense the Unseen", description: "", amalgamPrerequisites: [], summary: "sense supernatural activity", dicePool: "", level: 1, discipline: "auspex" },
            { name: "Premonition", description: "", amalgamPrerequisites: [], summary: "gain visions of the future", dicePool: "", level: 2, discipline: "auspex" },
            { name: "Obeah", description: "", amalgamPrerequisites: [{ discipline: "fortitude", level: 1 }], summary: "soothe a person's psychological turmoil", dicePool: "", level: 2, discipline: "auspex" },
            { name: "Unerring Pursuit", description: "", amalgamPrerequisites: [{ discipline: "dominate", level: 1 }], summary: "create a bond with a target to spy on them through glimpses in reflective surfaces", dicePool: "", level: 2, discipline: "auspex" },
        ],
    },
    celerity: {
        clans: ["Toreador", "Brujah", "Banu Haqim"],
        summary: "",
        powers: [
            { name: "Cat's Grace", description: "", amalgamPrerequisites: [], summary: "automatically pass balance tests", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Rapid Reflexes", description: "", amalgamPrerequisites: [], summary: "faster reactions & free minor actions", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Fleetness", description: "", amalgamPrerequisites: [], summary: "add Celerity rating for defense and Dexterity rolls", dicePool: "", level: 2, discipline: "celerity" },
        ],
    },
    dominate: {
        clans: ["Ventrue", "Malkavian", "Tremere", "Lasombra", "Tzimisce", "Salubri"],
        summary: "",
        powers: [
            { name: "Cloud Memory", description: "", amalgamPrerequisites: [], summary: "make a person forget the past minute", dicePool: "", level: 1, discipline: "dominate" },
            { name: "Compel", description: "", amalgamPrerequisites: [], summary: "a single, short command with an immediate effect", dicePool: "", level: 1, discipline: "dominate" },
            { name: "Mesmerize", description: "", amalgamPrerequisites: [], summary: "allow issuing more complex commands", dicePool: "", level: 2, discipline: "dominate" },
            { name: "Domitor's Favor", description: "", amalgamPrerequisites: [], summary: "make it harder for thralls to resist you", dicePool: "", level: 2, discipline: "dominate" },
            { name: "Slavish Devotion", description: "", amalgamPrerequisites: [{ discipline: "presence", level: 1 }], summary: "strengthen the mind of your dominated victims against interference from other kindred", dicePool: "", level: 2, discipline: "dominate" },
            // { name: "Dementation", description: "", amalgamPrerequisites: [{ discipline: "obfuscate", level: 2 }], summary: "trigger psychotic breaks or nervous breakdowns in others", dicePool: "", level: 2, discipline: "dominate" },
        ],
    },
    fortitude: {
        clans: ["Ventrue", "Gangrel", "Hecata", "Salubri"],
        summary: "",
        powers: [
            { name: "Resilience", description: "", amalgamPrerequisites: [], summary: "add Fortitude rating to health track", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Unswayable Mind", description: "", amalgamPrerequisites: [], summary: "add extra defense against mind-swaying", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Toughness", description: "", amalgamPrerequisites: [], summary: "reduce Superficial physical damage sustained", dicePool: "", level: 2, discipline: "fortitude" },
            { name: "Valeren", description: "", amalgamPrerequisites: [{ discipline: "auspex", level: 1 }], summary: "use your blood to heal other vampires", dicePool: "", level: 2, discipline: "fortitude" },
            // { name: "Obdurate", description: "", amalgamPrerequisites: [{ discipline: "potence", level: 2 }], summary: "maintain steady footing even when struck by massive force", dicePool: "", level: 2, discipline: "fortitude" },
        ],
    },
    obfuscate: {
        clans: ["Nosferatu", "Malkavian", "Banu Haqim", "Ministry", "Ravnos"],
        summary: "",
        powers: [
            { name: "Cloak of Shadows", description: "", amalgamPrerequisites: [], summary: "blend into surroundings while motionless", dicePool: "", level: 1, discipline: "obfuscate" },
            { name: "Silence of Death", description: "", amalgamPrerequisites: [], summary: "mute all sounds you make", dicePool: "", level: 1, discipline: "obfuscate" },
            { name: "Unseen Passage", description: "", amalgamPrerequisites: [], summary: "move while remaining hidden", dicePool: "", level: 2, discipline: "obfuscate" },
            { name: "Ghost's Passing", description: "", amalgamPrerequisites: [{ discipline: "animalism", level: 1 }], summary: "extend your obfuscate powers to animals under your influence", dicePool: "", level: 2, discipline: "obfuscate" },
            // { name: "Ventriloquism", description: "", amalgamPrerequisites: [{ discipline: "auspex", level: 2 }], summary: "choose who can and cannot hear you when speaking", dicePool: "", level: 2, discipline: "obfuscate" },
        ],
    },
    potence: {
        clans: ["Nosferatu", "Brujah", "Lasombra"],
        summary: "",
        powers: [
            { name: "Lethal Body", description: "", amalgamPrerequisites: [], summary: "cause serious physical damage to a mortals", dicePool: "", level: 1, discipline: "potence" },
            { name: "Soaring Leap", description: "", amalgamPrerequisites: [], summary: "jump over long distance", dicePool: "", level: 1, discipline: "potence" },
            { name: "Prowess", description: "", amalgamPrerequisites: [], summary: "add Potence rating to strength", dicePool: "", level: 2, discipline: "potence" },
        ],
    },
    presence: {
        clans: ["Toreador", "Brujah", "Ventrue", "Ministry", "Ravnos"],
        summary: "",
        powers: [
            { name: "Awe", description: "", amalgamPrerequisites: [], summary: "become attractive and charismatic", dicePool: "", level: 1, discipline: "presence" },
            { name: "Daunt", description: "", amalgamPrerequisites: [], summary: "push people away and intimidate", dicePool: "", level: 1, discipline: "presence" },
            { name: "Lingering Kiss", description: "", amalgamPrerequisites: [], summary: "make mortals you feed from love you", dicePool: "", level: 2, discipline: "presence" },
        ],
    },
    protean: {
        clans: ["Gangrel", "Ministry", "Tzimisce"],
        summary: "",
        powers: [
            { name: "Eyes of the Beast", description: "", amalgamPrerequisites: [], summary: "see in total darkness", dicePool: "", level: 1, discipline: "protean" },
            { name: "Weight of the Feather", description: "", amalgamPrerequisites: [], summary: "become weightless", dicePool: "", level: 1, discipline: "protean" },
            { name: "Feral Weapons", description: "", amalgamPrerequisites: [], summary: "grow deadly claws", dicePool: "", level: 2, discipline: "protean" },
            // { name: "Vicissitude", description: "", amalgamPrerequisites: [{ discipline: "dominate", level: 2 }], summary: "reshape your own skin, muscles and bone at will", dicePool: "", level: 2, discipline: "protean" },
        ],
    },
    "blood sorcery": {
        clans: ["Tremere", "Banu Haqim"],
        summary: "",
        powers: [
            { name: "Corrosive Vitae", description: "", amalgamPrerequisites: [], summary: "make your blood corrosive to dead substances", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "A Taste for Blood", description: "", amalgamPrerequisites: [], summary: "Discern traits about someone by tasting a drop of their blood", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "Shape of the Sanguine Sacrament", description: "", amalgamPrerequisites: [], summary: "manipulate blood to show simple messages or shapes", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "Extinguish Vitae", description: "", amalgamPrerequisites: [], summary: "increase another vampire's hunger", dicePool: "", level: 1, discipline: "blood sorcery" },
        ]
    },
    oblivion: {
        clans: ["Lasombra", "Hecata"],
        summary: "",
        powers: [
            { name: "Shadow Cloak", description: "", amalgamPrerequisites: [], summary: "manipulate shadows for stealth or intimidation", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Oblivion's Sight", description: "", amalgamPrerequisites: [], summary: "see in darkness and see ghosts", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Ashes to Ashes", description: "", amalgamPrerequisites: [], summary: "use your vitae to disintegrate non-vampire corpses", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "The Binding Fetter", description: "", amalgamPrerequisites: [], summary: "identify objects and locations that are connected to ghosts", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Shadow Cast", description: "", amalgamPrerequisites: [], summary: "summon a supernatural shadow you control", dicePool: "", level: 2, discipline: "oblivion" },
            { name: "Where the Shroud Thins", description: "", amalgamPrerequisites: [], summary: "find places where ghosts can cross between worlds", dicePool: "", level: 2, discipline: "oblivion" },
            // { name: "Arms of Ahriman", description: "", amalgamPrerequisites: [{ discipline: "potence", level: 2 }], summary: "xxx", dicePool: "", level: 2, discipline: "oblivion" },
            // { name: "Fatal Precognition", description: "", amalgamPrerequisites: [{ discipline: "auspex", level: 2 }], summary: "xxx", dicePool: "", level: 2, discipline: "oblivion" },
        ]
    },
}