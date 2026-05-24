import type { Character } from "./Character"
import { ClanName } from "./NameSchemas"
import type { Loresheet, MeritOrFlaw, MeritsAndFlaws } from "./MeritsAndFlaws"

export const thinbloodMeritsAndFlaws: MeritsAndFlaws = {
    title: "◐ Thin-blood specific",
    merits: [
        {
            name: "Anarch Comrades",
            cost: [1],
            summary: "A coterie of Anarchs considers you their pet",
            excludes: []
        },
        {
            name: "Camarilla Contact",
            cost: [1],
            summary:
                "A Camarilla recruiter promises you admittance, but treats you badly and asks you to do tasks",
            excludes: []
        },
        {
            name: "Catenating Blood",
            cost: [1],
            summary: "You can create blood bonds and embrace new Vampires",
            excludes: []
        },
        {
            name: "Day Drinker",
            cost: [1],
            summary:
                "Walking in the sun doesn't damage you, but removes all your Vampiric abilities and halves your health",
            excludes: []
        },
        {
            name: "Discipline Affinity",
            cost: [1],
            summary: "Pick a Discipline (lv1) that you can increase like a normal Vampire",
            excludes: []
        },
        {
            name: "Lifelike",
            cost: [1],
            summary: "Your body appears fully human, with a beating heart and a working stomach",
            excludes: []
        },
        {
            name: "Thin-blood Alchemist",
            cost: [1],
            summary: "Gain one dot and one formula in Thin-blood Alchemy",
            excludes: []
        },
        {
            name: "Vampiric Resilience",
            cost: [1],
            summary: "Suffer only superficial damage from most sources, like a normal Vampire",
            excludes: []
        },
        {
            name: "Memories of the Fallen",
            cost: [2],
            summary: "Ashe visions make some Blood Alchemy rolls critically stronger",
            excludes: [],
            complexity: "advanced"
        }
    ],
    flaws: [
        {
            name: "Baby Teeth",
            cost: [1],
            summary: "Your teeth are useless for feeding, you need to cut your victims",
            excludes: []
        },
        {
            name: "Bestial Temper",
            cost: [1],
            summary: "Be weak to frenzy like a normal vampire",
            excludes: []
        },
        {
            name: "Branded by the Camarilla",
            cost: [1],
            summary: "The Camarilla have their eyes peeled on you",
            excludes: []
        },
        { name: "Shunned by the Anarchs", cost: [1], summary: "Anarchs shun you", excludes: [] },
        { name: "Clan Curse", cost: [1], summary: "Pick a Clan Curse (severity 1)", excludes: [] },
        {
            name: "Dead Flesh",
            cost: [1],
            summary: "Your flesh slowly rots, -1 to social tests with Mortals",
            excludes: []
        },
        {
            name: "Mortal Frailty",
            cost: [1],
            summary: "Cannot rouse your blood to heal yourself",
            excludes: []
        },
        {
            name: "Vitae Dependency",
            cost: [1],
            summary: "Need to drink Vampire vitae once a week to use Disciplines",
            excludes: []
        },
        {
            name: "Ashe Addiction",
            cost: [2],
            summary: "failed Ashe-related alchemy leaves you distracted for the session",
            excludes: [],
            complexity: "advanced"
        }
    ]
}
export const essentialMeritsAndFlaws: MeritsAndFlaws[] = [
    {
        title: "💄 Looks",
        merits: [
            {
                name: "Beautiful",
                cost: [2],
                summary: "+1 die in Social rolls",
                excludes: ["Stunning", "Ugly", "Repulsive"]
            },
            {
                name: "Stunning",
                cost: [4],
                summary: "+2 dice in Social rolls",
                excludes: ["Beautiful", "Ugly", "Repulsive"]
            }
        ],
        flaws: [
            {
                name: "Ugly",
                cost: [1],
                summary: "-1 die in Social rolls",
                excludes: ["Beautiful", "Stunning", "Repulsive"]
            },
            {
                name: "Repulsive",
                cost: [2],
                summary: "-2 dice in Social rolls",
                excludes: ["Beautiful", "Stunning", "Ugly"]
            }
        ]
    },
    {
        title: "🏠 Haven",
        merits: [
            {
                name: "Haven",
                cost: [1, 2, 3],
                summary: "secure homebase, 1 - apartment, 3 - big building",
                excludes: ["No Haven"]
            },
            {
                name: "Hidden Armory",
                cost: [1],
                summary: "weapons and armor in your haven",
                excludes: ["No Haven"]
            },
            {
                name: "Cell",
                cost: [1],
                summary: "you can imprison people in your haven",
                excludes: ["No Haven"]
            },
            {
                name: "Watchmen",
                cost: [1],
                summary: "mortal security guards",
                excludes: ["No Haven"]
            },
            {
                name: "Luxury",
                cost: [1],
                summary: "+2 Dice on Social rolls in your haven",
                excludes: ["No Haven"]
            }
        ],
        flaws: [
            {
                name: "No Haven",
                cost: [1],
                summary: "you don't have a home",
                excludes: [
                    "Haven",
                    "Hidden Armory",
                    "Cell",
                    "Watchmen",
                    "Luxury",
                    "Haunted",
                    "Creepy"
                ]
            },
            {
                name: "Haunted",
                cost: [1],
                summary: "ghostly presence in your haven",
                excludes: ["No Haven"]
            },
            {
                name: "Creepy",
                cost: [1],
                summary:
                    "your haven looks like the den of a serial killer, neighbors might phone in a tip to the police",
                excludes: ["No Haven"]
            },
            {
                name: "Compromised",
                cost: [2],
                summary: "your haven is on a watchlist",
                excludes: ["No Haven"]
            }
        ]
    },
    {
        title: "💰 Resources",
        merits: [
            {
                name: "Resources",
                cost: [1, 2, 3, 4, 5],
                summary:
                    "wealth & income, 1 - you can afford basics, 5 - you can afford anything money can buy",
                excludes: ["Destitute"]
            },
            {
                name: "Check the Trunk",
                cost: [1],
                summary:
                    "Get easy access to an armory or tools; none of the items can be more valuable than Resources 2",
                excludes: []
            }
        ],
        flaws: [
            { name: "Destitute", cost: [1], summary: "poor & no income", excludes: ["Resources"] }
        ]
    },
    {
        title: "🩸 Feeding",
        merits: [
            {
                name: "Bloodhound",
                cost: [1],
                summary: "smell resonance in mortal blood",
                excludes: []
            },
            {
                name: "High-functioning addict",
                cost: [1],
                summary:
                    "add a die to one category of pool (choose once) when the last person you fed from was on your drug",
                excludes: []
            },
            {
                name: "Iron Gullet",
                cost: [3],
                summary: "able to feed on rancid blood",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Prey Exclusion",
                cost: [1],
                summary: "can't feed on certain types of people",
                excludes: []
            },
            {
                name: "Methusela's Thirst",
                cost: [1],
                summary: "can't fully satiate on mortal blood",
                excludes: []
            },
            {
                name: "Farmer",
                cost: [2],
                summary: "feeding on non-animal blood costs you 2 willpower",
                excludes: ["Vegan"]
            },
            {
                name: "Organovore",
                cost: [2],
                summary: "your hunger demands human flesh and organs",
                excludes: []
            },
            {
                name: "Addiction",
                cost: [1],
                summary: "-1 die on all pools if the last person you fed from wasn't on your drug",
                excludes: ["Hopeless Addiction"]
            },
            {
                name: "Hopeless Addiction",
                cost: [2],
                summary: "-2 dice on all pools if the last person you fed from wasn't on your drug",
                excludes: ["Addiction"]
            }
        ]
    },
    {
        title: "🕰 Keeping up with the times",
        merits: [],
        flaws: [
            {
                name: "Living in the Past",
                cost: [1],
                summary: "you have outdated views & convictions",
                excludes: []
            },
            {
                name: "Archaic",
                cost: [2],
                summary: "Can't use computers, technology skill stuck at 0",
                excludes: []
            }
        ]
    },
    {
        title: "🌙 Mythic",
        merits: [{ name: "Eat Food", cost: [2], summary: "can consume normal food", excludes: [] }],
        flaws: [
            {
                name: "Folkloric Bane",
                cost: [1],
                summary: "specific items damage you (eg. silver, garlic)",
                excludes: []
            },
            {
                name: "Folkloric Block",
                cost: [1],
                summary:
                    "must spend willpower to move past specific block (eg. running water, door uninvited)",
                excludes: []
            },
            {
                name: "Stigmata",
                cost: [1],
                summary: "bleed from your hands, feet and forehead when at Hunger 4",
                excludes: []
            },
            { name: "Stake Bait", cost: [2], summary: "Final Death when staked", excludes: [] }
        ]
    },
    {
        title: "👺 Mask",
        merits: [
            {
                name: "Mask",
                cost: [1, 2],
                summary: "fake identity with fake documents, lv2 can pass background checks",
                excludes: []
            },
            {
                name: "Zeroed",
                cost: [1],
                summary: "all your real records are purged, you officially don't exist",
                excludes: []
            },
            {
                name: "Cobbler",
                cost: [1],
                summary: "You can make or source masks for others",
                excludes: []
            }
        ],
        flaws: [
            { name: "Known Corpse", cost: [1], summary: "others know you're dead", excludes: [] },
            {
                name: "Known Blankbody",
                cost: [2],
                summary: "Certain governments / organizations know you're a vampire",
                excludes: []
            }
        ]
    },
    {
        title: "🗣 Linguistics",
        merits: [
            {
                name: "Linguistics",
                cost: [1],
                summary: "fluently speak another language",
                excludes: []
            }
        ],
        flaws: [
            {
                name: "Illiterate",
                cost: [2],
                summary: "Can't read or write, Academics and Science capped at 1",
                excludes: []
            }
        ]
    },
    {
        title: "🧛 Kindred",
        merits: [
            {
                name: "Mawla",
                cost: [1, 2, 3, 4, 5],
                summary: "kindred mentor to advise or help you",
                excludes: []
            },
            {
                name: "Status",
                cost: [1, 2, 3, 4, 5],
                summary: "positive reputation within a faction",
                excludes: []
            }
        ],
        flaws: [
            { name: "Adversary", cost: [1], summary: "kindred enemy", excludes: [] },
            {
                name: "Suspect",
                cost: [1],
                summary: "bad reputation within a faction, -2 on Social tests with them",
                excludes: []
            },
            { name: "Shunned", cost: [2], summary: "despised by a faction", excludes: [] },
            {
                name: "Dark Secret",
                cost: [1, 2],
                summary:
                    "You have a dark secret, like owing a debt to bad people or having escaped a blood hunt for masquerade breaching in another city",
                excludes: []
            }
        ]
    },
    {
        title: "⛓️ Bonding",
        merits: [],
        flaws: [
            {
                name: "Long Bond",
                cost: [1],
                summary: "blood bonds on you take longer to wane",
                excludes: ["Short Bond", "Unbondable"]
            },
            {
                name: "Bond Junkie",
                cost: [1],
                summary: "lose one die on all actions that go against your blood bond",
                excludes: ["Unbondable"]
            },
            {
                name: "Bondslave",
                cost: [2],
                summary: "blood bonds on you are created on the first drink",
                excludes: ["Bond Resistance", "Unbondable"]
            }
        ]
    },
    {
        title: "👱 Mortals",
        merits: [
            {
                name: "Retainer",
                cost: [1, 2, 3],
                summary:
                    "loyal mortal servant, 1 - weak lowlife, 3 - skilled professional retainer",
                excludes: []
            },
            {
                name: "Allies",
                cost: [1, 2, 3, 4, 5],
                summary: "group of mortals to advise or help you",
                excludes: []
            },
            {
                name: "Contacts",
                cost: [1, 2, 3],
                summary: "mortals who provide information or valuable items",
                excludes: []
            },
            {
                name: "Herd",
                cost: [1, 2, 3, 4, 5],
                summary:
                    "group of mortals who let you feed, 1 - a couple of people, 5 - large group and you can freely pick desired resonances",
                excludes: []
            },
            {
                name: "Fame",
                cost: [1, 2, 3, 4, 5],
                summary:
                    "1 - a select subculture loves you, 5 - you are well known and loved globally",
                excludes: []
            }
        ],
        flaws: [
            { name: "Stalkers", cost: [1], summary: "unwanted mortal followers", excludes: [] },
            {
                name: "Enemy",
                cost: [1, 2],
                summary: "group of mortals that want to harm you",
                excludes: []
            },
            {
                name: "Obvious Predator",
                cost: [2],
                summary: "mortals are scared of you, can't keep Herd",
                excludes: []
            },
            {
                name: "Infamy",
                cost: [1, 2, 3, 4, 5],
                summary:
                    "1 - a select subculture despises you, 5 - you are well known and hated globally",
                excludes: []
            }
        ]
    }
]

// Requirement function generators
const isClan = (clan: ClanName) => (character: Character) => character.clan === clan
const isNotClan = (clan: ClanName) => (character: Character) => character.clan !== clan
const hasDiscipline = (discipline: string) => (character: Character) =>
    character.availableDisciplineNames.includes(discipline) ||
    character.disciplines.some((power) => power.discipline === discipline)

const loreMerit = (name: string, cost: number, summary: string): MeritOrFlaw => ({
    name,
    cost: [cost],
    summary,
    excludes: []
})

