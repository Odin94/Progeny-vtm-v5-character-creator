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
            },
            {
                name: "Mobile",
                cost: [1, 2, 3],
                summary: "your haven is a vehicle, from a small sunproof ride to a large transport",
                excludes: ["No Haven"]
            },
            {
                name: "Armored",
                cost: [1],
                summary: "reinforced mobile haven resists damage and protects passengers better",
                excludes: ["No Haven"]
            },
            {
                name: "Smugglers Stash",
                cost: [1, 2],
                summary: "hidden compartment in a mobile haven for cargo or daysleep",
                excludes: ["No Haven"]
            },
            {
                name: "Spare Plates",
                cost: [2],
                summary: "swap mobile haven identifiers quickly to evade most ordinary searches",
                excludes: ["No Haven"]
            },
            {
                name: "Holy Ground",
                cost: [1],
                summary: "cult-significant haven site can call defenders once per story",
                excludes: ["No Haven"]
            },
            {
                name: "Shrine",
                cost: [1, 2, 3],
                summary: "haven shrine helps gather or prepare ritual and ceremony ingredients",
                excludes: ["No Haven"]
            }
        ],
        flaws: [
            {
                name: "Shared",
                cost: [1, 2],
                summary: "other Kindred have access to or authority over your haven",
                excludes: ["No Haven"]
            },
            {
                name: "On the Rails",
                cost: [1],
                summary:
                    "mobile haven follows fixed routes or destinations outside your full control",
                excludes: ["No Haven"]
            },
            {
                name: "Temperamental",
                cost: [1],
                summary: "mobile haven breaks down at the worst time after failed Drive tests",
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
            },
            {
                name: "Semblance of the Methuselah",
                cost: [1, 2],
                summary:
                    "resemble an ancient ancestor, helping with those who respect or fear them",
                excludes: []
            },
            {
                name: "Scene Kid",
                cost: [1],
                summary: "embody a subculture's style, helping social rolls with those in the know",
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
            },
            {
                name: "Drive-thru",
                cost: [1],
                summary: "once per session, raise hunt Difficulty to finish feeding within minutes",
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
            },
            {
                name: "Resonance Sensitivity",
                cost: [1],
                summary:
                    "one intense resonance triggers a lingering custom Compulsion after feeding",
                excludes: []
            },
            {
                name: "Resonance Mimic",
                cost: [2],
                summary: "victims' memories and personalities intrude after feeding",
                excludes: []
            },
            {
                name: "Sloppy Feeder",
                cost: [2],
                summary:
                    "your feeding leaves a recognizable pattern useful to authorities or hunters",
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
            },
            {
                name: "Ley Line Leech",
                cost: [1],
                summary:
                    "after meaningful travel, wake the next night without a rising Rouse Check",
                excludes: []
            },
            {
                name: "Persistent Blush",
                cost: [3],
                summary: "one Blush of Life activation lasts a week",
                excludes: []
            },
            {
                name: "Cold Dead Hunger",
                cost: [3],
                summary: "add dice to resist Hunger frenzy",
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
            },
            {
                name: "Land Locked",
                cost: [1],
                summary: "air or sea travel provokes fear frenzy from your Beast",
                excludes: []
            },
            {
                name: "Resistant Blush",
                cost: [1],
                summary: "roll twice and keep the worse result when using Blush of Life",
                excludes: []
            },
            {
                name: "Corpse Flesh",
                cost: [2],
                summary: "your body cannot benefit from Blush of Life",
                excludes: []
            },
            {
                name: "Disease Vector",
                cost: [1],
                summary: "sick vessels always infect you and your next feeding victim",
                excludes: []
            },
            {
                name: "Plaguebringer",
                cost: [1, 2],
                summary: "a persistent disease lives in your vitae and spreads through your bite",
                excludes: []
            },
            {
                name: "Ingrained Discipline",
                cost: [0],
                summary:
                    "take a Discipline-specific drawback to unlock extra purchasable powers in that Discipline",
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
        title: "Fame",
        complexity: "advanced",
        merits: [
            {
                name: "Influencer",
                cost: [1],
                summary: "temporarily leverage Fame like narrower Influence once per story",
                excludes: []
            },
            {
                name: "Enduring Fame",
                cost: [1],
                summary: "lost Fame returns at the start of the next story",
                excludes: []
            },
            {
                name: "Streamer",
                cost: [2],
                summary: "once per story, mobilize online followers for a simple nonviolent action",
                excludes: []
            }
        ],
        flaws: []
    },
    {
        title: "Cult",
        complexity: "advanced",
        merits: [
            {
                name: "Apocryphal Texts",
                cost: [1],
                summary: "possess disputed writings that help related Intelligence rolls",
                excludes: []
            },
            {
                name: "Inspired Artist",
                cost: [2],
                summary: "cult-themed art makes viewers more susceptible to cult social pressure",
                excludes: []
            },
            {
                name: "Traveling Preacher",
                cost: [2],
                summary: "mapped safe routes reduce notice from hunters while traveling",
                excludes: []
            },
            {
                name: "Gardener",
                cost: [1, 2, 3, 4, 5],
                summary: "lead a Bahari garden that acts as selective Herd and Influence",
                excludes: []
            },
            {
                name: "Dark Mother's Song",
                cost: [2],
                summary:
                    "gain dice when recruiting others into Lilith worship through grief or pain",
                excludes: []
            },
            {
                name: "Fire Resistant",
                cost: [1],
                summary: "convert a little fire aggravated damage during daysleep more efficiently",
                excludes: []
            },
            {
                name: "Fixer",
                cost: [2],
                summary: "once per story, call in leverage from someone you procured secrets for",
                excludes: []
            },
            {
                name: "Go to Ground",
                cost: [1],
                summary: "add dice to evade pursuit with prepared escape routes and go bags",
                excludes: []
            },
            {
                name: "Vigilant",
                cost: [2],
                summary:
                    "always know when you are watched unless supernatural concealment hides it",
                excludes: []
            },
            {
                name: "Gematria",
                cost: [1],
                summary:
                    "understand the Shalimite cipher well enough to encrypt and decrypt messages",
                excludes: []
            },
            {
                name: "Insidious Whispers",
                cost: [2],
                summary: "score criticals more easily when undermining a target's Conviction",
                excludes: []
            },
            {
                name: "Bargainer",
                cost: [1],
                summary: "reduce Difficulty when assessing a deal or transaction",
                excludes: []
            },
            {
                name: "Bull-Slayer",
                cost: [3],
                summary:
                    "reroll regular dice during extended tests as you adapt to a chosen target",
                excludes: []
            },
            {
                name: "Archangel's Grace",
                cost: [3],
                summary: "swap Performance and Athletics for athletic artistry, fights, or dancing",
                excludes: []
            },
            {
                name: "Mystic of the Void",
                cost: [1, 2],
                summary: "count selected Oblivion powers as known for ceremony prerequisites",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Excommunicated",
                cost: [1, 2],
                summary: "your former cult shuns you or actively works toward your ruin",
                excludes: []
            },
            {
                name: "Faithless",
                cost: [2],
                summary:
                    "you fake belief and suffer when acting for the cult or advancing within it",
                excludes: []
            },
            {
                name: "Schism",
                cost: [1],
                summary: "your lineage or history makes your cult suspicious of your loyalty",
                excludes: []
            },
            {
                name: "False Alarms",
                cost: [1],
                summary: "failed Awareness rolls become total failures under constant paranoia",
                excludes: []
            },
            {
                name: "Empty",
                cost: [1],
                summary: "your hollowness unsettles outsiders and penalizes social rolls",
                excludes: []
            },
            {
                name: "Failed Initiate",
                cost: [1],
                summary: "a cult minder scrutinizes and interrupts you after a failed step",
                excludes: []
            },
            {
                name: "Yearning",
                cost: [1],
                summary: "working against a lost master's goals costs Willpower",
                excludes: []
            }
        ]
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
            },
            {
                name: "Penitence",
                cost: [1, 2, 3, 4, 5],
                summary: "self-scourging converts superficial Health damage into Willpower healing",
                excludes: ["Groveling Worm"]
            },
            {
                name: "Unholy Will",
                cost: [2, 4],
                summary: "resist True Faith effects better and reduce holy damage",
                excludes: []
            },
            {
                name: "Zealotry",
                cost: [1, 2, 3],
                summary: "turn Conviction-aligned normal successes into messy criticals",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Weak-Willed",
                cost: [2],
                summary:
                    "struggle to resist a leader's influence and cannot actively resist mental sway",
                excludes: []
            },
            {
                name: "Horrible Scars of Penitence",
                cost: [1],
                summary: "faith scars make you socially repulsive outside your cult",
                excludes: []
            },
            {
                name: "Groveling Worm",
                cost: [2],
                summary: "must scourge yourself each session or suffer aggravated Willpower damage",
                excludes: ["Penitence"]
            },
            {
                name: "Beacon of Profanity",
                cost: [1],
                summary: "mortals with even faint True Faith can sense your profane presence",
                excludes: []
            },
            {
                name: "Crisis of Faith",
                cost: [1],
                summary: "bestial failures also damage your Willpower",
                excludes: []
            }
        ]
    },
    {
        title: "Other",
        complexity: "advanced",
        merits: [
            {
                name: "Pack Diablerie",
                cost: [2],
                summary:
                    "claim the main benefit when sharing diablerie and gain a small echo if aiding",
                excludes: []
            }
        ],
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
            },
            {
                name: "Mortal Pretender",
                cost: [1],
                summary:
                    "Masquerade enforcers distrust your attempt to live too much like a mortal",
                excludes: []
            }
        ]
    }
]
