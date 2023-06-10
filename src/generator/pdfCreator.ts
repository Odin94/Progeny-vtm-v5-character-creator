import { notifications } from '@mantine/notifications';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { Character, } from '../data/Character';
import { Clans } from '../data/Clans';
import { PredatorTypes } from '../data/PredatorType';
import { skillsKeySchema } from '../data/Skills';
import base64Check from '../resources/CheckSolid.base64';
// import base64Pdf_renegade from '../resources/v5_charactersheet_fillable_v3.base64';
import { attributesKeySchema } from '../data/Attributes';
import { DisciplineName, Power } from '../data/Disciplines';
import base64Pdf_nerdbert from '../resources/VtM5e_ENG_CharacterSheet_2pMINI_noTxtRichFields.base64';
import { upcase } from './utils';


type BloodPotencyEffect = {
    surge: number,
    mend: string,
    discBonus: string,
    discRouse: string,
    bane: number,
    penalty: string
}


const loadTemplate = async (pdf = base64Pdf_nerdbert) => {
    return fetch(pdf)
        .then(r => r.text())
}

export const testTemplate = async (basePdf: string) => {
    let form
    try {
        // const basePdf = await loadTemplate(pdf)
        const bytes = base64ToArrayBuffer(basePdf)

        const pdfDoc = await PDFDocument.load(bytes)
        form = pdfDoc.getForm();
    } catch (err) {
        return { success: false, error: new Error("Can't get form from pdf - is it a fillable pdf?") }
    }
    try {
        form.getTextField("Name").setText("")
        form.getTextField("Concept").setText("")
        form.getTextField("Predator").setText("")
        form.getTextField("Ambition").setText("")
    } catch (err) {
        return { success: false, error: new Error("PDF doesn't contain required fields - is it v5_charactersheet_fillable_v3.pdf from renegadegamestudios?") }
    }

    return { success: true, error: null }
}

const downloadPdf = (fileName: string, bytes: Uint8Array) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

