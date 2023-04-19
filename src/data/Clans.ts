import { z } from "zod";
import brujahLogo from "../resources/clanIcons/Brujah.webp";
import gangrelLogo from "../resources/clanIcons/Gangrel.webp";
import malkavianLogo from "../resources/clanIcons/Malkavian.webp";
import nosferatuLogo from "../resources/clanIcons/Nosferatu.webp";
import toreadorLogo from "../resources/clanIcons/Toreador.webp";
import tremereLogo from "../resources/clanIcons/Tremere.webp";
import ventrueLogo from "../resources/clanIcons/Ventrue.webp";

export const clanSchema = z.union([
    z.literal('Brujah'),
    z.literal('Gangrel'),
    z.literal('Nosferatu'),
    z.literal('Malkavian'),
    z.literal('Tremere'),
    z.literal('Ventrue'),
    z.literal('Toreador'),
    z.literal(''),
])
export type Clan = z.infer<typeof clanSchema>

export const logoByClan: Record<Clan, string> = {
    "Brujah": brujahLogo,
    "Gangrel": gangrelLogo,
    "Nosferatu": nosferatuLogo,
    "Malkavian": malkavianLogo,
    "Tremere": tremereLogo,
    "Ventrue": ventrueLogo,
    "Toreador": toreadorLogo,
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
    "": ""
}