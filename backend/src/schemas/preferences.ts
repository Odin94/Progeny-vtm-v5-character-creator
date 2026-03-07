import { z } from "zod"

export const ALLOWED_COLOR_THEMES = [
    "red",
    "pink",
    "grape",
    "violet",
    "indigo",
    "blue",
    "cyan",
    "teal",
    "green",
    "lime",
    "yellow",
    "orange",
] as const

export const ALLOWED_BACKGROUND_IMAGES = [
    "default",
    "bg_club",
    "bg_broken_door",
    "bg_city",
    "bg_blood_guy",
    "bg_bat_woman",
    "bg_alley",
] as const

export const updatePreferencesSchema = z.object({
    colorTheme: z.enum(ALLOWED_COLOR_THEMES).nullable().optional(),
    backgroundImage: z.enum(ALLOWED_BACKGROUND_IMAGES).nullable().optional(),
})

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>

export type UserPreferences = {
    colorTheme: (typeof ALLOWED_COLOR_THEMES)[number] | null
    backgroundImage: (typeof ALLOWED_BACKGROUND_IMAGES)[number] | null
}
