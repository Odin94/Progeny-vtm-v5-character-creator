import { PredatorTypes } from "~/data/PredatorType"
import { Attributes, AttributesKey } from "../data/Attributes"
import { Character, getDisciplineLevel, getEmptyCharacter } from "../data/Character"
import {
    getDisciplineDefinitionIdentity,
    getPowerDisciplineIdentity
} from "~/utils/homebrewOptions"
import { Skills, SkillsKey } from "../data/Skills"
import {
    attributeNameTo_WoD5EVtt_Key,
    skillNameTo_WoD5EVtt_Key
} from "./foundryWoDJsonCreator"
import { calculateBloodPotency } from "~/data/BloodPotency"

// The maximum is exclusive and the minimum is inclusive
export const rndInt = (min: number, max: number) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}

export const upcase = (str: string) => (str[0] ? str[0].toUpperCase() + str.slice(1) : str)
export const lowcase = (str: string) => (str[0] ? str[0].toLowerCase() + str.slice(1) : str)

export const intersection = <T>(arr1: T[], arr2: T[]) =>
    arr1.filter((value) => arr2.includes(value))

export const isEmptyList = (maybeList: unknown) => {
    if (Array.isArray(maybeList)) {
        return maybeList.length === 0
    }
    return false
}

export const updateHealthAndWillpowerAndBloodPotencyAndHumanity = (character: Character) => {
    // Health
    let health = 3 + character.attributes["stamina"]
    if (character.disciplines.find((power) => power.name === "Resilience")) {
        const fortitudeLevel = getDisciplineLevel(character, "official:fortitude")
        health += fortitudeLevel
    }

    // Willpower
    const willpower = character.attributes["composure"] + character.attributes["resolve"]

    // Blood Potency
    const bloodPotency = calculateBloodPotency(character)

    const humanity = 7 + PredatorTypes[character.predatorType.name].humanityChange

    character.maxHealth = health
    character.willpower = willpower
    character.bloodPotency = bloodPotency
    character.humanity = humanity
}

export const downloadJson = async (character: Character) => {
    const json = JSON.stringify(character, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const link = document.createElement("a")

    link.href = window.URL.createObjectURL(blob)
    link.download = `progeny_${character.name}.json`
    link.click()
    // Clean up the object URL to prevent memory leaks
    setTimeout(() => {
        window.URL.revokeObjectURL(link.href)
    }, 100)
}

export const getUploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
        reader.readAsDataURL(file)
    })
}

export const emptyCharacter = getEmptyCharacter()
const isNonDefaultAttributes = (attributes: Attributes) => {
    return !Object.values(attributes).reduce((acc, attrLvl) => acc && attrLvl === 1, true)
}
const isNonDefaultSkills = (skills: Skills) => {
    return !Object.values(skills).reduce((acc, skillLvl) => acc && skillLvl === 0, true)
}
const isNonDefaultPredatorType = (predatorType: { name: string; pickedDiscipline: string }) => {
    return predatorType.name !== "" || predatorType.pickedDiscipline !== ""
}
export const notDefault = (character: Character, attribute: keyof Character) => {
    if (isEmptyList(character[attribute])) return false
    if (attribute === "attributes") return isNonDefaultAttributes(character[attribute])
    if (attribute === "skills") return isNonDefaultSkills(character[attribute])
    if (attribute === "predatorType") return isNonDefaultPredatorType(character[attribute])
    return character[attribute] !== emptyCharacter[attribute]
}
export const isDefault = (character: Character, attribute: keyof Character) =>
    !notDefault(character, attribute)
export const getDisciplineRating = (disciplineName: string, character: Character): number => {
    const normalizedName = disciplineName.trim().toLowerCase()
    if (!normalizedName) return 0

    const matchingPower = character.disciplines.find(
        (power) => power.discipline.trim().toLowerCase() === normalizedName
    )
    if (matchingPower) {
        return getDisciplineLevel(character, getPowerDisciplineIdentity(matchingPower))
    }

    const customDiscipline = Object.values(character.customDisciplines).find(
        (discipline) => discipline.name.trim().toLowerCase() === normalizedName
    )

    return getDisciplineLevel(
        character,
        customDiscipline
            ? getDisciplineDefinitionIdentity(customDiscipline)
            : `official:${normalizedName}`
    )
}

export const getValueForKey = (key: string, character: Character): number => {
    if (attributeNameTo_WoD5EVtt_Key[key as AttributesKey]) {
        return character.attributes[key as AttributesKey] || 0
    }

    if (skillNameTo_WoD5EVtt_Key[key as SkillsKey]) {
        return character.skills[key as SkillsKey] || 0
    }

    return getDisciplineRating(key, character)
}
