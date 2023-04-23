import { PDFDocument, PDFForm } from 'pdf-lib';
import { Character, SkillsKey, attributesKeySchema, skillsKeySchema } from '../data/Character';
import base64Check from '../resources/CheckSolid.base64';
import base64Pdf from '../resources/v5_charactersheet_fillable_v3.base64';
import { upcase } from './utils';
import { Clans } from '../data/Clans';

type BloodPotencyEffect = {
    surge: number,
    mend: string,
    discBonus: string,
    discRouse: string,
    bane: number,
    penalty: string
}


const loadTemplate = async () => {
    return fetch(base64Pdf)
        .then(r => r.text())
}

function downloadPdf(fileName: string, bytes: Uint8Array) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

const createPdf = async (character: Character): Promise<Uint8Array> => {
    const basePdf = await loadTemplate()
    const bytes = base64ToArrayBuffer(basePdf)

    const pdfDoc = await PDFDocument.load(bytes)
    const form = pdfDoc.getForm();

    // Attributes
    const attributes = character.attributes;
    (["strength", "dexterity", "stamina", "charisma", "manipulation", "composure", "intelligence", "wits", "resolve"].map((a) => attributesKeySchema.parse(a))).forEach((attr) => {
        const lvl = attributes[attr]
        for (let i = 1; i <= lvl; i++) {
            form.getCheckBox(attr + i).check()
        }
    })

    // Skills
    const skills = character.skills;
    (["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival",
        "animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge", "academics",
        "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology",
    ].map((s) => skillsKeySchema.parse(s))).forEach((skill) => {
        const lvl = skills[skill]
        for (let i = 1; i <= lvl; i++) {
            form.getCheckBox(skill.replace("_", "") + i).check()
        }
    })

    // Health
    let health = 3 + character.attributes["stamina"]
    if (character.disciplines.find((power) => power.name === "Resilience")) {
        const fortitudeLevel = character.disciplines.filter((power) => power.discipline === "fortitude").length
        health += fortitudeLevel
    }
    for (let i = 10; i > health; i--) {
        form.getTextField(`health${i}`).setText("-")
    }

    // Willpower
    const willpower = character.attributes["composure"] + character.attributes["resolve"]
    for (let i = 1; i <= willpower; i++) {
        form.getTextField(`will${i}`).setText("o")
    }

    // Blood Potency
    const bloodPotency = (() => {
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
    for (let i = 1; i <= bloodPotency; i++) {
        form.getCheckBox(`potency${i}`).check()
    }

    const potencyEffects: Record<number, BloodPotencyEffect> = {
        0: { surge: 1, mend: "1 superficial", discBonus: "-", discRouse: "-", bane: 0, penalty: "-" },
        1: { surge: 2, mend: "1 superficial", discBonus: "-", discRouse: "Lvl 1", bane: 2, penalty: "-" },
        2: { surge: 2, mend: "2 superficial", discBonus: "Add 1 die", discRouse: "Lvl 1", bane: 2, penalty: "Animal and bagged blood slake half Hunger" },
        3: { surge: 3, mend: "2 superficial", discBonus: "Add 1 die", discRouse: "Lvl 2 and below", bane: 3, penalty: "Animal and bagged blood slake no Hunger" },
        4: { surge: 3, mend: "3 superficial", discBonus: "Add 2 dice", discRouse: "Lvl 2 and below", bane: 3, penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human" },
        5: { surge: 4, mend: "3 superficial", discBonus: "Add 2 dice", discRouse: "Lvl 3 and below", bane: 4, penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2" },
    }
    const effects = potencyEffects[bloodPotency]
    form.getTextField("Blood Surge").setText(`${effects.surge}`)
    form.getTextField("Mend Amount").setText(effects.mend)
    form.getTextField("Power Bonus").setText(effects.discBonus)
    form.getTextField("Rouse ReRoll").setText(effects.discRouse)
    form.getTextField("Feeding Penalty").setText(effects.penalty)
    form.getTextField("Bane Severity").setText(`${effects.bane}`)

    //Humanity
    const humanity = 7
    const checkImageBytes = await fetch(base64Check).then(res => res.text())
    const checkImage = await pdfDoc.embedPng(checkImageBytes)
    for (let i = 0; i <= humanity - 1; i++) {
        form.getButton(`Button7.${i}`).setImage(checkImage)
    }

    // Top fields
    form.getTextField("Name").setText(character.name)
    form.getTextField("Concept").setText(character.description)
    form.getTextField("Predator").setText(character.predatorType)
    form.getTextField("Ambition").setText(character.ambition)

    form.getTextField("Clan").setText(character.clan)
    form.getTextField("Clan Banes").setText(Clans[character.clan].bane + "\n\nCompulsion:\n" + Clans[character.clan].compulsion)

    form.getTextField("Sire").setText(character.sire)
    form.getTextField("Desire").setText(character.desire)
    form.getTextField("Generation").setText(`${character.generation}`)

    // Disciplines
    form.getTextField("Main1").setText(upcase(character.disciplines[0].discipline))
    form.getTextField("Row1").setText(character.disciplines[0].name + ": " + character.disciplines[0].summary)
    form.getTextField("Row2").setText(character.disciplines[1].name + ": " + character.disciplines[1].summary)
    form.getCheckBox("main1-1").check()
    form.getCheckBox("main1-2").check()

    form.getTextField("Main2").setText(upcase(character.disciplines[2].discipline))
    form.getTextField("Row1_2").setText(character.disciplines[2].name + ": " + character.disciplines[2].summary)
    form.getCheckBox("main2-1").check();


    const specialtyFieldNames: Record<SkillsKey, string> =
    {
        animal_ken: "AT.0.1",
        athletics: "AT.0.0.0",
        etiquette: "AT.0.0.1",
        craft: "AT.0.0.2",
        drive: "AT.0.0.3",
        melee: "AT.0.0.4",
        stealth: "AT.0.0.5",
        academics: "AT.1.0",
        brawl: "AT.1.1.0",
        finance: "AT.1.1.1",
        firearms: "AT.1.1.3",
        larceny: "AT.1.1.4",
        survival: "AT.1.1.5",
        insight: "AT.1.1.2.0",
        awareness: "AT.1.1.2.1",
        intimidation: "AT.1.1.2.2",
        investigation: "AT.1.1.2.3",
        medicine: "AT.1.1.2.4",
        leadership: "AT.1.1.2.5",
        occult: "AT.1.1.2.6",
        performance: "AT.1.1.2.7",
        politics: "AT.1.1.2.8",
        persuasion: "AT.1.1.2.9",
        science: "AT.1.1.2.10",
        streetwise: "AT.1.1.2.12",
        technology: "AT.1.1.2.13",
        subterfuge: "AT.1.1.2.14",
    }

    // Merits & flaws
    const meritFlawBase = "adflaw"
    const meritsAndFlaws = [...character.merits, ...character.flaws]
    meritsAndFlaws.forEach(({ name, level, summary }, i) => {
        const fieldNum = i + 1
        form.getTextField(meritFlawBase + fieldNum).setText(name + ": " + summary)
        for (let l = 1; l <= level; l++) {
            form.getCheckBox(meritFlawBase + fieldNum + "-" + l).check()
        }
    })

    // Touchstones & Convictions
    form.getTextField("Touchstones Convictions").setText(
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
    form.getTextField("totalxp").setText(`${experience} XP`)

    return await pdfDoc.save()
}

export const downloadCharacterSheet = async (character: Character) => {
    const pdfBytes = await createPdf(character)
    downloadPdf(`vtm_v5_${character.name}.pdf`, pdfBytes)
}

function base64ToArrayBuffer(base64: string) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
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



export default createPdf