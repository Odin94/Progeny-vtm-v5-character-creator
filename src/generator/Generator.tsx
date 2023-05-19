
/* Multi-step generation
 * Pick clan
 * Pick strongest-5, weakest-1, 3 decent-3 attributes (rest 2)
 * Pick skill distribution (jack 1x3, 8x2, 10x1   balanced 3x3, 5x2, 7x1   specialist 1x4 3x3 3x2 3x1)  (add free specializations to academics, craft, performance, science and 1 free anywhere)
 * Pick generation (default 13, +15xp, BP 1)
 * Pick predator type
 * Pick name, sire, long-lasting ambition and immediate desire, appearance
 * Pick disciplines
 * Pick 1-3 Touchstones (+ 1 conviction for each)
 * Pick merits and flaws
*/

import { Alert, Center, FileInput, Text } from "@mantine/core"
import { Character } from "../data/Character"
import AttributePicker from "./components/AttributePicker"
import BasicsPicker from "./components/BasicsPicker"
import ClanPicker from "./components/ClanPicker"
import DisciplinesPicker from "./components/DisciplinesPicker"
import GenerationPicker from "./components/GenerationPicker"
import MeritsAndFlawsPicker from "./components/MeritsAndFlawsPicker"
import PredatorTypePicker from "./components/PredatorTypePicker"
import SkillsPicker from "./components/SkillsPicker"
import TouchstonePicker from "./components/TouchstonePicker"
import { useState } from "react"
import { getUploadFile } from "./utils"
import { testTemplate } from "./pdfCreator"
import { IconAlertCircle } from "@tabler/icons-react"
import Final from "./components/Final"


export type GeneratorProps = {
    character: Character,
    setCharacter: (character: Character) => void

    selectedStep: number,
    setSelectedStep: (step: number) => void

    fillableCharacterSheet: string | null,
    setFillableCharacterSheet: (sheet: string) => void
}

const Generator = ({ character, setCharacter, selectedStep, setSelectedStep, fillableCharacterSheet, setFillableCharacterSheet }: GeneratorProps) => {
    const getStepComponent = () => {
        switch (selectedStep) {
            case 0: return <ClanPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 1: return <AttributePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 2: return <SkillsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 3: return <GenerationPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 4: return <PredatorTypePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 5: return <BasicsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 6: return <DisciplinesPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 7: return <TouchstonePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 8: return <MeritsAndFlawsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 9: return <Final character={character} setCharacter={setCharacter} setSelectedStep={setSelectedStep} />
            default: return <Text size={"xl"}>{`Error: Step ${selectedStep} is not implemented`}</Text>
        }
    }

    return (
        <Center h={"100%"}>
            {getStepComponent()}
        </Center>
    )
}


export default Generator