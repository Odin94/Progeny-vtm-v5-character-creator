import { z } from "zod";
import banuHaqimLogo from "../resources/clanIcons/BanuHaqim.webp";
import brujahLogo from "../resources/clanIcons/Brujah.webp";
import gangrelLogo from "../resources/clanIcons/Gangrel.webp";
import hecataLogo from "../resources/clanIcons/Hecata.webp";
import lasombraLogo from "../resources/clanIcons/Lasombra.webp";
import malkavianLogo from "../resources/clanIcons/Malkavian.webp";
import ministryLogo from "../resources/clanIcons/Ministry.webp";
import nosferatuLogo from "../resources/clanIcons/Nosferatu.webp";
import ravnosLogo from "../resources/clanIcons/Ravnos.webp";
import salubriLogo from "../resources/clanIcons/Salubri.webp";
import toreadorLogo from "../resources/clanIcons/Toreador.webp";
import tremereLogo from "../resources/clanIcons/Tremere.webp";
import tzimisceLogo from "../resources/clanIcons/Tzimisce.webp";
import ventrueLogo from "../resources/clanIcons/Ventrue.webp";

export const clanNameSchema = z.union([
    z.literal('Brujah'),
    z.literal('Gangrel'),
    z.literal('Nosferatu'),
    z.literal('Malkavian'),
    z.literal('Tremere'),
    z.literal('Ventrue'),
    z.literal('Toreador'),

    z.literal('Lasombra'),
    z.literal('Banu Haqim'),
    z.literal('Ministry'),
    z.literal('Ravnos'),
    z.literal('Tzimisce'),
    z.literal('Hecata'),
    z.literal('Salubri'),

    z.literal(''),
])
export type ClanName = z.infer<typeof clanNameSchema>

export const clanSchema = z.object({
    name: clanNameSchema,
    description: z.string(),
    logo: z.string(),
    bane: z.string(),
    compulsion: z.string()
})
export type Clan = z.infer<typeof clanSchema>
export const clanKeySchema = clanSchema.keyof()
export type ClanKey = z.infer<typeof clanKeySchema>

