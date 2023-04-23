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

// TODO: Add banes & compulsions
// TODO: Refactor to ClanName type and Clan: Record<ClanName, ClanData> (with logo, description, bane, compulsion..)

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
        bane: "xxx",
        compulsion: "xxx"
    },
    Gangrel: {
        name: "Gangrel",
        description: "Beastlike and close to nature",
        logo: gangrelLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Nosferatu: {
        name: "Nosferatu",
        description: "Disfigured lurkers in the shadows",
        logo: nosferatuLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Malkavian: {
        name: "Malkavian",
        description: "Clairvoyants who are driven mad by their gift",
        logo: malkavianLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Tremere: {
        name: "Tremere",
        description: "Blood mages, driven by their hunger for knowledge",
        logo: tremereLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Ventrue: {
        name: "Ventrue",
        description: "High and mighty rulers, continually grasping for more power",
        logo: ventrueLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Toreador: {
        name: "Toreador",
        description: "Beauty-obsessed artists, elegant and often snobby",
        logo: toreadorLogo,
        bane: "xxx",
        compulsion: "xxx"
    },

    Lasombra: {
        name: "Lasombra",
        description: "Shadowy predators and ruthless social climbers",
        logo: lasombraLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    "Banu Haqim": {
        name: "Banu Haqim",
        description: "Guardians, warriors, and scholars who seek to distance themselves from the Jyhad",
        logo: banuHaqimLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Ministry: {
        name: "Ministry",
        description: "Vampires who believe their founder was the Egyptian god Set",
        logo: ministryLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Ravnos: {
        name: "Ravnos",
        description: "Illusionists who are always on the move",
        logo: ravnosLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Tzimisce: {
        name: "Tzimisce",
        description: "Territorial, greedy flesh shapers",
        logo: tzimisceLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Hecata: {
        name: "Hecata",
        description: "Vampires specialized in necromancy",
        logo: hecataLogo,
        bane: "xxx",
        compulsion: "xxx"
    },
    Salubri: {
        name: "Salubri",
        description: "Almost extinct bloodline of mystical vampires",
        logo: salubriLogo,
        bane: "xxx",
        compulsion: "xxx"
    },

    "": {
        name: "",
        description: "",
        logo: "",
        bane: "",
        compulsion: ""
    }
}
