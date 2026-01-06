import { z } from "zod"

export const clanNameSchema = z.union([
  z.literal("Brujah"),
  z.literal("Gangrel"),
  z.literal("Nosferatu"),
  z.literal("Malkavian"),
  z.literal("Tremere"),
  z.literal("Ventrue"),
  z.literal("Toreador"),
  z.literal("Lasombra"),
  z.literal("Banu Haqim"),
  z.literal("Ministry"),
  z.literal("Ravnos"),
  z.literal("Tzimisce"),
  z.literal("Hecata"),
  z.literal("Salubri"),
  z.literal("Caitiff"),
  z.literal("Thin-blood"),
  z.literal(""),
])

export type ClanName = z.infer<typeof clanNameSchema>

export const disciplineNameSchema = z.union([
  z.literal("animalism"),
  z.literal("auspex"),
  z.literal("celerity"),
  z.literal("dominate"),
  z.literal("fortitude"),
  z.literal("obfuscate"),
  z.literal("potence"),
  z.literal("presence"),
  z.literal("protean"),
  z.literal("blood sorcery"),
  z.literal("oblivion"),
  z.literal("thin-blood alchemy"),
  z.literal(""),
])

export type DisciplineName = z.infer<typeof disciplineNameSchema>

export const predatorTypeNameSchema = z.union([
  z.literal("Alleycat"),
  z.literal("Extortionist"),
  z.literal("Roadside Killer"),
  z.literal("Montero"),
  z.literal("Cleaver"),
  z.literal("Consensualist"),
  z.literal("Osiris"),
  z.literal("Scene Queen"),
  z.literal("Siren"),
  z.literal("Sandman"),
  z.literal("Grim Reaper"),
  z.literal("Graverobber"),
  z.literal("Pursuer"),
  z.literal("Trapdoor"),
  z.literal("Bagger"),
  z.literal("Blood Leech"),
  z.literal("Farmer"),
  z.literal(""),
])

export type PredatorTypeName = z.infer<typeof predatorTypeNameSchema>
