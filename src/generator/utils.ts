import { Attributes } from "../data/Attributes";
import { Character, getEmptyCharacter } from "../data/Character";
import { Skills } from "../data/Skills";

// The maximum is exclusive and the minimum is inclusive
export const rndInt = (min: number, max: number) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}

export const upcase = (str: string) => str[0] ? str[0].toUpperCase() + str.slice(1) : str;
export const lowcase = (str: string) => str[0] ? str[0].toLowerCase() + str.slice(1) : str;

export const intersection = <T>(arr1: T[], arr2: T[]) => arr1.filter(value => arr2.includes(value))

export const isEmptyList = (maybeList: unknown) => {
    if (Array.isArray(maybeList)) {
        return maybeList.length === 0
    }
    return false
}

export const downloadJson = async (character: Character) => {
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: "application/json" })
    const link = document.createElement('a')

    link.href = window.URL.createObjectURL(blob)
    link.download = `vtm_v5_${character.name}.json`
    link.click()
}

export const getUploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
        reader.readAsDataURL(file)
    });
}

export const emptyCharacter = getEmptyCharacter()
const isNonDefaultAttributes = (attributes: Attributes) => {
    return !Object.values(attributes).reduce((acc, attrLvl) => acc && attrLvl === 1, true)
}
const isNonDefaultSkills = (skills: Skills) => {
    return !Object.values(skills).reduce((acc, skillLvl) => acc && skillLvl === 0, true)
}
const isNonDefaultPredatorType = (predatorType: { name: string, pickedDiscipline: string }) => {
    return predatorType.name !== "" || predatorType.pickedDiscipline !== ""
}
export const notDefault = (character: Character, attribute: keyof Character) => {
    if (isEmptyList(character[attribute])) return false
    if (attribute === "attributes") return isNonDefaultAttributes(character[attribute])
    if (attribute === "skills") return isNonDefaultSkills(character[attribute])
    if (attribute === "predatorType") return isNonDefaultPredatorType(character[attribute])
    return character[attribute] !== emptyCharacter[attribute]
}
export const isDefault = (character: Character, attribute: keyof Character) => !notDefault(character, attribute)