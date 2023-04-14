import { z } from "zod";


export const clanSchema = z.union([
    z.literal('Brujah'),
    z.literal('Gangrel'),
    z.literal('Nosferatu'),
    z.literal('Malkavian'),
    z.literal('Tremere'),
    z.literal('Ventrue'),
    z.literal('Toreador'),
])
export type Clan = z.infer<typeof clanSchema>