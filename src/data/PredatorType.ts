import { z } from "zod";
import { disciplineNameSchema } from "./Disciplines";
import { specialtySchema } from "./Specialties";


export const predatorTypeNameSchema = z.union([
    z.literal("Alleycat"),
    z.literal("Extortionist"),
    z.literal("Roadside Killer"),
    z.literal("Montero"),
    z.literal("Cleaver"),
    z.literal("Consensualist"),
    z.literal("Osiris"),
    z.literal("Scene Queen"),
    z.literal("Siren"),
    z.literal("Sandman"),
    z.literal("Grim Reaper"),
    z.literal("Graverobber"),
    z.literal("Pursuer"),
    z.literal("Trapdoor"),
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
        meritsAndFlaws: [{ name: "Spend between Contacts and Resources", level: 3, summary: "" }, { name: "Enemy", level: 2, summary: "(Police or Victim)" }],
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
            name: "Vampire Cant",
        }],
        disciplineOptions: [{ name: "fortitude" }, { name: "protean" }],
        meritsAndFlaws: [{ name: "Herd", level: 2, summary: "Migrating herd, always on the road" }, { name: "Prey Exclusion", level: 1, summary: "Can't feed on locals" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    Montero: {
        name: "Montero",
        summary: "Use your retainers to herd prey into your maw for the kill",
        specialtyOptions: [{
            skill: "leadership",
            name: "Hunting Pack",
        },
        {
            skill: "stealth",
            name: "Stakeout",
        }],
        disciplineOptions: [{ name: "dominate" }, { name: "obfuscate" }],
        meritsAndFlaws: [{ name: "Retainers", level: 2, summary: "Mortals that help you hunt" }],
        humanityChange: -1,
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
        meritsAndFlaws: [{ name: "Herd", level: 2, summary: "Group of mortals who let you feed" }, { name: "Dark Secret", level: 1, summary: "Cleaver" }],
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
        meritsAndFlaws: [{ name: "Masquerade Breacher", level: 1, summary: "" }, { name: "Prey Exclusion", level: 1, summary: "Can't feed on the non-consenting" }],
        humanityChange: 1,
        bloodPotencyChange: 0,
    },
    Osiris: {
        name: "Osiris",
        summary: "Feed on your followers",
        specialtyOptions: [{
            skill: "occult",
            name: "[pick tradition]",
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
        summary: "Feed in your scene / subculture",
        specialtyOptions: [{
            skill: "etiquette",
            name: "[Specific Scene]",
        },
        {
            skill: "leadership",
            name: "[Specific Scene]",
        }, {
            skill: "streetwise",
            name: "[Specific Scene]",
        },],
        disciplineOptions: [{ name: "dominate" }, { name: "potence" }],
        meritsAndFlaws: [{ name: "Fame", level: 1, summary: "a select subculture loves you" }, { name: "Contact", level: 1, summary: "" }, { name: "[pick one:] Disliked / Prey Exclusion (another scene)", level: 1, summary: "" }],
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
        meritsAndFlaws: [{ name: "Beautiful", level: 2, summary: "+1 die in Social rolls" }, { name: "Enemy", level: 1, summary: "(spurned lover or jealous partner)" }],
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
        meritsAndFlaws: [{ name: "Iron Gullet", level: 3, summary: "able to feed on rancid blood" }, { name: "Haven", level: 1, summary: "" }, { name: "Obvious Predator", level: 2, summary: "mortals are scared of you, can't keep Herd" }],
        humanityChange: 0,
        bloodPotencyChange: 0,
    },
    "Grim Reaper": {
        name: "Grim Reaper",
        summary: "Feed exclusively on the dying",
        specialtyOptions: [{
            skill: "awareness",
            name: "Death",
        },
        {
            skill: "larceny",
            name: "Forgery",
        }],
        disciplineOptions: [{ name: "auspex" }, { name: "oblivion" }],
        meritsAndFlaws: [{ name: "Allies", level: 1, summary: "medical community" }, { name: "Prey Exclusion", level: 1, summary: "Can't feed on the healthy" }],
        humanityChange: 1,
        bloodPotencyChange: 0,
    },
    Pursuer: {
        name: "Pursuer",
        summary: "Stalk your prey for extended time before indulging in the kill",
        specialtyOptions: [{
            skill: "investigation",
            name: "Profiling",
        },
        {
            skill: "stealth",
            name: "Shadowing",
        }],
        disciplineOptions: [{ name: "animalism" }, { name: "auspex" }],
        meritsAndFlaws: [{ name: "Bloodhound", level: 1, summary: "smell resonance in mortal blood" }, { name: "Contacts", level: 1, summary: "Unethical person in your hunting habitués" }],
        humanityChange: -1,
        bloodPotencyChange: 0,
    },
    Trapdoor: {
        name: "Trapdoor",
        summary: "Build a trap in your haven and lure prey into it",
        specialtyOptions: [{
            skill: "persuasion",
            name: "Marketing",
        },
        {
            skill: "stealth",
            name: "Ambushes and traps",
        }],
        disciplineOptions: [{ name: "protean" }, { name: "obfuscate" }],
        meritsAndFlaws: [{ name: "Haven", level: 1, summary: "smell resonance in mortal blood" }, { name: "[Pick one:] Retainer / Herd / +1 Haven]", level: 1, summary: "" }, { name: "[Pick one:] Creepy / Haunted]", level: 1, summary: "" }],
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
        meritsAndFlaws: [{ name: "Iron Gullet", level: 3, summary: "able to feed on rancid blood" }, { name: "Enemy", level: 2, summary: "Someone believes you owe them" }],
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
        meritsAndFlaws: [{ name: "[Pick one:] Diablerist / Shunned", level: 3, summary: "" }],
        humanityChange: -1,
        bloodPotencyChange: 1,
    },
    Farmer: {
        name: "Farmer",
        summary: "Feed on animals",
        specialtyOptions: [{
            skill: "animal ken",
            name: "[pick animal]",
        },
        {
            skill: "survival",
            name: "Hunting",
        }],
        disciplineOptions: [{ name: "animalism" }, { name: "protean" }],
        meritsAndFlaws: [{ name: "Farmer", level: 2, summary: "feeding on non-animal blood costs you 2 willpower" }],
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