export const loresheets: Loresheet[] = [
    {
        title: "The Bahari",
        summary:
            "Adherents to the Path of Lilith who seek enlightenment through pain and conflict. They have low compassion, engage in fleshly pleasures and form strict parenthood relationships over lesser Kindred.",
        source: "Core V5 p382",
        requirementFunctions: [],
        merits: [
            {
                name: "Dangerous Reputation",
                cost: [1],
                summary: "Once per story, add 2 dice to intimidation against Caine-Worshippers.",
                excludes: []
            },
            {
                name: "Ritual Scarification",
                cost: [2],
                summary:
                    "Once per session, scar yourself with 1 aggravated dmg to recover 1 aggravated willpower.",
                excludes: []
            },
            {
                name: "Sacrifice the Children",
                cost: [3],
                summary:
                    "If you diablerize your childe, add 3 dice to your Resolve + Humanity + Blood Potency roll to absorb disciplines.",
                excludes: []
            },
            {
                name: "The Womb's Blood",
                cost: [4],
                summary:
                    "Once per story, drink blood from an uterus to receive +2 Stamina or Resolve until dawn.",
                excludes: []
            },
            {
                name: "First-Cursed",
                cost: [5],
                summary:
                    "Walk in first hour of daylight in the morning and before sunset, engage in intercourse without Blush of Life, gain 'Obvious Predator' flaw, Slander social tests against you have -1 difficulty, Vampires using Auspex against you have half Resolve and Willpower until end of scene.",
                excludes: []
            }
        ]
    },
    {
        title: "Theo Bell",
        summary:
            "Theo is a former Camarilla lapdog who defected to the Anarch after killing Hardestadt at the Convention of Prague. He inspired countless Brujah to overthrough Camarilla Princes to form Anarch bastions and now acts as liasion between high-status Camarilla and Anarch.",
        source: "Core V5 p383",
        requirementFunctions: [],
        merits: [
            {
                name: "Rebel Cell",
                cost: [1],
                summary:
                    "Once per story, command rebellious mortals (3 dot Ally equivalent) to do one dangerous task for you without your presence.",
                excludes: []
            },
            {
                name: "True Anarch",
                cost: [2],
                summary:
                    "Get 2 automatic successes on any Investigation roll concerning Vampires who defected to the Anarch Movement.",
                excludes: []
            },
            {
                name: "Contact Information",
                cost: [3],
                summary:
                    "Get a message to Theo Bell. Effects on the game depend on the Story Teller.",
                excludes: []
            },
            {
                name: "Bell's Circle",
                cost: [4],
                summary:
                    "Gain Theo Bell as a 5 dot Mawla, but your association with him also has drawbacks.",
                excludes: []
            },
            {
                name: "Sect Neutrality",
                cost: [5],
                summary:
                    "You have a small group of loyal Brujah followers who you can influence in any direction (Camarilla, Anarch, independent group). Until they rebel against you, spend 5 dots among Contacts, Haven (safe houses), Mawla and Retainers.",
                excludes: []
            }
        ]
    },
    {
        title: "Cainite Heresy",
        summary:
            "Members of the Cainite Heresy believe Caine was the true messiah and Christ was his Second Coming. Vampires are his angels on Earth.",
        source: "Core V5 p384",
        requirementFunctions: [],
        merits: [
            {
                name: "Let He Who Hath Understanding",
                cost: [1],
                summary:
                    "Once per story, the Storyteller will give you one free clue to investigate the Heresy's plans now or in the past.",
                excludes: []
            },
            {
                name: "Hand of the Heresy",
                cost: [2],
                summary:
                    "Take a total of three dots among Allies, Herd, Mawla or Retainers to represent your role in the city's Heresy group. Also take the Dark Secret (Heresy) flaw.",
                excludes: []
            },
            {
                name: "Counter-Inquisition",
                cost: [3],
                summary: "Smell True Faith on humans",
                excludes: []
            },
            {
                name: "Red Celebrant",
                cost: [4],
                summary:
                    "Once per story, perform an elaborate ritual to trigger something akin to frenzy in a group of humans.",
                excludes: []
            },
            {
                name: "The One Named in Prophecy",
                cost: [5],
                summary:
                    "You're an essential member of the Heresy. Once per story, use this fact to determine the winner of a Social conflict if you can make a plausible argument for it.",
                excludes: []
            }
        ]
    },
    {
        title: "Carna",
        summary:
            "Carna is a powerful Tremere who has formed her own House to oppose the Tremere Pyramid. She fights for modernization and women's rights.",
        source: "Core V5 p385",
        requirementFunctions: [],
        merits: [
            {
                name: "Embrace the Vision",
                cost: [1],
                summary: "When around members of House Carna, gain 1 die to all Willpower tests.",
                excludes: []
            },
            {
                name: "The Rebel Trail",
                cost: [2],
                summary:
                    "When you're at risk of becoming Blood Bound, make a Willpower test against the Blood Potency of the ingested vitae to ignore it.",
                excludes: []
            },
            {
                name: "Unorthodox Rituals",
                cost: [3],
                summary:
                    "Once per story, perform a known ritual without expending blood. On a messy critical you become deranged in some way until the end of the story.",
                excludes: []
            },
            {
                name: "Reimagined Bond",
                cost: [4],
                summary:
                    "Form mutual Blood Bonds between yourself, your partner and Carna (even though she's absent) when having sex. Lasts until end of the story.",
                excludes: []
            },
            {
                name: "Book of the Grave-War",
                cost: [5],
                summary:
                    "Gain one automatic success on all Occult tests regarding Gehenna and breaking shackles binding Vampires to their elders. Become immune to Blood Bonds. Tremere seek to destroy you and the book.",
                excludes: []
            }
        ]
    },
    {
        title: "The Circulatory System",
        summary:
            "The Circulatory System is a human trafficking ring looking for the tastiest blood and exploring Resonances.",
        source: "Core V5 p386",
        requirementFunctions: [],
        merits: [
            {
                name: "Tap into the System",
                cost: [1],
                summary:
                    "Once per story, request specific blood vessels from the Circulatory System.",
                excludes: []
            },
            {
                name: "Little Black Book",
                cost: [2],
                summary:
                    "Gain one die to Investigation, Alchemy, Medicine and Science rolls regarding tracking down or testing specific blood. Research new 2 dot and 3 dot thin-blood Alchemy at double speed.",
                excludes: []
            },
            {
                name: "Farm Upstate",
                cost: [3],
                summary:
                    "You know about a farm of mortals with potent blood (Equivalent to Herd 4). You can feed on them once a week or attack the farm and take full control.",
                excludes: []
            },
            {
                name: "Secure Transit",
                cost: [4],
                summary: "Gain access to armed, secure transport vans.",
                excludes: []
            },
            {
                name: "Blood Sommelier",
                cost: [5],
                summary:
                    "Add 2 dice to any test to discover the Resonance of blood and select 3 dots of Contacts, Allies or Haven Merits to explain your knowledge. Once per story, ask the Story Teller the properties of the most valuable vessel's blood.",
                excludes: []
            }
        ]
    },
    {
        title: "Convention of Thorns",
        summary:
            "You have deep historical knowledge of the Convention of Thorns, where the Camarilla was founded and the Traditions were set in stone.",
        source: "Core V5 p387",
        requirementFunctions: [],
        merits: [
            {
                name: "Thorns Historian",
                cost: [1],
                summary:
                    "You know details of the many small agreements made at the Convention of Thorns and can use them to apply legal pressure. Once per story, ask the Storyteller for a piece of known information regarding the convention.",
                excludes: []
            },
            {
                name: "Tradition Master",
                cost: [2],
                summary:
                    "Once per Chronicle, exercise fringe laws in domains where ruling clans may be sympathetic to unaccepted Traditions of Thorns.",
                excludes: []
            },
            {
                name: "Convention Secrets",
                cost: [3],
                summary:
                    "Gain 1 die on Social tests involving Kindred who were present at the Convention. You know secrets that may be worth a Major Boon to a powerful vampire. Once the story, ask the Storyteller for the name of a kindred who needs your knowledge.",
                excludes: []
            },
            {
                name: "Prospective Justicar",
                cost: [4],
                summary: "You have powerful support for becoming the next Justicar of your clan.",
                excludes: []
            },
            {
                name: "New Traditions",
                cost: [5],
                summary:
                    "You can propose a new tradition or alteration to an existing one. Your voice will be heard by the Camarila's inner circle without prior judgement.",
                excludes: []
            }
        ]
    },
    {
        title: "The First Inquisition",
        summary:
            "You have special information on the First Inquisition that burned many vampires in the middle ages, and you can use that knowledge to manipulate or avoid the Second Inquisition of current times.",
        source: "Core V5 p388",
        requirementFunctions: [],
        merits: [
            {
                name: "Mistakes of the Past",
                cost: [1],
                summary:
                    "Once per story, ask the Storyteller for one piece of information regarding the First Inquisition.",
                excludes: []
            },
            {
                name: "Names of the Guilty",
                cost: [2],
                summary:
                    "Once per story, ask the Storyteller for the name of one descendant of a traitor vampire, who sold others out to the First Inquisition, in your domain (if there is one).",
                excludes: []
            },
            {
                name: "The Sect of St. James",
                cost: [3],
                summary:
                    "Once per story, use an abbot connected to remnants of the First Inquisition as 4 dot Contact.",
                excludes: []
            },
            {
                name: "The Second Act",
                cost: [4],
                summary:
                    "You have a Contact within the Second Inquisition. You have no power over them, but you can get information from them or feed them disinformation.",
                excludes: []
            },
            {
                name: "Black Spot",
                cost: [5],
                summary:
                    "You know a place in your domain that the Second Inquisition will not enter. But what is so holy or unholy about this place that they won't dare enter?",
                excludes: []
            }
        ]
    },
    {
        title: "Golconda",
        summary:
            "Golconda is a mythical enlightenment that vampires can supposedly reach. It is rumored to provide powerful benefits like quelling your inner beast and walking in sunlight.",
        source: "Core V5 p389",
        requirementFunctions: [],
        merits: [
            {
                name: "Seeds of Golconda",
                cost: [1],
                summary:
                    "Once per session, ask the Storyteller if an action will jeopardize the chance of pursuing Golconda.",
                excludes: []
            },
            {
                name: "The One True Way",
                cost: [2],
                summary:
                    "You own a pamphlet that, once per story, gives you 3 extra dice on a Social test involving the nature of Golconda.",
                excludes: []
            },
            {
                name: "Saulot's Disciple",
                cost: [3],
                summary:
                    "Whenever you willingly frenzy, make a note. You can automatically succeed on your next frenzy test.",
                excludes: []
            },
            {
                name: "Satisfy the Hunger",
                cost: [4],
                summary:
                    "Once per session, you can lower your Hunger by 1 (not below 1) without feeding.",
                excludes: []
            },
            {
                name: "Greet the Sun",
                cost: [5],
                summary:
                    "Once per story, walk a day in sunlight. At nightfall of that day you go into Hunger frenzy.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Hardestadt",
        summary:
            "Hardestadt was the most important Ventrue for 800 years until Theo Bell killed him. He was the Ventrue founding member of the Camarilla.",
        source: "Core V5 p390",
        requirementFunctions: [isClan("Ventrue")],
        merits: [
            {
                name: "Voice of Hardestadt",
                cost: [1],
                summary: "You can speak over any noise and draw attention.",
                excludes: []
            },
            {
                name: "Supreme Leader",
                cost: [2],
                summary:
                    "Once per story, take no penalty to your dice pool for sending people into danger.",
                excludes: []
            },
            {
                name: "Ventrue Pillar",
                cost: [3],
                summary: "You always have 3 dots of Status with Ventrue.",
                excludes: []
            },
            {
                name: "Line to the Founders",
                cost: [4],
                summary:
                    "Once per chronicle, message one of the Camarilla's founders. If your request is important enough, they will respond.",
                excludes: []
            },
            {
                name: "Hardestadt's Heir",
                cost: [5],
                summary:
                    "You have a signed document declaring you Hardestadt's heir. It says that when you take the name 'Hardestadt', the Camarilla will obey you and the Anarchs will swarm to take you down.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Helena",
        summary:
            "Owner of the most popular Vampire nightclub who may or may not be trying to wake the Toreador Antediluvian. She's beautiful and a brilliant artist - the exemplary Toreador.",
        source: "Core V5 p391",
        requirementFunctions: [isClan("Toreador")],
        merits: [
            {
                name: "Skin-Deep",
                cost: [1],
                summary:
                    "Once per story, drop Helena's name in conversation with a Toreador or Vampire who knows her to gain 1 Status with them. Do it more to make everyone sick of you.",
                excludes: []
            },
            {
                name: "Real Talent",
                cost: [2],
                summary:
                    "Choose one of Craft, Etiquette or Performance. Increasing this Skill costs half as many XP as usually (rounded down).",
                excludes: []
            },
            {
                name: "Embrace the Stereotypes",
                cost: [3],
                summary:
                    "Once per story, host a party to increase your Status or Influence by two dots with an invited group. The increase lasts until the party ends.",
                excludes: []
            },
            {
                name: "Divine Purity",
                cost: [4],
                summary: "Add 2 dice to all tests to avoid blame for your actions.",
                excludes: []
            },
            {
                name: "Succubus Club Franchise",
                cost: [5],
                summary:
                    "Open a franchise of the famous Succubus Club. While it's open, gain 2 dots to your coterie's domain's Chasse rating. Select four dots among Resources, Fame and Status among all Vampires.",
                excludes: []
            }
        ]
    },
    {
        title: "Sect War Veteran",
        summary:
            "The Sect War was a massive clash between the Camarilla and the Sabbat from the 1990s to the early 2000s in North America. During this conflict the Sabbat murdered their way through Camarilla and Anarch domains, though they have been mostly repelled by the Camarilla by now.",
        source: "Core V5 p392",
        requirementFunctions: [],
        merits: [
            {
                name: "Survivor",
                cost: [1],
                summary:
                    "Once per story, ask the Storyteller for a piece of information relating to the sect war in your domain.",
                excludes: []
            },
            {
                name: "Active Participant",
                cost: [2],
                summary: "Take 3 dots of Status or Mawla related to your veteran status.",
                excludes: []
            },
            {
                name: "Trophy Kill",
                cost: [3],
                summary:
                    "Once per story, use the legend of you killing a well known Vampire during the war to bypass a contest where it might assist.",
                excludes: []
            },
            {
                name: "No Vampire's Land",
                cost: [4],
                summary:
                    "Add 2 dots to your Domain's Portillon, add 2 dice to Streetwise, Larceny and Stealth tests in your and 2 neighboring domains regarding using hidden sanctuaries, armories, tunnel networks and side streets.",
                excludes: []
            },
            {
                name: "Sect Agitator",
                cost: [5],
                summary: "Add 2 dice to all Social tests to inflame sectarian tension.",
                excludes: []
            }
        ]
    },
    {
        title: "The Trinity",
        summary:
            "The Trinity of Michael, Antonius and The Dracon were the leaders of Constantinople during the Golden Age where Vampires of all believes could exist in harmony. This utopia was broken apart by the Crusades, a Methusela's mania and Setite corruption, turning the Trinity against each other. Many yearn for their return to their former glory.",
        source: "Core V5 p393",
        requirementFunctions: [],
        merits: [
            {
                name: "Constantinople",
                cost: [1],
                summary:
                    "Once per story, ask the Storyteller a question about Constantinople's past.",
                excludes: []
            },
            {
                name: "Antonius' Architecture",
                cost: [2],
                summary:
                    "Add 2 dice to any Politics test involving domain government. Once per story, mediate and calm any court debate, quashing violence with action and profundity.",
                excludes: []
            },
            {
                name: "The Dream",
                cost: [3],
                summary:
                    "Add 1 die to any Insight test when trying to gauge another's Beast. Once per story, spend a Willpower point to allow another Vampire to re-roll up to 3 dice when resisting frenzy.",
                excludes: []
            },
            {
                name: "The Dracon",
                cost: [4],
                summary:
                    "Gain the Dracon as 5 dot Mawla. He can assisst you with spiritual and Discipline matters.",
                excludes: []
            },
            {
                name: "The New Trinity",
                cost: [5],
                summary:
                    "You and two friends are prophecised to rebuild Constantinople into a new city. Once per story, remove up to 5 Stains you gained while pursuing this goal.",
                excludes: []
            }
        ]
    },
    {
        title: "Jeanette / Therese Voerman",
        summary:
            "The Voerman sister run the second most famous Vampire nightclub, The Asylum in LA. They hate each other, despite the fact that they are secretly two personalities inhabiting the same body. They prove that Malkavians can be as inspired and prosperous as any Toreador or Ventrue.",
        source: "Core V5 p394",
        requirementFunctions: [],
        merits: [
            {
                name: "Asylum Membership",
                cost: [1],
                summary:
                    "You never have to wait in queue to enter The Asylum and you may hunt there twice per session (Difficulty 2).",
                excludes: []
            },
            {
                name: "Performing Monkey",
                cost: [2],
                summary:
                    "The sisters frequently give you missions that they generously reward with boons.",
                excludes: []
            },
            {
                name: "Jeanette's Favorite",
                cost: [3],
                summary:
                    "Gain Jeanette as a 4 dot Mawla, but only for Malkavian and Anarch dealings. She lets you use the club to host parties, lets you rest there during days and does favors for you.",
                excludes: []
            },
            {
                name: "Therese's Favorite",
                cost: [4],
                summary:
                    "Gain Therese as a 3 dot Mawla. She speaks up for you in any regnum and can school you in business and finance.",
                excludes: []
            },
            {
                name: "Asylum Operator",
                cost: [5],
                summary:
                    "Run a franchise of The Asylum in your domain. As long as it is open, spend 4 dots between Haven, Herd, Resources or Chasse of your Domain. If you want, your club can be an Elysium.",
                excludes: []
            }
        ]
    },
    {
        title: "The Week of Nightmares",
        summary:
            "The red star Anthelios heralded the Week of Nightmares, where the Ravnos Antediluvian purged its own clan and thin-blooded Vampires emerged. You witnessed and survived the mania and now watch for signs of dooms to come.",
        source: "Core V5 p395",
        requirementFunctions: [],
        merits: [
            {
                name: "Oral History",
                cost: [1],
                summary:
                    "Add 3 dice to Performance tests to tell the story of the Week of Nightmares.",
                excludes: []
            },
            {
                name: "Ravnos Remains",
                cost: [2],
                summary:
                    "Gain 3 dots of Mawla representing a group of Ravnos as contacts. They carry news and warnings to you and can be convinced to cast mightly illusions once per story.",
                excludes: []
            },
            {
                name: "I Was There",
                cost: [3],
                summary:
                    "Once per story, use your status as a survivor to earn a minor boon from a Kindred historian, Ravnos or occultist.",
                excludes: []
            },
            {
                name: "The Red Star",
                cost: [4],
                summary:
                    "Once per story, you can either reduce your hunger to 2 or gain 1 die to the pools of one Discipline for a night by staring at the star Anthelios for 10 minutes.",
                excludes: []
            },
            {
                name: "Blood of Zapathasura",
                cost: [5],
                summary:
                    "You own a small vial containing the Blood of the Ravnos Antediluvian. What happens when it is imbibed is up to the Storyteller.",
                excludes: []
            }
        ]
    },
    {
        title: "Rudi",
        summary:
            "An Anarch representative for the oppressed minorities in Vampire society. He's close to Mortals and fights for their rights as well. Some European Princes worry that he will lead a revolt against the establishments in the near future.",
        source: "Core V5 p396",
        requirementFunctions: [],
        merits: [
            {
                name: "Newfound Rights",
                cost: [1],
                summary:
                    "Once per story, reroll any one Skill test dice pool when striking out against the establishment.",
                excludes: []
            },
            {
                name: "Them and Theirs",
                cost: [2],
                summary:
                    "You can feel when a Touchstone of any member of your coterie comes under threat, but you don't feel which one.",
                excludes: []
            },
            {
                name: "Gangrel Advocate",
                cost: [3],
                summary:
                    "Add 1 die to Social tests with Gangrel. You can organize truce meetings between Gangrel and Camarilla representatives with a Charisma + Politics test. (Difficulty set by Storyteller)",
                excludes: []
            },
            {
                name: "The Bear Pack",
                cost: [4],
                summary:
                    "Gain the Bear Pack as 3 dot Mawla. They can get in verbal and physical fights for you. Once per story, they and you get 1 automatic success when trying to rouse Anarchs against the establishment.",
                excludes: []
            },
            {
                name: "Rudi's Army",
                cost: [5],
                summary:
                    "You hold sway over an army of revolutionaries that you can rile up against Vampire or Mortal governments. Split 5 points among Allies, Influence and Contacts, that can be directed, but never controlled.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Tyler",
        summary:
            "Tyler is the Brujah revolutionary that inspired the Anarch Movement. Tyler herself is no longer convinced that violence is the answer, but her followers still think so.",
        source: "Core V5 p397",
        requirementFunctions: [isClan("Brujah")],
        merits: [
            {
                name: "Instigator",
                cost: [1],
                summary:
                    "Once per story, add 2 dice to a roll to persuade a mortal crowd into violent action.",
                excludes: []
            },
            {
                name: "Champion of the Cause",
                cost: [2],
                summary:
                    "Gain 2 dots of Status with rebels during a rebellion. Rebels come to you looking for advice or leadership.",
                excludes: []
            },
            {
                name: "Tyler's Mercy",
                cost: [3],
                summary:
                    "Once per story, when frenzying, take a Brujah compulsion to immediately end your frenzy.",
                excludes: []
            },
            {
                name: "The Furores",
                cost: [4],
                summary:
                    "Once per chronicle, the Furores arm you and you gain assets, influence, and surprise 5 dot Allies. Can only be used to attempt to take down a Prince, Baron or higher status Vampire.",
                excludes: []
            },
            {
                name: "Permanent Revolution",
                cost: [5],
                summary:
                    "You have already taken down one Sect figurehead and continue your revolution. Anarchs stop to listen to you, Brujah Anarchs follow your every command.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Zelios",
        summary:
            "A great Nosferatu Architect and planner who disappeared beneath New York in 1990. He is responsible for many Nosferatu labyrinths, dungeons and prisons.",
        source: "Core V5 p398",
        requirementFunctions: [isClan("Nosferatu")],
        merits: [
            {
                name: "Sanctuary",
                cost: [1],
                summary: "Split 2 dots among Haven-Postern and Haven-Security System.",
                excludes: []
            },
            {
                name: "Saboteur",
                cost: [2],
                summary:
                    "Collapse a building with merely a hammer over the course of as many nights as the Storyteller sets. (4 for a family home, 9 for a skyscraper)",
                excludes: []
            },
            {
                name: "On Commission",
                cost: [3],
                summary:
                    "Gain one minor boon per story from a Vampire who asks you for advice on building their Haven. You know where many powerful Vampires sleep.",
                excludes: []
            },
            {
                name: "The Labyrinth",
                cost: [4],
                summary:
                    "You have built a great maze beneath your domain. You can't use it as Haven as it terrifies you, but you can escape into it when chased and none can pursue you.",
                excludes: []
            },
            {
                name: "Sense the Ley Lines",
                cost: [5],
                summary:
                    "You can sense Ley Lines. Sleeping near them allows Vampires to roll 2 dice and pick the highest on their rouse check when awakening.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Vasantasena",
        summary:
            "A free-will-enthusiast who preached against the Blood Bond and traditional Vampire hierarchy in the middle ages. She is a former member of the Camarilla and the Sabbat and wants to fight the Antediluvians.",
        source: "Core V5 p399",
        requirementFunctions: [isClan("Malkavian")],
        merits: [
            {
                name: "Agent of Chaos",
                cost: [1],
                summary:
                    "Once per session, while in a chaotic situation, re-roll 1 die without spending Willpower.",
                excludes: []
            },
            {
                name: "Hear My Words",
                cost: [2],
                summary:
                    "Once per story, provide counsel to somebody in a chaotic situation. They may re-roll 1 die in a future test within the same situation.",
                excludes: []
            },
            {
                name: "Scent the Bond",
                cost: [3],
                summary:
                    "Once per story, roll Resolve + Awareness (Difficulty 4) to smell the Blood Bond on a bonded and bonding Vampire.",
                excludes: []
            },
            {
                name: "Destroy the Bond",
                cost: [4],
                summary:
                    "Drink a mouthful of a Vampires blood and ride out a frenzy to break a Blood Bond on them.",
                excludes: []
            },
            {
                name: "Sabbat Becomes Camarilla",
                cost: [5],
                summary:
                    "Once per story, deprogram a Vampire from their sect beliefs. To do so, completely isolate them in an atmosphere of perfumes. Once per 3 nights, roll Intelligence or Charisma + Insight. You win after achieving a number of total successes equal to twice the subject's Willpower.",
                excludes: []
            }
        ]
    },
    {
        title: "High Clan",
        summary:
            "Even though 'High' and 'Low' clans were abolished with the formation of the Camarilla, in your domain these rules still hold to some degree. Historically, High Clans include the Lasombra, Toreador, Tzimisce and Ventrue, sometimes the Brujah and Hecata and rarely the Tremere. In other parts of the world, the Banu Haqim and Ministry are considered High Clans.",
        source: "Core V5 p400",
        requirementFunctions: [],
        merits: [
            {
                name: "Peacock",
                cost: [1],
                summary:
                    "Once per session, reroll a single die when commanding deference from one non-titled vampire in your domain.",
                excludes: []
            },
            {
                name: "Sway the Low",
                cost: [2],
                summary:
                    "You have bullied Low Clan Vampires equivalent to 3 dots of Mawla into loyalty to you. Gain 3 extra dice to Intimidation or Leadership against those Vampires. If you ever roll a total failure on such a test you must compensate them or they turn on you.",
                excludes: []
            },
            {
                name: "Elevate the Low",
                cost: [3],
                summary:
                    "Once per chronicle, raise a Low Clan Vampire into High Clan status. Gain 1 die on Social tests against Low Clan Vampires when you allude to elevating them.",
                excludes: []
            },
            {
                name: "Embraced to Rule",
                cost: [4],
                summary:
                    "Add 1 die to Leadership tests involving High Clan Vampires. Once per story, other High Clan Vampires vote for you or allow you to take a position of power unless they have personal grievances with you.",
                excludes: []
            },
            {
                name: "Blessed, not Cursed",
                cost: [5],
                summary: "Once per session, spend one Willpower to ignore your Clan Bane.",
                excludes: []
            }
        ]
    },
    {
        title: "Low Clan",
        summary:
            "You're a member of a Clan that is considered lowly in your domain (typically those are one or more of the Gangrel, Malkavians and Nosferatu. Sometimes also Brujah and Tremere). This means many treat you as less-than, but you also have access to rebels and counter culture.",
        source: "Core V5 p401",
        requirementFunctions: [],
        merits: [
            {
                name: "Thick Hide",
                cost: [1],
                summary:
                    "Once per story, ignore verbal attacks or provocations for a scene without rolling.",
                excludes: []
            },
            {
                name: "Cursed with Pride",
                cost: [2],
                summary:
                    "Once per story, gain an automatic success in a roll when incorporating your Clan Bane.",
                excludes: []
            },
            {
                name: "Uncanny Kinship",
                cost: [3],
                summary: "Select 3 dots from Mawla or Statusfrom other Low Clans in the domain.",
                excludes: []
            },
            {
                name: "Trade Among Equals",
                cost: [4],
                summary:
                    "Select another Low Clan's Discipline. You can buy dots of that Discipline using experience points as if it was in-clan for you.",
                excludes: []
            },
            {
                name: "Criticality Incident",
                cost: [5],
                summary:
                    "Add 1 die to all rolls for projects undermining High Clans in your domain. Once per chronicle, sacrifice 10 of your Background dots to bring down the same number of High Clan Vampires in a coup.",
                excludes: []
            }
        ]
    },
    {
        title: "Ambrus Maropis",
        summary:
            "A well liked trend-setter among Camarilla society. Many don't know he is a Nosferatu as he uses intermediaries to interact with Princes and Barons while remaining hidden himself. At heart, he is an introverted anime & gaming nerd and a skilled hacker and software developer.",
        source: "Core V5 p402",
        requirementFunctions: [],
        merits: [
            {
                name: "True Believer",
                cost: [1],
                summary:
                    "Gain a 1 die bonus to tests for finding shared Kindred hiding places in your city.",
                excludes: []
            },
            {
                name: "Clandestine Information",
                cost: [2],
                summary:
                    "Once per story, get one piece of information stored online about a mortal within 2-20 hours.",
                excludes: []
            },
            {
                name: "Taught by the Best",
                cost: [3],
                summary:
                    "Consider Ambrus a 3 dot Mawla. He can set you up with your personal hacker for 'friend prices' or get intel on a wide array of topics like SI dealings or the current fashion trends in obscure subcultures.",
                excludes: []
            },
            {
                name: "Back Door Panopticon",
                cost: [4],
                summary:
                    "Once per story, log into a PRISM backdoor to get two automatic successes on any Investigation involving anyone's cell activity or online presence.",
                excludes: []
            },
            {
                name: "On Another Grid Entirely",
                cost: [5],
                summary:
                    "Gain two 2 dot Mask cover identities, gain the Zeroed merit, get 3 extra dice to resist attempts to discover your online activities or your undertakings in the mortal world.",
                excludes: []
            }
        ]
    },
    {
        title: "Carmelita Neillson",
        summary:
            "A Vampire-journalist chronicling the stories of ancient vampires and recording the history of Kindred society. Carmelita has established many hidden libraries in hidden locations. Carmelita is hired to debrief recently awoken Methuselahs, investigate ruined temples and interpreting Sabbat scripture.",
        source: "Core V5 p403",
        requirementFunctions: [],
        merits: [
            {
                name: "The Art of Story",
                cost: [1],
                summary:
                    "Toreadors always lend you their ear when you speak of historic lore or mythic tales.",
                excludes: []
            },
            {
                name: "The Art of Will",
                cost: [2],
                summary:
                    "Once per session, meditate before resting for the day and pass a Resolve + Academics test of difficulty 5 to awaken with an additional point of Willpower.",
                excludes: []
            },
            {
                name: "Neillson Library",
                cost: [3],
                summary:
                    "Serve as curator to a hidden library which serves as a 2 dot Haven with a 2 dot Library. Other Vampires meet there as well.",
                excludes: []
            },
            {
                name: "Interview With the Methuselah",
                cost: [4],
                summary:
                    "Once per story, ask the Storyteller to provide you a secret about one of the clans in your domain.",
                excludes: []
            },
            {
                name: "Ancestor's Tomb",
                cost: [5],
                summary:
                    "You are tasked with guarding the resting place of one of your ancestors. While you keep it safe, once per story, call upon Carmelita for a Major Boon. If you fail to guard the tomb, there will be consequences.",
                excludes: []
            }
        ]
    },
    {
        title: "Fiorenza Savona",
        summary:
            "A relatively freshly turned Ventrue with massive sway among the Mortals of the political and business elite. She has her hands in NGOs, the UN and the Davos elite and likes to maintain rigid power structures.",
        source: "Core V5 p404",
        requirementFunctions: [],
        merits: [
            {
                name: "On Fiorenza's List",
                cost: [1],
                summary:
                    "Gain a Gifted Mortal Retainer (Bodyguard, Driver, Butler..) who openly spies on you for Fiorenza.",
                excludes: []
            },
            {
                name: "Breakfast with Fiorenza",
                cost: [2],
                summary:
                    "Once per story, meet Fiorenza. This can be lucrative or informative, if you ask the right questions.",
                excludes: []
            },
            {
                name: "Friendly Benefits",
                cost: [3],
                summary:
                    "Gain Fiorenza as 3 dot Mawla who can provide you with insider trading tips, expensive cars or private planes or sweet-talk ruffled Ventrue for you. If you overuse or abuse this connection, she will cut you off.",
                excludes: []
            },
            {
                name: "The Directorate",
                cost: [4],
                summary:
                    "Become Blood Bound to a shadowy Ventrue Directorate that wants you to break Fiorenza to their will. They provide you with 6 dots to spend among Contacts, Mawla and Resources.",
                excludes: []
            },
            {
                name: "Government Motion",
                cost: [5],
                summary:
                    "Once per chronicle, Fiorenza will influence a Mortal political leader for you. This leads to you gaining 5 dice to distribute as you like among any roll involving government action.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Karl Schrekt",
        summary:
            "Hardcore-traditionalist & former Camarilla Justicar. Karl was a Vampire hunter before his embrace in 1235 and has gained massive respect as ruthless and strong enforcer of the Camarilla, hunting supernatural threats.",
        source: "Core V5 p405",
        requirementFunctions: [isClan("Tremere")],
        merits: [
            {
                name: "Remember the House",
                cost: [1],
                summary:
                    "Once per story, ask the Storyteller for one piece of information about House Tremere before the Pyramid fell.",
                excludes: []
            },
            {
                name: "Hardliner",
                cost: [2],
                summary:
                    "With the Storyteller's agreement, add 2 dice to any test to resist attempts to sway you from Schrekt's goals.",
                excludes: []
            },
            {
                name: "Ritual Preparedness",
                cost: [3],
                summary:
                    "Once per story, perform one of your rituals in five minutes & without preparation.",
                excludes: []
            },
            {
                name: "Archon's Bane",
                cost: [4],
                summary:
                    "Have a supernatural 4 dot Ally (Werewolf, Mage, Wraith, Changeling...) who is being hunted. Once per story, they come to your aid.",
                excludes: []
            },
            {
                name: "Know the World",
                cost: [5],
                summary:
                    "Gain 3 dots in Haven-Library and pick 3 Specialties in Occult. Once per story, ask the Storyteller a simple question about non-Vampire supernatural creatures.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Xaviar",
        summary:
            "Former Gangrel Justicar who saw his cotery eaten by an Antediluvian. He left the Camarilla because they ignored his warnings and died mysteriously soon after.",
        source: "Core V5 p406",
        requirementFunctions: [isClan("Gangrel")],
        merits: [
            {
                name: "Martyred Ancestor",
                cost: [1],
                summary: "Gain 2 dots of Status with other Gangrel in your domain.",
                excludes: []
            },
            {
                name: "Where the Bodies Are Buried",
                cost: [2],
                summary:
                    "Make Resolve + Awareness check to detect Vampires merged or torpid in soil below you.",
                excludes: []
            },
            {
                name: "Loyal Hound",
                cost: [3],
                summary:
                    "Spend 4 dots among Domain, Herd and Status. Non-Camarilla Gangrel despise you for staying loyal to the Camarilla.",
                excludes: []
            },
            {
                name: "Monstrous Bat",
                cost: [4],
                summary:
                    "Once per story, turn into a man-sized bat. In this form, gain +1 to all Physical Attributes, glide in the air and do +1 Aggravated dmg with bites.",
                excludes: []
            },
            {
                name: "Experienced the Antediluvian",
                cost: [5],
                summary:
                    "Once per story, while touching open ground, sense another Gangrels location and drain some vitae from the to reset your Hunger to 2.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of Roger de Camden",
        summary:
            "Roger is an ancient and shadowy Cappadocian Vampire who currently rules as Prince of Edinburgh. He is known as a scholar of the boundaries between life and death, a martyr and a survivor.",
        source: "Ash and Bone p171",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "Proud Childe",
                cost: [1],
                summary: "Gain 2 points to status while in a Hecata-controlled environment.",
                excludes: []
            },
            {
                name: "Corpsense",
                cost: [2],
                summary:
                    "Gain 2 dice to any pool for investigating the cause of injury or death of a body. Wraiths can communicate with you more easily.",
                excludes: []
            },
            {
                name: "Eye to Eye",
                cost: [3],
                summary: "Gain 2 dice to any Persuasion or Intimidation when talking to Ventrue.",
                excludes: []
            },
            {
                name: "The Way of all Flesh",
                cost: [4],
                summary: "You can embrace old corpses unless they're rotted beyond recognition.",
                excludes: []
            },
            {
                name: "Perchance to Dream",
                cost: [5],
                summary: "You can wander the Shadowlands while resting or while in torpor.",
                excludes: []
            }
        ]
    },
    {
        title: "Children of Tenochtitlan",
        summary:
            "Originally Aztec Vampires that were oppressed by the Giovanni and are now looking for a new leader and planning their revenge.",
        source: "Blood Gods p221",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "Hiding from the Wolf",
                cost: [1],
                summary: "Gain 1 die to any roll to hide.",
                excludes: []
            },
            {
                name: "Ghostly Instincts",
                cost: [2],
                summary:
                    "Gain 2 dice on any Oblivion Ceremony roll involving summoning, control or destruction of ghosts.",
                excludes: []
            },
            {
                name: "Forward Thinking",
                cost: [3],
                summary:
                    "Once per story, you can reroll any Skill roll. Once per scene, you can reroll a skill roll against another Hecata, with +1 success if they're a Harbinger of Skulls.",
                excludes: []
            },
            {
                name: "Necromantic Prodigy",
                cost: [4],
                summary:
                    "Get +2 successes on any roll necessary for activating a necromantic Oblivion Ceremony.",
                excludes: []
            },
            {
                name: "Next in Line",
                cost: [5],
                summary:
                    "Get 2 points of Status with Hecata, gain an Ally among the Anziani who acts as 5 dot Mawla once every other story.",
                excludes: []
            }
        ]
    },
    {
        title: "Flesh-Eaters",
        summary:
            "The Nagaraja are flesh-eating Vampires. They are feared by many and often sadistic killers.",
        source: "Blood Gods p223",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "Viscus",
                cost: [1],
                summary:
                    "Biting mortals and causing wounds acts like drinking blood for you, slaking your hunger. You can also eat fresh corpses.",
                excludes: []
            },
            {
                name: "Unseen Spirit",
                cost: [2],
                summary:
                    "Gain the 'Cloak of Shadows' Discipline, but it only works against ghosts. If you already have Obfuscate, all your Obfuscate abilities work against ghosts as well.",
                excludes: []
            },
            {
                name: "The Perfect Murder",
                cost: [3],
                summary:
                    "If you have at least one night to plan, gain +1 success on any roll during an intentional murder scene (can be negated by 'Send a Murderer')",
                excludes: []
            },
            {
                name: "Send a Murderer",
                cost: [4],
                summary:
                    "Get +2 dice to rolls for studying murder scenes of tracking killers. Spend 3 dots among Contacts with mortal police, vampire investigators and Status.",
                excludes: []
            },
            {
                name: "Monstrous Bite",
                cost: [5],
                summary:
                    "Your fangs can grow into daggers, giving you +1 success on Intimidation rolls, 3 bite damage and removes the 'called shot penalty' from bite attacks.",
                excludes: []
            }
        ]
    },
    {
        title: "La Famiglia Giovanni",
        summary:
            "The Giovanni are an ancient and respected mafioso family of Vampires. They are the most powerful part of the Hecata clan, and they'll do everything to keep it that way.",
        source: "Blood Gods p225",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "A Cousin's Ear",
                cost: [1],
                summary:
                    "Once per session, ask another Giovanni a direct question and get a direct answer. You'll have to honestly answer a question in return. Once per story, get a favor from a mortal member of the family.",
                excludes: []
            },
            {
                name: "Faded Glamour",
                cost: [2],
                summary:
                    "Once per session, add an automatic success to a social roll against another Hecata or their servants.",
                excludes: []
            },
            {
                name: "Petty Cash",
                cost: [3],
                summary:
                    "Spend four dots among 'Resources' and 'Retainers'. Elder members of the family can take these from you at any time.",
                excludes: []
            },
            {
                name: "Spectre Servant",
                cost: [4],
                summary:
                    "You gain a spectre to act as your servant (4 dot 'Ally', use stats from Core book p. 377) that you can summon once per session. It will arrive within 10 hours.",
                excludes: []
            },
            {
                name: "Aspiring Anziani",
                cost: [5],
                summary:
                    "Gain 5 dots of 'Status' among Hecata, and get a private audience with the Capuchin every few stories.",
                excludes: []
            }
        ]
    },
    {
        title: "The Nation of Blood / Descendants of the Baron",
        summary:
            "Vampires formerly known as the Samedi. They commonly work as mercenary spies and necromancers, or run secret religious circles practicing vodou magic. The clan curse rots their flesh or, in some cases, exposes raw bone, giving them an even more corpse-like appearance than most vampires.",
        source: "Blood Gods p222",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "CSI Shit",
                cost: [1],
                summary:
                    "You can easily identify the cause of death when inspecting a corpse (roll if it's magically concealed)",
                excludes: []
            },
            {
                name: "Pound of Flesh",
                cost: [2],
                summary:
                    "If you accept a freely given gift, you and the giver receive a dice penalty based on each character's Bane Severity for one night.",
                excludes: []
            },
            {
                name: "Treat Yourself",
                cost: [3],
                summary:
                    "Once per night, you can indulge in a vice just like a human would, without any of the usual vampiric downsides (eg. a meal, drinks, sex, a cigar)",
                excludes: []
            },
            {
                name: "My Setite Friend",
                cost: [4],
                summary:
                    "You have a friend in the Ministry. Once per story, you can ask a favor that is as powerful as 3 dots in the appropriate Merits (Alles, Influence, Resources...)",
                excludes: []
            },
            {
                name: "The Silk Hat",
                cost: [5],
                summary:
                    "You are next in the line of succession of the Baron. Before you step up into his position, you have him as a 5 dot Mawla (his help comes in cryptic and mysterious ways). If you take his place, it might just be a job, or maybe you gain his mystical powers. Either way, you certainly gain his enemies.",
                excludes: []
            }
        ]
    },
    {
        title: "Descendant of the Ankou",
        summary:
            "A Malkavian death-visionary lineage from northern France, drawn to blood, mortality, and secrets pulled from the dead.",
        source: "Tattered Facade p171",
        requirementFunctions: [isClan("Malkavian")],
        merits: [
            loreMerit(
                "Bleed Them Dry",
                1,
                "Gain three blood, blade, fang, occult, or hematology specialties, but every haven you occupy becomes creepy."
            ),
            loreMerit(
                "Crimson Visionary",
                2,
                "Learn Oblivion at in-clan cost without a tutor's Blood, but your early powers must focus on perception and you gain a minor folkloric weakness."
            ),
            loreMerit(
                "Bloody Work",
                3,
                "Spend extra blood or kill an animal to add 2 dice to information-gathering Auspex, Occult, Ritual, or Ceremony pools."
            ),
            loreMerit(
                "Focus of Clarity",
                4,
                "Once per session, use a treasured focus object with one skill to turn one Hunger die 1 or 10 into a normal failure."
            ),
            loreMerit(
                "The Prophet of Death Reborn",
                5,
                "At each story's start, receive temporary local Contacts, Influence, Resources, or a minor Kindred boon for your prophecies."
            )
        ]
    },
    {
        title: "Descendant of Baron Vollgirre",
        summary:
            "A Toreador line touched by Vollgirre's cruelty, classical education, and hidden fleshcrafting legacy.",
        source: "Tattered Facade p172",
        requirementFunctions: [isClan("Toreador")],
        merits: [
            loreMerit(
                "The Seven Arts",
                1,
                "Gain three liberal-arts specialties across academic, social, or creative skills, but your refinement marks you as disliked."
            ),
            loreMerit(
                "Prodigy of Flesh",
                2,
                "Learn Protean at in-clan cost and use Presence for Vicissitude amalgams, but learning Vicissitude creates a dangerous secret."
            ),
            loreMerit(
                "Sadistic Hunger",
                3,
                "Inflicting real pain or fear immediately before or during feeding slakes one extra Hunger, within normal limits."
            ),
            loreMerit(
                "Unusual Connections",
                4,
                "Gain a 5-dot Mawla among Sabbat, Tzimisce, or Vollgirre descendants, but your Blood becomes vulnerable to bonding flaws."
            ),
            loreMerit(
                "Voice of Treachery",
                5,
                "Once per story, set one die to 10 on a social roll to intimidate, torture, or influence Sabbat, Toreador, Tzimisce, or Vicissitude users."
            )
        ]
    },
    {
        title: "Descendant of Montano",
        summary:
            "A Lasombra lineage tied to Montano's ancient Abyssal mastery, Camarilla loyalty, and long memory of clan politics.",
        source: "Tattered Facade p173",
        requirementFunctions: [isClan("Lasombra")],
        merits: [
            loreMerit(
                "The Shadow of Yesterday",
                1,
                "Once per story, write Montano for truth or clues about the Camarilla or Clan Lasombra."
            ),
            loreMerit(
                "Siblings in Darkness",
                2,
                "Your Lasombra Status applies across sect boundaries because the clan respects Montano's line."
            ),
            loreMerit(
                "Abyssal Apprentice",
                3,
                "Once per story, use an Oblivion power at or below your current Oblivion rating that you do not know."
            ),
            loreMerit(
                "Word of Mouth",
                4,
                "Your non-Lasombra Camarilla Status follows you throughout your home country, even outside your own city."
            ),
            loreMerit(
                "Purity of Remorse",
                5,
                "When rolling Remorse, never roll fewer than two dice."
            )
        ]
    },
    {
        title: "Little Siblings",
        summary:
            "Rossellini Hecata who treat ghosts as tools and practice Oblivion with harsh, domineering necromantic discipline.",
        source: "Tattered Facade p174",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "Grave Attitude",
                1,
                "Your certainty about death imposes a 1-die penalty on attempts to intimidate or manipulate you."
            ),
            loreMerit(
                "Ghostly Dominance",
                2,
                "After harming a wraith or its attachments, gain 3 dice to command that wraith."
            ),
            loreMerit("Necromantic Expertise", 3, "Reduce Oblivion Ceremony difficulty by 1."),
            loreMerit(
                "Stolen Will",
                4,
                "Biting a commanded ghost's damaged fetter can heal your Willpower damage."
            ),
            loreMerit(
                "Purge",
                5,
                "Your attacks can strike intangible ghosts and always deal aggravated damage to them."
            )
        ]
    },
    {
        title: "Descendant of Idder",
        summary:
            "A wandering Banu Haqim line with nomadic roots, protective instincts, and deep experience keeping herds safe on the road.",
        source: "Live from the Succubus Club p158",
        requirementFunctions: [isClan("Banu Haqim")],
        merits: [
            loreMerit(
                "Animal Affinity",
                1,
                "Reroll Rouse Checks to maintain animal ghouls and keep two Famuli if you know Bond Famulus."
            ),
            loreMerit("Shepherd", 2, "Slake one extra Hunger from your Herd each session."),
            loreMerit(
                "Never Unprepared",
                3,
                "Gain 2 dice the first time you hunt mortals in a new city or environment."
            ),
            loreMerit(
                "Safe Haven",
                4,
                "If free and half an hour from sunrise, gain 1 Hunger to have the Beast find daytime shelter."
            ),
            loreMerit(
                "Haqim's Justice",
                5,
                "Gain 2 dice when defending or avenging close connections, and once per story declare a vendetta for a lasting bonus against one target."
            )
        ]
    },
    {
        title: "Descendant of Kerwiya",
        summary:
            "Urban Gangrel descended from the Greek Gangrel tradition, more at home in Kindred politics than wilderness isolation.",
        source: "Live from the Succubus Club p159",
        requirementFunctions: [isClan("Gangrel")],
        merits: [
            loreMerit(
                "Hidden Predator",
                1,
                "You can learn Obfuscate without drinking from a teacher, though it remains out-of-clan."
            ),
            loreMerit(
                "Politically Adept",
                2,
                "Gain vampire-focused specialties or first dots in Politics, Insight, and Subterfuge, but lose access to mortal-culture specialties."
            ),
            loreMerit(
                "Actions Have Consequences",
                3,
                "Once per story, ask if a choice will increase danger from other Kindred and receive a yes or no answer."
            ),
            loreMerit(
                "The Boon Economy",
                4,
                "Once per story, upgrade a trivial or minor boon owed to you by one step."
            ),
            loreMerit(
                "Echoes of Constantinople",
                5,
                "After rolling Insight, Subterfuge, or Politics, set one die to 10."
            )
        ]
    },
    {
        title: "Descendant of Phaedyme",
        summary:
            "Ravnos descended from a martial pilgrim-knight tradition, known for travel, guardianship, and difficult honor.",
        source: "Live from the Succubus Club p160",
        requirementFunctions: [isClan("Ravnos")],
        merits: [
            loreMerit(
                "Skilled Traveler",
                1,
                "Gain travel and combat specialties or first dots, but you cannot take knowledge-skill specialties."
            ),
            loreMerit(
                "Safe Routes",
                2,
                "Once per session, bypass roadblocks or obstacles by taking a longer route, with the delay's consequences."
            ),
            loreMerit(
                "Renown Guardian",
                3,
                "Once per story, a local authority grants you a security role when you ask."
            ),
            loreMerit(
                "Honor among the Honorless",
                4,
                "Gain an extra duty, honor, or chivalry Conviction that needs no Touchstone."
            ),
            loreMerit(
                "Defender",
                5,
                "Once per story, reroll Blood Surge Rouse Checks for a scene while defending someone or something important."
            )
        ]
    },
    {
        title: "Descendant of the Fallen Lord",
        summary:
            "A militant Salubri line shaped by Sabbat war, ancient grudges, and violent discipline.",
        source: "Live from the Succubus Club p161",
        requirementFunctions: [isClan("Salubri")],
        merits: [
            loreMerit(
                "Instinct for Death",
                1,
                "Gain two combat specialties or first dots, but very humane characters find you harder to deal with."
            ),
            loreMerit(
                "Tracker's Mark",
                2,
                "Gain 2 dice to track anyone you have attacked in combat."
            ),
            loreMerit(
                "Fury's Strike",
                3,
                "Once per scene after a close-combat hit, immediately use a Discipline power against that target as though you had touch or eye contact."
            ),
            loreMerit(
                "What Must Be Done",
                4,
                "Gain a permanent enemy-destruction Conviction that needs no Touchstone."
            ),
            loreMerit(
                "Vengeful Eye",
                5,
                "When rerolling melee dice with Willpower, reroll one extra die, even Hunger, while exposing your third eye."
            )
        ]
    },
    {
        title: "Succubus Club Copycat",
        summary:
            "Owner or key operator of a nightclub trying to capture the dangerous glamour of the legendary Succubus Club.",
        source: "Live from the Succubus Club p162",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Finger on the Pulse",
                1,
                "Gain 1 die to Social pools involving important mortals who want your favor or discretion."
            ),
            loreMerit(
                "Energizing Beat",
                2,
                "Blood hunted from your club counts as Intense Resonance for you."
            ),
            loreMerit(
                "Damage Control",
                3,
                "Once per session while hunting in the club, reroll all dice after a Messy Critical or failed frenzy test."
            ),
            loreMerit(
                "Loyalty",
                4,
                "Your staff automatically resist bonding, Dominate, or Presence that would turn them against you or the club."
            ),
            loreMerit(
                "Destination of Choice",
                5,
                "Once per session, petition to host the city's major undead gathering at your club."
            )
        ]
    },
    {
        title: "The Pony Express",
        summary:
            "A Camarilla courier network moving secure physical messages, people, and goods between domains after digital communication became deadly.",
        source: "Live from the Succubus Club p163",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Access to the Network",
                1,
                "Send or receive one secure package or message through any domain the Express serves."
            ),
            loreMerit(
                "Station Agent",
                2,
                "Gain a 2-dot Mask, Zeroed, and use of a 2-dot Express haven while handling risky local mail handoffs."
            ),
            loreMerit(
                "Driver",
                3,
                "Once per story, obtain a suitable travel vehicle and use the Express chain of safe stations."
            ),
            loreMerit(
                "World Tour",
                4,
                "Once per story, access Kindred-safe international travel with secure stations at both ends."
            ),
            loreMerit(
                "Passenger Service",
                5,
                "Once per story, move yourself and your coterie to another Express-served destination."
            )
        ]
    },
    {
        title: "Road Courier",
        summary:
            "A discreet courier who survives long-haul nights, bad roads, and the dangers of transporting sensitive cargo.",
        source: "Live from the Succubus Club p164",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Bucket",
                1,
                "Gain 2 dice to find a temporary vehicle in cities or along major roads."
            ),
            loreMerit(
                "Six in the Morning",
                2,
                "Once per story, gain 4 dice to find vehicular shelter from dawn on or near a road."
            ),
            loreMerit(
                "Chosen Steed",
                3,
                "Pick a vehicle you have kept for a story; gain 3 dice to drive or work on it."
            ),
            loreMerit(
                "Highway Harbinger",
                4,
                "For three nights in a new city, gain 3 dice to intimidate, investigate, or navigate vampire rumors, but attract a temporary Adversary."
            ),
            loreMerit(
                "Midnight Express",
                5,
                "Gain courier Contacts and once per story have them scout and clear a route for one night's high-speed travel."
            )
        ]
    },
    {
        title: "Stories of the Daughters",
        summary:
            "A suspected, pretended, or genuine link to the legendary Daughters of Cacophony and their supernatural vocal gifts.",
        source: "Live from the Succubus Club p165",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Aspiring Idol",
                1,
                "Gain 2 dice to singing tests, but a failure immediately triggers a Compulsion."
            ),
            loreMerit(
                "Surprise Performance",
                2,
                "Once per story, add 2 successes to a public-speaking test after rolling."
            ),
            loreMerit(
                "Wayward Daughter",
                3,
                "Pass as a Daughter in your domain and distribute 4 dots among Status, Herd, and Mawla until exposed."
            ),
            loreMerit(
                "Songstress Supreme",
                4,
                "Gain 4 dice to vocal performances, but take Stalkers and a possessive or jealous Adversary."
            ),
            loreMerit(
                "Rejuvenating Voice",
                5,
                "Gain 2 dice to non-intimidating Presence, Quell the Beast, or Obeah and once per story heal listeners' Willpower through song."
            )
        ]
    },
    {
        title: "Temple of Boom Contract",
        summary:
            "A business or performance connection to Victor Temple's Anarch entertainment empire and its growing nightclub brand.",
        source: "Live from the Succubus Club p166",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Chocolate Drop",
                1,
                "Gain 1 dot each in Fame and Contacts as Temple talent, plus a Stalker flaw."
            ),
            loreMerit(
                "Got Connections",
                2,
                "Temporarily gain Resources or Contacts by recruiting talent for Temple of Boom."
            ),
            loreMerit(
                "This is Fine",
                3,
                "Once per story, name-drop Victor for 3 dice in business or entertainment scenes, but gain a temporary Enemy."
            ),
            loreMerit(
                "Maharaja/Maharani",
                4,
                "Open a Temple club franchise, improving Haven, Fame, Resources, Herd, and one specialty while making the haven Compromised."
            ),
            loreMerit(
                "If Not Now, When?",
                5,
                "Hold a major boon from Victor Temple, but using it marks your Anarch connection to the Camarilla."
            )
        ]
    },
    {
        title: "Descendant of Al-Ashrad",
        summary:
            "A Banu Haqim sorcerous lineage carrying al-Ashrad's prestige, visions, and hatred of hostile spirits and clan schismatics.",
        source: "Blood Sigils p177",
        requirementFunctions: [isClan("Banu Haqim")],
        merits: [
            loreMerit(
                "Stories of Old",
                1,
                "Gain 2 dice to Leadership tests when invoking al-Ashrad or Haqim to motivate others."
            ),
            loreMerit(
                "Sight Beyond Sight",
                2,
                "Once per session, use Sense the Unseen with Blood Potency in place of Auspex, or gain 2 dice if you already know it."
            ),
            loreMerit(
                "Vengeful Sorcery",
                3,
                "Once per session in violent conflict, gain 2 dice to a harmful Blood Sorcery power against another vampire."
            ),
            loreMerit(
                "Banish the Intangible",
                4,
                "Blood Sorcery powers and rituals that harm physical targets also affect incorporeal beings."
            ),
            loreMerit(
                "Amr-in-Waiting",
                5,
                "Gain Banu Haqim Status 5 and one free ritual, but also a powerful sorcerous Adversary."
            )
        ]
    },
    {
        title: "Student of Kirin Taunk",
        summary:
            "A thin-blood alchemist shaped by Kirin Taunk's efficient formulas, social pragmatism, and mysterious patronage.",
        source: "Blood Sigils p178",
        requirementFunctions: [isClan("Thin-blood")],
        merits: [
            loreMerit("Stunning Efficiency", 1, "Halve all formula distillation times."),
            loreMerit(
                "Professional Mindset",
                2,
                "Once per session, use Thin-blood Alchemy rating in place of a lower Social skill at Storyteller discretion."
            ),
            loreMerit(
                "A Taunk Formula",
                3,
                "Choose one formula for free once your alchemy is high enough and gain 2 dice to distill it."
            ),
            loreMerit(
                "Diplomatic Power",
                4,
                "Gain Status 2 with both the Camarilla and the Anarchs."
            ),
            loreMerit(
                "Taunk's Patron",
                5,
                "Gain a 5-dot Mawla who can boost three approved formulae each story with rare ingredients."
            )
        ]
    },
    {
        title: "Veins of the Earth",
        summary:
            "A blood-craft mystic who senses and exploits the living earth's hidden energetic veins and furcus sites.",
        source: "Blood Sigils p179",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Seeking a Vein",
                1,
                "Once per story, declare your current location a furcus at Storyteller discretion."
            ),
            loreMerit(
                "Drawing the Flies",
                2,
                "Gain a 3-dot Herd of mortals drawn to earth energies, maintained by sharing discoveries."
            ),
            loreMerit(
                "Revelations of the Earth",
                3,
                "Once per session, meditate on a furcus to ask one truthful question about a Kindred's location and movement."
            ),
            loreMerit(
                "Channeling the Earth",
                4,
                "Once per session, meditate on a furcus to add 1 die to a Discipline pool beyond Blood Potency."
            ),
            loreMerit(
                "Tiamat's Exchange",
                5,
                "Once per story, offer flesh or blood to a furcus to gain 3 automatic successes on a chosen test."
            )
        ]
    },
    {
        title: "Vienna Zero",
        summary:
            "A blood sorcerer or scavenger with dangerous access to the ruined Tremere Prime Chantry and the hunters excavating it.",
        source: "Blood Sigils p180",
        requirementFunctions: [hasDiscipline("blood sorcery")],
        merits: [
            loreMerit(
                "Inside Knowledge",
                1,
                "Gain 2 dice to blood-craft Occult or Tremere Politics rolls."
            ),
            loreMerit(
                "Off the Back of a Truck",
                2,
                "Gain a 3-dot Contact who can source restricted items from Vienna Zero if you can pay."
            ),
            loreMerit(
                "Instrument of Power",
                3,
                "Gain an agreed artifact with +1 die to its tests, but each use risks hunter attention."
            ),
            loreMerit(
                "The Very Last Copy",
                4,
                "Own a unique Tremere grimoire listing four rituals you can learn without a teacher in half the time."
            ),
            loreMerit(
                "Deep Clearance",
                5,
                "Gain Mask 3 with Zeroed and once per story borrow an artifact from Vienna Zero, but take a suspicious hunter Enemy."
            )
        ]
    },
    {
        title: "Birth of the Anarch Free States",
        summary:
            "A claimed or genuine connection to the Second Anarch Revolt in Los Angeles and the myth of the Free States.",
        source: "In Memoriam p149",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Fake Revolutionary",
                1,
                "Gain 1 die to rally or manipulate Anarchs, but veterans may catch your false history."
            ),
            loreMerit(
                "Connections",
                2,
                "Once per story, ask a veteran contact an honest question about Anarch politics or Free States history."
            ),
            loreMerit(
                "Original Rebel",
                3,
                "Gain 1 die to tests involving revolution against Camarilla rule."
            ),
            loreMerit(
                "Hero of the Revolution",
                4,
                "Once per story, summon five Anarch neonates for a justified anti-Camarilla action."
            ),
            loreMerit(
                "Legacy of the Revolution",
                5,
                "Once per chronicle, spark a domain-wide Anarch revolt with Storyteller approval."
            )
        ]
    },
    {
        title: "Childe of the Revolution",
        summary:
            "A Kindred survivor or inheritor of the French Revolution's violence, reformist salons, and Bohemian politics.",
        source: "In Memoriam p150",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Rousing Speech",
                1,
                "Gain 2 dice to Persuasion or Leadership when arguing against the established order."
            ),
            loreMerit(
                "Under the Guillotine",
                2,
                "Once per story, reroll a failed Hunger Frenzy test."
            ),
            loreMerit(
                "Bal des Victimes",
                3,
                "Gain 2 or 3 dice to social tests when bonding through grief, especially with other attendees."
            ),
            loreMerit(
                "Friend of Beaumont",
                4,
                "Count Felicien Beaumont as a 5-dot Mawla who asks one minor boon each story."
            ),
            loreMerit(
                "Bohemian Affinities",
                5,
                "Distribute 5 dots among Haven, Contacts, and Resources and occasionally use the Halls of Montmartre as a hideout."
            )
        ]
    },
    {
        title: "Descendant of Dracula",
        summary:
            "A Tzimisce line claiming the dangerous legacy, charisma, earth-bound resilience, and occult potential of Vlad Tepes.",
        source: "In Memoriam p151",
        requirementFunctions: [isClan("Tzimisce")],
        merits: [
            loreMerit(
                "Blood of the Dragon",
                1,
                "Once per story, gain 1 die to all Physical tests for a scene."
            ),
            loreMerit(
                "Of the Earth",
                2,
                "Once per story, bury yourself for 48 hours to mend all aggravated Willpower or Physical damage."
            ),
            loreMerit(
                "Charisma of the Count",
                3,
                "Gain a Persuasion specialty and 1 die to seduction or charm tests."
            ),
            loreMerit(
                "Whispers in the Blood",
                4,
                "Once per story, use an unknown power from a Discipline you already possess at your current level or lower."
            ),
            loreMerit(
                "Dracula's Chosen",
                5,
                "Once per story, call on your bloodline for up to a major boon, with political expectations attached."
            )
        ]
    },
    {
        title: "The Order of Repentants",
        summary:
            "Kindred penitents who once lost themselves to the Beast and now seek discipline, atonement, and control.",
        source: "In Memoriam p152",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Sponsorship",
                1,
                "Gain a 3-dot Mawla from the order who helps once per story and may police your conduct."
            ),
            loreMerit(
                "Surface Empathy",
                2,
                "Once per session, gain 2 dice to an Insight or Persuasion test."
            ),
            loreMerit(
                "Flagellation",
                3,
                "Gain 1 die to resist frenzy, but must later inflict aggravated damage on yourself or fail the next frenzy test."
            ),
            loreMerit(
                "Superior Focus",
                4,
                "Once per story, reroll one Bestial Failure without spending Willpower."
            ),
            loreMerit(
                "Benevolence",
                5,
                "Once per story, reroll a failed Remorse test for yourself or another player."
            )
        ]
    },
    {
        title: "The Red Lady",
        summary:
            "Access to a Prague Toreador's infamous parties, shifting favorites, and discreet Camarilla favors.",
        source: "In Memoriam p153",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "You Gotta Know Somebody",
                1,
                "Know a contact who can get you into one of the Red Lady's parties."
            ),
            loreMerit(
                "Person of Interest",
                2,
                "Gain 1 die to Charisma tests around the Red Lady or her partygoers when you fit her current tastes."
            ),
            loreMerit(
                "A Pretty Pet",
                3,
                "Count the Red Lady as a 2-dot Mawla and gain Herd 1 and Resources 1 while you remain favored."
            ),
            loreMerit(
                "A Trusted Friend",
                4,
                "Once per story, host the Red Lady for a favor and gain 1 Camarilla Status."
            ),
            loreMerit(
                "Red Haze",
                5,
                "Once per story, have the Red Lady hide evidence of diablerie in your Blood and aura."
            )
        ]
    },
    {
        title: "The Vanderbilt Ventrue",
        summary:
            "A Ventrue connection to the gilded wealth, social leverage, and occult bargains surrounding the Vanderbilt circle.",
        source: "In Memoriam p154",
        requirementFunctions: [isClan("Ventrue")],
        merits: [
            loreMerit(
                "Well-connected",
                1,
                "Once per story, call on a distant Vanderbilt relation for a minor social, financial, or professional favor."
            ),
            loreMerit(
                "Financial Problem-solving",
                2,
                "Gain 1 Resources and spend Willpower to secure a temporary professional Retainer for the story."
            ),
            loreMerit(
                "Someone of Worth",
                3,
                "Gain 1 die with high society and 1 die to read intentions in elite social situations."
            ),
            loreMerit(
                "In the Know",
                4,
                "Once per story, blackmail a suitable ancilla or elder, with risky repeat attempts possible."
            ),
            loreMerit(
                "Ancient Pact",
                5,
                "Perform a costly occult bargain for 2 automatic successes on finance-related tests for a story, but suffer bad luck near Final Death."
            )
        ]
    },
    {
        title: "The Anubi",
        summary:
            "Lupine-hunting coteries modeled after Milwaukee's Anubi, ranging from silver-armed strike teams to tense werewolf diplomats.",
        source: "Let the Streets Run Red p224",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Argent Fury",
                1,
                "Once per story, equip yourself with a silver handheld weapon or ammunition."
            ),
            loreMerit(
                "What Big Eyes You Have",
                2,
                "Once per story, gain 2 automatic successes to investigate Lupines in your domain."
            ),
            loreMerit(
                "Brick House",
                3,
                "Spend 4 dots on Haven and Retainers dedicated to defense against Lupines."
            ),
            loreMerit(
                "In the City, In the Woods",
                4,
                "Choose a Lupine-hunting, diplomacy, or werewolf-blood benefit for your organization."
            ),
            loreMerit(
                "Summon the Pack",
                5,
                "Once per story when Lupines are involved, call on a temporary Mawla and Anubi biker Allies."
            )
        ]
    },
    {
        title: "Eletria",
        summary:
            "A personal tie to Eletria, vanished artist, warrior, former Prince of Veracruz, and one-time companion of Helena.",
        source: "Let the Streets Run Red p225",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Muse",
                1,
                "Reduce difficulty by 1 on chosen painting, sculpture, or music tests."
            ),
            loreMerit(
                "Portrait of a Woman",
                2,
                "Once per session, meditate on Eletria's art before rest to recover all superficial Willpower damage on a successful creative test."
            ),
            loreMerit(
                "This is Sparta",
                3,
                "Gain 1 die to research or occult defense against hostile sect incursions."
            ),
            loreMerit(
                "Ageless Beauty",
                4,
                "Once per session, glimpse and artistically reproduce a subject as they appeared in the past."
            ),
            loreMerit(
                "Conspicuous Consumption",
                5,
                "Join Helena's feeding circle and distribute 5 dots among social and material Backgrounds, with secrecy demanded."
            )
        ]
    },
    {
        title: "Kindred Social Media Influencer",
        summary:
            "A vampire risking online attention for money, reach, followers, information, and easy feeding.",
        source: "Let the Streets Run Red p226",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Friends Everywhere",
                1,
                "Once per chapter, crowdsource help for a problem, rolling an unfamiliar skill or adding successes to a familiar area."
            ),
            loreMerit(
                "Niche Following",
                2,
                "Gain 2 dots of field-specific Influence and once per story earn a temporary Resources boost from paid content."
            ),
            loreMerit(
                "Internet Famous",
                3,
                "Gain 2 Resources and once per story arrange a meetup that provides Herd 1."
            ),
            loreMerit(
                "Collabs and Sponsorships",
                4,
                "Gain Fame 2, fan Allies 2, and a company Contact 2."
            ),
            loreMerit(
                "Superstar",
                5,
                "Gain Fame 3 and Resources 3 from your platform, but your visibility makes exposure deadly."
            )
        ]
    },
    {
        title: "Juggler",
        summary:
            "A connection to Juggler's Gary Anarch network, revolutionary logistics, and hidden plans against the Camarilla.",
        source: "Let the Streets Run Red p227",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "For the Cause",
                1,
                "Once per session, reroll Brawl, Melee, or Streetwise against Camarilla members."
            ),
            loreMerit(
                "Guns to a Knife Fight",
                2,
                "Once per story, access one of Juggler's Gary weapon caches."
            ),
            loreMerit(
                "Rabble Rouser",
                3,
                "Once per story, call on a small Kindred Anarch crew to create chaos or fight."
            ),
            loreMerit(
                "Coordination is Key",
                4,
                "Gain Anarch Status 3, Gary Influence 3, and once per story ask for recent movement intel."
            ),
            loreMerit(
                "Rust Never Sleeps",
                5,
                "Count Juggler or Evelyn as a 4-dot Mawla and once per story turn another city's Anarch into a temporary Contact."
            )
        ]
    },
    {
        title: "Lost Secrets of the Milwaukee Chantry",
        summary:
            "Access to the abandoned Tremere mysteries, havens, grimoires, and occult sites left behind in Milwaukee.",
        source: "Let the Streets Run Red p228",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Carna's Primogen Files",
                1,
                "Gain 1 die to Politics rolls involving Milwaukee Kindred."
            ),
            loreMerit(
                "Abandoned Real Estate",
                2,
                "Gain access to a Milwaukee haven with either an occult library or hidden armory."
            ),
            loreMerit(
                "Victor's Grimoire",
                3,
                "Blood sorcerers can justify learning one special Milwaukee ritual and later learn more from the grimoire."
            ),
            loreMerit(
                "Objects of Desire",
                4,
                "Gain a precarious 4-dot haven near the Null Zone, plus serious enemies and rivals."
            ),
            loreMerit(
                "Dr. Mortius's Haven",
                5,
                "Find Mortius's haunted haven and powerful occult library, with possible secrets and defenses inside."
            )
        ]
    },
    {
        title: "Mark Decker",
        summary:
            "A place in Prince Decker's paranoid Milwaukee order, built on patrol duty, Lupine defense, and harsh law enforcement.",
        source: "Let the Streets Run Red p229",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Good Graces",
                1,
                "Act with limited Decker authority on patrol, but accept a one-step Blood Bond."
            ),
            loreMerit(
                "Tyrant's Recognition",
                2,
                "Gain a 2-dot Herd and 1-dot Haven as feeding rights for protecting Milwaukee."
            ),
            loreMerit(
                "One Strike",
                3,
                "Once per story, plead down a minor breach of Decker's laws instead of facing Final Death."
            ),
            loreMerit(
                "The Prince's Trust",
                4,
                "Once per story, count Decker as a 5-dot Mawla or secure a private audience with him."
            ),
            loreMerit(
                "Childe of Mark Decker",
                5,
                "Gangrel only: gain Haven, Status, and a combat specialty from Decker's Embrace, plus Adversaries who hate his line."
            )
        ]
    },
    {
        title: "Maxwell",
        summary:
            "Support from the vanished Brujah prince-in-waiting, his Gary Vanguard, and his plans to reclaim Chicago.",
        source: "Let the Streets Run Red p230",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Tactician",
                1,
                "Gain 2 dice to academic, political, or deceptive planning and military rolls."
            ),
            loreMerit(
                "Travelling Companion",
                2,
                "Once per story, call on Maxwell's allies for secure travel between cities."
            ),
            loreMerit(
                "Vanguard",
                3,
                "Gain Gary Status 3, a 2-dot Haven, and recognized local standing."
            ),
            loreMerit(
                "The Art of Disappearing",
                4,
                "Once per story, Maxwell helps create or retire a 2-dot Mask for anonymous work."
            ),
            loreMerit(
                "The Once and Future Prince",
                5,
                "Gain Resources 5, access to Maxwell's boon list, and the obligation to spend his favors wisely."
            )
        ]
    },
    {
        title: 'The Milwaukee "Null Zone"',
        summary:
            "Knowledge of the occult dead zone beneath Marquette University and the Lupine talismans buried there.",
        source: "Let the Streets Run Red p231",
        requirementFunctions: [],
        merits: [
            loreMerit("Legends of Usla", 1, "Gain 1 die to investigate or research the Null Zone."),
            loreMerit(
                "Into the Zone",
                2,
                "Safely access the Null Zone and exploit its strange effects on Auspex, Protean, and Blood Sorcery."
            ),
            loreMerit(
                "St. Joan of Arc Chapel",
                3,
                "Know the warded chapel and hidden tunnels at the Zone's center."
            ),
            loreMerit(
                "Church of Isis",
                4,
                "Once per chronicle, call on a 5-dot occult Ally group tied to the Zone."
            ),
            loreMerit(
                "Usla's Talismans",
                5,
                "With permission, locate either a powerful Auspex or Protean talisman while drawing relentless Lupine pursuit."
            )
        ]
    },
    {
        title: "Modius",
        summary:
            "A loyalist, correspondent, or beneficiary of Gary's self-styled Prince and his long feud with Juggler.",
        source: "Let the Streets Run Red p233",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Followers",
                1,
                "Once per chapter, call on another Modius supporter for a small favor in Gary."
            ),
            loreMerit(
                "Windy City Ally",
                2,
                "Gain a 2-dot Retainer sent by Modius as thanks for supporting his Chicago ambitions."
            ),
            loreMerit(
                "Keys to the Mansion",
                3,
                "Use Modius's mansion haven and once per story ask for intel on Anarch movements."
            ),
            loreMerit(
                "Since 1913",
                4,
                "Gain Gary Camarilla Status 4 and feeding permission throughout Gary, Anarch resistance notwithstanding."
            ),
            loreMerit(
                "Pauper Dynasty",
                5,
                "Count Modius as a 5-dot Mawla and gain 2 Influence in a city he hopes you will one night rule."
            )
        ]
    },
    {
        title: "The Ruby Throat",
        summary:
            "A connection to Atlantic City's undead gambling den, where Kindred stake status, secrets, vessels, and stranger prizes.",
        source: "Ash and Bone p170",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Rubbing Shoulders",
                1,
                "Name-drop important patrons for 1 die to get access or information in Atlantic City, if you choose well."
            ),
            loreMerit(
                "What's in your Sleeves",
                2,
                "Gain 2 dice to intimidate Kindred in the crime scene and identify Atlantic City night-spot regulars."
            ),
            loreMerit(
                "Chicken Dinner",
                3,
                "Once per story, gain responsibility for a human vessel with a dyscrasia of your choice."
            ),
            loreMerit(
                "High Roller",
                4,
                "Increase Resources by 2 up to 4 and access Herd 2 in Atlantic City, but gain a jealous Adversary."
            ),
            loreMerit(
                "Dead Man's Hand",
                5,
                "Before the highest-stakes annual game, gain Atlantic City Status 3 and access to lesser games without a roll."
            )
        ]
    },
    {
        title: "Relics of the Veil",
        summary:
            "Haunted relics and fetters that aid Oblivion, resist wraiths, reveal secrets, or carry the attention of the dead.",
        source: "Ash and Bone p172",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Torn Shroud",
                1,
                "Hold a fragile shroud fragment for 1 die to Oblivion pools until overuse destroys it."
            ),
            loreMerit(
                "Burning Effigy",
                2,
                "Burn the effigy once to heal extra aggravated Health next dusk while something else feels the pain."
            ),
            loreMerit(
                "The Gaunt Robe",
                3,
                "Spend Willpower while wearing the robe for 2 automatic successes to resist wraith abilities."
            ),
            loreMerit(
                "The Nails of Dismus",
                4,
                "Own a cruel relic nail that stakes vampires and torments them each dawn."
            ),
            loreMerit(
                "Codex Caecitus",
                5,
                "Once per story, meditate on the codex to uncover a major deathly secret, wraith name, fetter, or Oblivion ritual."
            )
        ]
    },
    {
        title: "Bankers of Dunsirn",
        summary:
            "A Hecata bloodline of cannibal financiers whose money, secrecy, and leverage keep the Clan of Death solvent.",
        source: "Blood Gods p220",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "Money Obfuscates",
                1,
                "Gain a 2-dot Mask backed by family money, provided you maintain it each story."
            ),
            loreMerit(
                "Money Talks",
                2,
                "Once per story, buy information as if you had Contacts equal to your Resources for one scene."
            ),
            loreMerit(
                "Money Enhances",
                3,
                "Gain 1 die when using your own high-quality equipment for a roll."
            ),
            loreMerit(
                "Money Multiplies",
                4,
                "Gain 3 Resources up to 5 and help your coterie recover from Destitute or buy Resources cheaply."
            ),
            loreMerit(
                "Money Dictates",
                5,
                "Gain Hecata Status 3 and once per chronicle adjust Hecata Resources for a story, creating enemies if you take wealth away."
            )
        ]
    },
    {
        title: "Harbingers of Ashur",
        summary:
            "Masked Cappadocian remnants whose Hecata identity balances death-scholarship, old grudges, and Underworld experience.",
        source: "Blood Gods p224",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "The Ashen Mask",
                1,
                "When a Touchstone dies, corpse study can move their Conviction to another mortal as if the death were peaceful."
            ),
            loreMerit(
                "The Gold Mask",
                2,
                "Use the equivalent of Influence 4 to cover up deaths by you or your coterie."
            ),
            loreMerit(
                "The White Mask",
                3,
                "Gain 3 dice socially against Harbingers and 2 dice against other Hecata."
            ),
            loreMerit(
                "The Obsidian Mask",
                4,
                "Learn Oblivion Ceremonies without a teacher, but ghost-targeting effects also threaten you."
            ),
            loreMerit(
                "The Lazarene Mask",
                5,
                "Take no Stains for killing Hecata or Hecata servants in pursuit of your bloodline's final necromantic doctrine."
            )
        ]
    },
    {
        title: "The Criminal Puttanesca",
        summary:
            "The Hecata's street-level enforcers and criminal fixers, handed the family's dirtiest organized-crime work.",
        source: "Blood Gods p226",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "Friends in Low Places",
                1,
                "Split 2 dots between Allies and Resources each story, but police scrutiny follows."
            ),
            loreMerit(
                "Show Your Belly",
                2,
                "Gain 3 dice to convince stronger people not to hurt or endanger you."
            ),
            loreMerit(
                "Show Your Fists",
                3,
                "Gain 2 dice to intimidate mortals and increase unarmed damage against them by 1."
            ),
            loreMerit(
                "Get the Squad Together",
                4,
                "Once per story, gather local Puttanesca and mortal Allies for a brawl, with an automatic social success to justify it."
            ),
            loreMerit(
                "The Don",
                5,
                "Gain 3 dots each in criminal Contacts, Influence, and Resources, but maintaining them risks law-enforcement enemies."
            )
        ]
    },
    {
        title: "The Gorgons",
        summary:
            "Lamia-descended Hecata warriors tied to Lilith, Bahari rites, body-control, and the old duty of protecting Cappadocians.",
        source: "Blood Gods p227",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "The Serpent's Kiss",
                1,
                "Once per story, infect mortal prey with a disease that causes aggravated damage over three nights."
            ),
            loreMerit("Protection", 2, "Gain 2 dice when using Block to protect someone else."),
            loreMerit(
                "Four Humours",
                3,
                "Once per story, bite a mortal to penalize actions that do not match their current resonance."
            ),
            loreMerit(
                "Controlling the Beast",
                4,
                "Once per session, convert a messy critical in combat into a normal critical."
            ),
            loreMerit(
                "Medusa's Gaze",
                5,
                "Once per session after winning Intimidation or conflict, freeze the loser briefly in combat or for a scene outside combat."
            )
        ]
    },
    {
        title: "Calling the Family Reunion",
        summary:
            "A Hecata insider tied to the negotiations, murders, favors, and spectral fallout that unified the Clan of Death.",
        source: "Blood Gods p228",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            loreMerit(
                "The Kids' Table",
                1,
                "Gain 2 dice to persuade Hecata against reopening old grudges."
            ),
            loreMerit(
                "Updating the Rolodex",
                2,
                "Use the equivalent of Hecata Status 3 for information and small favors."
            ),
            loreMerit(
                "Hiding the Bodies",
                3,
                "Once per story, cash in a Hecata elder's debt for a boon, with overuse creating an Adversary."
            ),
            loreMerit(
                "Dealmaker",
                4,
                "Gain a 5-dot Hecata Mawla from a secret deal, who becomes an Adversary if exposed."
            ),
            loreMerit(
                "Spiritual Assault",
                5,
                "Gain 2 automatic successes when you or someone you advise uses Oblivion Ceremonies against hostile ghosts."
            )
        ]
    },
    {
        title: "Child of the Angel Michael",
        summary:
            "A Nephilim cultist pursuing beauty, perfection, hedonism, and the dream of a restored Constantinople.",
        source: "Blood Gods p229",
        requirementFunctions: [isNotClan("Nosferatu")],
        merits: [
            loreMerit(
                "The Great and the Good",
                1,
                "Distribute 2 dots among Contacts, Fame, Herd, and Influence, attracting fanatical admirers."
            ),
            loreMerit(
                "Outer Beauty",
                2,
                "Gain 4 dots of Looks even after character creation, but your appearance becomes memorable."
            ),
            loreMerit(
                "Hedonistic Pleasure",
                3,
                "Gain 2 dice to find drugs, partners, or parties, and take either Fame 2 or Status 2."
            ),
            loreMerit(
                "Michael's Calling",
                4,
                "Once per story, use another cult member's relevant Backgrounds as your own."
            ),
            loreMerit(
                "Wiping Away the Stains",
                5,
                "Once per story, spend Willpower and a hedonistic hour to remove another vampire's Stain."
            )
        ]
    },
    {
        title: "Servitor of Irad",
        summary:
            "A deep-cover cultist serving the Antediluvians by weakening elders, shattering alliances, and sowing division.",
        source: "Blood Gods p230",
        requirementFunctions: [],
        merits: [
            loreMerit("Shield of Irad", 1, "Gain 1 die when lying to other Kindred."),
            loreMerit(
                "Sword of Irad",
                2,
                "Once per story, add 3 dice to a roll central to your cult's plans."
            ),
            loreMerit(
                "Know the Will of the Ancients",
                3,
                "Gain an extra infiltration-related Conviction sustained by the cult instead of a Touchstone."
            ),
            loreMerit(
                "Do the Will of the Ancients",
                4,
                "Once per story, ignore your clan Bane while acting as a Servitor."
            ),
            loreMerit(
                "Kill Thy Brother",
                5,
                "Once per story, gain 2 dice to inflict aggravated damage on a vampire and ignore fire frenzy for that attack."
            )
        ]
    },
    {
        title: "The Promise of 1528",
        summary:
            "Forbidden knowledge of the expiring pact between the Giovanni and the Camarilla, useful in legal and political pressure.",
        source: "Blood Gods p231",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Legal Scholar",
                1,
                "Gain 2 dice to Persuasion in legal disputes with Camarilla or Hecata Kindred."
            ),
            loreMerit(
                "Scrap of Information",
                2,
                "Once per story, share research notes for a temporary Background dot and a future major boon."
            ),
            loreMerit(
                "Tick Tock",
                3,
                "Once per story, secure a faction audience and 2 automatic successes when leveraging Promise knowledge."
            ),
            loreMerit(
                "Faulty Memory",
                4,
                "Once per story, add 3 dice when a resurfaced memory of the Promise would help."
            ),
            loreMerit(
                "Signatory",
                5,
                "Once per chronicle, force a Camarilla Prince or Hecata anziani to change a ruling in your favor."
            )
        ]
    },
    {
        title: "Annabelle",
        summary:
            "A link to Chicago's Toreador Primogen, her parties, media ties, art patronage, and long Primogen influence.",
        source: "Chicago by Night p262",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Intern",
                1,
                "Once per story, ask Annabelle for guidance, whether or not her help is cleanly beneficial."
            ),
            loreMerit(
                "Glitterati",
                2,
                "Once per story, get yourself onto an event guest list through your name or fame."
            ),
            loreMerit(
                "With Thanks to Our Donors",
                3,
                "Once per story, Annabelle arranges a meeting with someone important in art, media, or culture."
            ),
            loreMerit(
                "Patronage",
                4,
                "Once per story, performing or selling art through Annabelle raises Resources by 1 for the story."
            ),
            loreMerit(
                "Inner Circle",
                5,
                "Once per story, have Annabelle bring an issue of your choice before the Primogen council."
            )
        ]
    },
    {
        title: "Ballard Industries",
        summary:
            "Access to Horatio Ballard's corporate empire, legal machinery, police leverage, and Ventrue financial power.",
        source: "Chicago by Night p263",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Deep Pockets",
                1,
                "Once per story, restore Resources after an event reduces them."
            ),
            loreMerit(
                "Where the In-Crowd Goes",
                2,
                "Once per story, invoke Ballard influence for 3 dice in a corporate social test, or risk a breach for automatic success."
            ),
            loreMerit(
                "I Fought the Law, and I Won",
                3,
                "Always have access to Police Influence 3 in your home state or district."
            ),
            loreMerit(
                "Favors for Favors",
                4,
                "Spend resources for an SPC to create a debt and gain leverage enforcing repayment."
            ),
            loreMerit(
                "The View from the Top",
                5,
                "Run part of Ballard's empire, gaining major Backgrounds and business enemies."
            )
        ]
    },
    {
        title: "Blacksite 24",
        summary:
            "Knowledge of FIRSTLIGHT's hidden Illinois detention and research site for captured vampires.",
        source: "Chicago by Night p264",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Rumors",
                1,
                "Once per story, receive one possibly unreliable rumor about suspicious disappearances."
            ),
            loreMerit(
                "No, Really!",
                2,
                "Once per story, receive a solid piece of information about what you witnessed."
            ),
            loreMerit(
                "Paranoia Strikes Deep",
                3,
                "Once per story, use Contacts 4 focused on FIRSTLIGHT or similar hunter operations."
            ),
            loreMerit(
                "It's My Job To Know This Stuff",
                4,
                "Gain Kindred Status 2 and mortal Influence 2 from your specialist security knowledge."
            ),
            loreMerit(
                "The One That Got Away",
                5,
                "You escaped Blacksite 24, can recover one clear memory per story, and resist FIRSTLIGHT-induced Rotschreck."
            )
        ]
    },
    {
        title: "The Blue Velvet",
        summary:
            "A place in Bronwyn's legendary Chicago club, its history, guest traffic, stage, VIP access, and secret patronage.",
        source: "Chicago by Night p266",
        requirementFunctions: [],
        merits: [
            loreMerit("Est. 1972", 1, "Gain 2 dice to recall or use Blue Velvet history."),
            loreMerit(
                "Who's Who",
                2,
                "Once per story, learn when a club regular last visited, how they behaved, and who they met."
            ),
            loreMerit(
                "Standing Gig",
                3,
                "Once per story while performing at the club, gain temporary Resources 3 or Herd 3."
            ),
            loreMerit(
                "VIP Club",
                4,
                "Count Bronwyn as a 4-dot Ally or Mawla and gain private VIP access."
            ),
            loreMerit(
                "Backstage Pass",
                5,
                "Once per story, request Bronwyn's aid with money, influence, or club access."
            )
        ]
    },
    {
        title: "The Book of Nod",
        summary:
            "Study, fragments, and authority around Cainite scripture, Noddist prophecy, and the forbidden history of Caine.",
        source: "Chicago by Night p267",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Precis",
                1,
                "Once per story, add 2 dice to Academics or Occult about ancient Cainite history."
            ),
            loreMerit(
                "Well-versed",
                2,
                "Once per story, seek a sire or Mawla's help for 2 dice to Noddist Occult."
            ),
            loreMerit(
                "Scholar",
                3,
                "Once per session, add 3 dice to Persuasion when debating the Book of Nod."
            ),
            loreMerit(
                "Collector",
                4,
                "Once per story, grant access to your collection for temporary resources or a future favor."
            ),
            loreMerit(
                "Noddist Master",
                5,
                "Once per story, cite a fact or prophecy to automatically succeed at an appropriate Persuasion test."
            )
        ]
    },
    {
        title: "Capone Gang",
        summary:
            "Membership, favors, and criminal access through Eddie Wu's vampiric continuation of Capone's Chicago underworld.",
        source: "Chicago by Night p268",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "A Favor for a Favor",
                1,
                "Once per story, use Capone Gang Contacts and Allies for illegal goods, information, or services."
            ),
            loreMerit(
                "In Debt",
                2,
                "Once per story, have the gang solve a major problem, then owe Eddie a favor."
            ),
            loreMerit(
                "Just One Job",
                3,
                "Join a planned heist and gain Resources 3 after a successful job."
            ),
            loreMerit(
                "One of Us",
                4,
                "Gain Resources 2, Capone Gang Allies 2, and 1 die to Streetwise about organized crime."
            ),
            loreMerit(
                "Prodigal Child",
                5,
                "Gain Capone Gang Contacts 4, Eddie Wu as Mawla 2, and a gang safehouse haven, while owing loyalty."
            )
        ]
    },
    {
        title: "The Cobweb",
        summary:
            "A Malkavian's psychic tie to the Madness Network, from stray impressions to direct communion with the mind inside it.",
        source: "Chicago by Night p270",
        requirementFunctions: [isClan("Malkavian")],
        merits: [
            loreMerit(
                "A Break in the Static",
                1,
                "Catch brief Malkavian Network impressions, enough to understand an order or call for aid."
            ),
            loreMerit(
                "Step into My Parlor",
                2,
                "Communicate nearby through the Network using short phrases, images, and emotions."
            ),
            loreMerit(
                "Across the Web",
                3,
                "Hold citywide Malkavian conversations and once per story initiate the Call."
            ),
            loreMerit(
                "Pluck the Strands",
                4,
                "Once per story, observe through the senses of your sire or childe."
            ),
            loreMerit(
                "Malkav's Will",
                5,
                "Once per story, ask for a secret about another Malkavian or the Network entity's orders."
            )
        ]
    },
    {
        title: "Cultivar",
        summary:
            "A follower shaped by Nerissa Blackwater's Lilith cult into a weapon for the Ancestor and the New Garden.",
        source: "Chicago by Night p271",
        requirementFunctions: [],
        merits: [
            loreMerit("Dark Seedling", 1, "Once per story, call on Cultivar mortal Allies 2."),
            loreMerit(
                "Fresh Cutting",
                2,
                "Gain an Occult specialty in Bahari, Lilith, or the Ancestor and Status 1 with the Cultivars."
            ),
            loreMerit(
                "Suppressing the Beast",
                3,
                "Gain Herd 3 and a once-per-story Haven 1 from cultists, but may never feed from animals again."
            ),
            loreMerit(
                "Newly Made Initiate",
                4,
                "Gain Cultivar Status 3 and once per story add 2 dice to a Willpower roll by recalling your initiation."
            ),
            loreMerit(
                "Jewel in the Garden",
                5,
                "Gain 4 dice to resist frenzy, while maintaining a Garden and answering the cult's summons."
            )
        ]
    },
    {
        title: "Cult of Shalim",
        summary:
            "A Lasombra doomsday faith devoted to the annihilating peace of the Abyss and the end of reality.",
        source: "Chicago by Night p272",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Dark Whispers",
                1,
                "Once per story, gain 2 dice to investigate or identify the cult."
            ),
            loreMerit(
                "Cult Initiate",
                2,
                "Use the cult phrase to gain 2 dice when persuading an initiated member for aid."
            ),
            loreMerit(
                "Power of Faith",
                3,
                "Ignore Impairment penalties while in a church or temple."
            ),
            loreMerit(
                "Crush the Dreams of Life",
                4,
                "Read a target's ambition, exploit it socially, and potentially break their hopes for the story."
            ),
            loreMerit(
                "Shalim Is",
                5,
                "Gain Herd 2, religious Influence 3, a Dark Secret, and automatic success hiding cult membership with Composure."
            )
        ]
    },
    {
        title: "Descendant of Lodin",
        summary:
            "A Ventrue scion of Chicago's fallen prince, inheriting his bloodline's authority, secrets, enemies, and survival instinct.",
        source: "Chicago by Night p273",
        requirementFunctions: [isClan("Ventrue")],
        merits: [
            loreMerit("Baby of the Family", 1, "Among Chicago Ventrue, always have Mawla 1."),
            loreMerit(
                "Responsible Middle Childe",
                2,
                "Among peers of similar age and generation, always carry Status 2."
            ),
            loreMerit(
                "Black Sheep of the Family",
                3,
                "Once per story, learn a secret about one of Lodin's childer."
            ),
            loreMerit(
                "Like Sire, Like Childe",
                4,
                "Gain 2 dice to avoid physical or supernatural injury outside direct physical conflict."
            ),
            loreMerit(
                "Long-Lost Relative",
                5,
                "Gain Ventrue and court Status 4, social attention, and a seat at the Prince's table."
            )
        ]
    },
    {
        title: "Fires and Floods and Devil's Night",
        summary:
            "Experience with Chicago's disasters, the undead politics hidden in them, and the opportunities they created.",
        source: "Chicago by Night p275",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Trivia Buff",
                1,
                "Gain 2 dice to Academics or Investigation about Chicago disasters."
            ),
            loreMerit(
                "Old Bones",
                2,
                "Once per story, hide in an old rebuilt-over part of the city to shake pursuit."
            ),
            loreMerit(
                "Devil's Night Survivor",
                3,
                "Once per story, add 3 dice to Social rolls with fire survivors or their childer."
            ),
            loreMerit(
                "Local Hero",
                4,
                "Once per chronicle, gain temporary Influence 5 to sway mortal opinion through disaster goodwill."
            ),
            loreMerit(
                "Puppetmaster",
                5,
                "Work with the Storyteller to define the disaster you helped orchestrate and what you gained from it."
            )
        ]
    },
    {
        title: "FIRSTLIGHT",
        summary:
            "Operational knowledge, countermeasures, and inside help against the intelligence coalition hunting vampires.",
        source: "Chicago by Night p276",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Evasion Tactics",
                1,
                "Gain 1 die to avoid surveillance, tails, or recording."
            ),
            loreMerit(
                "Branch Office",
                2,
                "Know the location of the nearest FIRSTLIGHT base of operations."
            ),
            loreMerit(
                "What Do They Know",
                3,
                "Once per story, ask what information FIRSTLIGHT has on you or a coterie-mate."
            ),
            loreMerit(
                "No Records Found",
                4,
                "Gain 3 dice to Larceny, Stealth, or Survival when handling FIRSTLIGHT operations."
            ),
            loreMerit(
                "Friend on the Inside",
                5,
                "A mole warns you of actions against you and once per story performs minor sabotage."
            )
        ]
    },
    {
        title: "Kevin Jackson",
        summary:
            "Service to Chicago's Prince, with access to his masks, ghouls, influence, gang network, and political favor.",
        source: "Chicago by Night p277",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "New Blood",
                1,
                "Once per story, use a specially built 2-dot Mask backed by Jackson's Influence."
            ),
            loreMerit(
                "Recent Graduate",
                2,
                "Gain a 2-dot Retainer ghoul who teaches Chicago and assists your assigned duties."
            ),
            loreMerit(
                "Up and Comer",
                3,
                "Gain Influence 3 in one of Jackson's interests and once per story invoke him for automatic social success."
            ),
            loreMerit(
                "Adjutant",
                4,
                "Once per story, call on the Bloods as Allies 3 and Contacts 2 for an upcoming scene."
            ),
            loreMerit(
                "The Prince's Lieutenant",
                5,
                "Gain Kevin Jackson as Mawla 4 and once per story request permission to Embrace a chosen mortal."
            )
        ]
    },
    {
        title: "Kindred Iconography",
        summary:
            "Mastery of vampire symbols, fashion, graffiti, and clan imagery as a practical visual language.",
        source: "Chicago by Night p278",
        requirementFunctions: [],
        merits: [
            loreMerit("Iconographer", 1, "Gain 2 dice to Academics involving Kindred symbols."),
            loreMerit(
                "The Writing on the Wall",
                2,
                "Gain 3 dice to Streetwise when reading local vampire signs in public art and markings."
            ),
            loreMerit(
                "Trendsetter",
                3,
                "Gain 2 dice to Social rolls while dressed in your clan or affiliation imagery."
            ),
            loreMerit(
                "Graffiti Artist",
                4,
                "Gain 3 dice to Craft rolls involving Kindred iconography."
            ),
            loreMerit(
                "Giorgio Who?",
                5,
                "Once per story, your design grants Status 2 or your critique removes Status 1 for a session."
            )
        ]
    },
    {
        title: "The Labyrinth",
        summary:
            "Access to Chicago's abandoned underground superstation, its hidden communities, rumors, parties, oracles, and safe routes.",
        source: "Chicago by Night p279",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Tunnel Access",
                1,
                "Use a safe Labyrinth path to hide or escape, as long as you do not stray."
            ),
            loreMerit(
                "Boxcar Blues",
                2,
                "Gain Performance and Streetwise specialties for decoding Labyrinth folk songs and rumors."
            ),
            loreMerit(
                "Church",
                3,
                "Know and can attend the monthly underground club night with a plus one."
            ),
            loreMerit("Lydia's Lair", 4, "Gain access to Lydia the oracle as a 4-dot Mawla."),
            loreMerit(
                "Hideout",
                5,
                "Gain Labyrinth Kindred Community Allies 4 for protection and hiding."
            )
        ]
    },
    {
        title: "Lupine Expert",
        summary:
            "Rare survival-tested knowledge of werewolves, from tracking and tactics to parley between Lupines and Kindred.",
        source: "Chicago by Night p280",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Huntsman",
                1,
                "Once per session, gain 3 dice to a Mental test to pursue Lupines."
            ),
            loreMerit(
                "Tactician",
                2,
                "Against Lupines, your group can always use Teamwork, with everyone contributing one die."
            ),
            loreMerit(
                "Soldier",
                3,
                "When shifted Lupines fight you physically, their claw and bite damage modifier is reduced."
            ),
            loreMerit(
                "Trophy",
                4,
                "Once per story, reveal a werewolf trophy to force a Lupine to flee or focus only on you."
            ),
            loreMerit(
                "Ambassador",
                5,
                "Gain 2 dice to broker vampire-werewolf cooperation and once per chronicle unite them for a shared task."
            )
        ]
    },
    {
        title: "Nathaniel Bordruff",
        summary:
            "A dangerous association with a bitter Nosferatu elder conspiring to expose and destroy Kindred society.",
        source: "Chicago by Night p281",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Recruit",
                1,
                "Gain Bordruff as Mawla 2, but accept a one-step Blood Bond to him."
            ),
            loreMerit(
                "Collaborator",
                2,
                "Gain Resources 1 and Status 1 through favors that deepen Bordruff's hold."
            ),
            loreMerit(
                "Accomplice",
                3,
                "Gain a secured-room Haven, consistory Contacts, and insight into Bordruff's anti-Kindred cause."
            ),
            loreMerit(
                "Conspirator",
                4,
                "Gain Allies 4 in Bordruff's ghoul church network devoted to destroying the undead."
            ),
            loreMerit(
                "Betrayer",
                5,
                "Choose whether to betray Bordruff or the Kindred, with major Status, Mawla, and enemy consequences."
            )
        ]
    },
    {
        title: "The Painted Lady",
        summary:
            "An invitation into Edith Beaubien's exclusive body-art, BDSM, and counterculture salon in Chicago.",
        source: "Chicago by Night p282",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Plus One",
                1,
                "After visiting as someone's guest, gain 2 dice to Persuasion and temporary Status with fans for a week."
            ),
            loreMerit(
                "Engraved Invitation",
                2,
                "Gain Painted Lady Enthusiasts Influence 2 and access to willing blood-play feeding."
            ),
            loreMerit(
                "Schedule an Appointment",
                3,
                "Attend weekly, gain a 2-dot Retainer admirer, and improve counterculture Status if you get work done."
            ),
            loreMerit(
                "VIP",
                4,
                "Gain Herd 3 and BDSM Community Contacts 2 through full VIP access."
            ),
            loreMerit(
                "A Beaubien Original",
                5,
                "Gain 2 dice to Streetwise and permanent Status among Painted Lady devotees and Chicago Kindred."
            )
        ]
    },
    {
        title: "Revenant Family: Ducheski",
        summary:
            "Tremere access to a declining revenant family of scholars, assistants, and occult inventors.",
        source: "Chicago by Night p283",
        requirementFunctions: [isClan("Tremere")],
        merits: [
            loreMerit(
                "Nourishing Blood",
                1,
                "Gain a Ducheski Retainer whose blood sustains without Blood Bond risk."
            ),
            loreMerit(
                "Personal Library",
                2,
                "Choose two scholarly skills; specialties in them grant 1 extra die through the revenant library."
            ),
            loreMerit(
                "Research Team",
                3,
                "Gain a Ducheski Retainer group and halve ritual-learning time once per story."
            ),
            loreMerit(
                "Ritual Assistant",
                4,
                "A revenant assistant reduces ritual difficulty by 1, with larger teams adding dice."
            ),
            loreMerit(
                "Ducheski Invention",
                5,
                "Own a custom Ducheski device that acts as a powerful specialty for one skill."
            )
        ]
    },
    {
        title: "The Society of St. Leopold",
        summary:
            "Inside knowledge of the Church's old vampire hunters and their modern role beside FIRSTLIGHT.",
        source: "Chicago by Night p285",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Postulant",
                1,
                "Once per story, ask for known information about the Society."
            ),
            loreMerit("Novice", 2, "Gain 2-dot Contacts in your former religious community."),
            loreMerit(
                "Brother or Sister",
                3,
                "Gain 2 dice to religious-district Academics and Occult and once per story find a church Haven 1."
            ),
            loreMerit(
                "Father or Mother",
                4,
                "Gain diocesan Influence 3 against the Society and Haven 2, but take Infamy."
            ),
            loreMerit(
                "Inquisitor",
                5,
                "Once per story, ask for true information about the Society and its current activities."
            )
        ]
    },
    {
        title: "Talley",
        summary:
            "A tie to the Lasombra assassin and bodyguard, his danger sense, secret channels, and professional violence.",
        source: "Chicago by Night p286",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Recognize the Signs",
                1,
                "Once per story, ask if an action is likely to cause severe social backlash."
            ),
            loreMerit(
                "Secret Communications",
                2,
                "Once per chronicle, claim a prominent Camarilla member as a 3-dot Mawla for a session."
            ),
            loreMerit(
                "Tangled Strings",
                3,
                "Gain 2 dice to detect manipulation and 2 dice to socially manipulate the manipulator."
            ),
            loreMerit(
                "Trained Killer",
                4,
                "Once per chronicle, Talley acts as Mawla 4 and grants access to his portable armory."
            ),
            loreMerit(
                "Personal Defender",
                5,
                "For one session, Talley serves as your silent bodyguard under contract."
            )
        ]
    },
    {
        title: "Wauneka",
        summary:
            "Trust and information from the Nosferatu's street-level whisper network of Chicago's unseen and discarded.",
        source: "Chicago by Night p287",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Secluded Meetup",
                1,
                "Once per story, meet Wauneka for one secret from his network."
            ),
            loreMerit(
                "Spy Paths",
                2,
                "Once per story, use hidden paths and vantage points to spy without being noticed."
            ),
            loreMerit(
                "Insider Connections",
                3,
                "Once per story, Wauneka provides a temporary inside Retainer 2 who can become a Contact."
            ),
            loreMerit(
                "Spy Skills",
                4,
                "Once per story, gain three secrets and receive Investigation and Insight specialties."
            ),
            loreMerit(
                "Darkest Whispers",
                5,
                "Gain Wauneka and his underground associates as Allies 3, and once per story advise a political move."
            )
        ]
    },
    {
        title: "Agent of Justicar Parr",
        summary:
            "Service as a trusted observer, investigator, or archon under Malkavian Justicar Juliette Parr.",
        source: "Fall of London p231",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Information Drop",
                1,
                "Once per story, ask for investigation-relevant information from Parr's network."
            ),
            loreMerit(
                "Camarilla Conditioning",
                2,
                "Gain 1 die to duty-related Willpower tests and to resist being intimidated or compelled away from duty."
            ),
            loreMerit(
                "Request Backup",
                3,
                "Once per story, call a 5-dot Ally for one scene of Camarilla support."
            ),
            loreMerit(
                "Favored Protege",
                4,
                "Count Parr as a 5-dot Mawla, but she makes frequent possessive demands."
            ),
            loreMerit(
                "Camarilla Archon",
                5,
                "Hold an Archon's warrant demanding Camarilla cooperation, attracting respect, resentment, and enemies."
            )
        ]
    },
    {
        title: "Court of Shadows",
        summary:
            "Service to London's King of Shadows, gaining food, rumors, contraband, sanctuary, and rare personal favor.",
        source: "Fall of London p232",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Free Meals",
                1,
                "Once per session, receive a willing compatible vessel from the Court."
            ),
            loreMerit(
                "Rumor Mill",
                2,
                "Once per session, trade useful information for rumors or services."
            ),
            loreMerit(
                "Contraband",
                3,
                "Once per story, source illegal drugs, weapons, explosives, or similar goods for a price."
            ),
            loreMerit(
                "Sanctuary",
                4,
                "Once per story, ask the Court to hide you safely in one of the King's secret sites."
            ),
            loreMerit(
                "Favored by the King",
                5,
                "Once per story, call on the King of Shadows directly for materially useful aid."
            )
        ]
    },
    {
        title: "Hunt Club",
        summary:
            "Membership in London's secret Kindred-hunting society, infamous for sport hunts and diablerie.",
        source: "Fall of London p233",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Huntsman's Newsletter",
                1,
                "Receive notice of Blood Hunts and important hunting opportunities once per story."
            ),
            loreMerit(
                "Experienced Diablerist",
                2,
                "Gain 1 die to future diablerie absorption rolls, while risking visible aura stains."
            ),
            loreMerit(
                "Huntsman's Dossier",
                3,
                "Once per story, ask the club for a named local Kindred's whereabouts or favorite haunts."
            ),
            loreMerit(
                "Huntsman's Steed",
                4,
                "Own a plain, reinforced hunting vehicle designed to contain Kindred prey."
            ),
            loreMerit(
                "Leader of the Hunt",
                5,
                "Once per story, name a Kindred quarry for organized harassment and attacks by the Hunt Club."
            )
        ]
    },
    {
        title: "London Under London",
        summary:
            "Nosferatu mastery of London's tunnels, stations, service shafts, vermin, bolt-holes, and unseen routes.",
        source: "Fall of London p234",
        requirementFunctions: [isClan("Nosferatu")],
        merits: [
            loreMerit(
                "Tube Safety",
                1,
                "Use station knowledge to pass through or hunt in the Tube undetected on a successful Stealth test."
            ),
            loreMerit(
                "Somewhere to Hide",
                2,
                "Find a concealed underground hiding place with a successful Larceny test."
            ),
            loreMerit(
                "Network of Vermin",
                3,
                "Find underground animals more easily and gain 1 die to relevant Animalism powers below London."
            ),
            loreMerit(
                "Personal Bolt-Hole",
                4,
                "Maintain a secret mundane underground haven and storage site."
            ),
            loreMerit(
                "Freedom of the City",
                5,
                "Once per story, travel between surface locations through underground routes without ground-level detection."
            )
        ]
    },
    {
        title: "Operation Antigen",
        summary:
            "Contacts, leverage, and false access inside the anti-vampire operation that purged London.",
        source: "Fall of London p235",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Early Warning",
                1,
                "Once, an insider warns you if Antigen plans to capture you."
            ),
            loreMerit(
                "Tactical Dossier",
                2,
                "Use Antigen procedures to outwit them for one scene before they adapt."
            ),
            loreMerit(
                "Sympathetic Insider",
                3,
                "Once per story, ask a cautious 4-dot Contact about Antigen activity."
            ),
            loreMerit(
                "Get Out of Jail Free",
                4,
                "Blackmail a senior Antigen figure for one major service, then land on their watch list."
            ),
            loreMerit(
                "Official Credentials",
                5,
                "Use false Antigen credentials once to command personnel, seize evidence, or infiltrate an operation."
            )
        ]
    },
    {
        title: "Oskar Anasov",
        summary:
            "A working relationship with London's Nosferatu messenger, smuggler, compact enforcer, and Landlord convener.",
        source: "Fall of London p236",
        requirementFunctions: [],
        merits: [
            loreMerit(
                "Messaging Service",
                1,
                "Pay Anasov to deliver secure messages to other London Kindred."
            ),
            loreMerit(
                "Personal Introduction",
                2,
                "Once per story, pay Anasov to arrange a face-to-face meeting with a London Kindred."
            ),
            loreMerit(
                "Safe Passage",
                3,
                "Once per story, have Anasov smuggle up to six people into or out of London."
            ),
            loreMerit(
                "Mentor",
                4,
                "Count Anasov as a 4-dot Mawla with discounted services and recurring requests."
            ),
            loreMerit(
                "Landlord Council",
                5,
                "Receive invitations to Landlord meetings and once per story ask Anasov to convene one with cause."
            )
        ]
    }
    // {
    //     title: "Sample",
    //     summary: "Sample",
    //     source: "Core V5 p394",
    //     requirementFunctions: [],
    //     merits: [
    //         { name: "Sample", cost: [1], summary: "SampleSummary" },
    //         { name: "Sample", cost: [2], summary: "SampleSummary" },
    //         { name: "Sample", cost: [3], summary: "SampleSummary" },
    //         { name: "Sample", cost: [4], summary: "SampleSummary" },
    //         { name: "Sample", cost: [5], summary: "SampleSummary" },
    //     ]
    // },
]
