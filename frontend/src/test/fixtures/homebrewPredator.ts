import type { HomebrewCollection, HomebrewPredatorType } from "~/data/Homebrew"
export const customPredator: HomebrewPredatorType & { id: string } = {
    id: "night-stalker",
    kind: "predatorType",
    name: "Night Stalker",
    summary: "Follow the city's midnight wanderers.",
    description: "Hunt by listening for secrets in the night.",
    specialtyOptions: [
        { skill: "stealth", name: "Stalking" },
        { skill: "investigation", name: "Patterns", customInput: "Which patterns?" }
    ],
    disciplineOptions: [
        { type: "official", name: "auspex" },
        { type: "homebrew", itemId: "noctis", name: "Noctis" }
    ],
    skillBonuses: [{ skill: "stealth", dots: 2 }],
    humanityChange: -1,
    bloodPotencyChange: 1,
    meritsAndFlaws: [
        {
            name: "Night Contacts",
            summary: "Watchers in the city",
            type: "merit",
            level: 2,
            excludes: ["Isolated"]
        },
        { name: "Marked", summary: "Your prey remembers you", type: "flaw", level: 1, excludes: [] }
    ],
    selectableMeritsAndFlaws: [
        {
            totalPoints: 1,
            exclusive: true,
            options: [
                {
                    name: "Haven",
                    summary: "A quiet refuge",
                    type: "merit",
                    maxLevel: 1,
                    excludes: ["No Haven"]
                },
                {
                    name: "Resources",
                    summary: "Funds for the hunt",
                    type: "merit",
                    maxLevel: 1,
                    excludes: []
                }
            ]
        }
    ]
}
export const predatorCollection: HomebrewCollection = {
    id: "night-arts",
    name: "Night Arts",
    shortDescription: "Custom feeding styles",
    description: "",
    tags: [],
    contentWarning: "",
    sourceLibraryEntryId: null,
    sourcePublicationId: null,
    rootSourceLibraryEntryId: null,
    createdAt: "2026-11-08T10:00:00Z",
    updatedAt: "2026-11-08T10:00:00Z",
    enabledForAccount: true,
    items: [
        customPredator,
        {
            id: "noctis",
            kind: "discipline",
            name: "Noctis",
            summary: "Shape the night",
            description: "",
            logo: ""
        },
        {
            id: "night-sight",
            kind: "power",
            name: "Night Sight",
            summary: "See in complete darkness",
            description: "",
            discipline: "Noctis",
            disciplineRef: { type: "homebrew", itemId: "noctis", name: "Noctis" },
            level: 1,
            dicePool: "",
            rouseChecks: 0,
            amalgamPrerequisites: []
        },
        {
            id: "echoes",
            kind: "power",
            name: "Midnight Echoes",
            summary: "Listen through the night",
            description: "",
            discipline: "auspex",
            disciplineRef: { type: "official", name: "auspex" },
            level: 1,
            dicePool: "",
            rouseChecks: 0,
            amalgamPrerequisites: []
        }
    ]
}
