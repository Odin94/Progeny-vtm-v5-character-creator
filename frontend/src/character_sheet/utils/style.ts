import { ClanName } from "~/data/NameSchemas"

export const bgAlpha = 0.9

export const inputAlpha = 0.7

export const sheetSurfaceStyle = {
    background:
        "linear-gradient(145deg, rgba(32, 31, 33, 0.96) 0%, rgba(19, 17, 20, 0.98) 100%)",
    border: "1px solid rgba(183, 169, 158, 0.3)",
    boxShadow: "0 12px 26px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.035)"
} as const

export const sheetAddSurfaceStyle = {
    ...sheetSurfaceStyle,
    borderStyle: "dashed"
} as const

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : null
}

export const hexToRgba = (hex: string, alpha: number): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
export const getPrimaryColor = (clan: ClanName): string => {
    const clanColorMap: Record<ClanName, string> = {
        Brujah: "red",
        Gangrel: "orange",
        Nosferatu: "gray",
        Malkavian: "violet",
        Tremere: "grape",
        Ventrue: "blue",
        Toreador: "pink",
        Lasombra: "violet",
        "Banu Haqim": "cyan",
        Ministry: "lime",
        Ravnos: "yellow",
        Tzimisce: "grape",
        Hecata: "gray",
        Salubri: "teal",
        Caitiff: "grape",
        "Thin-blood": "grape",
        "": "red"
    }
    return clanColorMap[clan] || "red"
}

export const vtmRed = "#e03131"
