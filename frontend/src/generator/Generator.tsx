import { Text } from "@mantine/core"
import ErrorBoundary from "../components/ErrorBoundary"
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
import RitualsPicker from "./components/RitualsPicker"
import SkillsPicker from "./components/SkillsPicker"
import TouchstonePicker from "./components/TouchstonePicker"
import { GeneratorStepId, getNextGeneratorStepId } from "./steps"

export type GeneratorProps = {
    character: Character
    setCharacter: (character: Character) => void

    selectedStep: GeneratorStepId
    setSelectedStep: (step: GeneratorStepId) => void
}

const Generator = ({ character, setCharacter, selectedStep, setSelectedStep }: GeneratorProps) => {
    const nextStep = () => {
        setSelectedStep(getNextGeneratorStepId(character, selectedStep))
    }

    const getStepComponent = () => {
        switch (selectedStep) {
            case "intro":
                return (
                    <Intro
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        setSelectedStep={setSelectedStep}
                    />
                )
            case "clan":
                return (
                    <ClanPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "attributes":
                return (
                    <AttributePicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "skills":
                return (
                    <SkillsPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "generation":
                return (
                    <GenerationPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "predator-type":
                return (
                    <PredatorTypePicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "basics":
                return (
                    <BasicsPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "disciplines":
                return (
                    <DisciplinesPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "rituals":
                return (
                    <RitualsPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "touchstones":
                return (
                    <TouchstonePicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "merits":
                return (
                    <MeritsAndFlawsPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                    />
                )
            case "final":
                return <Final character={character} setCharacter={setCharacter} setSelectedStep={setSelectedStep} />
            default:
                return <Text size={"xl"}>{`Error: Step ${selectedStep} is not implemented`}</Text>
        }
    }

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                minHeight: 0,
            }}
        >
            <ErrorBoundary key={selectedStep}>{getStepComponent()}</ErrorBoundary>
        </div>
    )
}

export default Generator
