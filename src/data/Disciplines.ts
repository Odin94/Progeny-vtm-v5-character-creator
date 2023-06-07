import { z } from "zod";
import { clanNameSchema } from "./Clans";

import animalismLogo from "../resources/Rombo_Disciplines/rombo_Animalism.svg";
import auspexLogo from "../resources/Rombo_Disciplines/rombo_Auspex.svg";
import celerityLogo from "../resources/Rombo_Disciplines/rombo_Celerity.svg";
import dominateLogo from "../resources/Rombo_Disciplines/rombo_Dominate.svg";
import fortitudeLogo from "../resources/Rombo_Disciplines/rombo_Fortitude.svg";
import obfuscateLogo from "../resources/Rombo_Disciplines/rombo_Obfuscate.svg";
import potenceLogo from "../resources/Rombo_Disciplines/rombo_Potence.svg";
import presenceLogo from "../resources/Rombo_Disciplines/rombo_Presence.svg";
import proteanLogo from "../resources/Rombo_Disciplines/rombo_Protean.svg";
import bloodSorceryLogo from "../resources/Rombo_Disciplines/rombo_BloodSorcery.svg";
import oblivionLogo from "../resources/Rombo_Disciplines/rombo_Oblivion.svg";


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
    rouseChecks: z.number().min(0).int(),
    amalgamPrerequisites: amalgamPrerequisiteSchema.array(),
})
export type Power = z.infer<typeof powerSchema>


export const disciplineSchema = z.object({
    clans: clanNameSchema.array(),
    summary: z.string(),
    powers: powerSchema.array(),
    logo: z.string(),
})
export type Discipline = z.infer<typeof disciplineSchema>


