import { Character } from "./Character"
import { ClanName } from "./NameSchemas"

export type MeritOrFlaw = { name: string; cost: number[]; summary: string }

export type MeritsAndFlaws = {
    title: string
    merits: MeritOrFlaw[]
    flaws: MeritOrFlaw[]
}

export const thinbloodMeritsAndFlaws: MeritsAndFlaws = {
    title: "◐ Thin-blood specific",
    merits: [
        { name: "Anarch Comrades", cost: [1], summary: "A coterie of Anarchs considers you their pet" },
        {
            name: "Camarilla Contact",
            cost: [1],
            summary: "A Camarilla recruiter promises you admittance, but treats you badly and asks you to do tasks",
        },
        { name: "Catenating Blood", cost: [1], summary: "You can create blood bonds and embrace new Vampires" },
        {
            name: "Day Drinker",
            cost: [1],
            summary: "Walking in the sun doesn't damage you, but removes all your Vampiric abilities and halves your health",
        },
        { name: "Discipline Affinity", cost: [1], summary: "Pick a Discipline (lv1) that you can increase like a normal Vampire" },
        { name: "Lifelike", cost: [1], summary: "Your body appears fully human, with a beating heart and a working stomach" },
        { name: "Thin-blood Alchemist", cost: [1], summary: "Gain one dot and one formula in Thin-blood Alchemy" },
        { name: "Vampiric Resilience", cost: [1], summary: "Suffer only superficial damage from most sources, like a normal Vampire" },
    ],
    flaws: [
        { name: "Baby Teeth", cost: [1], summary: "Your teeth are useless for feeding, you need to cut your victims" },
        { name: "Bestial Temper", cost: [1], summary: "Be weak to frenzy like a normal vampire" },
        { name: "Branded by the Camarilla", cost: [1], summary: "The Camarilla have their eyes peeled on you" },
        { name: "Shunned by the Anarchs", cost: [1], summary: "Anarchs shun you" },
        { name: "Clan Curse", cost: [1], summary: "Pick a Clan Curse (severity 1)" },
        { name: "Dead Flesh", cost: [1], summary: "Your flesh slowly rots, -1 to social tests with Mortals" },
        { name: "Mortal Frailty", cost: [1], summary: "Cannot rouse your blood to heal yourself" },
        { name: "Vitae Dependency", cost: [1], summary: "Need to drink Vampire vitae once a week to use Disciplines" },
    ],
}
export const isThinbloodMerit = (m: string) => !!thinbloodMeritsAndFlaws.merits.find((tbm) => tbm.name === m)
export const isThinbloodFlaw = (f: string) => !!thinbloodMeritsAndFlaws.flaws.find((tbf) => tbf.name === f)
export const isThinbloodMeritOrFlaw = (mf: string) => isThinbloodMerit(mf) || isThinbloodFlaw(mf)

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
        ],
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
            {
                name: "Creepy",
                cost: [1],
                summary: "your haven looks like the den of a serial killer, neighbors might phone in a tip to the police",
            },
            { name: "Compromised", cost: [2], summary: "your haven is on a watchlist" },
        ],
    },
    {
        title: "💰 Resources",
        merits: [
            {
                name: "Resources",
                cost: [1, 2, 3, 4, 5],
                summary: "wealth & income, 1 - you can afford basics, 5 - you can afford anything money can buy",
            },
        ],
        flaws: [{ name: "Destitute", cost: [1], summary: "poor & no income" }],
    },
    {
        title: "🩸 Feeding",
        merits: [
            { name: "Bloodhound", cost: [1], summary: "smell resonance in mortal blood" },
            {
                name: "High-functioning addict",
                cost: [1],
                summary: "add a die to one category of pool (choose once) when the last person you fed from was on your drug",
            },
            { name: "Iron Gullet", cost: [3], summary: "able to feed on rancid blood" },
        ],
        flaws: [
            { name: "Prey Exclusion", cost: [1], summary: "can't feed on certain types of people" },
            { name: "Methusela's Thirst", cost: [1], summary: "can't fully satiate on mortal blood" },
            { name: "Farmer", cost: [2], summary: "feeding on non-animal blood costs you 2 willpower" },
            { name: "Organovore", cost: [2], summary: "your hunger demands human flesh and organs" },
            { name: "Addiction", cost: [1], summary: "-1 die on all pools if the last person you fed from wasn't on your drug" },
            { name: "Hopeless Addiction", cost: [2], summary: "-2 dice on all pools if the last person you fed from wasn't on your drug" },
        ],
    },
    {
        title: "🕰 Keeping up with the times",
        merits: [],
        flaws: [
            { name: "Living in the Past", cost: [1], summary: "you have outdated views & convictions" },
            { name: "Archaic", cost: [1], summary: "Technology skill stuck at 0" },
        ],
    },
    {
        title: "🌙 Mythic",
        merits: [{ name: "Eat Food", cost: [2], summary: "can consume normal food" }],
        flaws: [
            { name: "Folkloric Bane", cost: [1], summary: "specific items damage you (eg. silver, garlic)" },
            {
                name: "Folkloric Block",
                cost: [1],
                summary: "must spend willpower to move past specific block (eg. running water, door uninvited)",
            },
            { name: "Stigmata", cost: [1], summary: "bleed from your hands, feet and forehead when at Hunger 4" },
            { name: "Stake Bait", cost: [2], summary: "Final Death when staked" },
        ],
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
        ],
    },
    {
        title: "🗣 Linguistics",
        merits: [{ name: "Linguistics", cost: [1], summary: "fluently speak another language" }],
        flaws: [{ name: "Illiterate", cost: [2], summary: "Can't read or write, Academics and Science capped at 1" }],
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
            {
                name: "Dark Secret",
                cost: [1, 2],
                summary:
                    "You have a dark secret, like owing a debt to bad people or having escaped a blood hunt for masquerade breaching in another city",
            },
        ],
    },
    {
        title: "⛓️ Bonding",
        merits: [],
        flaws: [
            { name: "Long Bond", cost: [1], summary: "blood bonds on you take longer to wane" },
            { name: "Bond Junkie", cost: [1], summary: "lose one die on all actions that go against your blood bond" },
            { name: "Bondslave", cost: [2], summary: "blood bonds on you are created on the first drink" },
        ],
    },
    {
        title: "👱 Mortals",
        merits: [
            { name: "Retainer", cost: [1, 2, 3], summary: "loyal mortal servant, 1 - weak lowlife, 3 - skilled professional retainer" },
            { name: "Allies", cost: [1, 2, 3, 4, 5], summary: "group of mortals to advise or help you" },
            { name: "Contacts", cost: [1, 2, 3], summary: "mortals who provide information or valuable items" },
            {
                name: "Herd",
                cost: [1, 2, 3, 4, 5],
                summary:
                    "group of mortals who let you feed, 1 - a couple of people, 5 - large group and you can freely pick desired resonances",
            },
            {
                name: "Fame",
                cost: [1, 2, 3, 4, 5],
                summary: "1 - a select subculture loves you, 5 - you are well known and loved globally",
            },
        ],
        flaws: [
            { name: "Stalkers", cost: [1], summary: "unwanted mortal followers" },
            { name: "Enemy", cost: [1, 2], summary: "group of mortals that want to harm you" },
            { name: "Obvious Predator", cost: [2], summary: "mortals are scared of you, can't keep Herd" },
            {
                name: "Infamy",
                cost: [1, 2, 3, 4, 5],
                summary: "1 - a select subculture despises you, 5 - you are well known and hated globally",
            },
        ],
    },
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
        summary:
            "Adherents to the Path of Lilith who seek enlightenment through pain and conflict. They have low compassion, engage in fleshly pleasures and form strict parenthood relationships over lesser Kindred.",
        source: "Core V5 p382",
        requirementFunctions: [],
        merits: [
            { name: "Dangerous Reputation", cost: [1], summary: "Once per story, add 2 dice to intimidation against Caine-Worshippers." },
            {
                name: "Ritual Scarification",
                cost: [2],
                summary: "Once per session, scar yourself with 1 aggravated dmg to recover 1 aggravated willpower.",
            },
            {
                name: "Sacrifice the Children",
                cost: [3],
                summary: "If you diablerize your childe, add 3 dice to your Resolve + Humanity + Blood Potency roll to absorb disciplines.",
            },
            {
                name: "The Womb's Blood",
                cost: [4],
                summary: "Once per story, drink blood from an uterus to receive +2 Stamina or Resolve until dawn.",
            },
            {
                name: "First-Cursed",
                cost: [5],
                summary:
                    "Walk in first hour of daylight in the morning and before sunset, engage in intercourse without Blush of Life, gain 'Obvious Predator' flaw, Slander social tests against you have -1 difficulty, Vampires using Auspex against you have half Resolve and Willpower until end of scene.",
            },
        ],
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
            },
            {
                name: "True Anarch",
                cost: [2],
                summary: "Get 2 automatic successes on any Investigation roll concerning Vampires who defected to the Anarch Movement.",
            },
            {
                name: "Contact Information",
                cost: [3],
                summary: "Get a message to Theo Bell. Effects on the game depend on the Story Teller.",
            },
            {
                name: "Bell's Circle",
                cost: [4],
                summary: "Gain Theo Bell as a 5 dot Mawla, but your association with him also has drawbacks.",
            },
            {
                name: "Sect Neutrality",
                cost: [5],
                summary:
                    "You have a small group of loyal Brujah followers who you can influence in any direction (Camarilla, Anarch, independent group). Until they rebel against you, spend 5 dots among Contacts, Haven (safe houses), Mawla and Retainers.",
            },
        ],
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
            },
            {
                name: "Hand of the Heresy",
                cost: [2],
                summary:
                    "Take a total of three dots among Allies, Herd, Mawla or Retainers to represent your role in the city's Heresy group. Also take the Dark Secret (Heresy) flaw.",
            },
            { name: "Counter-Inquisition", cost: [3], summary: "Smell True Faith on humans" },
            {
                name: "Red Celebrant",
                cost: [4],
                summary: "Once per story, perform an elaborate ritual to trigger something akin to frenzy in a group of humans.",
            },
            {
                name: "The One Named in Prophecy",
                cost: [5],
                summary:
                    "You're an essential member of the Heresy. Once per story, use this fact to determine the winner of a Social conflict if you can make a plausible argument for it.",
            },
        ],
    },
    {
        title: "Carna",
        summary:
            "Carna is a powerful Tremere who has formed her own House to oppose the Tremere Pyramid. She fights for modernization and women's rights.",
        source: "Core V5 p385",
        requirementFunctions: [],
        merits: [
            { name: "Embrace the Vision", cost: [1], summary: "When around members of House Carna, gain 1 die to all Willpower tests." },
            {
                name: "The Rebel Trail",
                cost: [2],
                summary:
                    "When you're at risk of becoming Blood Bound, make a Willpower test against the Blood Potency of the ingested vitae to ignore it.",
            },
            {
                name: "Unorthodox Rituals",
                cost: [3],
                summary:
                    "Once per story, perform a known ritual without expending blood. On a messy critical you become deranged in some way until the end of the story.",
            },
            {
                name: "Reimagined Bond",
                cost: [4],
                summary:
                    "Form mutual Blood Bonds between yourself, your partner and Carna (even though she's absent) when having sex. Lasts until end of the story.",
            },
            {
                name: "Book of the Grave-War",
                cost: [5],
                summary:
                    "Gain one automatic success on all Occult tests regarding Gehenna and breaking shackles binding Vampires to their elders. Become immune to Blood Bonds. Tremere seek to destroy you and the book.",
            },
        ],
    },
    {
        title: "The Circulatory System",
        summary: "The Circulatory System is a human trafficking ring looking for the tastiest blood and exploring Resonances.",
        source: "Core V5 p386",
        requirementFunctions: [],
        merits: [
            {
                name: "Tap into the System",
                cost: [1],
                summary: "Once per story, request specific blood vessels from the Circulatory System.",
            },
            {
                name: "Little Black Book",
                cost: [2],
                summary:
                    "Gain one die to Investigation, Alchemy, Medicine and Science rolls regarding tracking down or testing specific blood. Research new 2 dot and 3 dot thin-blood Alchemy at double speed.",
            },
            {
                name: "Farm Upstate",
                cost: [3],
                summary:
                    "You know about a farm of mortals with potent blood (Equivalent to Herd 4). You can feed on them once a week or attack the farm and take full control.",
            },
            { name: "Secure Transit", cost: [4], summary: "Gain access to armed, secure transport vans." },
            {
                name: "Blood Sommelier",
                cost: [5],
                summary:
                    "Add 2 dice to any test to discover the Resonance of blood and select 3 dots of Contacts, Allies or Haven Merits to explain your knowledge. Once per story, ask the Story Teller the properties of the most valuable vessel's blood.",
            },
        ],
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
            },
            {
                name: "Tradition Master",
                cost: [2],
                summary:
                    "Once per Chronicle, exercise fringe laws in domains where ruling clans may be sympathetic to unaccepted Traditions of Thorns.",
            },
            {
                name: "Convention Secrets",
                cost: [3],
                summary:
                    "Gain 1 die on Social tests involving Kindred who were present at the Convention. You know secrets that may be worth a Major Boon to a powerful vampire. Once the story, ask the Storyteller for the name of a kindred who needs your knowledge.",
            },
            { name: "Prospective Justicar", cost: [4], summary: "You have powerful support for becoming the next Justicar of your clan." },
            {
                name: "New Traditions",
                cost: [5],
                summary:
                    "You can propose a new tradition or alteration to an existing one. Your voice will be heard by the Camarila's inner circle without prior judgement.",
            },
        ],
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
                summary: "Once per story, ask the Storyteller for one piece of information regarding the First Inquisition.",
            },
            {
                name: "Names of the Guilty",
                cost: [2],
                summary:
                    "Once per story, ask the Storyteller for the name of one descendant of a traitor vampire, who sold others out to the First Inquisition, in your domain (if there is one).",
            },
            {
                name: "The Sect of St. James",
                cost: [3],
                summary: "Once per story, use an abbot connected to remnants of the First Inquisition as 4 dot Contact.",
            },
            {
                name: "The Second Act",
                cost: [4],
                summary:
                    "You have a Contact within the Second Inquisition. You have no power over them, but you can get information from them or feed them disinformation.",
            },
            {
                name: "Black Spot",
                cost: [5],
                summary:
                    "You know a place in your domain that the Second Inquisition will not enter. But what is so holy or unholy about this place that they won't dare enter?",
            },
        ],
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
                summary: "Once per session, ask the Storyteller if an action will jeopardize the chance of pursuing Golconda.",
            },
            {
                name: "The One True Way",
                cost: [2],
                summary:
                    "You own a pamphlet that, once per story, gives you 3 extra dice on a Social test involving the nature of Golconda.",
            },
            {
                name: "Saulot's Disciple",
                cost: [3],
                summary: "Whenever you willingly frenzy, make a note. You can automatically succeed on your next frenzy test.",
            },
            {
                name: "Satisfy the Hunger",
                cost: [4],
                summary: "Once per session, you can lower your Hunger by 1 (not below 1) without feeding.",
            },
            {
                name: "Greet the Sun",
                cost: [5],
                summary: "Once per story, walk a day in sunlight. At nightfall of that day you go into Hunger frenzy.",
            },
        ],
    },
    {
        title: "Descendant of Hardestadt",
        summary:
            "Hardestadt was the most important Ventrue for 800 years until Theo Bell killed him. He was the Ventrue founding member of the Camarilla.",
        source: "Core V5 p390",
        requirementFunctions: [isClan("Ventrue")],
        merits: [
            { name: "Voice of Hardestadt", cost: [1], summary: "You can speak over any noise and draw attention." },
            {
                name: "Supreme Leader",
                cost: [2],
                summary: "Once per story, take no penalty to your dice pool for sending people into danger.",
            },
            { name: "Ventrue Pillar", cost: [3], summary: "You always have 3 dots of Status with Ventrue." },
            {
                name: "Line to the Founders",
                cost: [4],
                summary:
                    "Once per chronicle, message one of the Camarilla's founders. If your request is important enough, they will respond.",
            },
            {
                name: "Hardestadt's Heir",
                cost: [5],
                summary:
                    "You have a signed document declaring you Hardestadt's heir. It says that when you take the name 'Hardestadt', the Camarilla will obey you and the Anarchs will swarm to take you down.",
            },
        ],
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
            },
            {
                name: "Real Talent",
                cost: [2],
                summary:
                    "Choose one of Craft, Etiquette or Performance. Increasing this Skill costs half as many XP as usually (rounded down).",
            },
            {
                name: "Embrace the Stereotypes",
                cost: [3],
                summary:
                    "Once per story, host a party to increase your Status or Influence by two dots with an invited group. The increase lasts until the party ends.",
            },
            { name: "Divine Purity", cost: [4], summary: "Add 2 dice to all tests to avoid blame for your actions." },
            {
                name: "Succubus Club Franchise",
                cost: [5],
                summary:
                    "Open a franchise of the famous Succubus Club. While it's open, gain 2 dots to your coterie's domain's Chasse rating. Select four dots among Resources, Fame and Status among all Vampires.",
            },
        ],
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
                summary: "Once per story, ask the Storyteller for a piece of information relating to the sect war in your domain.",
            },
            { name: "Active Participant", cost: [2], summary: "Take 3 dots of Status or Mawla related to your veteran status." },
            {
                name: "Trophy Kill",
                cost: [3],
                summary:
                    "Once per story, use the legend of you killing a well known Vampire during the war to bypass a contest where it might assist.",
            },
            {
                name: "No Vampire's Land",
                cost: [4],
                summary:
                    "Add 2 dots to your Domain's Portillon, add 2 dice to Streetwise, Larceny and Stealth tests in your and 2 neighboring domains regarding using hidden sanctuaries, armories, tunnel networks and side streets.",
            },
            { name: "Sect Agitator", cost: [5], summary: "Add 2 dice to all Social tests to inflame sectarian tension." },
        ],
    },
    {
        title: "The Trinity",
        summary:
            "The Trinity of Michael, Antonius and The Dracon were the leaders of Constantinople during the Golden Age where Vampires of all believes could exist in harmony. This utopia was broken apart by the Crusades, a Methusela's mania and Setite corruption, turning the Trinity against each other. Many yearn for their return to their former glory.",
        source: "Core V5 p393",
        requirementFunctions: [],
        merits: [
            { name: "Constantinople", cost: [1], summary: "Once per story, ask the Storyteller a question about Constantinople's past." },
            {
                name: "Antonius' Architecture",
                cost: [2],
                summary:
                    "Add 2 dice to any Politics test involving domain government. Once per story, mediate and calm any court debate, quashing violence with action and profundity.",
            },
            {
                name: "The Dream",
                cost: [3],
                summary:
                    "Add 1 die to any Insight test when trying to gauge another's Beast. Once per story, spend a Willpower point to allow another Vampire to re-roll up to 3 dice when resisting frenzy.",
            },
            {
                name: "The Dracon",
                cost: [4],
                summary: "Gain the Dracon as 5 dot Mawla. He can assisst you with spiritual and Discipline matters.",
            },
            {
                name: "The New Trinity",
                cost: [5],
                summary:
                    "You and two friends are prophecised to rebuild Constantinople into a new city. Once per story, remove up to 5 Stains you gained while pursuing this goal.",
            },
        ],
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
                summary: "You never have to wait in queue to enter The Asylum and you may hunt there twice per session (Difficulty 2).",
            },
            {
                name: "Performing Monkey",
                cost: [2],
                summary: "The sisters frequently give you missions that they generously reward with boons.",
            },
            {
                name: "Jeanette's Favorite",
                cost: [3],
                summary:
                    "Gain Jeanette as a 4 dot Mawla, but only for Malkavian and Anarch dealings. She lets you use the club to host parties, lets you rest there during days and does favors for you.",
            },
            {
                name: "Therese's Favorite",
                cost: [4],
                summary: "Gain Therese as a 3 dot Mawla. She speaks up for you in any regnum and can school you in business and finance.",
            },
            {
                name: "Asylum Operator",
                cost: [5],
                summary:
                    "Run a franchise of The Asylum in your domain. As long as it is open, spend 4 dots between Haven, Herd, Resources or Chasse of your Domain. If you want, your club can be an Elysium.",
            },
        ],
    },
    {
        title: "The Week of Nightmares",
        summary:
            "The red star Anthelios heralded the Week of Nightmares, where the Ravnos Antediluvian purged its own clan and thin-blooded Vampires emerged. You witnessed and survived the mania and now watch for signs of dooms to come.",
        source: "Core V5 p395",
        requirementFunctions: [],
        merits: [
            { name: "Oral History", cost: [1], summary: "Add 3 dice to Performance tests to tell the story of the Week of Nightmares." },
            {
                name: "Ravnos Remains",
                cost: [2],
                summary:
                    "Gain 3 dots of Mawla representing a group of Ravnos as contacts. They carry news and warnings to you and can be convinced to cast mightly illusions once per story.",
            },
            {
                name: "I Was There",
                cost: [3],
                summary:
                    "Once per story, use your status as a survivor to earn a minor boon from a Kindred historian, Ravnos or occultist.",
            },
            {
                name: "The Red Star",
                cost: [4],
                summary:
                    "Once per story, you can either reduce your hunger to 2 or gain 1 die to the pools of one Discipline for a night by staring at the star Anthelios for 10 minutes.",
            },
            {
                name: "Blood of Zapathasura",
                cost: [5],
                summary:
                    "You own a small vial containing the Blood of the Ravnos Antediluvian. What happens when it is imbibed is up to the Storyteller.",
            },
        ],
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
                summary: "Once per story, reroll any one Skill test dice pool when striking out against the establishment.",
            },
            {
                name: "Them and Theirs",
                cost: [2],
                summary: "You can feel when a Touchstone of any member of your coterie comes under threat, but you don't feel which one.",
            },
            {
                name: "Gangrel Advocate",
                cost: [3],
                summary:
                    "Add 1 die to Social tests with Gangrel. You can organize truce meetings between Gangrel and Camarilla representatives with a Charisma + Politics test. (Difficulty set by Storyteller)",
            },
            {
                name: "The Bear Pack",
                cost: [4],
                summary:
                    "Gain the Bear Pack as 3 dot Mawla. They can get in verbal and physical fights for you. Once per story, they and you get 1 automatic success when trying to rouse Anarchs against the establishment.",
            },
            {
                name: "Rudi's Army",
                cost: [5],
                summary:
                    "You hold sway over an army of revolutionaries that you can rile up against Vampire or Mortal governments. Split 5 points among Allies, Influence and Contacts, that can be directed, but never controlled.",
            },
        ],
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
                summary: "Once per story, add 2 dice to a roll to persuade a mortal crowd into violent action.",
            },
            {
                name: "Champion of the Cause",
                cost: [2],
                summary: "Gain 2 dots of Status with rebels during a rebellion. Rebels come to you looking for advice or leadership.",
            },
            {
                name: "Tyler's Mercy",
                cost: [3],
                summary: "Once per story, when frenzying, take a Brujah compulsion to immediately end your frenzy.",
            },
            {
                name: "The Furores",
                cost: [4],
                summary:
                    "Once per chronicle, the Furores arm you and you gain assets, influence, and surprise 5 dot Allies. Can only be used to attempt to take down a Prince, Baron or higher status Vampire.",
            },
            {
                name: "Permanent Revolution",
                cost: [5],
                summary:
                    "You have already taken down one Sect figurehead and continue your revolution. Anarchs stop to listen to you, Brujah Anarchs follow your every command.",
            },
        ],
    },
    {
        title: "Descendant of Zelios",
        summary:
            "A great Nosferatu Architect and planner who disappeared beneath New York in 1990. He is responsible for many Nosferatu labyrinths, dungeons and prisons.",
        source: "Core V5 p398",
        requirementFunctions: [isClan("Nosferatu")],
        merits: [
            { name: "Sanctuary", cost: [1], summary: "Split 2 dots among Haven-Postern and Haven-Security System." },
            {
                name: "Saboteur",
                cost: [2],
                summary:
                    "Collapse a building with merely a hammer over the course of as many nights as the Storyteller sets. (4 for a family home, 9 for a skyscraper)",
            },
            {
                name: "On Commission",
                cost: [3],
                summary:
                    "Gain one minor boon per story from a Vampire who asks you for advice on building their Haven. You know where many powerful Vampires sleep.",
            },
            {
                name: "The Labyrinth",
                cost: [4],
                summary:
                    "You have built a great maze beneath your domain. You can't use it as Haven as it terrifies you, but you can escape into it when chased and none can pursue you.",
            },
            {
                name: "Sense the Ley Lines",
                cost: [5],
                summary:
                    "You can sense Ley Lines. Sleeping near them allows Vampires to roll 2 dice and pick the highest on their rouse check when awakening.",
            },
        ],
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
                summary: "Once per session, while in a chaotic situation, re-roll 1 die without spending Willpower.",
            },
            {
                name: "Hear My Words",
                cost: [2],
                summary:
                    "Once per story, provide counsel to somebody in a chaotic situation. They may re-roll 1 die in a future test within the same situation.",
            },
            {
                name: "Scent the Bond",
                cost: [3],
                summary: "Once per story, roll Resolve + Awareness (Difficulty 4) to smell the Blood Bond on a bonded and bonding Vampire.",
            },
            {
                name: "Destroy the Bond",
                cost: [4],
                summary: "Drink a mouthful of a Vampires blood and ride out a frenzy to break a Blood Bond on them.",
            },
            {
                name: "Sabbat Becomes Camarilla",
                cost: [5],
                summary:
                    "Once per story, deprogram a Vampire from their sect beliefs. To do so, completely isolate them in an atmosphere of perfumes. Once per 3 nights, roll Intelligence or Charisma + Insight. You win after achieving a number of total successes equal to twice the subject's Willpower.",
            },
        ],
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
                summary: "Once per session, reroll a single die when commanding deference from one non-titled vampire in your domain.",
            },
            {
                name: "Sway the Low",
                cost: [2],
                summary:
                    "You have bullied Low Clan Vampires equivalent to 3 dots of Mawla into loyalty to you. Gain 3 extra dice to Intimidation or Leadership against those Vampires. If you ever roll a total failure on such a test you must compensate them or they turn on you.",
            },
            {
                name: "Elevate the Low",
                cost: [3],
                summary:
                    "Once per chronicle, raise a Low Clan Vampire into High Clan status. Gain 1 die on Social tests against Low Clan Vampires when you allude to elevating them.",
            },
            {
                name: "Embraced to Rule",
                cost: [4],
                summary:
                    "Add 1 die to Leadership tests involving High Clan Vampires. Once per story, other High Clan Vampires vote for you or allow you to take a position of power unless they have personal grievances with you.",
            },
            { name: "Blessed, not Cursed", cost: [5], summary: "Once per session, spend one Willpower to ignore your Clan Bane." },
        ],
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
                summary: "Once per story, ignore verbal attacks or provocations for a scene without rolling.",
            },
            {
                name: "Cursed with Pride",
                cost: [2],
                summary: "Once per story, gain an automatic success in a roll when incorporating your Clan Bane.",
            },
            { name: "Uncanny Kinship", cost: [3], summary: "Select 3 dots from Mawla or Statusfrom other Low Clans in the domain." },
            {
                name: "Trade Among Equals",
                cost: [4],
                summary:
                    "Select another Low Clan's Discipline. You can buy dots of that Discipline using experience points as if it was in-clan for you.",
            },
            {
                name: "Criticality Incident",
                cost: [5],
                summary:
                    "Add 1 die to all rolls for projects undermining High Clans in your domain. Once per chronicle, sacrifice 10 of your Background dots to bring down the same number of High Clan Vampires in a coup.",
            },
        ],
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
                summary: "Gain a 1 die bonus to tests for finding shared Kindred hiding places in your city.",
            },
            {
                name: "Clandestine Information",
                cost: [2],
                summary: "Once per story, get one piece of information stored online about a mortal within 2-20 hours.",
            },
            {
                name: "Taught by the Best",
                cost: [3],
                summary:
                    "Consider Ambrus a 3 dot Mawla. He can set you up with your personal hacker for 'friend prices' or get intel on a wide array of topics like SI dealings or the current fashion trends in obscure subcultures.",
            },
            {
                name: "Back Door Panopticon",
                cost: [4],
                summary:
                    "Once per story, log into a PRISM backdoor to get two automatic successes on any Investigation involving anyone's cell activity or online presence.",
            },
            {
                name: "On Another Grid Entirely",
                cost: [5],
                summary:
                    "Gain two 2 dot Mask cover identities, gain the Zeroed merit, get 3 extra dice to resist attempts to discover your online activities or your undertakings in the mortal world.",
            },
        ],
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
                summary: "Toreadors always lend you their ear when you speak of historic lore or mythic tales.",
            },
            {
                name: "The Art of Will",
                cost: [2],
                summary:
                    "Once per session, meditate before resting for the day and pass a Resolve + Academics test of difficulty 5 to awaken with an additional point of Willpower.",
            },
            {
                name: "Neillson Library",
                cost: [3],
                summary:
                    "Serve as curator to a hidden library which serves as a 2 dot Haven with a 2 dot Library. Other Vampires meet there as well.",
            },
            {
                name: "Interview With the Methuselah",
                cost: [4],
                summary: "Once per story, ask the Storyteller to provide you a secret about one of the clans in your domain.",
            },
            {
                name: "Ancestor's Tomb",
                cost: [5],
                summary:
                    "You are tasked with guarding the resting place of one of your ancestors. While you keep it safe, once per story, call upon Carmelita for a Major Boon. If you fail to guard the tomb, there will be consequences.",
            },
        ],
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
                summary: "Gain a Gifted Mortal Retainer (Bodyguard, Driver, Butler..) who openly spies on you for Fiorenza.",
            },
            {
                name: "Breakfast with Fiorenza",
                cost: [2],
                summary: "Once per story, meet Fiorenza. This can be lucrative or informative, if you ask the right questions.",
            },
            {
                name: "Friendly Benefits",
                cost: [3],
                summary:
                    "Gain Fiorenza as 3 dot Mawla who can provide you with insider trading tips, expensive cars or private planes or sweet-talk ruffled Ventrue for you. If you overuse or abuse this connection, she will cut you off.",
            },
            {
                name: "The Directorate",
                cost: [4],
                summary:
                    "Become Blood Bound to a shadowy Ventrue Directorate that wants you to break Fiorenza to their will. They provide you with 6 dots to spend among Contacts, Mawla and Resources.",
            },
            {
                name: "Government Motion",
                cost: [5],
                summary:
                    "Once per chronicle, Fiorenza will influence a Mortal political leader for you. This leads to you gaining 5 dice to distribute as you like among any roll involving government action.",
            },
        ],
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
                summary: "Once per story, ask the Storyteller for one piece of information about House Tremere before the Pyramid fell.",
            },
            {
                name: "Hardliner",
                cost: [2],
                summary: "With the Storyteller's agreement, add 2 dice to any test to resist attempts to sway you from Schrekt's goals.",
            },
            {
                name: "Ritual Preparedness",
                cost: [3],
                summary: "Once per story, perform one of your rituals in five minutes & without preparation.",
            },
            {
                name: "Archon's Bane",
                cost: [4],
                summary:
                    "Have a supernatural 4 dot Ally (Werewolf, Mage, Wraith, Changeling...) who is being hunted. Once per story, they come to your aid.",
            },
            {
                name: "Know the World",
                cost: [5],
                summary:
                    "Gain 3 dots in Haven-Library and pick 3 Specialties in Occult. Once per story, ask the Storyteller a simple question about non-Vampire supernatural creatures.",
            },
        ],
    },
    {
        title: "Descendant of Xaviar",
        summary:
            "Former Gangrel Justicar who saw his cotery eaten by an Antediluvian. He left the Camarilla because they ignored his warnings and died mysteriously soon after.",
        source: "Core V5 p406",
        requirementFunctions: [isClan("Gangrel")],
        merits: [
            { name: "Martyred Ancestor", cost: [1], summary: "Gain 2 dots of Status with other Gangrel in your domain." },
            {
                name: "Where the Bodies Are Buried",
                cost: [2],
                summary: "Make Resolve + Awareness check to detect Vampires merged or torpid in soil below you.",
            },
            {
                name: "Loyal Hound",
                cost: [3],
                summary:
                    "Spend 4 dots among Domain, Herd and Status. Non-Camarilla Gangrel despise you for staying loyal to the Camarilla.",
            },
            {
                name: "Monstrous Bat",
                cost: [4],
                summary:
                    "Once per story, turn into a man-sized bat. In this form, gain +1 to all Physical Attributes, glide in the air and do +1 Aggravated dmg with bites.",
            },
            {
                name: "Experienced the Antediluvian",
                cost: [5],
                summary:
                    "Once per story, while touching open ground, sense another Gangrels location and drain some vitae from the to reset your Hunger to 2.",
            },
        ],
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
            },
            {
                name: "Corpsense",
                cost: [2],
                summary:
                    "Gain 2 dice to any pool for investigating the cause of injury or death of a body. Wraiths can communicate with you more easily.",
            },
            {
                name: "Eye to Eye",
                cost: [3],
                summary: "Gain 2 dice to any Persuasion or Intimidation when talking to Ventrue.",
            },
            {
                name: "The Way of all Flesh",
                cost: [4],
                summary: "You can embrace old corpses unless they're rotted beyond recognition.",
            },
            {
                name: "Perchance to Dream",
                cost: [5],
                summary: "You can wander the Shadowlands while resting or while in torpor.",
            },
        ],
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
            },
            {
                name: "Ghostly Instincts",
                cost: [2],
                summary: "Gain 2 dice on any Oblivion Ceremony roll involving summoning, control or destruction of ghosts.",
            },
            {
                name: "Forward Thinking",
                cost: [3],
                summary:
                    "Once per story, you can reroll any Skill roll. Once per scene, you can reroll a skill roll against another Hecata, with +1 success if they're a Harbinger of Skulls.",
            },
            {
                name: "Necromantic Prodigy",
                cost: [4],
                summary: "Get +2 successes on any roll necessary for activating a necromantic Oblivion Ceremony.",
            },
            {
                name: "Next in Line",
                cost: [5],
                summary:
                    "Get 2 points of Status with Hecata, gain an Ally among the Anziani who acts as 5 dot Mawla once every other story.",
            },
        ],
    },
    {
        title: "Flesh-Eaters",
        summary: "The Nagaraja are flesh-eating Vampires. They are feared by many and often sadistic killers.",
        source: "Blood Gods p223",
        requirementFunctions: [isClan("Hecata")],
        merits: [
            {
                name: "Viscus",
                cost: [1],
                summary:
                    "Biting mortals and causing wounds acts like drinking blood for you, slaking your hunger. You can also eat fresh corpses.",
            },
            {
                name: "Unseen Spirit",
                cost: [2],
                summary:
                    "Gain the 'Cloak of Shadows' Discipline, but it only works against ghosts. If you already have Obfuscate, all your Obfuscate abilities work against ghosts as well.",
            },
            {
                name: "The Perfect Murder",
                cost: [3],
                summary:
                    "If you have at least one night to plan, gain +1 success on any roll during an intentional murder scene (can be negated by 'Send a Murderer')",
            },
            {
                name: "Send a Murderer",
                cost: [4],
                summary:
                    "Get +2 dice to rolls for studying murder scenes of tracking killers. Spend 3 dots among Contacts with mortal police, vampire investigators and Status.",
            },
            {
                name: "Monstrous Bite",
                cost: [5],
                summary:
                    "Your fangs can grow into daggers, giving you +1 success on Intimidation rolls, 3 bite damage and removes the 'called shot penalty' from bite attacks.",
            },
        ],
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
            },
            {
                name: "Faded Glamour",
                cost: [2],
                summary: "Once per session, add an automatic success to a social roll against another Hecata or their servants.",
            },
            {
                name: "Petty Cash",
                cost: [3],
                summary:
                    "Spend four dots among 'Resources' and 'Retainers'. Elder members of the family can take these from you at any time.",
            },
            {
                name: "Spectre Servant",
                cost: [4],
                summary:
                    "You gain a spectre to act as your servant (4 dot 'Ally', use stats from Core book p. 377) that you can summon once per session. It will arrive within 10 hours.",
            },
            {
                name: "Aspiring Anziani",
                cost: [5],
                summary: "Gain 5 dots of 'Status' among Hecata, and get a private audience with the Capuchin every few stories.",
            },
        ],
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
                summary: "You can easily identify the cause of death when inspecting a corpse (roll if it's magically concealed)",
            },
            {
                name: "Pound of Flesh",
                cost: [2],
                summary:
                    "If you accept a freely given gift, you and the giver receive a dice penalty based on each character's Bane Severity for one night.",
            },
            {
                name: "Treat Yourself",
                cost: [3],
                summary:
                    "Once per night, you can indulge in a vice just like a human would, without any of the usual vampiric downsides (eg. a meal, drinks, sex, a cigar)",
            },
            {
                name: "My Setite Friend",
                cost: [4],
                summary:
                    "You have a friend in the Ministry. Once per story, you can ask a favor that is as powerful as 3 dots in the appropriate Merits (Alles, Influence, Resources...)",
            },
            {
                name: "The Silk Hat",
                cost: [5],
                summary:
                    "You are next in the line of succession of the Baron. Before you step up into his position, you have him as a 5 dot Mawla (his help comes in cryptic and mysterious ways). If you take his place, it might just be a job, or maybe you gain his mystical powers. Either way, you certainly gain his enemies.",
            },
        ],
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
