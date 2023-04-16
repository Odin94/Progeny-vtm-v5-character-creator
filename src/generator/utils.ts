import { Character } from "../data/Character";

export const upcase = (str: string) => str[0].toUpperCase() + str.slice(1);

export const intersection = <T>(arr1: T[], arr2: T[]) => arr1.filter(value => arr2.includes(value))

export const isEmptyList = (maybeList: unknown) => {
    if (Array.isArray(maybeList)) {
        return maybeList.length === 0
    }
    return false
}

export const downloadJson = (character: Character) => {
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: "application/json" });
    const link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = `vtm_v5_${character.name}.json`;
    link.click();
}

export const getUploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}