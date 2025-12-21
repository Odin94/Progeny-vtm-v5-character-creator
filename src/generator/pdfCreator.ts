import { notifications } from "@mantine/notifications"
import fontkit from "@pdf-lib/fontkit"
import { PDFBool, PDFDocument, PDFFont, PDFForm, PDFName } from "pdf-lib"
import { Character } from "../data/Character"
import { clans } from "../data/Clans"
import { PredatorTypes } from "../data/PredatorType"
import { SkillsKey, skillsKeySchema } from "../data/Skills"
import checkPng from "../resources/CheckSolid.png"
// import base64Pdf_renegade from '../resources/v5_charactersheet_fillable_v3.base64';
import { attributesKeySchema } from "../data/Attributes"
import { Power, Ritual, powerIsRitual } from "../data/Disciplines"
import base64Pdf_nerdbert from "../resources/VtM5e_ENG_CharacterSheet_2pMINI_noTxtRichFields.base64?raw"
import { upcase } from "./utils"
import { DisciplineName } from "~/data/NameSchemas"

type BloodPotencyEffect = {
    surge: number
    mend: string
    discBonus: string
    discRouse: string
    bane: number
    penalty: string
}

let customFont: PDFFont

const initPDFDocument = async (bytes: ArrayBufferLike): Promise<PDFDocument> => {
    const pdfDoc = await PDFDocument.load(bytes as ArrayBuffer)

    pdfDoc.registerFontkit(fontkit)
    const fontBytes = await fetch("fonts/Roboto-Regular.ttf").then((res) => res.arrayBuffer())
    customFont = await pdfDoc.embedFont(fontBytes) // enables writing characters like "старый"

    return pdfDoc
}

export const testTemplate = async (basePdf: string) => {
    let form
    try {
        const bytes = base64ToArrayBuffer(basePdf)
        const pdfDoc = await initPDFDocument(bytes)

        form = pdfDoc.getForm()
    } catch (_err) {
        return { success: false, error: new Error("Can't get form from pdf - is it a fillable pdf?") }
    }
    try {
        form.getTextField("Name").setText("")
        form.getTextField("Concept").setText("")
        form.getTextField("Predator").setText("")
        form.getTextField("Ambition").setText("")
    } catch (_err) {
        return {
            success: false,
            error: new Error("PDF doesn't contain required fields - is it v5_charactersheet_fillable_v3.pdf from renegadegamestudios?"),
        }
    }

    return { success: true, error: null }
}

const downloadPdf = (fileName: string, bytes: Uint8Array) => {
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
    const link = document.createElement("a")

    link.href = window.URL.createObjectURL(blob)
    link.download = fileName
    link.click()

    // Clean up the object URL to prevent memory leaks
    setTimeout(() => {
        window.URL.revokeObjectURL(link.href)
    }, 100)
}

const potencyEffects: Record<number, BloodPotencyEffect> = {
    0: { surge: 1, mend: "1 superficial", discBonus: "-", discRouse: "-", bane: 0, penalty: "-" },
    1: { surge: 2, mend: "1 superficial", discBonus: "-", discRouse: "Lvl 1", bane: 2, penalty: "-" },
    2: {
        surge: 2,
        mend: "2 superficial",
        discBonus: "Add 1 die",
        discRouse: "Lvl 1",
        bane: 2,
        penalty: "Animal and bagged blood slake half Hunger",
    },
    3: {
        surge: 3,
        mend: "2 superficial",
        discBonus: "Add 1 die",
        discRouse: "Lvl 2 and below",
        bane: 3,
        penalty: "Animal and bagged blood slake no Hunger",
    },
    4: {
        surge: 3,
        mend: "3 superficial",
        discBonus: "Add 2 dice",
        discRouse: "Lvl 2 and below",
        bane: 3,
        penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human",
    },
    5: {
        surge: 4,
        mend: "3 superficial",
        discBonus: "Add 2 dice",
        discRouse: "Lvl 3 and below",
        bane: 4,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2",
    },
}

