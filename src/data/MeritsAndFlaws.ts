import { Character } from "./Character"
import { ClanName } from "./Clans"


export type MeritOrFlaw = { name: string, cost: number[], summary: string }

export type MeritsAndFlaws = {
    title: string,
    merits: MeritOrFlaw[]
    flaws: MeritOrFlaw[]
}

export const meritsAndFlaws: MeritsAndFlaws[] = [
    {
        title: "💄 Looks",
        merits: [
            { name: "Beautiful", cost: [2], summary: "+1 die in Social rolls" },
            { name: "Stunning", cost: [4], summary: "+2 dice in Social rolls" },
        ],
        flaws: [
            { name: "Ugly", cost: [1], summary: "-1 die in Social rolls" },
            { name: "Repulsive", cost: [2], summary: "-2 dice in Social rolls" },
        ]
    },
    {
        title: "🏠 Haven",
        merits: [
            { name: "Haven", cost: [1, 2, 3], summary: "secure homebase" },
            { name: "Hidden Armory", cost: [1], summary: "weapons and armor in your haven" },
            { name: "Watchmen", cost: [1], summary: "mortal security guards" },
            { name: "Luxury", cost: [1], summary: "+2 Dice on Social rolls in your haven" },
        ],
        flaws: [
            { name: "No Haven", cost: [1], summary: "you don't have a home" },
            { name: "Haunted", cost: [1], summary: "ghostly presence in your haven" },
            { name: "Compromised", cost: [2], summary: "your haven is on a watchlist" },
        ]
    },
    {
        title: "💰 Resources",
        merits: [{ name: "Resources", cost: [1, 2, 3, 4, 5], summary: "wealth & income" }],
        flaws: [{ name: "Destitute", cost: [1], summary: "poor & no income" }]
    },
    {
        title: "🩸 Feeding",
        merits: [
            { name: "Bloodhound", cost: [1], summary: "smell resonance in mortal blood" },
            { name: "Iron Gullet", cost: [3], summary: "able to feed on rancid blood" },
        ],
        flaws: [
            { name: "Prey Exclusion", cost: [1], summary: "can't feed on certain types of people" },
            { name: "Methusela's Thirst", cost: [1], summary: "can't fully satiate on mortal blood" },
            { name: "Farmer", cost: [2], summary: "feeding on non-animal blood costs you 2 willpower" },
            { name: "Organovore", cost: [2], summary: "your hunger demands human flesh and organs" },
        ]
    },
    {
        title: "🕰 Keeping up with the times",
        merits: [],
        flaws: [
            { name: "Living in the Past", cost: [1], summary: "you have outdated views" },
            { name: "Archaic", cost: [1], summary: "Technology skill stuck at 0" },
        ]
    },
    {
        title: "🌙 Mythic",
        merits: [{ name: "Eat Food", cost: [1], summary: "can consume normal food" },],
        flaws: [
            { name: "Folkloric Bane", cost: [1], summary: "specific items damage you (eg. silver, garlic)" },
            { name: "Folkloric Block", cost: [1], summary: "must spend willpower to move past specific block (eg. running water, door uninvited)" },
            { name: "Stigmata", cost: [1], summary: "bleed from your hands, feet and forehead when at Hunger 4" },
            { name: "Stake Bait", cost: [1], summary: "Final Death when staked" },
        ]
    },
    {
        title: "👺 Mask",
        merits: [{ name: "Mask", cost: [1, 2], summary: "fake identity with fake documents" },],
        flaws: [
            { name: "Known Corpse", cost: [1], summary: "others know you're dead" },
            { name: "Known Blankbody", cost: [2], summary: "Certain governments / organizations know you're a vampire" },
        ]
    },
    {
        title: "🗣 Linguistics",
        merits: [{ name: "Linguistics", cost: [1], summary: "fluently speak another language" },],
        flaws: [{ name: "Illiterate", cost: [1], summary: "can't read and write" },]
    },
    {
        title: "🧛 Kindred",
        merits: [
            { name: "Mawla", cost: [1, 2, 3, 4, 5], summary: "kindred mentor to advise or help you" },
            { name: "Status", cost: [1, 2, 3, 4, 5], summary: "positive reputation within a faction" },
        ],
        flaws: [
            { name: "Adversary", cost: [1], summary: "kindred enemy" },
            { name: "Suspect", cost: [1], summary: "bad reputation within a faction, -2 on Social tests with them" },
            { name: "Shunned", cost: [2], summary: "despised by a faction" },
        ]
    },
    {
        title: "👱 Mortals",
        merits: [
            { name: "Retainer", cost: [1, 3], summary: "loyal mortal servant" },
            { name: "Allies", cost: [1, 2, 3, 4, 5], summary: "group of mortals to advise or help you" },
            { name: "Contacts", cost: [1, 2, 3], summary: "mortals who provide information or valuable items" },
            { name: "Herd", cost: [1], summary: "group of mortals who let you feed" },
        ],
        flaws: [
            { name: "Stalkers", cost: [1], summary: "unwanted mortal followers" },
            { name: "Enemy", cost: [1, 2], summary: "group of mortals that want to harm you" },
            { name: "Obvious Predator", cost: [1], summary: "mortals are scared of you, can't keep Herd" },
        ]
    }
]

