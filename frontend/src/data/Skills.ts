import { skillsSchema, skillsKeySchema, type Skills, type SkillsKey } from "@progeny/shared"

// Re-export from shared for backwards compatibility
export { skillsSchema, skillsKeySchema, type Skills, type SkillsKey }

export const allSkills: SkillsKey[] = [
    "athletics",
    "brawl",
    "craft",
    "drive",
    "firearms",
    "melee",
    "larceny",
    "stealth",
    "survival",

    "animal ken",
    "etiquette",
    "insight",
    "intimidation",
    "leadership",
    "performance",
    "persuasion",
    "streetwise",
    "subterfuge",

    "academics",
    "awareness",
    "finance",
    "investigation",
    "medicine",
    "occult",
    "politics",
    "science",
    "technology",
]

export const emptySkills: Skills = {
    athletics: 0,
    brawl: 0,
    craft: 0,
    drive: 0,
    firearms: 0,
    melee: 0,
    larceny: 0,
    stealth: 0,
    survival: 0,

    "animal ken": 0,
    etiquette: 0,
    insight: 0,
    intimidation: 0,
    leadership: 0,
    performance: 0,
    persuasion: 0,
    streetwise: 0,
    subterfuge: 0,

    academics: 0,
    awareness: 0,
    finance: 0,
    investigation: 0,
    medicine: 0,
    occult: 0,
    politics: 0,
    science: 0,
    technology: 0,
}

// Page 152
export const skillsDescriptions: Record<SkillsKey, string> = {
    athletics: "Running, jumping and climbing",
    brawl: "Unarmed combat",
    craft: "Crafting, building, repairing",
    drive: "Operating vehicles (not needed for basic driving)",
    firearms: "Using ranged weapons",
    melee: "Armed melee combat",
    larceny: "Breaking into places and securing your home against the same",
    stealth: "Not being seen, heard or recognized",
    survival: "Handle adverse surroundings",

    academics: "Book-smarts and humanities",
    awareness: "Sharp senses and awareness of your surroundings",
    finance: "Making & handling money",
    investigation: "Researching, finding and following clues",
    medicine: "Healing and diagnosing",
    occult: "Affinity for secret lore",
    politics: "Handling government",
    science: "Knowledge of the physical world",
    technology: "Understand modern technology, computers, the internet",

    "animal ken": "Interacting with animals",
    etiquette: "Following social conventions",
    insight: "Sense emotions and motives",
    intimidation: "Get someone to back down",
    leadership: "Inspiring others",
    performance: "Performing art for an audience",
    persuasion: "Convincing others",
    streetwise: "Understanding criminal and urban society",
    subterfuge: "Trick others",
}
