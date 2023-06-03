import { z } from "zod";
import { disciplineNameSchema } from "./Disciplines";
import { specialtySchema } from "./Specialties";


export const predatorTypeNameSchema = z.union([
    z.literal("Alleycat"),
    z.literal("Extortionist"),
    z.literal("Roadside Killer"),
    z.literal("Cleaver"),
    z.literal("Consensualist"),
    z.literal("Osiris"),
    z.literal("Scene Queen"),
    z.literal("Siren"),
    z.literal("Sandman"),
    z.literal("Graverobber"),
    z.literal("Bagger"),
    z.literal("Blood Leech"),
    z.literal("Farmer"),
    z.literal(""),
])
export type PredatorTypeName = z.infer<typeof predatorTypeNameSchema>


export const predatorTypeSchema = z.object({
    name: z.string(),
    summary: z.string(),
    specialtyOptions: specialtySchema.array(),
    disciplineOptions: z.object({ name: disciplineNameSchema }).array(),
    meritsAndFlaws: z.object({ name: z.string(), level: z.number().int(), summary: z.string() }).array(),
    humanityChange: z.number().int(),
    bloodPotencyChange: z.number().int(),
})
export type PredatorType = z.infer<typeof predatorTypeSchema>


export const PredatorTypes: Record<PredatorTypeName, PredatorType> = {
    Alleycat: {
        name: "Alleycat",
        summary: "Ambush prey in alleys",
        specialtyOptions: [{
            skill: "intimidation",
            name: "Stickups",
        },
        {
            skill: "brawl",
            name: "Grappling",
        }],
        disciplineOptions: [{ name: "celerity" }, { name: "potence" }],
        meritsAndFlaws: [{ name: "Criminal Contacts", level: 3, summary: "" }],
        humanityChange: -1,
        bloodPotencyChange: 0,
    },
    Extortionist: {
        name: "Extortionist",
        summary: "Strong-arm prey into giving you their blood",
        specialtyOptions: [{
            skill: "intimidation",
            name: "Coercion",
        },
        {
            skill: "larceny",
            name: "Security",
        }],
        disciplineOptions: [{ name: "dominate" }, { name: "potence" }],
        meritsAndFlaws: [{ name: "Spend between Contacts and Resources", level: 3, summary: "" }, { name: "Enemy (Police or Victim)", level: 2, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    "Roadside Killer": {
        name: "Roadside Killer",
        summary: "Hunt prey on desolate roads",
        specialtyOptions: [{
            skill: "survival",
            name: "The Road",
        },
        {
            skill: "investigation",
            name: "Vampire can't",
        }],
        disciplineOptions: [{ name: "fortitude" }, { name: "protean" }],
        meritsAndFlaws: [{ name: "Migrating Herd", level: 2, summary: "" }, { name: "Prey Exclusion (Locals)", level: 1, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Cleaver: {
        name: "Cleaver",
        summary: "Feed on friends and family",
        specialtyOptions: [{
            skill: "persuasion",
            name: "Gaslighting",
        },
        {
            skill: "subterfuge",
            name: "Coverups",
        }],
        disciplineOptions: [{ name: "dominate" }, { name: "animalism" }],
        meritsAndFlaws: [{ name: "Herd", level: 2, summary: "" }, { name: "Cleaver", level: 1, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Consensualist: {
        name: "Consensualist",
        summary: "Take blood only from the willing",
        specialtyOptions: [{
            skill: "medicine",
            name: "Phlebotomy",
        },
        {
            skill: "persuasion",
            name: "Vessels",
        }],
        disciplineOptions: [{ name: "auspex" }, { name: "fortitude" }],
        meritsAndFlaws: [{ name: "Masquerade Breacher", level: 1, summary: "" }, { name: "Prey Exclusion (Non-Consenting)", level: 1, summary: "" }],
        humanityChange: 1,
        bloodPotencyChange: 0,
    },
    Osiris: {
        name: "Osiris",
        summary: "Feed on your followers",
        specialtyOptions: [{
            skill: "occult",
            name: "pick tradition",
        },
        {
            skill: "performance",
            name: "[pick any]",
        }],
        disciplineOptions: [{ name: "blood sorcery" }, { name: "presence" }],
        meritsAndFlaws: [{ name: "Spend these between Fame and Herd", level: 3, summary: "" }, { name: "Spend these between Enemies and Mythic Flaws", level: 2, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    "Scene Queen": {
        name: "Scene Queen",
        summary: "Feed in your scene",
        specialtyOptions: [{
            skill: "etiquette",
            name: "Specific Scene",
        },
        {
            skill: "leadership",
            name: "Specific Scene",
        }, {
            skill: "streetwise",
            name: "Specific Scene",
        },],
        disciplineOptions: [{ name: "dominate" }, { name: "potence" }],
        meritsAndFlaws: [{ name: "Fame", level: 1, summary: "" }, { name: "Contact", level: 1, summary: "" }, { name: "[pick one:] Disliked / Prey Exclusion (another scene)", level: 1, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Siren: {
        name: "Siren",
        summary: "Seduce prey and take their blood",
        specialtyOptions: [{
            skill: "persuasion",
            name: "Seduction",
        },
        {
            skill: "subterfuge",
            name: "Seduction",
        }],
        disciplineOptions: [{ name: "fortitude" }, { name: "presence" }],
        meritsAndFlaws: [{ name: "Beautiful", level: 2, summary: "" }, { name: "Enemy (spurned lover or jealous partner)", level: 1, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Sandman: {
        name: "Sandman",
        summary: "Break into homes and feed on sleeping prey",
        specialtyOptions: [{
            skill: "medicine",
            name: "Anesthetics",
        },
        {
            skill: "stealth",
            name: "Break-ins",
        }],
        disciplineOptions: [{ name: "auspex" }, { name: "obfuscate" }],
        meritsAndFlaws: [{ name: "Resources", level: 1, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Graverobber: {
        name: "Graverobber",
        summary: "Feed on fresh corpses and mourning families",
        specialtyOptions: [{
            skill: "occult",
            name: "Grave rituals",
        },
        {
            skill: "medicine",
            name: "Cadavers",
        }],
        disciplineOptions: [{ name: "fortitude" }, { name: "oblivion" }],
        meritsAndFlaws: [{ name: "Iron Gullet", level: 3, summary: "" }, { name: "Haven", level: 1, summary: "" }, { name: "Obvious Predator", level: 2, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Bagger: {
        name: "Bagger",
        summary: "Feed on blood bags",
        specialtyOptions: [{
            skill: "larceny",
            name: "Lockpicking",
        },
        {
            skill: "streetwise",
            name: "Black market",
        }],
        disciplineOptions: [{ name: "obfuscate" }, { name: "oblivion" }, { name: "blood sorcery" }],
        meritsAndFlaws: [{ name: "Iron Gullet", level: 3, summary: "" }, { name: "Enemy", level: 2, summary: "" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    "Blood Leech": {
        name: "Blood Leech",
        summary: "Feed on other vampires",
        specialtyOptions: [{
            skill: "brawl",
            name: "Kindred",
        },
        {
            skill: "stealth",
            name: "Against Kindred",
        }],
        disciplineOptions: [{ name: "celerity" }, { name: "protean" }],
        meritsAndFlaws: [{ name: "[pick one:] Diablerist / Shunned", level: 3, summary: "" }],
        humanityChange: -1,
        bloodPotencyChange: 1,
    },
    Farmer: {
        name: "Farmer",
        summary: "Feed on animals",
        specialtyOptions: [{
            skill: "animal ken",
            name: "pick animal",
        },
        {
            skill: "survival",
            name: "Hunting",
        }],
        disciplineOptions: [{ name: "animalism" }, { name: "protean" }],
        meritsAndFlaws: [{ name: "Feeding: Farmer", level: 2, summary: "" }],
        humanityChange: 1,
        bloodPotencyChange: 0,
    },
    "": {
        name: "",
        summary: "",
        specialtyOptions: [],
        disciplineOptions: [],
        meritsAndFlaws: [],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
}