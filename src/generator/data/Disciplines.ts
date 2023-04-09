import { z } from "zod";
import { clanSchema } from "./Clans";

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
])
export type DisciplineName = z.infer<typeof disciplineNameSchema>


export const powerSchema = z.object({
    name: z.string(),
    description: z.string(),
    summary: z.string(),
    dicePool: z.string(),
    level: z.number().min(1).int(),
    discipline: disciplineNameSchema,
})
export type Power = z.infer<typeof powerSchema>


export const disciplineSchema = z.object({
    clans: clanSchema.array(),
    summary: z.string(),
    powers: powerSchema.array(),
})
export type Discipline = z.infer<typeof disciplineSchema>


export const disciplines: Record<DisciplineName, Discipline> = {
    animalism: {
        clans: ["Nosferatu", "Gangrel"],
        summary: "",
        powers: [
            { name: "Bond Famulus", description: "", summary: "bond an animal companion", dicePool: "", level: 1, discipline: "animalism" },
            { name: "Sense the Beast", description: "", summary: "sense hostility and supernatural traits", dicePool: "", level: 1, discipline: "animalism" },
            { name: "Feral Whispers", description: "", summary: "communicate with animals", dicePool: "", level: 2, discipline: "animalism" },
        ],
    },
    auspex: {
        clans: ["Toreador", "Tremere", "Malkavian"],
        summary: "",
        powers: [
            { name: "Heightened Senses", description: "", summary: "add Auspex rating to perception rolls", dicePool: "", level: 1, discipline: "auspex" },
            { name: "Sense the Unseen", description: "", summary: "sense supernatural activity", dicePool: "", level: 1, discipline: "auspex" },
            { name: "Premonition", description: "", summary: "gain visions of the future", dicePool: "", level: 2, discipline: "auspex" },
        ],
    },
    celerity: {
        clans: ["Toreador", "Brujah"],
        summary: "",
        powers: [
            { name: "Cat's Grace", description: "", summary: "automatically pass balance tests", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Rapid Reflexes", description: "", summary: "faster reactions & free minor actions", dicePool: "", level: 1, discipline: "celerity" },
            { name: "Fleetness", description: "", summary: "add Celerity rating for defense and Dexterity rolls", dicePool: "", level: 2, discipline: "celerity" },
        ],
    },
    dominate: {
        clans: ["Ventrue", "Malkavian", "Tremere"],
        summary: "",
        powers: [
            { name: "Cloud Memory", description: "", summary: "make a person forget the past minute", dicePool: "", level: 1, discipline: "dominate" },
            { name: "Compel", description: "", summary: "a single, short command with an immediate effect", dicePool: "", level: 1, discipline: "dominate" },
            { name: "Mesmerize", description: "", summary: "allow issuing more complex commands", dicePool: "", level: 2, discipline: "dominate" },
        ],
    },
    fortitude: {
        clans: ["Ventrue", "Gangrel"],
        summary: "",
        powers: [
            { name: "Resilience", description: "", summary: "add Fortitude rating to health track", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Unswayable Mind", description: "", summary: "add extra defense against mind-swaying", dicePool: "", level: 1, discipline: "fortitude" },
            { name: "Toughness", description: "", summary: "reduce Superficial physical damage sustained", dicePool: "", level: 2, discipline: "fortitude" },
        ],
    },
    obfuscate: {
        clans: ["Nosferatu", "Malkavian"],
        summary: "",
        powers: [
            { name: "Cloak of Shadows", description: "", summary: "blend into surroundings while motionless", dicePool: "", level: 1, discipline: "obfuscate" },
            { name: "Silence of Death", description: "", summary: "mute all sounds you make", dicePool: "", level: 1, discipline: "obfuscate" },
            { name: "Unseen Passage", description: "", summary: "move while remaining hidden", dicePool: "", level: 2, discipline: "obfuscate" },
        ],
    },
    potence: {
        clans: ["Nosferatu", "Brujah"],
        summary: "",
        powers: [
            { name: "Lethal Body", description: "", summary: "cause serious physical damage to a mortals", dicePool: "", level: 1, discipline: "potence" },
            { name: "Soaring Leap", description: "", summary: "jump over long distance", dicePool: "", level: 1, discipline: "potence" },
            { name: "Prowess", description: "", summary: "add Potence rating to strength", dicePool: "", level: 2, discipline: "potence" },
        ],
    },
    presence: {
        clans: ["Toreador", "Brujah", "Ventrue"],
        summary: "",
        powers: [
            { name: "Awe", description: "", summary: "become attractive and charismatic", dicePool: "", level: 1, discipline: "presence" },
            { name: "Daunt", description: "", summary: "push people away and intimidate", dicePool: "", level: 1, discipline: "presence" },
            { name: "Lingering Kiss", description: "", summary: "make mortals you feed from love you", dicePool: "", level: 2, discipline: "presence" },
        ],
    },
    protean: {
        clans: ["Gangrel"],
        summary: "",
        powers: [
            { name: "Eyes of the Beast", description: "", summary: "see in total darkness", dicePool: "", level: 1, discipline: "protean" },
            { name: "Weight of the Feather", description: "", summary: "become weightless", dicePool: "", level: 1, discipline: "protean" },
            { name: "Feral Weapons", description: "", summary: "grow deadly claws", dicePool: "", level: 2, discipline: "protean" },
        ],
    },
}