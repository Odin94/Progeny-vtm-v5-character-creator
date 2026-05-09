import { Ritual } from "./Disciplines"

export const Rituals: Ritual[] = [
    {
        name: "Blood Walk",
        summary:
            "Use blood to learn about a subjects generation, name, sire and - on a crit - any active Blood Bonds.",
        rouseChecks: 1,
        requiredTime: "1 hour",
        dicePool: "Intelligence + Blood Sorcery",
        ingredients: "Blood of the subject",
        level: 1
    },
    {
        name: "Clinging of the Insect",
        summary:
            "Drink blood mixed with a freshly crushed spider to cling to walls like an insect.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: "Intelligence + Blood Sorcery",
        ingredients: "Living spider, your own blood",
        level: 1
    },
    {
        name: "Craft Bloodstone",
        summary:
            "Slowly soak blood into a small magnet. Once done, you sense the direction and rough distance of the stone for a week.",
        rouseChecks: 1,
        requiredTime: "3 nights",
        dicePool: "Intelligence + Blood Sorcery",
        ingredients: "Small magnet, your blood",
        level: 1
    },
    {
        name: "Wake with Evenings Freshness",
        summary:
            "When threatened during the day after performing this ritual, awaken and ignore daytime penalties for a scene.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: "Intelligence + Blood Sorcery",
        ingredients: "Burnt bones of a rooster",
        level: 1
    },
    {
        name: "Ward against Ghouls",
        summary:
            "Place a ward on a small object. When a ghoul tries to touch it, roll your Ritual roll. If you succeed, the Ghoul cannot touch it and is damaged.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: "Intelligence + Blood Sorcery",
        ingredients: "asd",
        level: 1
    }
]
