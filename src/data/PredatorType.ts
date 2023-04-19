import { z } from "zod";


export const predatorTypeSchema = z.union([
    z.literal("Alleycat"),
    z.literal("Extortionist"),
    z.literal("Roadside Killer"),
    z.literal("Cleaver"),
    z.literal("Consensualist"),
    z.literal("Osiris"),
    z.literal("Scene Queen"),
    z.literal("Siren"),
    z.literal("Sandman"),
    z.literal("Graverobber"),
    z.literal("Bagger"),
    z.literal("Blood Leech"),
    z.literal("Farmer"),
    z.literal(""),
])
export type PredatorType = z.infer<typeof predatorTypeSchema>

export const summaryByPredatorType: Record<PredatorType, string> = {
    Alleycat: "Ambush prey in alleys",
    Extortionist: "Strongarm prey into giving you their blood",
    "Roadside Killer": "Hunt prey on desolate roads",
    Cleaver: "Feed on friends and family",
    Consensualist: "Take blood only from the willing",
    Osiris: "Feed on your followers",
    "Scene Queen": "Feed in your scene",
    Siren: "Seduce prey and take their blood",
    Sandman: "Break into homes and feed on sleeping prey",
    Graverobber: "Feed on fresh corpses and mourning families",
    Bagger: "Feed on blood bags",
    "Blood Leech": "Feed on other vampires",
    Farmer: "Feed on animals",
    "": ""
}