import { z } from "zod"
import banuHaqimLogo from "../resources/clanIcons/BanuHaqim.webp"
import brujahLogo from "../resources/clanIcons/Brujah.webp"
import gangrelLogo from "../resources/clanIcons/Gangrel.webp"
import hecataLogo from "../resources/clanIcons/Hecata.webp"
import lasombraLogo from "../resources/clanIcons/Lasombra.webp"
import malkavianLogo from "../resources/clanIcons/Malkavian.webp"
import ministryLogo from "../resources/clanIcons/Ministry.webp"
import nosferatuLogo from "../resources/clanIcons/Nosferatu.webp"
import ravnosLogo from "../resources/clanIcons/Ravnos.webp"
import salubriLogo from "../resources/clanIcons/Salubri.webp"
import caitiffLogo from "../resources/clanIcons/logoCaitiff.png"
import thinbloodLogo from "../resources/clanIcons/logoThinblood.png"
import toreadorLogo from "../resources/clanIcons/Toreador.webp"
import tremereLogo from "../resources/clanIcons/Tremere.webp"
import tzimisceLogo from "../resources/clanIcons/Tzimisce.webp"
import ventrueLogo from "../resources/clanIcons/Ventrue.webp"
import { ClanName, clanNameSchema, disciplineNameSchema } from "./NameSchemas"

export const clanSchema = z.object({
    name: clanNameSchema,
    description: z.string(),
    logo: z.string(),
    bane: z.string(),
    compulsion: z.string(),
    nativeDisciplines: disciplineNameSchema.array(),
    excludedPredatorTypes: z.array(z.string()).default([]).optional(),
    excludedMeritsAndFlaws: z.array(z.string()).default([]).optional(),
})
export type Clan = z.infer<typeof clanSchema>
export const clanKeySchema = clanSchema.keyof()
export type ClanKey = z.infer<typeof clanKeySchema>

