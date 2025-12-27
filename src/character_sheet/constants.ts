import { ClanName } from "~/data/NameSchemas"

export const getPrimaryColor = (clan: ClanName): string => {
    const clanColorMap: Record<ClanName, string> = {
        Brujah: "red",
        Gangrel: "orange",
        Nosferatu: "gray",
        Malkavian: "violet",
        Tremere: "grape",
        Ventrue: "blue",
        Toreador: "pink",
        Lasombra: "dark",
        "Banu Haqim": "cyan",
        Ministry: "lime",
        Ravnos: "yellow",
        Tzimisce: "grape",
        Hecata: "gray",
        Salubri: "teal",
        Caitiff: "grape",
        "Thin-blood": "grape",
        "": "grape",
    }
    return clanColorMap[clan] || "grape"
}
