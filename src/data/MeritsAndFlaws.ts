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
            { name: "Haven", cost: [1, 2, 3], summary: "secure homebase, 1 - apartment, 3 - big building" },
            { name: "Hidden Armory", cost: [1], summary: "weapons and armor in your haven" },
            { name: "Cell", cost: [1], summary: "you can imprison people in your haven" },
            { name: "Watchmen", cost: [1], summary: "mortal security guards" },
            { name: "Luxury", cost: [1], summary: "+2 Dice on Social rolls in your haven" },
        ],
        flaws: [
            { name: "No Haven", cost: [1], summary: "you don't have a home" },
            { name: "Haunted", cost: [1], summary: "ghostly presence in your haven" },
            { name: "Creepy", cost: [1], summary: "your haven looks like the den of a serial killer, neighbors might phone in a tip to the police" },
            { name: "Compromised", cost: [2], summary: "your haven is on a watchlist" },
        ]
    },
    {
        title: "💰 Resources",
        merits: [{ name: "Resources", cost: [1, 2, 3, 4, 5], summary: "wealth & income, 1 - you can afford basics, 5 - you can afford anything money can buy" }],
        flaws: [{ name: "Destitute", cost: [1], summary: "poor & no income" }]
    },
    {
        title: "🩸 Feeding",
        merits: [
            { name: "Bloodhound", cost: [1], summary: "smell resonance in mortal blood" },
            { name: "High-functioning addict", cost: [1], summary: "add a die to one category of pool (choose once) when the last person you fed from was on your drug" },
            { name: "Iron Gullet", cost: [3], summary: "able to feed on rancid blood" },
        ],
        flaws: [
            { name: "Prey Exclusion", cost: [1], summary: "can't feed on certain types of people" },
            { name: "Methusela's Thirst", cost: [1], summary: "can't fully satiate on mortal blood" },
            { name: "Farmer", cost: [2], summary: "feeding on non-animal blood costs you 2 willpower" },
            { name: "Organovore", cost: [2], summary: "your hunger demands human flesh and organs" },
            { name: "Addiction", cost: [1], summary: "-1 die on all pools if the last person you fed from wasn't on your drug" },
            { name: "Hopeless Addiction", cost: [2], summary: "-2 dice on all pools if the last person you fed from wasn't on your drug" },
        ]
    },
    {
        title: "🕰 Keeping up with the times",
        merits: [],
        flaws: [
            { name: "Living in the Past", cost: [1], summary: "you have outdated views & convictions" },
            { name: "Archaic", cost: [1], summary: "Technology skill stuck at 0" },
            { name: "Illiterate", cost: [2], summary: "Can't read or write, Academics and Science capped at 1" },
        ]
    },
    {
        title: "🌙 Mythic",
        merits: [{ name: "Eat Food", cost: [2], summary: "can consume normal food" },],
        flaws: [
            { name: "Folkloric Bane", cost: [1], summary: "specific items damage you (eg. silver, garlic)" },
            { name: "Folkloric Block", cost: [1], summary: "must spend willpower to move past specific block (eg. running water, door uninvited)" },
            { name: "Stigmata", cost: [1], summary: "bleed from your hands, feet and forehead when at Hunger 4" },
            { name: "Stake Bait", cost: [2], summary: "Final Death when staked" },
        ]
    },
    {
        title: "👺 Mask",
        merits: [
            { name: "Mask", cost: [1, 2], summary: "fake identity with fake documents, lv2 can pass background checks" },
            { name: "Zeroed", cost: [1], summary: "all your real records are purged, you officially don't exist" },
            { name: "Cobbler", cost: [1], summary: "You can make or source masks for others" },
        ],
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
            { name: "Dark Secret", cost: [1, 2], summary: "You have a dark secret, like owing a debt to bad people or having escaped a blood hunt for masquerade breaching in another city" },
        ]
    },
    {
        title: "⛓️ Bonding",
        merits: [],
        flaws: [
            { name: "Long Bond", cost: [1], summary: "blood bonds on you take longer to wane" },
            { name: "Bond Junkie", cost: [1], summary: "lose one die on all actions that go against your blood bond" },
            { name: "Bondslave", cost: [2], summary: "blood bonds on you are created on the first drink" },
        ]
    },
    {
        title: "👱 Mortals",
        merits: [
            { name: "Retainer", cost: [1, 2, 3], summary: "loyal mortal servant, 1 - weak lowlife, 3 - skilled professional retainer" },
            { name: "Allies", cost: [1, 2, 3, 4, 5], summary: "group of mortals to advise or help you" },
            { name: "Contacts", cost: [1, 2, 3], summary: "mortals who provide information or valuable items" },
            { name: "Herd", cost: [1, 2, 3, 4, 5], summary: "group of mortals who let you feed, 1 - a couple of people, 5 - large group and you can freely pick desired resonances" },
            { name: "Fame", cost: [1, 2, 3, 4, 5], summary: "1 - a select subculture loves you, 5 - you are well known and loved globally" },
        ],
        flaws: [
            { name: "Stalkers", cost: [1], summary: "unwanted mortal followers" },
            { name: "Enemy", cost: [1, 2], summary: "group of mortals that want to harm you" },
            { name: "Obvious Predator", cost: [2], summary: "mortals are scared of you, can't keep Herd" },
            { name: "Infamy", cost: [1, 2, 3, 4, 5], summary: "1 - a select subculture despises you, 5 - you are well known and hated globally" },
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
    {
        title: "Descendant of Helena",
        summary: "Core V5 p391",
        source: "Sample",
        requirementFunctions: [isClan("Toreador")],
        merits: [
            { name: "Skin-Deep", cost: [1], summary: "SampleSummary" },
            { name: "Real Talent", cost: [2], summary: "SampleSummary" },
            { name: "Embrace the Stereotypes", cost: [3], summary: "SampleSummary" },
            { name: "Divine Purity", cost: [4], summary: "SampleSummary" },
            { name: "Succubus Club Franchise", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "Sect War Veteran",
        summary: "Sample",
        source: "Core V5 p392",
        requirementFunctions: [],
        merits: [
            { name: "Survivor", cost: [1], summary: "SampleSummary" },
            { name: "Active Participant", cost: [2], summary: "SampleSummary" },
            { name: "Trophy Kill", cost: [3], summary: "SampleSummary" },
            { name: "No Vampire's Land", cost: [4], summary: "SampleSummary" },
            { name: "Sect Agitator", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "The Trinity",
        summary: "Sample",
        source: "Core V5 p393",
        requirementFunctions: [],
        merits: [
            { name: "Constantinople", cost: [1], summary: "SampleSummary" },
            { name: "Antonius' Architecture", cost: [2], summary: "SampleSummary" },
            { name: "The Dream", cost: [3], summary: "SampleSummary" },
            { name: "The Dracon", cost: [4], summary: "SampleSummary" },
            { name: "The New Trinity", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "Jeanette / Therese Voerman",
        summary: "Sample",
        source: "Core V5 p394",
        requirementFunctions: [],
        merits: [
            { name: "Asylum Membership", cost: [1], summary: "SampleSummary" },
            { name: "Performing Monkey", cost: [2], summary: "SampleSummary" },
            { name: "Jeanette's Favorite", cost: [3], summary: "SampleSummary" },
            { name: "Therese's Favorite", cost: [4], summary: "SampleSummary" },
            { name: "Asylum Operator", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "The Week of Nightmares",
        summary: "Sample",
        source: "Core V5 p395",
        requirementFunctions: [],
        merits: [
            { name: "Oral History", cost: [1], summary: "SampleSummary" },
            { name: "Ravnos Remains", cost: [2], summary: "SampleSummary" },
            { name: "I Was There", cost: [3], summary: "SampleSummary" },
            { name: "The Red Star", cost: [4], summary: "SampleSummary" },
            { name: "Blood of Zapathasura", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "Rudi",
        summary: "Sample",
        source: "Core V5 p396",
        requirementFunctions: [],
        merits: [
            { name: "Newfound Rights", cost: [1], summary: "SampleSummary" },
            { name: "Them and Theirs", cost: [2], summary: "SampleSummary" },
            { name: "Gangrel Advocate", cost: [3], summary: "SampleSummary" },
            { name: "The Bear Pack", cost: [4], summary: "SampleSummary" },
            { name: "Rudi's Army", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "Descendant of Tyler",
        summary: "Sample",
        source: "Core V5 p397",
        requirementFunctions: [isClan("Brujah")],
        merits: [
            { name: "Instigator", cost: [1], summary: "SampleSummary" },
            { name: "Champion of the Cause", cost: [2], summary: "SampleSummary" },
            { name: "Tyler's Mercy", cost: [3], summary: "SampleSummary" },
            { name: "The Furores", cost: [4], summary: "SampleSummary" },
            { name: "Permanent Revolution", cost: [5], summary: "SampleSummary" },
        ]
    },
    {
        title: "Descendant of Zelios",
        summary: "A great Nosferatu Architect and planner who disappeared beneath New York in 1990. He is responsible for many Nosferatu labyrinths, dungeons and prisons.",
        source: "Core V5 p398",
        requirementFunctions: [isClan("Nosferatu")],
        merits: [
            { name: "Sanctuary", cost: [1], summary: "Split 2 dots among Haven-Postern and Haven-Security System." },
            { name: "Saboteur", cost: [2], summary: "Collapse a building with merely a hammer over the course of as many nights as the Storyteller sets. (4 for a family home, 9 for a skyscraper)" },
            { name: "On Commission", cost: [3], summary: "Gain one minor boon per story from a Vampire who asks you for advice on building their Haven. You know where many powerful Vampires sleep." },
            { name: "The Labyrinth", cost: [4], summary: "You have built a great maze beneath your domain. You can't use it as Haven as it terrifies you, but you can escape into it when chased and none can pursue you." },
            { name: "Sense the Ley Lines", cost: [5], summary: "You can sense Ley Lines. Sleeping near them allows Vampires to roll 2 dice and pick the highest on their rouse check when awakening." },
        ]
    },
    {
        title: "Descendant of Vasantasena",
        summary: "A free-will-enthusiast who preached against the Blood Bond and traditional Vampire hierarchy in the middle ages. She is a former member of the Camarilla and the Sabbat and wants to fight the Antediluvians.",
        source: "Core V5 p399",
        requirementFunctions: [isClan("Malkavian")],
        merits: [
            { name: "Agent of Chaos", cost: [1], summary: "Once per session, while in a chaotic situation, re-roll 1 die without spending Willpower." },
            { name: "Hear My Words", cost: [2], summary: "Once per story, provide counsel to somebody in a chaotic situation. They may re-roll 1 die in a future test within the same situation." },
            { name: "Scent the Bond", cost: [3], summary: "Once per story, roll Resolve + Awareness (Difficulty 4) to smell the Blood Bond on a bonded and bonding Vampire." },
            { name: "Destroy the Bond", cost: [4], summary: "Drink a mouthful of a Vampires blood and ride out a frenzy to break a Blood Bond on them." },
            { name: "Sabbat Becomes Camarilla", cost: [5], summary: "Once per story, deprogram a Vampire from their sect beliefs. To do so, completely isolate them in an atmosphere of perfumes. Once per 3 nights, roll Intelligence or Charisma + Insight. You win after achieving a number of total successes equal to twice the subject's Willpower." },
        ]
    },
    {
        title: "High Clan",
        summary: "Even though 'High' and 'Low' clans were abolished with the formation of the Camarilla, in your domain these rules still hold to some degree. Historically, High Clans include the Lasombra, Toreador, Tzimisce and Ventrue, sometimes the Brujah and Hecata and rarely the Tremere. In other parts of the world, the Banu Haqim and Ministry are considered High Clans.",
        source: "Core V5 p400",
        requirementFunctions: [],
        merits: [
            { name: "Peacock", cost: [1], summary: "Once per session, reroll a single die when commanding deference from one non-titled vampire in your domain." },
            { name: "Sway the Low", cost: [2], summary: "You have bullied Low Clan Vampires equivalent to 3 dots of Mawla into loyalty to you. Gain 3 extra dice to Intimidation or Leadership against those Vampires. If you ever roll a total failure on such a test you must compensate them or they turn on you." },
            { name: "Elevate the Low", cost: [3], summary: "Once per chronicle, raise a Low Clan Vampire into High Clan status. Gain 1 die on Social tests against Low Clan Vampires when you allude to elevating them." },
            { name: "Embraced to Rule", cost: [4], summary: "Add 1 die to Leadership tests involving High Clan Vampires. Once per story, other High Clan Vampires vote for you or allow you to take a position of power unless they have personal grievances with you." },
            { name: "Blessed, not Cursed", cost: [5], summary: "Once per session, spend one Willpower to ignore your Clan Bane." },
        ]
    },
    {
        title: "Low Clan",
        summary: "You're a member of a Clan that is considered lowly in your domain (typically those are one or more of the Gangrel, Malkavians and Nosferatu. Sometimes also Brujah and Tremere). This means many treat you as less-than, but you also have access to rebels and counter culture.",
        source: "Core V5 p401",
        requirementFunctions: [],
        merits: [
            { name: "Thick Hide", cost: [1], summary: "Once per story, ignore verbal attacks or provocations for a scene without rolling." },
            { name: "Cursed with Pride", cost: [2], summary: "Once per story, gain an automatic success in a roll when incorporating your Clan Bane." },
            { name: "Uncanny Kinship", cost: [3], summary: "Select 3 dots from Mawla or Statusfrom other Low Clans in the domain." },
            { name: "Trade Among Equals", cost: [4], summary: "Select another Low Clan's Discipline. You can buy dots of that Discipline using experience points as if it was in-clan for you." },
            { name: "Criticality Incident", cost: [5], summary: "Add 1 die to all rolls for projects undermining High Clans in your domain. Once per chronicle, sacrifice 10 of your Background dots to bring down the same number of High Clan Vampires in a coup." },
        ]
    },
    {
        title: "Ambrus Maropis",
        summary: "A well liked trend-setter among Camarilla society. Many don't know he is a Nosferatu as he uses intermediaries to interact with Princes and Barons while remaining hidden himself. At heart, he is an introverted anime & gaming nerd and a skilled hacker and software developer.",
        source: "Core V5 p402",
        requirementFunctions: [],
        merits: [
            { name: "True Believer", cost: [1], summary: "Gain a 1 die bonus to tests for finding shared Kindred hiding places in your city." },
            { name: "Clandestine Information", cost: [2], summary: "Once per story, get one piece of information stored online about a mortal within 2-20 hours." },
            { name: "Taught by the Best", cost: [3], summary: "Consider Ambrus a 3 dot Mawla. He can set you up with your personal hacker for 'friend prices' or get intel on a wide array of topics like SI dealings or the current fashion trends in obscure subcultures." },
            { name: "Back Door Panopticon", cost: [4], summary: "Once per story, log into a PRISM backdoor to get two automatic successes on any Investigation involving anyone's cell activity or online presence." },
            { name: "On Another Grid Entirely", cost: [5], summary: "Gain two 2 dot Mask cover identities, gain the Zeroed merit, get 3 extra dice to resist attempts to discover your online activities or your undertakings in the mortal world." },
        ]
    },
    {
        title: "Carmelita Neillson",
        summary: "A Vampire-journalist chronicling the stories of ancient vampires and recording the history of Kindred society. Carmelita has established many hidden libraries in hidden locations. Carmelita is hired to debrief recently awoken Methuselahs, investigate ruined temples and interpreting Sabbat scripture.",
        source: "Core V5 p403",
        requirementFunctions: [],
        merits: [
            { name: "The Art of Story", cost: [1], summary: "Toreadors always lend you their ear when you speak of historic lore or mythic tales." },
            { name: "The Art of Will", cost: [2], summary: "Once per session, meditate before resting for the day and pass a Resolve + Academics test of difficulty 5 to awaken with an additional point of Willpower." },
            { name: "Neillson Library", cost: [3], summary: "Serve as curator to a hidden library which serves as a 2 dot Haven with a 2 dot Library. Other Vampires meet there as well." },
            { name: "Interview With the Methuselah", cost: [4], summary: "Once per story, ask the Storyteller to provide you a secret about one of the clans in your domain." },
            { name: "Ancestor's Tomb", cost: [5], summary: "You are tasked with guarding the resting place of one of your ancestors. While you keep it safe, once per story, call upon Carmelita for a Major Boon. If you fail to guard the tomb, there will be consequences." },
        ]
    },
    {
        title: "Fiorenza Savona",
        summary: "A relatively freshly turned Ventrue with massive sway among the Mortals of the political and business elite. She has her hands in NGOs, the UN and the Davos elite and likes to maintain rigid power structures.",
        source: "Core V5 p404",
        requirementFunctions: [],
        merits: [
            { name: "On Fiorenza's List", cost: [1], summary: "Gain a Gifted Mortal Retainer (Bodyguard, Driver, Butler..) who openly spies on you for Fiorenza." },
            { name: "Breakfast with Fiorenza", cost: [2], summary: "Once per story, meet Fiorenza. This can be lucrative or informative, if you ask the right questions." },
            { name: "Friendly Benefits", cost: [3], summary: "Gain Fiorenza as 3 dot Mawla who can provide you with insider trading tips, expensive cars or private planes or sweet-talk ruffled Ventrue for you. If you overuse or abuse this connection, she will cut you off." },
            { name: "The Directorate", cost: [4], summary: "Become Blood Bound to a shadowy Ventrue Directorate that wants you to break Fiorenza to their will. They provide you with 6 dots to spend among Contacts, Mawla and Resources." },
            { name: "Government Motion", cost: [5], summary: "Once per chronicle, Fiorenza will influence a Mortal political leader for you. This leads to you gaining 5 dice to distribute as you like among any roll involving government action." },
        ]
    },
    {
        title: "Descendant of Karl Schrekt",
        summary: "Hardcore-traditionalist & former Camarilla Justicar. Karl was a Vampire hunter before his embrace in 1235 and has gained massive respect as ruthless and strong enforcer of the Camarilla, hunting supernatural threats.",
        source: "Core V5 p405",
        requirementFunctions: [isClan("Tremere")],
        merits: [
            { name: "Remember the House", cost: [1], summary: "Once per story, ask the Storyteller for one piece of information about House Tremere before the Pyramid fell." },
            { name: "Hardliner", cost: [2], summary: "With the Storyteller's agreement, add 2 dice to any test to resist attempts to sway you from Schrekt's goals." },
            { name: "Ritual Preparedness", cost: [3], summary: "Once per story, perform one of your rituals in five minutes & without preparation." },
            { name: "Archon's Bane", cost: [4], summary: "Have a supernatural 4 dot Ally (Werewolf, Mage, Wraith, Changeling...) who is being hunted. Once per story, they come to your aid." },
            { name: "Know the World", cost: [5], summary: "Gain 3 dots in Haven-Library and pick 3 Specialties in Occult. Once per story, ask the Storyteller a simple question about non-Vampire supernatural creatures." },
        ]
    },
    {
        title: "Descendant of Xaviar",
        summary: "Former Gangrel Justicar who saw his cotery eaten by an Antediluvian. He left the Camarilla because they ignored his warnings and died mysteriously soon after.",
        source: "Core V5 p406",
        requirementFunctions: [isClan("Gangrel")],
        merits: [
            { name: "Martyred Ancestor", cost: [1], summary: "Gain 2 dots of Status with other Gangrel in your domain." },
            { name: "Where the Bodies Are Buried", cost: [2], summary: "Make Resolve + Awareness check to detect Vampires merged or torpid in soil below you." },
            { name: "Loyal Hound", cost: [3], summary: "Spend 4 dots among Domain, Herd and Status. Non-Camarilla Gangrel despise you for staying loyal to the Camarilla." },
            { name: "Monstrous Bat", cost: [4], summary: "Once per story, turn into a man-sized bat. In this form, gain +1 to all Physical Attributes, glide in the air and do +1 Aggravated dmg with bites." },
            { name: "Experienced the Antediluvian", cost: [5], summary: "Once per story, while touching open ground, sense another Gangrels location and drain some vitae from the to reset your Hunger to 2." },
        ]
    },
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