export type RequirementFunction = (character: Character) => boolean

export type Loresheet = {
    title: string
    summary: string
    source: string
    requirementFunctions: RequirementFunction[]
    merits: MeritOrFlaw[]
}

// Requirement function generators
const isClan = (clan: ClanName) => (character: Character) => character.clan === clan

export const loresheets: Loresheet[] = [
    {
        title: "The Bahari",
        summary: "Adherents to the Path of Lilith who seek enlightenment through pain and conflict. They have low compassion, engage in fleshly pleasures and form strict parenthood relationships over lesser Kindred.",
        source: "Core V5 p382",
        requirementFunctions: [],
        merits: [
            { name: "Dangerous Reputation", cost: [1], summary: "Once per story, add 2 dice to intimidation against Caine-Worshippers." },
            { name: "Ritual Scarification", cost: [2], summary: "Once per session, scar yourself with 1 aggravated dmg to recover 1 aggravated willpower." },
            { name: "Sacrifice the Children", cost: [3], summary: "If you diablerize your childe, add 3 dice to your Resolve + Humanity + Blood Potency roll to absorb disciplines." },
            { name: "The Womb's Blood", cost: [4], summary: "Once per story, drink blood from an uterus to receive +2 Stamina or Resolve until dawn." },
            { name: "First-Cursed", cost: [5], summary: "Walk in first hour of daylight in the morning and before sunset, engage in intercourse without Blush of Life, gain 'Obvious Predator' flaw, Slander social tests against you have -1 difficulty, Vampires using Auspex against you have half Resolve and Willpower until end of scene." },
        ]
    },
    {
        title: "Theo Bell",
        summary: "Theo is a former Camarilla lapdog who defected to the Anarch after killing Hardestadt at the Convention of Prague. He inspired countless Brujah to overthrough Camarilla Princes to form Anarch bastions and now acts as liasion between high-status Camarilla and Anarch.",
        source: "Core V5 p383",
        requirementFunctions: [],
        merits: [
            { name: "Rebel Cell", cost: [1], summary: "Once per story, command rebellious mortals (3 dot Ally equivalent) to do one dangerous task for you without your presence." },
            { name: "True Anarch", cost: [2], summary: "Get 2 automatic successes on any Investigation roll concerning Vampires who defected to the Anarch Movement." },
            { name: "Contact Information", cost: [3], summary: "Get a message to Theo Bell. Effects on the game depend on the Story Teller." },
            { name: "Bell's Circle", cost: [4], summary: "Gain Theo Bell as a 5 dot Mawla, but your association with him also has drawbacks." },
            { name: "Sect Neutrality", cost: [5], summary: "You have a small group of loyal Brujah followers who you can influence in any direction (Camarilla, Anarch, independent group). Until they rebel against you, spend 5 dots among Contacts, Haven (safe houses), Mawla and Retainers." },
        ]
    },
    {
        title: "Cainite Heresy",
        summary: "Members of the Cainite Heresy believe Caine was the true messiah and Christ was his Second Coming. Vampires are his angels on Earth.",
        source: "Core V5 p384",
        requirementFunctions: [],
        merits: [
            { name: "Let He Who Hath Understanding", cost: [1], summary: "Once per story, the Storyteller will give you one free clue to investigate the Heresy's plans now or in the past." },
            { name: "Hand of the Heresy", cost: [2], summary: "Take a total of three dots among Allies, Herd, Mawla or Retainers to represent your role in the city's Heresy group. Also take the Dark Secret (Heresy) flaw." },
            { name: "Counter-Inquisition", cost: [3], summary: "Smell True Faith on humans" },
            { name: "Red Celebrant", cost: [4], summary: "Once per story, perform an elaborate ritual to trigger something akin to frenzy in a group of humans." },
            { name: "The One Named in Prophecy", cost: [5], summary: "You're an essential member of the Heresy. Once per story, use this fact to determine the winner of a Social conflict if you can make a plausible argument for it." },
        ]
    },
    {
        title: "Carna",
        summary: "Carna is a powerful Tremere who has formed her own House to oppose the Tremere Pyramid. She fights for modernization and women's rights.",
        source: "Core V5 p385",
        requirementFunctions: [],
        merits: [
            { name: "Embrace the Vision", cost: [1], summary: "When around members of House Carna, gain 1 die to all Willpower tests." },
            { name: "The Rebel Trail", cost: [2], summary: "When you're at risk of becoming Blood Bound, make a Willpower test against the Blood Potency of the ingested vitae to ignore it." },
            { name: "Unorthodox Rituals", cost: [3], summary: "Once per story, perform a known ritual without expending blood. On a messy critical you become deranged in some way until the end of the story." },
            { name: "Reimagined Bond", cost: [4], summary: "Form mutual Blood Bonds between yourself, your partner and Carna (even though she's absent) when having sex. Lasts until end of the story." },
            { name: "Book of the Grave-War", cost: [5], summary: "Gain one automatic success on all Occult tests regarding Gehenna and breaking shackles binding Vampires to their elders. Become immune to Blood Bonds. Tremere seek to destroy you and the book." },
        ]
    },
    {
        title: "The Circulatory System",
        summary: "The Circulatory System is a human trafficking ring looking for the tastiest blood and exploring Resonances.",
        source: "Core V5 p386",
        requirementFunctions: [],
        merits: [
            { name: "Tap into the System", cost: [1], summary: "Once per story, request specific blood vessels from the Circulatory System." },
            { name: "Little Black Book", cost: [2], summary: "Gain one die to Investigation, Alchemy, Medicine and Science rolls regarding tracking down or testing specific blood. Research new 2 dot and 3 dot thin-blood Alchemy at double speed." },
            { name: "Farm Upstate", cost: [3], summary: "You know about a farm of mortals with potent blood (Equivalent to Herd 4). You can feed on them once a week or attack the farm and take full control." },
            { name: "Secure Transit", cost: [4], summary: "Gain access to armed, secure transport vans." },
            { name: "Blood Sommelier", cost: [5], summary: "Add 2 dice to any test to discover the Resonance of blood and select 3 dots of Contacts, Allies or Haven Merits to explain your knowledge. Once per story, ask the Story Teller the properties of the most valuable vessel's blood." },
        ]
    },
    {
        title: "Convention of Thorns",
        summary: "You have deep historical knowledge of the Convention of Thorns, where the Camarilla was founded and the Traditions were set in stone.",
        source: "Core V5 p387",
        requirementFunctions: [],
        merits: [
            { name: "Thorns Historian", cost: [1], summary: "You know details of the many small agreements made at the Convention of Thorns and can use them to apply legal pressure. Once per story, ask the Storyteller for a piece of known information regarding the convention." },
            { name: "Tradition Master", cost: [2], summary: "Once per Chronicle, exercise fringe laws in domains where ruling clans may be sympathetic to unaccepted Traditions of Thorns." },
            { name: "Convention Secrets", cost: [3], summary: "Gain 1 die on Social tests involving Kindred who were present at the Convention. You know secrets that may be worth a Major Boon to a powerful vampire. Once the story, ask the Storyteller for the name of a kindred who needs your knowledge." },
            { name: "Prospective Justicar", cost: [4], summary: "You have powerful support for becoming the next Justicar of your clan." },
            { name: "New Traditions", cost: [5], summary: "You can propose a new tradition or alteration to an existing one. Your voice will be heard by the Camarila's inner circle without prior judgement." },
        ]
    },
    {
        title: "The First Inquisition",
        summary: "You have special information on the First Inquisition that burned many vampires in the middle ages, and you can use that knowledge to manipulate or avoid the Second Inquisition of current times.",
        source: "Core V5 p388",
        requirementFunctions: [],
        merits: [
            { name: "Mistakes of the Past", cost: [1], summary: "Once per story, ask the Storyteller for one piece of information regarding the First Inquisition." },
            { name: "Names of the Guilty", cost: [2], summary: "Once per story, ask the Storyteller for the name of one descendant of a traitor vampire, who sold others out to the First Inquisition, in your domain (if there is one)." },
            { name: "The Sect of St. James", cost: [3], summary: "Once per story, use an abbot connected to remnants of the First Inquisition as 4 dot Contact." },
            { name: "The Second Act", cost: [4], summary: "You have a Contact within the Second Inquisition. You have no power over them, but you can get information from them or feed them disinformation." },
            { name: "Black Spot", cost: [5], summary: "You know a place in your domain that the Second Inquisition will not enter. But what is so holy or unholy about this place that they won't dare enter?" },
        ]
    },
    {
        title: "Golconda",
        summary: "Golconda is a mythical enlightenment that vampires can supposedly reach. It is rumored to provide powerful benefits like quelling your inner beast and walking in sunlight.",
        source: "Core V5 p389",
        requirementFunctions: [],
        merits: [
            { name: "Seeds of Golconda", cost: [1], summary: "Once per session, ask the Storyteller if an action will jeopardize the chance of pursuing Golconda." },
            { name: "The One True Way", cost: [2], summary: "You own a pamphlet that, once per story, gives you 3 extra dice on a Social test involving the nature of Golconda." },
            { name: "Saulot's Disciple", cost: [3], summary: "Whenever you willingly frenzy, make a note. You can automatically succeed on your next frenzy test." },
            { name: "Satisfy the Hunger", cost: [4], summary: "Once per session, you can lower your Hunger by 1 (not below 1) without feeding." },
            { name: "Greet the Sun", cost: [5], summary: "Once per story, walk a day in sunlight. At nightfall of that day you go into Hunger frenzy." },
        ]
    },
    {
        title: "Descendant of Hardestadt",
        summary: "Hardestadt was the most important Ventrue for 800 years until Theo Bell killed him. He was the Ventrue founding member of the Camarilla.",
        source: "Core V5 p390",
        requirementFunctions: [isClan("Ventrue")],
        merits: [
            { name: "Voice of Hardestadt", cost: [1], summary: "You can speak over any noise and draw attention." },
            { name: "Supreme Leader", cost: [2], summary: "Once per story, take no penalty to your dice pool for sending people into danger." },
            { name: "Ventrue Pillar", cost: [3], summary: "You always have 3 dots of Status with Ventrue." },
            { name: "Line to the Founders", cost: [4], summary: "Once per chronicle, message one of the Camarilla's founders. If your request is important enough, they will respond." },
            { name: "Hardestadt's Heir", cost: [5], summary: "You have a signed document declaring you Hardestadt's heir. It says that when you take the name 'Hardestadt', the Camarilla will obey you and the Anarchs will swarm to take you down." },
        ]
    },
    // {
    //     title: "Sample",
    //     summary: "Sample",
    //     source: "Sample",
    //     requirementFunctions: [],
    //     merits: [
    //         { name: "Sample", cost: [1], summary: "SampleSummary" },
    //         { name: "Sample", cost: [2], summary: "SampleSummary" },
    //         { name: "Sample", cost: [3], summary: "SampleSummary" },
    //         { name: "Sample", cost: [4], summary: "SampleSummary" },
    //         { name: "Sample", cost: [5], summary: "SampleSummary" },
    //     ]
    // },
    // {
    //     title: "Sample",
    //     summary: "Sample",
    //     source: "Sample",
    //     requirementFunctions: [],
    //     merits: [
    //         { name: "Sample", cost: [1], summary: "SampleSummary" },
    //         { name: "Sample", cost: [2], summary: "SampleSummary" },
    //         { name: "Sample", cost: [3], summary: "SampleSummary" },
    //         { name: "Sample", cost: [4], summary: "SampleSummary" },
    //         { name: "Sample", cost: [5], summary: "SampleSummary" },
    //     ]
    // },
    // {
    //     title: "Sample",
    //     summary: "Sample",
    //     source: "Sample",
    //     requirementFunctions: [],
    //     merits: [
    //         { name: "Sample", cost: [1], summary: "SampleSummary" },
    //         { name: "Sample", cost: [2], summary: "SampleSummary" },
    //         { name: "Sample", cost: [3], summary: "SampleSummary" },
    //         { name: "Sample", cost: [4], summary: "SampleSummary" },
    //         { name: "Sample", cost: [5], summary: "SampleSummary" },
    //     ]
    // },
    // {
    //     title: "Sample",
    //     summary: "Sample",
    //     source: "Sample",
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