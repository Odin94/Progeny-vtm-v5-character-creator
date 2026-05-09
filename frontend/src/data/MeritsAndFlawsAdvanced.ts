import type { MeritsAndFlaws } from "./MeritsAndFlaws"

export const advancedMeritsAndFlaws: MeritsAndFlaws[] = [
    {
        title: "Haven",
        complexity: "advanced",
        merits: [
            {
                name: "Business Establishment",
                cost: [2, 3],
                summary: "your haven contains a money-making business with useful local access",
                excludes: ["No Haven"]
            },
            {
                name: "Furcus",
                cost: [1, 2, 3],
                summary: "mystic crossing in your haven aids rituals or ceremonies performed there",
                excludes: ["No Haven"]
            },
            {
                name: "Laboratory",
                cost: [1, 2, 3],
                summary: "equipped haven lab for Science, Technology, or alchemy work",
                excludes: ["No Haven"]
            },
            {
                name: "Library",
                cost: [1, 2, 3],
                summary: "research collection tied to one scholarly specialty per dot",
                excludes: ["No Haven"]
            },
            {
                name: "Location",
                cost: [1],
                summary: "prime haven spot that helps nearby hunting, politics, or security",
                excludes: ["No Haven"]
            },
            {
                name: "Machine Shop",
                cost: [1, 2, 3],
                summary: "tools and machinery for building, repairing, or dismantling equipment",
                excludes: ["No Haven"]
            },
            {
                name: "Postern",
                cost: [1, 2, 3],
                summary: "hidden exit or escape route from your haven",
                excludes: ["No Haven"]
            },
            {
                name: "Security System",
                cost: [1, 2, 3],
                summary: "better alarms and defenses against unwanted entry",
                excludes: ["No Haven"]
            },
            {
                name: "Surgery",
                cost: [1],
                summary: "medical room that helps Medicine tests in your haven",
                excludes: ["No Haven"]
            },
            {
                name: "Warding",
                cost: [1, 2, 3],
                summary: "mystic protection against scrying or supernatural intrusion",
                excludes: ["No Haven"]
            }
        ],
        flaws: [
            {
                name: "Shared",
                cost: [1, 2],
                summary: "other Kindred have access to or authority over your haven",
                excludes: ["No Haven"]
            }
        ]
    },
    {
        title: "Looks",
        complexity: "advanced",
        merits: [
            {
                name: "Famous Face",
                cost: [1],
                summary: "look like a celebrity; helps socially but makes you memorable",
                excludes: []
            },
            {
                name: "Ingénue",
                cost: [1],
                summary: "look innocent, adding dice to deflect blame or suspicion",
                excludes: []
            },
            {
                name: "Remarkable Feature",
                cost: [1],
                summary: "striking feature helps first impressions but hinders disguises",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Stench",
                cost: [1],
                summary: "foul odor hurts seduction and hiding from those who can smell",
                excludes: []
            },
            {
                name: "Transparent",
                cost: [1],
                summary: "bad liar; lose dice with Subterfuge and cannot improve it",
                excludes: []
            }
        ]
    },
    {
        title: "Feeding",
        complexity: "advanced",
        merits: [
            {
                name: "Vessel Recognition",
                cost: [1],
                summary: "smell whether a mortal has recently been fed on",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Vegan",
                cost: [2],
                summary: "feed only from animals; human blood costs Willpower",
                excludes: ["Farmer"]
            },
            {
                name: "Vein Tapper",
                cost: [1],
                summary: "cannot feed from mortals while being observed",
                excludes: []
            }
        ]
    },
    {
        title: "Mythic",
        complexity: "advanced",
        merits: [
            {
                name: "Luck of the Devil",
                cost: [4],
                summary: "once per session, shift a misfortune onto someone nearby",
                excludes: []
            },
            {
                name: "Nuit Mode",
                cost: [2],
                summary: "at low Blood Potency, keep chosen body modifications after rest",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Starving Decay",
                cost: [2],
                summary: "at Hunger 3+, decay harms physical and mortal social tests",
                excludes: []
            },
            {
                name: "Twice-Cursed",
                cost: [2],
                summary: "suffer your clan's variant Bane in addition to its normal Bane",
                excludes: []
            }
        ]
    },
    {
        title: "Resources",
        complexity: "advanced",
        merits: [
            {
                name: "Side Hustler",
                cost: [2],
                summary: "once per session, pull a small item, lead, or access from your network",
                excludes: []
            }
        ],
        flaws: []
    },
    {
        title: "Bonding",
        complexity: "advanced",
        merits: [
            {
                name: "Bond Resistance",
                cost: [1, 2, 3],
                summary: "add dice to resist blood bonds",
                excludes: ["Bondslave"]
            },
            {
                name: "Short Bond",
                cost: [2],
                summary: "blood bonds on you fade faster than normal",
                excludes: ["Long Bond"]
            },
            {
                name: "Unbondable",
                cost: [5],
                summary: "you cannot be blood bound",
                excludes: ["Bondslave", "Bond Junkie", "Long Bond"]
            }
        ],
        flaws: []
    },
    {
        title: "Influence",
        complexity: "advanced",
        merits: [
            {
                name: "Influence",
                cost: [1, 2, 3, 4, 5],
                summary: "pull in a mortal group, institution, or city region",
                excludes: ["Disliked", "Despised"]
            },
            {
                name: "City Secrets",
                cost: [1],
                summary: "hold a dangerous local secret that can protect or leverage you",
                excludes: []
            },
            {
                name: "Untouchable",
                cost: [5],
                summary: "once per story, avoid official punishment for a severe offense",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Disliked",
                cost: [1],
                summary: "lose a die socially with most local groups",
                excludes: ["Influence", "Despised"]
            },
            {
                name: "Despised",
                cost: [2],
                summary: "a local group or region actively works against you",
                excludes: ["Influence", "Disliked"]
            }
        ]
    },
    {
        title: "Boons and Debts",
        complexity: "advanced",
        merits: [
            {
                name: "Minor Boon",
                cost: [1, 2, 3],
                summary: "a tracked favor owed by another vampire, scaled by their status",
                excludes: []
            },
            {
                name: "Major Boon",
                cost: [2, 3, 4],
                summary: "a serious favor owed by another vampire, scaled by their status",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Minor Debt",
                cost: [1, 2],
                summary: "you owe a smaller boon to another vampire",
                excludes: []
            },
            {
                name: "Major Debt",
                cost: [1, 2, 3],
                summary: "you owe a dangerous favor to another vampire",
                excludes: []
            },
            {
                name: "Life Debt",
                cost: [2, 3],
                summary: "you owe an overwhelming debt to another vampire",
                excludes: []
            }
        ]
    },
    {
        title: "Mental",
        complexity: "advanced",
        merits: [
            {
                name: "Tempered Will",
                cost: [3],
                summary: "sense Dominate or Presence and resist them better once per session",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Weak-Willed",
                cost: [2],
                summary: "struggle to resist a leader's influence and cannot actively resist mental sway",
                excludes: []
            }
        ]
    },
    {
        title: "Other",
        complexity: "advanced",
        merits: [],
        flaws: [
            {
                name: "Knowledge Hungry",
                cost: [1],
                summary: "must resist pursuing study of a chosen subject when new sources appear",
                excludes: []
            },
            {
                name: "Prestation Debts",
                cost: [1],
                summary: "owe two minor boons to a more influential Kindred",
                excludes: []
            },
            {
                name: "Risk-Taker",
                cost: [1],
                summary: "new risky temptations distract you until indulged or the scene ends",
                excludes: []
            }
        ]
    }
]
