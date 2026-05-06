import defaultBg from "../resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"

export type UserPreferences = {
    colorTheme: string | null
    backgroundImage: string | null
}

export const PREFERENCES_LOCALSTORAGE_KEY = "userPreferences"

export const DEFAULT_PREFERENCES: UserPreferences = {
    colorTheme: null,
    backgroundImage: null
}

export const ALLOWED_COLORS: Array<{ value: string; label: string }> = [
    { value: "red", label: "Red" },
    { value: "pink", label: "Pink" },
    { value: "grape", label: "Grape" },
    { value: "violet", label: "Violet" },
    { value: "indigo", label: "Indigo" },
    { value: "blue", label: "Blue" },
    { value: "cyan", label: "Cyan" },
    { value: "teal", label: "Teal" },
    { value: "green", label: "Green" },
    { value: "lime", label: "Lime" },
    { value: "yellow", label: "Yellow" },
    { value: "orange", label: "Orange" }
]

export type BackgroundImageOption = {
    id: string
    label: string
    src: string
}

export const BACKGROUND_IMAGES: BackgroundImageOption[] = [
    { id: "default", label: "Default", src: defaultBg },
    { id: "bg_club", label: "Club", src: club },
    { id: "bg_broken_door", label: "Broken Door", src: brokenDoor },
    { id: "bg_city", label: "City", src: city },
    { id: "bg_blood_guy", label: "Blood", src: bloodGuy },
    { id: "bg_bat_woman", label: "Bat Woman", src: batWoman },
    { id: "bg_alley", label: "Alley", src: alley }
]

export const getBackgroundSrc = (id: string | null): string | null => {
    if (!id || id === "default") return null
    const found = BACKGROUND_IMAGES.find((bg) => bg.id === id)
    return found?.src ?? null
}

export const loadPreferences = (): UserPreferences => {
    try {
        const raw = localStorage.getItem(PREFERENCES_LOCALSTORAGE_KEY)
        if (!raw) return DEFAULT_PREFERENCES
        const parsed = JSON.parse(raw)
        return {
            colorTheme: parsed.colorTheme ?? null,
            backgroundImage: parsed.backgroundImage ?? null
        }
    } catch {
        return DEFAULT_PREFERENCES
    }
}

export const savePreferences = (prefs: UserPreferences): void => {
    localStorage.setItem(PREFERENCES_LOCALSTORAGE_KEY, JSON.stringify(prefs))
}
