import { z } from "zod";
import brujahLogo from "../resources/clanIcons/Brujah.webp";
import gangrelLogo from "../resources/clanIcons/Gangrel.webp";
import malkavianLogo from "../resources/clanIcons/Malkavian.webp";
import nosferatuLogo from "../resources/clanIcons/Nosferatu.webp";
import toreadorLogo from "../resources/clanIcons/Toreador.webp";
import tremereLogo from "../resources/clanIcons/Tremere.webp";
import ventrueLogo from "../resources/clanIcons/Ventrue.webp";
import lasombraLogo from "../resources/clanIcons/Lasombra.webp";
import banuHaqimLogo from "../resources/clanIcons/BanuHaqim.webp";
import ministryLogo from "../resources/clanIcons/Ministry.webp";
import ravnosLogo from "../resources/clanIcons/Ravnos.webp";
import tzimisceLogo from "../resources/clanIcons/Tzimisce.webp";
import hecataLogo from "../resources/clanIcons/Hecata.webp";
import salubriLogo from "../resources/clanIcons/Salubri.webp";

export const clanSchema = z.union([
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
export type Clan = z.infer<typeof clanSchema>

// TODO: Add banes & compulsions
// TODO: Refactor to ClanName type and Clan: Record<ClanName, ClanData> (with logo, description, bane, compulsion..)

export const logoByClan: Record<Clan, string> = {
    "Brujah": brujahLogo,
    "Gangrel": gangrelLogo,
    "Nosferatu": nosferatuLogo,
    "Malkavian": malkavianLogo,
    "Tremere": tremereLogo,
    "Ventrue": ventrueLogo,
    "Toreador": toreadorLogo,

    "Lasombra": lasombraLogo,
    "Banu Haqim": banuHaqimLogo,
    "Ministry": ministryLogo,
    "Ravnos": ravnosLogo,
    "Tzimisce": tzimisceLogo,
    "Hecata": hecataLogo,
    "Salubri": salubriLogo,

    "": ""
}

export const descriptionByClan: Record<Clan, string> = {
    "Brujah": "Rebels who always fight against the power, easy to anger",
    "Gangrel": "Beastlike and close to nature",
    "Nosferatu": "Disfigured lurkers in the shadows",
    "Malkavian": "Clairvoyants who are driven mad by their gift",
    "Tremere": "Blood mages, driven by their hunger for knowledge",
    "Ventrue": "High and mighty rulers, continually grasping for more power",
    "Toreador": "Beauty-obsessed artists, elegant and often snobby",

    "Lasombra": "Shadowy predators and ruthless social climbers",
    "Banu Haqim": "Guardians, warriors, and scholars who seek to distance themselves from the Jyhad",
    "Ministry": "Vampires who believe their founder was the Egyptian god Set",
    "Ravnos": "Illusionists who are always on the move",
    "Tzimisce": "Territorial and greedy flesh shapers",
    "Hecata": "Vampires specialized in necromancy",
    "Salubri": "Almost extinct bloodline of mystical vampires",

    "": ""
}