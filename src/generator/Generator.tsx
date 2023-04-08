
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

import { useState } from "react"
import { Character, getEmptyCharacter } from "./data/Character"
import ClanPicker from "./components/ClanPicker"
import AttributePicker from "./components/AttributePicker"
import { Text } from "@mantine/core"
import SkillPicker from "./components/SkillPicker"
import GenerationPicker from "./components/GenerationPicker"
import PredatorTypePicker from "./components/PredatorTypePicker"



// Interface
// One parent component that holds the character info
// Cycles through child components for each step, passes them a "completeStep" function that triggers next component and sets value in parent
// 

const Generator = () => {
    const [character, setCharacter] = useState<Character>(getEmptyCharacter())
    const [selectedStep, setSelectedStep] = useState(0)

    const getStepComponent = () => {
        switch (selectedStep) {
            case 0: return <ClanPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 1: return <AttributePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 2: return <SkillPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 3: return <GenerationPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 4: return <PredatorTypePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            default: throw new Error(`Step ${selectedStep} not yet implemented`)
        }
    }

    return (
        <div>
            <Text>{JSON.stringify(character, null, 2)}</Text>

            {getStepComponent()}
        </div>
    )
}


export default Generator