export const createPdf_nerdbert = async (character: Character): Promise<Uint8Array> => {
    const bytes = base64ToArrayBuffer(base64Pdf_nerdbert)

    const pdfDoc = await initPDFDocument(bytes)
    const form = pdfDoc.getForm()

    // Attributes
    const attributes = character.attributes
    ;["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"]
        .map((a) => attributesKeySchema.parse(a))
        .forEach((attr) => {
            const lvl = attributes[attr]
            for (let i = 1; i <= lvl; i++) {
                form.getCheckBox(`${upcase(attr).slice(0, 3)}-${i}`).check()
            }
        })

    // Skills
    const setSpecialty = (skillName: SkillsKey, textFieldKey: string) => {
        const allSpecialties = [...character.skillSpecialties, ...character.predatorType.pickedSpecialties]
        const specialties = allSpecialties
            .filter((s) => s.skill === skillName)
            .filter((s) => s.name !== "")
            .map((s) => s.name)

        if (specialties) form.getTextField(textFieldKey).setText(specialties.join(", "))
    }

    const skills = character.skills
    ;["athletics", "brawl", "craft", "drive", "melee", "larceny", "survival"]
        .map((s) => skillsKeySchema.parse(s))
        .forEach((skill) => {
            const lvl = skills[skill]
            for (let i = 1; i <= lvl; i++) {
                form.getCheckBox(`${upcase(skill).slice(0, 3)}-${i}`).check()
            }
            setSpecialty(skill, `spec${upcase(skill).slice(0, 3)}`)
        })

    const aniKenLvl = skills["animal ken"]
    for (let i = 1; i <= aniKenLvl; i++) {
        form.getCheckBox(`AniKen-${i}`).check()
    }
    setSpecialty("animal ken", "specAniKen")

    // PDF-issue: Lead-1, but specLea  (4 letters vs 3 letters)
    const leadLvl = skills["leadership"]
    for (let i = 1; i <= leadLvl; i++) {
        form.getCheckBox(`Lead-${i}`).check()
    }
    setSpecialty("leadership", "specLea")

    const stealthLvl = skills["stealth"]
    for (let i = 1; i <= stealthLvl; i++) {
        form.getCheckBox(`Ste-${i}`).check()
    }
    setSpecialty("stealth", "specStea")

    // PDF-issue: "Fri-1" instead of "Fir-1"
    const fireLvl = skills["firearms"]
    for (let i = 1; i <= fireLvl; i++) {
        form.getCheckBox(`Fri-${i}`).check()
    }
    setSpecialty("firearms", "specFir")

    // PDF-issue: Stre-1-1, but specStree  (4 letters vs 5 letters)
    const streeLvl = skills["streetwise"]
    for (let i = 1; i <= streeLvl; i++) {
        form.getCheckBox(`Stre-${i}`).check()
    }
    setSpecialty("streetwise", "specStree")
    ;[
        "etiquette",
        "insight",
        "intimidation",
        "performance",
        "persuasion",
        "subterfuge",
        "academics",
        "awareness",
        "finance",
        "investigation",
        "medicine",
        "occult",
        "politics",
        "science",
        "technology",
    ]
        .map((s) => skillsKeySchema.parse(s))
        .forEach((skill) => {
            const lvl = skills[skill]
            for (let i = 1; i <= lvl; i++) {
                form.getCheckBox(`${upcase(skill).slice(0, 4)}-${i}`).check()
            }

            setSpecialty(skill, `spec${upcase(skill).slice(0, 4)}`)
        })

    // Health
    let health = 3 + character.attributes["stamina"]
    if (character.disciplines.find((power) => power.name === "Resilience")) {
        const fortitudeLevel = character.disciplines.filter((power) => power.discipline === "fortitude").length
        health += fortitudeLevel
    }
    for (let i = 1; i <= health; i++) {
        form.getCheckBox(`Health-${i}`).check()
    }

    // Willpower
    const willpower = character.attributes["composure"] + character.attributes["resolve"]
    for (let i = 1; i <= willpower; i++) {
        form.getCheckBox(`WP-${i}`).check()
    }

    // Blood Potency
    let bloodPotency = (() => {
        switch (character.generation) {
            case 16:
            case 15:
            case 14:
                return 0
            case 13:
            case 12:
                return 1
            case 11:
            case 10:
                return 2
            default:
                return 1
        }
    })()
    bloodPotency += PredatorTypes[character.predatorType.name].bloodPotencyChange
    for (let i = 1; i <= bloodPotency; i++) {
        form.getCheckBox(`BloodPotency-${i}`).check()
    }

    const effects = potencyEffects[bloodPotency]
    form.getTextField("BloodSurge").setText(`${effects.surge}`)
    form.getTextField("Mend").setText(effects.mend)
    form.getTextField("PowBonus").setText(effects.discBonus)
    form.getTextField("ReRouse").setText(effects.discRouse)
    form.getTextField("FeedPen").setText(effects.penalty)
    form.getTextField("BaneSev").setText(`${effects.bane}`)

    //Humanity
    const humanity = 7 + PredatorTypes[character.predatorType.name].humanityChange
    const checkImageBytes = await fetch(checkPng).then((res) => res.arrayBuffer())
    const checkImage = await pdfDoc.embedPng(checkImageBytes)
    for (let i = 1; i <= humanity; i++) {
        // Broken by setting "NeedAppearances" to true
        form.getButton(`Humanity-${i}`).setImage(checkImage)
    }

    // Top fields
    form.getTextField("Name").setText(character.name)
    // form.getTextField("Name").updateAppearances(customFont)
    form.getTextField("pcDescription").setText(character.description)
    form.getTextField("Predator type").setText(character.predatorType.name)
    form.getTextField("Ambition").setText(character.ambition)

    form.getTextField("Clan").setText(character.clan)
    const baneText = clans[character.clan].bane.replace("BANE_SEVERITY", `${effects.bane} (bane severity)`)
    form.getTextField("ClanBane").setText(baneText)
    form.getTextField("ClanCompulsion").setText(clans[character.clan].compulsion)

    form.getTextField("Sire").setText(character.sire)
    form.getTextField("Desire").setText(character.desire)
    form.getTextField("Title").setText(`${character.generation}`) // Yes, "Title" is the generation field

    // Disciplines
    const getDisciplineText = (power: Power | Ritual) => {
        let text = power.name + ": " + power.summary
        if (power.dicePool !== "") {
            text += ` // ${power.dicePool}`
        }
        if (power.rouseChecks > 0) {
            text += ` // ${power.rouseChecks} rouse check${power.rouseChecks > 1 ? "s" : ""}`
        }

        if (powerIsRitual(power)) {
            text += ` // requires: ${power.ingredients}; ${power.requiredTime}`
        }

        return text
    }

    const powersByDiscipline = character.disciplines.reduce(
        (acc, p) => {
            if (!acc[p.discipline]) acc[p.discipline] = []
            acc[p.discipline].push(p)
            return acc
        },
        {} as Record<DisciplineName, Power[]>
    )
    for (const [disciplineIndex, powers] of Object.values(powersByDiscipline).entries()) {
        const di = disciplineIndex + 1
        form.getTextField(`Disc${di}`).setText(upcase(powers[0].discipline))
        for (const [powerIndex, power] of powers.entries()) {
            const pi = powerIndex + 1
            form.getTextField(`Disc${di}_Ability${pi}`).setText(getDisciplineText(power))
            form.getTextField(`Disc${di}_Ability${pi}`).disableRichFormatting()
            form.getCheckBox(`Disc${di}-${pi}`).check()
        }
        if (powers[0].discipline === "blood sorcery") {
            for (const [ritualIndex, ritual] of character.rituals.entries()) {
                const ri = powers.length + ritualIndex + 1
                form.getTextField(`Disc${di}_Ability${ri}`).setText(getDisciplineText(ritual))
                form.getTextField(`Disc${di}_Ability${ri}`).disableRichFormatting()
            }
        }
    }

    // Merits & flaws
    const characterMeritsFlaws = [...character.merits, ...character.flaws]
    const predatorTypeMeritsFlaws = PredatorTypes[character.predatorType.name].meritsAndFlaws.filter(
        (m) => !characterMeritsFlaws.map((cm) => cm.name).includes(m.name)
    )
    const pickedPredatorTypeMeritsFlaws = character.predatorType.pickedMeritsAndFlaws
    const meritsAndFlaws = [...predatorTypeMeritsFlaws, ...pickedPredatorTypeMeritsFlaws, ...characterMeritsFlaws]
    meritsAndFlaws.forEach(({ name, level, summary }, i) => {
        const fieldNum = i + 1
        form.getTextField(`Merit${fieldNum}`).setText(name + ": " + summary)
        for (let l = 1; l <= level; l++) {
            form.getCheckBox(`Merit${fieldNum}-${l}`).check()
        }
    })

    // Touchstones & Convictions
    form.getTextField("Convictions").setText(
        character.touchstones.map(({ name, description, conviction }) => `${name}: ${conviction}\n${description}`).join("\n\n")
    )

    // Experience
    const experience = (() => {
        switch (character.generation) {
            case 16:
            case 15:
            case 14:
                return 0
            case 13:
            case 12:
                return 15
            case 11:
            case 10:
                return 35
            default:
                return 0
        }
    })()
    form.getTextField("tEXP").setText(`${experience} XP`)

    // Fixes bug where text that is too long for field doesn't show until clicked
    // see https://github.com/Hopding/pdf-lib/issues/569#issuecomment-1087328416 and https://stackoverflow.com/questions/73058238/some-pdf-textfield-content-not-visible-until-clicked
    // TODO: This breaks embedding the png in humanity-tracker!
    form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True)

    // Fixes embedded font not being applied on form fields
    form.updateFieldAppearances(customFont)

    return await pdfDoc.save({ updateFieldAppearances: true })
}

export const downloadCharacterSheet = async (character: Character) => {
    const pdfBytes = await createPdf_nerdbert(character)
    notifications.show({
        title: "PDF base kindly provided by Nerdbert!",
        message: "https://linktr.ee/nerdbert",
        autoClose: 10000,
        color: "grape",
    })

    downloadPdf(`progeny_${character.name}.pdf`, pdfBytes)
}

function base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64)
    const len = binary_string.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

const getFields = (form: PDFForm): Record<string, string> => {
    const fields = form.getFields()

    const outFields: Record<string, string> = {}
    fields.forEach((field) => {
        const type = field.constructor.name
        const name = field.getName()

        outFields[name] = type
    })

    return outFields
}

export const printFieldNames = async () => {
    const basePdf = base64Pdf_nerdbert
    const bytes = base64ToArrayBuffer(basePdf)

    const pdfDoc = await initPDFDocument(bytes)
    const form = pdfDoc.getForm()

    console.log(JSON.stringify(getFields(form), null, 2))
}