export const disciplines: Record<DisciplineName, Discipline> = {
    animalism: {
        clans: ["Nosferatu", "Gangrel", "Ravnos", "Tzimisce"],
        summary: "",
        logo: animalismLogo,
        powers: [
            { name: "Bond Famulus", description: "", rouseChecks: 3, amalgamPrerequisites: [], summary: "bond an animal companion", dicePool: "Charisma + Animal Ken", level: 1, discipline: "animalism" },
            { name: "Sense the Beast", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "sense hostility and supernatural traits", dicePool: "Resolve + Animalism", level: 1, discipline: "animalism" },
            { name: "Feral Whispers", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "communicate with animals", dicePool: "Manipulation / Charisma + Animalism", level: 2, discipline: "animalism" },
            { name: "Atavism", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "make an animal enrage or flee", dicePool: "Composure + Animalism", level: 2, discipline: "animalism" },

            { name: "Animal Succulence", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "Feed more effectively on animals", dicePool: "", level: 3, discipline: "animalism" },
            { name: "Scent of Prey", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "Detect Mortals who saw Masquerade breaches", dicePool: "Resolve + Animalism", level: 3, discipline: "animalism" },
            { name: "Quell the Beast", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "Shut down a target's drives and desires, pull vampires out of frenzy", dicePool: "Charisma + Animalism", level: 3, discipline: "animalism" },
        ],
    },
    auspex: {
        clans: ["Toreador", "Tremere", "Malkavian", "Hecata", "Salubri"],
        summary: "",
        logo: auspexLogo,
        powers: [
            { name: "Heightened Senses", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "add Auspex rating to perception rolls", dicePool: "", level: 1, discipline: "auspex" },
            { name: "Sense the Unseen", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "sense supernatural activity", dicePool: "Wits / Resolve + Auspex", level: 1, discipline: "auspex" },
            { name: "Premonition", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "gain visions of the future", dicePool: "", level: 2, discipline: "auspex" },
            { name: "Obeah", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "fortitude", level: 1 }], summary: "soothe a person's psychological turmoil", dicePool: "Composure + Auspex", level: 2, discipline: "auspex" },
            { name: "Unerring Pursuit", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "dominate", level: 1 }], summary: "create a bond with a target to spy on them through glimpses in reflective surfaces", dicePool: "Resolve + Auspex", level: 2, discipline: "auspex" },

            { name: "Fatal Flaw", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "oblivion", level: 1 }], summary: "determine a target's weakness", dicePool: "Intelligence + Auspex", level: 3, discipline: "auspex" },
            { name: "Scry the Soul", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "see people's auras", dicePool: "Intelligence + Auspex", level: 3, discipline: "auspex" },
            { name: "Share the Senses", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "sense through another person (eg. see through their eyes)", dicePool: "Resolve + Auspex", level: 3, discipline: "auspex" },
        ],
    },
    celerity: {
        clans: ["Toreador", "Brujah", "Banu Haqim"],
        summary: "",
        logo: celerityLogo,
        powers: [
            { name: "Cat's Grace", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "automatically pass balance tests", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Rapid Reflexes", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "faster reactions & free minor actions", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Fleetness", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "add Celerity rating for defense and Dexterity rolls", dicePool: "", level: 2, discipline: "celerity" },

            { name: "Blink", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "dash up to 50m at supernatural speed", dicePool: "Dexterity + Athletics", level: 3, discipline: "celerity" },
            { name: "Traversal", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "run across liquids or walls", dicePool: "Dexterity + Athletics", level: 3, discipline: "celerity" },
            { name: "Weaving", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "add Celerity rating to defense against ranged (Requires 'Rapid Reflexes')", dicePool: "", level: 3, discipline: "celerity" },
        ],
    },
    dominate: {
        clans: ["Ventrue", "Malkavian", "Tremere", "Lasombra", "Tzimisce", "Salubri"],
        summary: "",
        logo: dominateLogo,
        powers: [
            { name: "Cloud Memory", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "make a person forget the past minute", dicePool: "Charisma + Dominate", level: 1, discipline: "dominate" },
            { name: "Compel", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "a single, short command with an immediate effect", dicePool: "Charisma + Dominate", level: 1, discipline: "dominate" },
            { name: "Mesmerize", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "allow issuing more complex commands", dicePool: "Manipulation + Dominate", level: 2, discipline: "dominate" },
            { name: "Domitor's Favor", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "make it harder for thralls to resist you", dicePool: "", level: 2, discipline: "dominate" },
            { name: "Slavish Devotion", description: "", rouseChecks: 0, amalgamPrerequisites: [{ discipline: "presence", level: 1 }], summary: "strengthen the mind of your dominated victims against interference from other kindred", dicePool: "", level: 2, discipline: "dominate" },
            // { name: "Dementation", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "obfuscate", level: 2 }], summary: "trigger psychotic breaks or nervous breakdowns in others", dicePool: "Manipulation + Dominate", level: 2, discipline: "dominate" },

            { name: "Forgetful Mind", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "Rewrite memories", dicePool: "Manipulation + Dominate", level: 3, discipline: "dominate" },
            { name: "Submerged Directive", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "When using Mesmerize you can give a command that stays dormant until triggered (requires Mesmerize)", dicePool: "", level: 3, discipline: "dominate" },
        ],
    },
    fortitude: {
        clans: ["Ventrue", "Gangrel", "Hecata", "Salubri"],
        summary: "",
        logo: fortitudeLogo,
        powers: [
            { name: "Resilience", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "add Fortitude rating to health track", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Unswayable Mind", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "add extra defense against mind-swaying", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Toughness", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "reduce Superficial physical damage sustained", dicePool: "", level: 2, discipline: "fortitude" },
            { name: "Valeren", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "auspex", level: 1 }], summary: "use your blood to heal other vampires", dicePool: "Intelligence + Fortitude", level: 2, discipline: "fortitude" },
            // { name: "Obdurate", description: "", rouseChecks: 0, amalgamPrerequisites: [{ discipline: "potence", level: 2 }], summary: "maintain steady footing even when struck by massive force", dicePool: "", level: 2, discipline: "fortitude" },

            { name: "Defy Bane", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "turn aggravated damage to superficial", dicePool: "", level: 3, discipline: "fortitude" },
            { name: "Fortify the Inner Facade", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "resist auspex and similar powers", dicePool: "", level: 3, discipline: "fortitude" },
            { name: "Seal the Beast's Maw", description: "", rouseChecks: 2, amalgamPrerequisites: [], summary: "ignore hunger for one scene", dicePool: "", level: 3, discipline: "fortitude" },
        ],
    },
    obfuscate: {
        clans: ["Nosferatu", "Malkavian", "Banu Haqim", "Ministry", "Ravnos"],
        summary: "",
        logo: obfuscateLogo,
        powers: [
            { name: "Cloak of Shadows", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "blend into surroundings while motionless", dicePool: "Wits + Obfuscate / Stealth", level: 1, discipline: "obfuscate" },
            { name: "Silence of Death", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "mute all sounds you make", dicePool: "", level: 1, discipline: "obfuscate" },
            { name: "Unseen Passage", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "move while remaining hidden", dicePool: "Wits + Obfuscate / Stealth", level: 2, discipline: "obfuscate" },
            { name: "Ghost's Passing", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "animalism", level: 1 }], summary: "extend your obfuscate powers to animals under your influence", dicePool: "Wits + Obfuscate", level: 2, discipline: "obfuscate" },
            // { name: "Ventriloquism", description: "", rouseChecks: 0, amalgamPrerequisites: [{ discipline: "auspex", level: 2 }], summary: "choose who can and cannot hear you when speaking", dicePool: "", level: 2, discipline: "obfuscate" },

            { name: "Ghost in the Machine", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "Obfuscate affects technology (eg. hide yourself from recordings)", dicePool: "", level: 3, discipline: "obfuscate" },
            { name: "Mask of a Thousand Faces", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "make yourself appear as a non-descript stranger to others", dicePool: "", level: 3, discipline: "obfuscate" },
            { name: "Mental Maze", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "dominate", level: 1 }], summary: "prevent someone from perceiving any exits or means of escape", dicePool: "Charisma + Obfuscate", level: 3, discipline: "obfuscate" },
        ],
    },
    potence: {
        clans: ["Nosferatu", "Brujah", "Lasombra"],
        summary: "",
        logo: potenceLogo,
        powers: [
            { name: "Lethal Body", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "cause serious physical damage to a mortals", dicePool: "", level: 1, discipline: "potence" },
            { name: "Soaring Leap", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "jump over long distance", dicePool: "", level: 1, discipline: "potence" },
            { name: "Prowess", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "add Potence rating to strength checks", dicePool: "", level: 2, discipline: "potence" },

            { name: "Brutal Feed", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "drain a person in seconds", dicePool: "", level: 3, discipline: "potence" },
            { name: "Uncanny Grip", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "grip and hold onto any surface, including walls and ceilings", dicePool: "", level: 3, discipline: "potence" },
            { name: "Wrecker", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "add double Potence rating to strength when destroying objects (requires 'Prowess')", dicePool: "", level: 3, discipline: "potence" },
        ],
    },
    presence: {
        clans: ["Toreador", "Brujah", "Ventrue", "Ministry", "Ravnos"],
        summary: "",
        logo: presenceLogo,
        powers: [
            { name: "Awe", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "become attractive and charismatic; add Presence rating to Persuasion and Performance checks", dicePool: "", level: 1, discipline: "presence" },
            { name: "Daunt", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "push people away and intimidate; add Presence rating to Intimidation checks", dicePool: "", level: 1, discipline: "presence" },
            { name: "Lingering Kiss", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "make mortals you feed from love you", dicePool: "", level: 2, discipline: "presence" },

            { name: "Dread Gaze", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "terrify an individual, causing them to submit, freeze, flee or terror-frenzy", dicePool: "Charisma + Presence", level: 3, discipline: "presence" },
            { name: "Entrancement", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "cause infatuation, making a target do almost anything to remain in your good graces", dicePool: "Charisma + Presence", level: 3, discipline: "presence" },
            { name: "Thrown Voice", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "auspex", level: 1 }], summary: "project your voice to anywhere you can see", dicePool: "", level: 3, discipline: "presence" },
        ],
    },
    protean: {
        clans: ["Gangrel", "Ministry", "Tzimisce"],
        summary: "",
        logo: proteanLogo,
        powers: [
            { name: "Eyes of the Beast", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "see in total darkness", dicePool: "", level: 1, discipline: "protean" },
            { name: "Weight of the Feather", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "become weightless", dicePool: "", level: 1, discipline: "protean" },
            { name: "Feral Weapons", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "grow deadly claws", dicePool: "", level: 2, discipline: "protean" },
            // { name: "Vicissitude", description: "", rouseChecks: 1, amalgamPrerequisites: [{ discipline: "dominate", level: 2 }], summary: "reshape your own skin, muscles and bone at will", dicePool: "Resolve + Protean", level: 2, discipline: "protean" },

            { name: "Earth Meld", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "meld into the soil", dicePool: "", level: 3, discipline: "protean" },
            { name: "Shapechange", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "turn into a human-sized animal", dicePool: "", level: 3, discipline: "protean" },
        ],
    },
    "blood sorcery": {
        clans: ["Tremere", "Banu Haqim"],
        summary: "",
        logo: bloodSorceryLogo,
        powers: [
            { name: "Corrosive Vitae", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "make your blood corrosive to dead substances", dicePool: "", level: 1, discipline: "blood sorcery" },
            { name: "A Taste for Blood", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "Discern traits about someone by tasting a drop of their blood", dicePool: "Resolve + Blood Sorcery", level: 1, discipline: "blood sorcery" },
            { name: "Shape of the Sanguine Sacrament", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "manipulate blood to show simple messages or shapes", dicePool: "Manipulation + Blood Sorcery", level: 1, discipline: "blood sorcery" },
            { name: "Extinguish Vitae", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "increase another vampire's hunger", dicePool: "Resolve + Blood Sorcery", level: 2, discipline: "blood sorcery" },
            { name: "Scour Secrets", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "locate particular information in text", dicePool: "Intelligence + Blood Sorcery", level: 2, discipline: "blood sorcery" },

            { name: "Blood of Potency", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "temporarily increase your Blood Potency", dicePool: "Resolve + Blood Sorcery", level: 3, discipline: "blood sorcery" },
            { name: "Scorpion's Touch", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "turn your blood into paralyzing poison", dicePool: "Strength + Blood Sorcery", level: 3, discipline: "blood sorcery" },
            { name: "Transitive Bond", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "your blood can retain Blood Bonding properties even when stored in an object or a ghoul", dicePool: "Intelligence + Blood Sorcery", level: 3, discipline: "blood sorcery" },
        ]
    },
    oblivion: {
        clans: ["Lasombra", "Hecata"],
        summary: "",
        logo: oblivionLogo,
        powers: [
            { name: "Shadow Cloak", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "manipulate shadows for stealth or intimidation", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Oblivion's Sight", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "see in darkness and see ghosts", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Ashes to Ashes", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "use your vitae to disintegrate non-vampire corpses", dicePool: "Stamina + Oblivion", level: 1, discipline: "oblivion" },
            { name: "The Binding Fetter", description: "", rouseChecks: 0, amalgamPrerequisites: [], summary: "identify objects and locations that are connected to ghosts", dicePool: "", level: 1, discipline: "oblivion" },
            { name: "Shadow Cast", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "summon a supernatural shadow you control", dicePool: "", level: 2, discipline: "oblivion" },
            { name: "Where the Shroud Thins", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "find places where ghosts can cross between worlds", dicePool: "Wits + Oblivion", level: 2, discipline: "oblivion" },
            // { name: "Arms of Ahriman", description: "", rouseChecks: 0, amalgamPrerequisites: [{ discipline: "potence", level: 2 }], summary: "xxx", dicePool: "", level: 2, discipline: "oblivion" },
            // { name: "Fatal Precognition", description: "", rouseChecks: 0, amalgamPrerequisites: [{ discipline: "auspex", level: 2 }], summary: "xxx", dicePool: "", level: 2, discipline: "oblivion" },

            { name: "Aura of Decay", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "decay everything around", dicePool: "Stamina + Oblivion", level: 3, discipline: "oblivion" },
            { name: "Shadow Perspective", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "project senses through shadows", dicePool: "", level: 3, discipline: "oblivion" },
            { name: "Touch of Oblivion", description: "", rouseChecks: 1, amalgamPrerequisites: [], summary: "decay a living or unliving body", dicePool: "", level: 3, discipline: "oblivion" },
        ]
    },

    "": {
        clans: [],
        summary: "",
        logo: "",
        powers: []
    },
}