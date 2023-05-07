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

    z.literal(""),
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

            { name: "Animal Succulence", description: "", amalgamPrerequisites: [], summary: "Feed more effectively on animals", dicePool: "", level: 3, discipline: "animalism" },
            { name: "Scent of Prey", description: "", amalgamPrerequisites: [], summary: "Detect Mortals who saw Masquerade breaches", dicePool: "", level: 3, discipline: "animalism" },
            { name: "Quell the Beast", description: "", amalgamPrerequisites: [], summary: "Shut down a target's drives and desires, pull vampires out of frenzy", dicePool: "", level: 3, discipline: "animalism" },
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

            { name: "Fatal Flaw", description: "", amalgamPrerequisites: [{ discipline: "oblivion", level: 1 }], summary: "determine a target's weakness", dicePool: "", level: 3, discipline: "auspex" },
            { name: "Scry the Soul", description: "", amalgamPrerequisites: [], summary: "see people's auras", dicePool: "", level: 3, discipline: "auspex" },
            { name: "Share the Senses", description: "", amalgamPrerequisites: [], summary: "sense through another person (eg. see through their eyes)", dicePool: "", level: 3, discipline: "auspex" },
        ],
    },
    celerity: {
        clans: ["Toreador", "Brujah", "Banu Haqim"],
        summary: "",
        powers: [
            { name: "Cat's Grace", description: "", amalgamPrerequisites: [], summary: "automatically pass balance tests", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Rapid Reflexes", description: "", amalgamPrerequisites: [], summary: "faster reactions & free minor actions", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Fleetness", description: "", amalgamPrerequisites: [], summary: "add Celerity rating for defense and Dexterity rolls", dicePool: "", level: 2, discipline: "celerity" },

            { name: "Blink", description: "", amalgamPrerequisites: [], summary: "dash up to 50m at supernatural speed", dicePool: "", level: 3, discipline: "celerity" },
            { name: "Traversal", description: "", amalgamPrerequisites: [], summary: "run across liquids or walls", dicePool: "", level: 3, discipline: "celerity" },
            { name: "Weaving", description: "", amalgamPrerequisites: [], summary: "add Celerity rating to defense against ranged (Requires 'Rapid Reflexes')", dicePool: "", level: 3, discipline: "celerity" },
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

            { name: "Forgetful Mind", description: "", amalgamPrerequisites: [], summary: "Rewrite memories", dicePool: "", level: 3, discipline: "dominate" },
            { name: "Submerged Directive", description: "", amalgamPrerequisites: [], summary: "When using Mesmerize you can give a command that stays dormant until triggered (requires Mesmerize)", dicePool: "", level: 3, discipline: "dominate" },
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

            { name: "Defy Bane", description: "", amalgamPrerequisites: [], summary: "turn aggravated damage to superficial", dicePool: "", level: 3, discipline: "fortitude" },
            { name: "Fortify the Inner Facade", description: "", amalgamPrerequisites: [], summary: "resist auspex and similar powers", dicePool: "", level: 3, discipline: "fortitude" },
            { name: "Seal the Beast's Maw", description: "", amalgamPrerequisites: [], summary: "ignore hunger for one scene", dicePool: "", level: 3, discipline: "fortitude" },
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

            { name: "Ghost in the Machine", description: "", amalgamPrerequisites: [], summary: "Obfuscate affects technology (eg. hide yourself from recordings)", dicePool: "", level: 3, discipline: "obfuscate" },
            { name: "Mask of a Thousand Faces", description: "", amalgamPrerequisites: [], summary: "make yourself appear as a non-descript stranger to others", dicePool: "", level: 3, discipline: "obfuscate" },
            { name: "Mental Maze", description: "", amalgamPrerequisites: [{ discipline: "dominate", level: 1 }], summary: "prevent someone from perceiving any exits or means of escape", dicePool: "", level: 3, discipline: "obfuscate" },
        ],
    },
    potence: {
        clans: ["Nosferatu", "Brujah", "Lasombra"],
        summary: "",
        powers: [
            { name: "Lethal Body", description: "", amalgamPrerequisites: [], summary: "cause serious physical damage to a mortals", dicePool: "", level: 1, discipline: "potence" },
            { name: "Soaring Leap", description: "", amalgamPrerequisites: [], summary: "jump over long distance", dicePool: "", level: 1, discipline: "potence" },
            { name: "Prowess", description: "", amalgamPrerequisites: [], summary: "add Potence rating to strength checks", dicePool: "", level: 2, discipline: "potence" },

            { name: "Brutal Feed", description: "", amalgamPrerequisites: [], summary: "drain a person in seconds", dicePool: "", level: 3, discipline: "potence" },
            { name: "Uncanny Grip", description: "", amalgamPrerequisites: [], summary: "grip and hold onto any surface, including walls and ceilings", dicePool: "", level: 3, discipline: "potence" },
            { name: "Wrecker", description: "", amalgamPrerequisites: [], summary: "add double Potence rating to strength when destroying objects (requires 'Prowess')", dicePool: "", level: 3, discipline: "potence" },
        ],
    },
    presence: {
        clans: ["Toreador", "Brujah", "Ventrue", "Ministry", "Ravnos"],
        summary: "",
        powers: [
            { name: "Awe", description: "", amalgamPrerequisites: [], summary: "become attractive and charismatic; add Presence rating to Persuasion and Performance checks", dicePool: "", level: 1, discipline: "presence" },
            { name: "Daunt", description: "", amalgamPrerequisites: [], summary: "push people away and intimidate; add Presence rating to Intimidation checks", dicePool: "", level: 1, discipline: "presence" },
            { name: "Lingering Kiss", description: "", amalgamPrerequisites: [], summary: "make mortals you feed from love you", dicePool: "", level: 2, discipline: "presence" },

            { name: "Dread Gaze", description: "", amalgamPrerequisites: [], summary: "terrify an individual, causing them to submit, freeze, flee or terror-frenzy", dicePool: "", level: 3, discipline: "presence" },
            { name: "Entrancement", description: "", amalgamPrerequisites: [], summary: "cause infatuation, making a target do almost anything to remain in your good graces", dicePool: "", level: 3, discipline: "presence" },
            { name: "Thrown Voice", description: "", amalgamPrerequisites: [{ discipline: "auspex", level: 1 }], summary: "project your voice to anywhere you can see", dicePool: "", level: 3, discipline: "presence" },
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

            { name: "Earth Meld", description: "", amalgamPrerequisites: [], summary: "meld into the soil", dicePool: "", level: 3, discipline: "protean" },
            { name: "Shapechange", description: "", amalgamPrerequisites: [], summary: "turn into a human-sized animal", dicePool: "", level: 3, discipline: "protean" },
        ],
    },
    "blood sorcery": {
        clans: ["Tremere", "Banu Haqim"],
        summary: "",
        powers: [
            { name: "Corrosive Vitae", description: "", amalgamPrerequisites: [], summary: "make your blood corrosive to dead substances", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "A Taste for Blood", description: "", amalgamPrerequisites: [], summary: "Discern traits about someone by tasting a drop of their blood", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "Shape of the Sanguine Sacrament", description: "", amalgamPrerequisites: [], summary: "manipulate blood to show simple messages or shapes", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "Extinguish Vitae", description: "", amalgamPrerequisites: [], summary: "increase another vampire's hunger", dicePool: "", level: 2, discipline: "blood sorcery" },
            { name: "Scour Secrets", description: "", amalgamPrerequisites: [], summary: "locate particular information in text", dicePool: "", level: 2, discipline: "blood sorcery" },

            { name: "Blood of Potency", description: "", amalgamPrerequisites: [], summary: "temporarily increase your Blood Potency", dicePool: "", level: 3, discipline: "blood sorcery" },
            { name: "Scorpion's Touch", description: "", amalgamPrerequisites: [], summary: "turn your blood into paralyzing poison", dicePool: "", level: 3, discipline: "blood sorcery" },
            { name: "Transitive Bond", description: "", amalgamPrerequisites: [], summary: "your blood can retain Blood Bonding properties even when stored in an object or a ghoul", dicePool: "", level: 3, discipline: "blood sorcery" },
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

            { name: "Aura of Decay", description: "", amalgamPrerequisites: [], summary: "decay everything around", dicePool: "", level: 3, discipline: "oblivion" },
            { name: "Shadow Perspective", description: "", amalgamPrerequisites: [], summary: "project senses through shadows", dicePool: "", level: 3, discipline: "oblivion" },
            { name: "Touch of Oblivion", description: "", amalgamPrerequisites: [], summary: "decay a living or unliving body", dicePool: "", level: 3, discipline: "oblivion" },
        ]
    },

    "": {
        clans: [],
        summary: "",
        powers: []
    },
}