export const clans: Record<ClanName, Clan> = {
    Brujah: {
        name: "Brujah",
        description: "Rebels who always fight against the power, easy to anger",
        logo: brujahLogo,
        bane: "Violent Temper: All difficulties to resist Frenzy are increased by 2 (max of 10).",
        compulsion:
            "Rebellion: Rebel against orders or expectations of an authority or change somebody's mind (by force if necessary). Until then, receive two-dice penalty on all rolls.",
        nativeDisciplines: ["celerity", "potence", "presence"],
    },
    Gangrel: {
        name: "Gangrel",
        description: "Beastlike and close to nature",
        logo: gangrelLogo,
        bane: "Bestial Features: In frenzy, gain one or more animal features (physical trait, smell, behavior..). Lasts for one more night after.",
        compulsion:
            "Feral Impulses: For one scene, take three-dice penalty to Manipulation and Intelligence. Can only speak one-word sentences.",
        nativeDisciplines: ["animalism", "fortitude", "protean"],
    },
    Nosferatu: {
        name: "Nosferatu",
        description: "Disfigured lurkers in the shadows",
        logo: nosferatuLogo,
        bane: "Repulsiveness: You count as having the Repulsive Flaw (-2) and can never improve your Looks Merit. Any attempt to disguise as non-deformed (even supernatural) takes BANE_SEVERITY dice penalty.",
        compulsion:
            "Cryptophilia: Become obsessed with obtaining secrets. Refuse to share secrets with others, except in strict trade for greater secrets.",
        nativeDisciplines: ["animalism", "obfuscate", "potence"],
        excludedMeritsAndFlaws: ["Beautiful", "Stunning"],
    },
    Malkavian: {
        name: "Malkavian",
        description: "Clairvoyants who are driven mad by their gift",
        logo: malkavianLogo,
        bane: "Fractured Perspective: You are cursed with at least one type of mental derangement.",
        compulsion:
            "Delusion: Two-dice penalty to Dexterity, Manipulation, Compusre and Wits as well as resists to terror frenzy for one scene.",
        nativeDisciplines: ["auspex", "dominate", "obfuscate"],
    },
    Tremere: {
        name: "Tremere",
        description: "Blood mages, driven by their hunger for knowledge",
        logo: tremereLogo,
        bane: "Deficient Blood: Can't create blood bonds with other kindred, ghouling takes an additional BANE_SEVERITY drinks.",
        compulsion:
            "Perfectionism: Until you score a critical win, all actions have a two-dice penalty. Penalty is reduced by one die for every repeat of an action.",
        nativeDisciplines: ["auspex", "dominate", "blood sorcery"],
    },
    Ventrue: {
        name: "Ventrue",
        description: "High and mighty rulers, continually grasping for more power",
        logo: ventrueLogo,
        bane: "Rarefied Tastes: Pick a group of preferred victims. Feeding from anyone outside that group costs BANE_SEVERITY willpower points.",
        compulsion:
            "Arrogance: Until somebody obeys an order from you (not forced by Dominate), you take a two-dice penalty on all rolls not related to leadership.",
        nativeDisciplines: ["dominate", "fortitude", "presence"],
        excludedPredatorTypes: ["Bagger", "Farmer"],
        excludedMeritsAndFlaws: ["Farmer"],
    },
    Toreador: {
        name: "Toreador",
        description: "Beauty-obsessed artists, elegant and often snobby",
        logo: toreadorLogo,
        bane: "Aesthetic Fixation: While you're in less than beautiful surroundings you take BANE_SEVERITY dice penalty on Discipline rolls.",
        compulsion:
            "Obsession: Become fixated with something in the scene. Take a two-dice penalty on any actions that aren't directly related to that thing. Lasts until you can't perceive the thing or scene ends.",
        nativeDisciplines: ["auspex", "celerity", "presence"],
    },

    Lasombra: {
        name: "Lasombra",
        description: "Shadowy predators and ruthless social climbers",
        logo: lasombraLogo,
        bane: "Distorted Image: Reflections and (audio) recordings of you distort and flicker. Touch technology is unresponsive.",
        compulsion:
            "Ruthlessness: Next failure after compulsion causes all rolls to receive a penalty until future attempt at same action succeeds.",
        nativeDisciplines: ["dominate", "potence", "oblivion"],
    },
    "Banu Haqim": {
        name: "Banu Haqim",
        description: "Assassins and judges with a twisted passion for justice",
        logo: banuHaqimLogo,
        bane: "Blood Addiction: Drinking from another vampire provokes a Hunger Frenzy test of difficulty 2 + BANE_SEVERITY.",
        compulsion:
            "Judgment: Drink at least 1 hunger of blood from anyone who acts against on of your personal convictions. If you can't, take three-dice penalty to all rolls until compulsion is satisfied or scene ends.",
        nativeDisciplines: ["celerity", "obfuscate", "blood sorcery"],
    },
    Ministry: {
        name: "Ministry",
        description: "Cult-like clan that uses temptation as a weapon",
        logo: ministryLogo,
        bane: "If under bright light, take a BANE_SEVERITY penalty to all rolls. Take BANE_SEVERITY additional damage from sunlight.",
        compulsion:
            "Transgression: Take a two-dice penalty on all rolls not related to enticing someone (even themselves) to break a Chronicle Tenet or personal Conviction, causing at least one Stain and ending this Compulsion.",
        nativeDisciplines: ["obfuscate", "presence", "protean"],
    },
    Ravnos: {
        name: "Ravnos",
        description: "Illusionists who are always on the move",
        logo: ravnosLogo,
        bane: "Doomed: If you day-sleep in the same place more than once within 7 days, roll dice equal to BANE_SEVERITY and take aggravated damage equal to 10s rolled. Need to be at least 1 mile away from last sleeping place.",
        compulsion:
            "Tempting Fate: Next time you're faced with a problem, you must choose the most dangerous and daring solution, or take a two-dice penalty. Lasts until the problem is solved or further attempts are impossible.",
        nativeDisciplines: ["animalism", "obfuscate", "presence"],
    },
    Tzimisce: {
        name: "Tzimisce",
        description: "Territorial, greedy flesh shapers",
        logo: tzimisceLogo,
        bane: "Grounded: Choose a place or group, if you day-sleep away from that you take BANE_SEVERITY aggravated willpower damage.",
        compulsion:
            "Covetousness: Become obsessed with possessing something in the scene. Any action not taken toward this purpose incurs two-dice penalty. Persists you own it or ownership becomes impossible.",
        nativeDisciplines: ["animalism", "dominate", "protean"],
    },
    Hecata: {
        name: "Hecata",
        description: "Vampires specialized in necromancy",
        logo: hecataLogo,
        bane: "Painful Kiss: Your vampire kiss is excruciatingly painful and brings no pleasure to your prey.",
        compulsion:
            "Morbidity: Until you have either predicted a death or solved the cause of a local one, you suffer a three-dice penalty to other rolls. Conclusions don't need to be correct, but should make sense.",
        nativeDisciplines: ["auspex", "fortitude", "oblivion"],
    },
    Salubri: {
        name: "Salubri",
        description: "Almost extinct bloodline of mystical vampires",
        logo: salubriLogo,
        bane: "Hunted: Your blood is tasty. When others drink from you, they must pass a Hunger Frenzy test to stop. You have a third eye on your forehead that cannot be obscured (even supernaturally), but can be covered with clothing. When you use disciplines it weeps blood and vampires with Hunger >= 4 must pass a Hunger Frenzy test.",
        compulsion:
            "Affective Empathy: Become overwhelmed with somebody's personal problem. Suffer a two-dice penalty to all actions that don't got towards solving the problem. Lasts until the problem is eased, an immediate crisis supersedes it or the scene ends.",
        nativeDisciplines: ["auspex", "dominate", "fortitude"],
    },
    Caitiff: {
        name: "Caitiff",
        description: "Clanless vampires, often distrusted",
        logo: caitiffLogo,
        bane: "Outcast: Increasing discipline levels costs XP equal to 6x the new level. (instead of 5x)",
        compulsion: "Caitiffs have no compulsion",
        nativeDisciplines: [
            "animalism",
            "auspex",
            "celerity",
            "dominate",
            "fortitude",
            "obfuscate",
            "potence",
            "presence",
            "protean",
            "blood sorcery",
            "oblivion",
        ],
    },
    "Thin-blood": {
        name: "Thin-blood",
        description: "Half Vampire, half Human. Despised by all.",
        logo: thinbloodLogo,
        bane: "Outcast: Increasing discipline levels costs XP equal to 6x the new level. (instead of 5x)",
        compulsion: "Caitiffs have no compulsion",
        nativeDisciplines: ["thin-blood alchemy"],
    },

    "": {
        name: "",
        description: "",
        logo: "",
        bane: "",
        compulsion: "",
        nativeDisciplines: [],
    },
}
