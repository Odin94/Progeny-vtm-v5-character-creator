import { ClanName } from "~/data/NameSchemas"

export const bgAlpha = 0.9

export const inputAlpha = 0.7

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
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
        "": "red",
    }
    return clanColorMap[clan] || "red"
}
