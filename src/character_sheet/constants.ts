import { Character } from "~/data/Character"
import { ClanName } from "~/data/NameSchemas"
import { CharacterSheetMode } from "./CharacterSheet"

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

export type SheetOptions = {
    mode: CharacterSheetMode
    primaryColor: string
    character: Character
    setCharacter: (character: Character) => void
}
