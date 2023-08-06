import { Center, Text } from "@mantine/core"
import { Character } from "../data/Character"
import AttributePicker from "./components/AttributePicker"
import BasicsPicker from "./components/BasicsPicker"
import ClanPicker from "./components/ClanPicker"
import DisciplinesPicker from "./components/DisciplinesPicker"
import Final from "./components/Final"
import GenerationPicker from "./components/GenerationPicker"
import Intro from "./components/Intro"
import MeritsAndFlawsPicker from "./components/MeritsAndFlawsPicker"
import PredatorTypePicker from "./components/PredatorTypePicker"
import SkillsPicker from "./components/SkillsPicker"
import TouchstonePicker from "./components/TouchstonePicker"
import ErrorBoundary from "../components/ErrorBoundary"
import RitualsPicker from "./components/RitualsPicker"


export type GeneratorProps = {
    character: Character,
    setCharacter: (character: Character) => void

    selectedStep: number,
    setSelectedStep: (step: number) => void
}

const Generator = ({ character, setCharacter, selectedStep, setSelectedStep }: GeneratorProps) => {
    const getStepComponent = () => {
        switch (selectedStep) {
            case 0: return <Intro setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 1: return <ClanPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 2: return <AttributePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 3: return <SkillsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 4: return <GenerationPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 5: return <PredatorTypePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 6: return <BasicsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 7: return <DisciplinesPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 8: return <RitualsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 9: return <TouchstonePicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 10: return <MeritsAndFlawsPicker character={character} setCharacter={setCharacter} nextStep={() => { setSelectedStep(selectedStep + 1) }} />
            case 11: return <Final character={character} setCharacter={setCharacter} setSelectedStep={setSelectedStep} />
            default: return <Text size={"xl"}>{`Error: Step ${selectedStep} is not implemented`}</Text>
        }
    }

    return (
        <Center h={"100%"}>
            <ErrorBoundary key={selectedStep}>
                {getStepComponent()}
            </ErrorBoundary>
        </Center>
    )
}


export default Generator