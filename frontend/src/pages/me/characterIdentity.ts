import type { CSSProperties } from "react"
import { getPrimaryColor } from "~/character_sheet/utils/style"
import type { Character as CharacterType } from "~/data/Character"
import { clans } from "~/data/Clans"
import type { ClanName } from "~/data/NameSchemas"

export type CharacterIdentity = {
    /** Display clan (homebrew clan name wins). Empty when no clan was picked yet. */
    clanName: string
    logo?: string
    /** Mantine palette name used for the clan accent (same mapping as the sheet). */
    color: string
    generation?: number
    predatorType?: string
    player?: string
}

/** Pulls the gallery-facing identity out of loosely typed stored character data. */
export const getCharacterIdentity = (data: unknown): CharacterIdentity => {
    const character = (data && typeof data === "object" ? data : {}) as Partial<CharacterType>
    const clan = typeof character.clan === "string" ? character.clan : ""
    const official = clan ? clans[clan as ClanName] : undefined
    const homebrew = character.homebrewClan

    return {
        clanName: homebrew?.name?.trim() || clan,
        logo: homebrew?.logo || official?.logo,
        color: official ? getPrimaryColor(clan as ClanName) : "red",
        generation:
            typeof character.generation === "number" && character.generation > 0
                ? character.generation
                : undefined,
        predatorType: character.predatorType?.name?.trim() || undefined,
        player: character.player?.trim() || undefined
    }
}

/** CSS custom property that tints a card/row with the clan color. */
export const clanColorVars = (color: string) =>
    ({
        "--clan": `var(--mantine-color-${color}-6)`,
        "--clan-bright": `var(--mantine-color-${color}-4)`
    }) as CSSProperties

export const ordinal = (value: number) => {
    const mod100 = value % 100
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`
    switch (value % 10) {
        case 1:
            return `${value}st`
        case 2:
            return `${value}nd`
        case 3:
            return `${value}rd`
        default:
            return `${value}th`
    }
}

const relativeTime =
    typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
        ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
        : null

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY]
]

/** "3 hours ago", "yesterday", … — falls back to a locale date. */
export const formatRelativeTime = (value: string | Date | undefined | null, now = Date.now()) => {
    if (!value) return null
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) return null
    if (!relativeTime) return new Date(time).toLocaleDateString()

    let delta = (time - now) / 1000
    for (const [unit, size] of RELATIVE_STEPS) {
        if (Math.abs(delta) < size) {
            return relativeTime.format(Math.round(delta), unit)
        }
        delta /= size
    }
    return new Date(time).toLocaleDateString()
}