const potencyEffects: Record<number, BloodPotencyEffect> = {
    0: { surge: 1, mend: "1 superficial", discBonus: "-", discRouse: "-", bane: 0, penalty: "-" },
    1: { surge: 2, mend: "1 superficial", discBonus: "-", discRouse: "Lvl 1", bane: 2, penalty: "-" },
    2: { surge: 2, mend: "2 superficial", discBonus: "Add 1 die", discRouse: "Lvl 1", bane: 2, penalty: "Animal and bagged blood slake half Hunger" },
    3: { surge: 3, mend: "2 superficial", discBonus: "Add 1 die", discRouse: "Lvl 2 and below", bane: 3, penalty: "Animal and bagged blood slake no Hunger" },
    4: { surge: 3, mend: "3 superficial", discBonus: "Add 2 dice", discRouse: "Lvl 2 and below", bane: 3, penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human" },
    5: { surge: 4, mend: "3 superficial", discBonus: "Add 2 dice", discRouse: "Lvl 3 and below", bane: 4, penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2" },
}

const createPdf_nerdbert = async (character: Character): Promise<Uint8Array> => {
    const basePdf = await loadTemplate(base64Pdf_nerdbert)
    const bytes = base64ToArrayBuffer(basePdf)

    const pdfDoc = await PDFDocument.load(bytes)
    const form = pdfDoc.getForm();

    // Attributes
    const attributes = character.attributes;
    (["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"].map((a) => attributesKeySchema.parse(a))).forEach((attr) => {
        const lvl = attributes[attr]
        for (let i = 1; i <= lvl; i++) {
            form.getCheckBox(`${upcase(attr).slice(0, 3)}-${i}`).check()
        }
    })

    // Skills
    const skills = character.skills;
    (["athletics", "brawl", "craft", "drive", "melee", "larceny", "survival"].map((s) => skillsKeySchema.parse(s))).forEach((skill) => {
        const lvl = skills[skill]
        for (let i = 1; i <= lvl; i++) {
            form.getCheckBox(`${upcase(skill).slice(0, 3)}-${i}`).check()
        }

        const specialty = character.specialties.find((s) => s.skill === skill)
        if (specialty) form.getTextField(`spec${upcase(skill).slice(0, 3)}`).setText(specialty.name)
    });

    const aniKenLvl = skills["animal ken"]
    for (let i = 1; i <= aniKenLvl; i++) {
        form.getCheckBox(`AniKen-${i}`).check()
    }
    const aniKenSpecialty = character.specialties.find((s) => s.skill === "animal ken")
    if (aniKenSpecialty) form.getTextField("specAniKen").setText(aniKenSpecialty.name);

    // PDF-issue: Lead-1, but specLea  (4 letters vs 3 letters)
    const leadLvl = skills["leadership"]
    for (let i = 1; i <= leadLvl; i++) {
        form.getCheckBox(`Lead-${i}`).check()
    }
    const leadSpecialty = character.specialties.find((s) => s.skill === "leadership")
    if (leadSpecialty) form.getTextField("specLea").setText(leadSpecialty.name);

    const stealthLvl = skills["stealth"]
    for (let i = 1; i <= stealthLvl; i++) {
        form.getCheckBox(`Ste-${i}`).check()
    }
    const stealthSpecialty = character.specialties.find((s) => s.skill === "stealth")
    if (stealthSpecialty) form.getTextField("specStea").setText(stealthSpecialty.name);

    // PDF-issue: "Fri-1" instead of "Fir-1"
    const fireLvl = skills["firearms"]
    for (let i = 1; i <= fireLvl; i++) {
        form.getCheckBox(`Fri-${i}`).check()
    }
    const fireSpecialty = character.specialties.find((s) => s.skill === "firearms")
    if (fireSpecialty) form.getTextField("specFir").setText(fireSpecialty.name);

    // PDF-issue: Stre-1-1, but specStree  (4 letters vs 5 letters)
    const streeLvl = skills["streetwise"]
    for (let i = 1; i <= streeLvl; i++) {
        form.getCheckBox(`Stre-${i}`).check()
    }
    const streeSpecialty = character.specialties.find((s) => s.skill === "streetwise")
    if (streeSpecialty) form.getTextField("specStree").setText(streeSpecialty.name);

    (["etiquette", "insight", "intimidation", "performance", "persuasion", "subterfuge", "academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology",].map((s) => skillsKeySchema.parse(s))).forEach((skill) => {
        const lvl = skills[skill]
        for (let i = 1; i <= lvl; i++) {
            form.getCheckBox(`${upcase(skill).slice(0, 4)}-${i}`).check()
        }

        const specialty = character.specialties.find((s) => s.skill === skill)
        if (specialty) form.getTextField(`spec${upcase(skill).slice(0, 4)}`).setText(specialty.name)
    });

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
            case 14: return 0
            case 13:
            case 12: return 1
            case 11:
            case 10: return 2
            default: return 1
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
    const checkImageBytes = await fetch(base64Check).then(res => res.text())
    const checkImage = await pdfDoc.embedPng(checkImageBytes)
    for (let i = 1; i <= humanity; i++) {
        form.getButton(`Humanity-${i}`).setImage(checkImage)
    }

    // Top fields
    form.getTextField("Name").setText(character.name)
    form.getTextField("pcDescription").setText(character.description)
    form.getTextField("Predator type").setText(character.predatorType.name)
    form.getTextField("Ambition").setText(character.ambition)

    form.getTextField("Clan").setText(character.clan)
    form.getTextField("ClanBane").setText(Clans[character.clan].bane)
    form.getTextField("ClanCompulsion").setText(Clans[character.clan].compulsion)

    form.getTextField("Sire").setText(character.sire)
    form.getTextField("Desire").setText(character.desire)
    form.getTextField("Title").setText(`${character.generation}`) // Yes, "Title" is the generation field

    // Disciplines
    const getDisciplineText = (power: Power) => {
        let text = power.name + ": " + power.summary
        if (power.dicePool !== "") {
            text += ` // ${power.dicePool}`
        }
        if (power.rouseChecks > 0) {
            text += ` // ${power.rouseChecks} rouse check${power.rouseChecks > 1 ? "s" : ""}`
        }

        return text
    }

    const powersByDiscipline = character.disciplines.reduce((acc, p) => {
        if (!acc[p.discipline]) acc[p.discipline] = []
        acc[p.discipline].push(p)
        return acc
    }, {} as Record<DisciplineName, Power[]>)
    let i = 1  // TODO: Clean up index logic here
    for (const powers of Object.values(powersByDiscipline)) {
        form.getTextField(`Disc${i}`).setText(upcase(powers[0].discipline))
        let j = 1
        for (const p of powers) {
            form.getTextField(`Disc${i}_Ability${j}`).setText(getDisciplineText(p))
            form.getTextField(`Disc${i}_Ability${j}`).disableRichFormatting()
            form.getCheckBox(`Disc${i}-${j}`).check()
            j++
        }
        i++
        j = 0
    }


    // Merits & flaws
    const predatorTypeMeritsFlaws = PredatorTypes[character.predatorType.name].meritsAndFlaws
    const meritsAndFlaws = [...character.merits, ...predatorTypeMeritsFlaws, ...character.flaws]
    meritsAndFlaws.forEach(({ name, level, summary }, i) => {
        const fieldNum = i + 1
        form.getTextField(`Merit${fieldNum}`).setText(name + ": " + summary)
        for (let l = 1; l <= level; l++) {
            form.getCheckBox(`Merit${fieldNum}-${l}`).check()
        }
    })

    // Touchstones & Convictions
    form.getTextField("Convictions").setText(
        character.touchstones
            .map(({ name, description, conviction }) => `${name}: ${conviction}\n${description}`)
            .join("\n\n")
    )

    // Experience
    const experience = (() => {
        switch (character.generation) {
            case 16:
            case 15:
            case 14: return 0
            case 13:
            case 12: return 15
            case 11:
            case 10: return 35
            default: return 0
        }
    })()
    form.getTextField("tEXP").setText(`${experience} XP`)

    return await pdfDoc.save()
}

// export const createPdf_renegade = async (character: Character): Promise<Uint8Array> => {
//     const basePdf = await loadTemplate(base64Pdf_renegade)
//     const bytes = base64ToArrayBuffer(basePdf)

//     const pdfDoc = await PDFDocument.load(bytes)
//     const form = pdfDoc.getForm();

//     // Attributes
//     const attributes = character.attributes;
//     (["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"].map((a) => attributesKeySchema.parse(a))).forEach((attr) => {
//         const lvl = attributes[attr]
//         for (let i = 1; i <= lvl; i++) {
//             form.getCheckBox(attr + i).check()
//         }
//     })

//     // Skills
//     const skills = character.skills;
//     (["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival",
//         "animal ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge", "academics",
//         "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology",
//     ].map((s) => skillsKeySchema.parse(s))).forEach((skill) => {
//         const lvl = skills[skill]
//         for (let i = 1; i <= lvl; i++) {
//             form.getCheckBox(skill.replace(" ", "") + i).check()
//         }
//     })

//     // Health
//     let health = 3 + character.attributes["stamina"]
//     if (character.disciplines.find((power) => power.name === "Resilience")) {
//         const fortitudeLevel = character.disciplines.filter((power) => power.discipline === "fortitude").length
//         health += fortitudeLevel
//     }
//     for (let i = 10; i > health; i--) {
//         form.getTextField(`health${i}`).setText("-")
//     }

//     // Willpower
//     const willpower = character.attributes["composure"] + character.attributes["resolve"]
//     for (let i = 1; i <= willpower; i++) {
//         form.getTextField(`will${i}`).setText("o")
//     }

//     // Blood Potency
//     let bloodPotency = (() => {
//         switch (character.generation) {
//             case 16:
//             case 15:
//             case 14: return 0
//             case 13:
//             case 12: return 1
//             case 11:
//             case 10: return 2
//             default: return 1
//         }
//     })()
//     bloodPotency += PredatorTypes[character.predatorType.name].bloodPotencyChange
//     for (let i = 1; i <= bloodPotency; i++) {
//         form.getCheckBox(`potency${i}`).check()
//     }

//     const effects = potencyEffects[bloodPotency]
//     form.getTextField("Blood Surge").setText(`${effects.surge}`)
//     form.getTextField("Mend Amount").setText(effects.mend)
//     form.getTextField("Power Bonus").setText(effects.discBonus)
//     form.getTextField("Rouse ReRoll").setText(effects.discRouse)
//     form.getTextField("Feeding Penalty").setText(effects.penalty)
//     form.getTextField("Bane Severity").setText(`${effects.bane}`)

//     //Humanity
//     const humanity = 7 + PredatorTypes[character.predatorType.name].humanityChange
//     const checkImageBytes = await fetch(base64Check).then(res => res.text())
//     const checkImage = await pdfDoc.embedPng(checkImageBytes)
//     for (let i = 0; i <= humanity - 1; i++) {
//         form.getButton(`Button7.${i}`).setImage(checkImage)
//     }

//     // Top fields
//     form.getTextField("Name").setText(character.name)
//     form.getTextField("Concept").setText(character.description)
//     form.getTextField("Predator").setText(character.predatorType.name)
//     form.getTextField("Ambition").setText(character.ambition)

//     form.getTextField("Clan").setText(character.clan)
//     form.getTextField("Clan Banes").setText(Clans[character.clan].bane + "\n\nCompulsion:\n" + Clans[character.clan].compulsion)

//     form.getTextField("Sire").setText(character.sire)
//     form.getTextField("Desire").setText(character.desire)
//     form.getTextField("Generation").setText(`${character.generation}`)

//     // Disciplines
//     form.getTextField("Main1").setText(upcase(character.disciplines[0].discipline))
//     form.getTextField("Row1").setText(character.disciplines[0].name + ": " + character.disciplines[0].summary)
//     form.getTextField("Row2").setText(character.disciplines[1].name + ": " + character.disciplines[1].summary)
//     form.getCheckBox("main1-1").check()
//     form.getCheckBox("main1-2").check()

//     form.getTextField("Main2").setText(upcase(character.disciplines[2].discipline))
//     form.getTextField("Row1_2").setText(character.disciplines[2].name + ": " + character.disciplines[2].summary)
//     form.getCheckBox("main2-1").check();

//     // Specialties
//     const specialtyFieldNames: Record<SkillsKey, string> =
//     {
//         "animal ken": "AT.0.1",
//         athletics: "AT.0.0.0",
//         etiquette: "AT.0.0.1",
//         craft: "AT.0.0.2",
//         drive: "AT.0.0.3",
//         melee: "AT.0.0.4",
//         stealth: "AT.0.0.5",
//         academics: "AT.1.0",
//         brawl: "AT.1.1.0",
//         finance: "AT.1.1.1",
//         firearms: "AT.1.1.3",
//         larceny: "AT.1.1.4",
//         survival: "AT.1.1.5",
//         insight: "AT.1.1.2.0",
//         awareness: "AT.1.1.2.1",
//         intimidation: "AT.1.1.2.2",
//         investigation: "AT.1.1.2.3",
//         medicine: "AT.1.1.2.4",
//         leadership: "AT.1.1.2.5",
//         occult: "AT.1.1.2.6",
//         performance: "AT.1.1.2.7",
//         politics: "AT.1.1.2.8",
//         persuasion: "AT.1.1.2.9",
//         science: "AT.1.1.2.10",
//         streetwise: "AT.1.1.2.12",
//         technology: "AT.1.1.2.13",
//         subterfuge: "AT.1.1.2.14",
//     }
//     for (const specialty of character.specialties) {
//         const specialtyFieldName = specialtyFieldNames[specialty.skill]
//         form.getTextField(specialtyFieldName).setText(specialty.name)
//     }

//     // Merits & flaws
//     const meritFlawBase = "adflaw"
//     const predatorTypeMeritsFlaws = PredatorTypes[character.predatorType.name].meritsAndFlaws
//     const meritsAndFlaws = [...character.merits, ...character.flaws, ...predatorTypeMeritsFlaws]
//     meritsAndFlaws.forEach(({ name, level, summary }, i) => {
//         const fieldNum = i + 1
//         form.getTextField(meritFlawBase + fieldNum).setText(name + ": " + summary)
//         for (let l = 1; l <= level; l++) {
//             form.getCheckBox(meritFlawBase + fieldNum + "-" + l).check()
//         }
//     })

//     // Touchstones & Convictions
//     form.getTextField("Touchstones Convictions").setText(
//         character.touchstones
//             .map(({ name, description, conviction }) => `${name}: ${conviction}\n${description}`)
//             .join("\n\n")
//     )

//     // Experience
//     const experience = (() => {
//         switch (character.generation) {
//             case 16:
//             case 15:
//             case 14: return 0
//             case 13:
//             case 12: return 15
//             case 11:
//             case 10: return 35
//             default: return 0
//         }
//     })()
//     form.getTextField("totalxp").setText(`${experience} XP`)

//     return await pdfDoc.save()
// }

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
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}


const getFields = (form: PDFForm): Record<string, string> => {
    const fields = form.getFields()

    const outFields: Record<string, string> = {}
    fields.forEach(field => {
        const type = field.constructor.name
        const name = field.getName()

        outFields[name] = type
    })

    return outFields
}

export const printFieldNames = async () => {
    const basePdf = await loadTemplate()
    const bytes = base64ToArrayBuffer(basePdf)

    const pdfDoc = await PDFDocument.load(bytes)
    const form = pdfDoc.getForm()

    console.log(JSON.stringify(getFields(form), null, 2))
}



// export default createPdf_renegade