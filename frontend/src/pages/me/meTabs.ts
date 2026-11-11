export const ME_TABS = ["characters", "coteries", "profile"] as const
export type MeTab = (typeof ME_TABS)[number]

export const DEFAULT_ME_TAB: MeTab = "characters"

export const parseMeTab = (value: unknown): MeTab | undefined =>
    typeof value === "string" && (ME_TABS as readonly string[]).includes(value)
        ? (value as MeTab)
        : undefined