export const Clans: Record<ClanName, Clan> = {
    Brujah: {
        name: "Brujah",
        description: "Rebels who always fight against the power, easy to anger",
        logo: brujahLogo,
        bane: "Violent Temper: All difficulties to resist Frenzy are increased by 2 (max of 10).",
        compulsion: "Rebellion: Rebel against orders or expectations of an authority or change somebody's mind (by force if necessary). Until then, receive two-dice penalty on all rolls."
    },
    Gangrel: {
        name: "Gangrel",
        description: "Beastlike and close to nature",
        logo: gangrelLogo,
        bane: "Bestial Features: In frenzy, gain one or more animal features (physical trait, smell, behavior..). Lasts for one more night after.",
        compulsion: "Feral Impulses: For one scene, take three-dice penalty to Manipulation and Intelligence. Can only speak one-word sentences."
    },
    Nosferatu: {
        name: "Nosferatu",
        description: "Disfigured lurkers in the shadows",
        logo: nosferatuLogo,
        bane: "Repulsiveness: You count as having the Repulsive Flaw (-2) and can never improve your Looks Merit. Any attempt to disguise as non-deformed (even supernatural) takes BANE_SEVERITY dice penalty.",
        compulsion: "Cryptophilia: Become obsessed with obtaining secrets. Refuse to share secrets with others, except in strict trade for greater secrets."
    },
    Malkavian: {
        name: "Malkavian",
        description: "Clairvoyants who are driven mad by their gift",
        logo: malkavianLogo,
        bane: "Fractured Perspective: You are cursed with at least one type of mental derangement.",
        compulsion: "Delusion: Two-dice penalty to Dexterity, Manipulation, Compusre and Wits as well as resists to terror frenzy for one scene."
    },
    Tremere: {
        name: "Tremere",
        description: "Blood mages, driven by their hunger for knowledge",
        logo: tremereLogo,
        bane: "Deficient Blood: Can't create blood bonds with other kindred, ghouling takes an additional BANE_SEVERITY drinks.",
        compulsion: "Perfectionism: Until you score a critical win, all actions have a two-dice penalty. Penalty is reduced by one die for every repeat of an action."
    },
    Ventrue: {
        name: "Ventrue",
        description: "High and mighty rulers, continually grasping for more power",
        logo: ventrueLogo,
        bane: "Rarefied Tastes: Pick a group of preferred victims. Feeding from anyone outside that group costs BANE_SEVERITY willpower points.",
        compulsion: "Arrogance: Until somebody obeys an order from you (not forced by Dominate), you take a two-dice penalty on all rolls not related to leadership."
    },
    Toreador: {
        name: "Toreador",
        description: "Beauty-obsessed artists, elegant and often snobby",
        logo: toreadorLogo,
        bane: "Aesthetic Fixation: While you're in less than beautiful surroundings you take BANE_SEVERITY dice penalty on Discipline rolls.",
        compulsion: "Obsession: Become fixated with something in the scene. Take a two-dice penalty on any actions that aren't directly related to that thing. Lasts until you can't perceive the thing or scene ends."
    },

    Lasombra: {
        name: "Lasombra",
        description: "Shadowy predators and ruthless social climbers",
        logo: lasombraLogo,
        bane: "Distorted Image: Reflections and (audio) recordings of you distort and flicker. Touch technology is unresponsive.",
        compulsion: "Ruthlessness: Next failure after compulsion causes all rolls to receive a penalty until future attempt at same action succeeds."
    },
    "Banu Haqim": {
        name: "Banu Haqim",
        description: "Guardians, warriors, and scholars who seek to distance themselves from the Jyhad",
        logo: banuHaqimLogo,
        bane: "Blood Addiction: Drinking from another vampire provokes a Hunger Frenzy test of difficulty 2 + BANE_SEVERITY.",
        compulsion: "Judgment: Drink at least 1 hunger of blood from anyone who acts against on of your personal convictions. If you can't, take three-dice penalty to all rolls until compulsion is satisfied or scene ends."
    },
    Ministry: {
        name: "Ministry",
        description: "Vampires who believe their founder was the Egyptian god Set",
        logo: ministryLogo,
        bane: "If under bright light, take a BANE_SEVERITY penalty to all rolls. Take BANE_SEVERITY additional damage from sunlight.",
        compulsion: "Transgression: Take a two-dice penalty on all rolls not related to enticing someone (even themselves) to break a Chronicle Tenet or personal Conviction, causing at least one Stain and ending this Compulsion."
    },
    Ravnos: {
        name: "Ravnos",
        description: "Illusionists who are always on the move",
        logo: ravnosLogo,
        bane: "Doomed: If you day-sleep in the same place more than once within 7 days, roll dice equal to BANE_SEVERITY and take aggravated damage equal to 10s rolled. Need to be at least 1 mile away from last sleeping place.",
        compulsion: "Tempting Fate: Next time you're faced with a problem, you must choose the most dangerous and daring solution, or take a two-dice penalty. Lasts until the problem is solved or further attempts are impossible."
    },
    Tzimisce: {
        name: "Tzimisce",
        description: "Territorial, greedy flesh shapers",
        logo: tzimisceLogo,
        bane: "Grounded: Choose a place or group, if you day-sleep away from that you take BANE_SEVERITY aggravated willpower damage.",
        compulsion: "Covetousness: Become obsessed with possessing something in the scene. Any action not taken toward this purpose incurs two-dice penalty. Persists you own it or ownership becomes impossible."
    },
    Hecata: {
        name: "Hecata",
        description: "Vampires specialized in necromancy",
        logo: hecataLogo,
        bane: "Painful Kiss: Your vampire kiss is excruciatingly painful and brings no pleasure to your prey.",
        compulsion: "Morbidity: Until you have either predicted a death or solved the cause of a local one, you suffer a three-dice penalty to other rolls. Conclusions don't need to be correct, but should make sense."
    },
    Salubri: {
        name: "Salubri",
        description: "Almost extinct bloodline of mystical vampires",
        logo: salubriLogo,
        bane: "Hunted: Your blood is tasty. When others drink from you, they must pass a Hunger Frenzy test to stop. You have a third eye on your forehead that cannot be obscured (even supernaturally), but can be covered with clothing. When you use disciplines it weeps blood and vampires with Hunger >= 4 must pass a Hunger Frenzy test.",
        compulsion: "Affective Empathy: Become overwhelmed with somebody's personal problem. Suffer a two-dice penalty to all actions that don't got towards solving the problem. Lasts until the problem is eased, an immediate crisis supersedes it or the scene ends."
    },

    "": {
        name: "",
        description: "",
        logo: "",
        bane: "",
        compulsion: ""
    }
}
