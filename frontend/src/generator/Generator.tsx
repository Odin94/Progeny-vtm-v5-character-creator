import { Text } from "@mantine/core"
import { useEffect, useState } from "react"
import posthog from "posthog-js"
import ErrorBoundary from "../components/ErrorBoundary"
import { Character } from "../data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { PredatorTypeName } from "../data/NameSchemas"
import {
    AttributeSetting,
    DistributionKey,
    getAttributeSetting,
    getDisciplineDraft,
    getSkillDistribution,
    getSkillsSetting,
    SkillsSetting
} from "./creatorDrafts"
import { trackEvent } from "../utils/analytics"
import AttributePicker from "./components/AttributePicker"
import BasicsPicker from "./components/BasicsPicker"
import ClanPicker from "./components/ClanPicker"
import CeremoniesPicker from "./components/CeremoniesPicker"
import DisciplinesPicker from "./components/DisciplinesPicker"
import Final from "./components/Final"
import GenerationPicker from "./components/GenerationPicker"
import MeritsAndFlawsPicker from "./components/MeritsAndFlawsPicker"
import PredatorTypePicker from "./components/PredatorTypePicker"
import RitualsPicker from "./components/RitualsPicker"
import SkillsPicker from "./components/SkillsPicker"
import TouchstonePicker from "./components/TouchstonePicker"
import { GeneratorStepId, getNextGeneratorStepId } from "./steps"
import { feedbackSurveyEvents } from "~/utils/feedbackSurveys"

export type GeneratorProps = {
    character: Character
    setCharacter: SetCharacter

    selectedStep: GeneratorStepId
    setSelectedStep: (step: GeneratorStepId) => void
}

const Generator = ({
    character,
    setCharacter,
    selectedStep,
    setSelectedStep
}: GeneratorProps) => {
    // The predator-type picker is the generator's busiest back-and-forth step, so its in-progress
    // selection lives here rather than in the picker: the picker (and its modal) is unmounted every
    // time another step is shown, and component-local state would be discarded on the way out. Held
    // here it survives a step change, so a half-configured predator type is still there on return.
    const [pickedPredatorType, setPickedPredatorType] = useState<PredatorTypeName>("")
    const [predatorTypeSpecialty, setPredatorTypeSpecialty] = useState("")
    const [predatorTypeDiscipline, setPredatorTypeDiscipline] = useState("")
    const [attributeDraft, setAttributeDraft] = useState<AttributeSetting>(() =>
        getAttributeSetting(character.attributes)
    )
    const [skillsDraft, setSkillsDraft] = useState<SkillsSetting>(() =>
        getSkillsSetting(character.skills)
    )
    const [skillsDistribution, setSkillsDistribution] = useState<DistributionKey | null>(() =>
        getSkillDistribution(getSkillsSetting(character.skills))
    )
    const [generationDraft, setGenerationDraft] = useState<string | null>(() =>
        character.generation ? character.generation.toString() : null
    )
    const [{ clanPowers: disciplineDraft, predatorPower: predatorDisciplineDraft }, setDisciplinesDraft] =
        useState(() => getDisciplineDraft(character.disciplines, character.predatorType.pickedDiscipline))

    const clearClanDependentDrafts = () => {
        setDisciplinesDraft({ clanPowers: [], predatorPower: undefined })
        setPickedPredatorType("")
        setPredatorTypeSpecialty("")
        setPredatorTypeDiscipline("")
    }

    // Fire a PostHog step-view event whenever a generator step is shown. Individual steps only
    // send a confirm-click event, so without this we cannot measure step-level drop-off (how
    // many people reach a step vs. confirm it) outside of session replay.
    useEffect(() => {
        trackEvent({
            action: "generator step viewed",
            category: "generator",
            label: selectedStep
        })
    }, [selectedStep])

    const nextStep = (characterOverride?: Character) => {
        const nextStepId = getNextGeneratorStepId(characterOverride ?? character, selectedStep)

        if (nextStepId === "final" && selectedStep !== "final") {
            try {
                posthog.capture(feedbackSurveyEvents.characterCreationCompleted)
            } catch (error) {
                console.warn("PostHog character completion tracking failed:", error)
            }
        }

        setSelectedStep(nextStepId)
    }

    const getStepComponent = () => {
        switch (selectedStep) {
            case "clan":
                return (
                    <ClanPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        onClanChanged={clearClanDependentDrafts}
                    />
                )
            case "attributes":
                return (
                    <AttributePicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        pickedAttributes={attributeDraft}
                        setPickedAttributes={setAttributeDraft}
                    />
                )
            case "skills":
                return (
                    <SkillsPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        pickedSkills={skillsDraft}
                        setPickedSkills={setSkillsDraft}
                        pickedDistribution={skillsDistribution}
                        setPickedDistribution={setSkillsDistribution}
                    />
                )
            case "generation":
                return (
                    <GenerationPicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        generation={generationDraft}
                        setGeneration={setGenerationDraft}
                    />
                )
            case "predator-type":
                return (
                    <PredatorTypePicker
                        character={character}
                        setCharacter={setCharacter}
                        nextStep={nextStep}
                        pickedPowers={disciplineDraft}
                        setPickedPowers={(clanPowers) =>
                            setDisciplinesDraft((current) => ({ ...current, clanPowers }))
                        }
                        pickedPredatorTypePower={predatorDisciplineDraft}
                        setPickedPredatorTypePower={(predatorPower) =>
                            setDisciplinesDraft((current) => ({ ...current, predatorPower }))
                        }
                        pickedPredatorType={pickedPredatorType}
                        setPickedPredatorType={setPickedPredatorType}
                        specialty={predatorTypeSpecialty}
                        setSpecialty={setPredatorTypeSpecialty}
                        discipline={predatorTypeDiscipline}
                        setDiscipline={setPredatorTypeDiscipline}
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
                        pickedPowers={disciplineDraft}
                        setPickedPowers={(clanPowers) =>
                            setDisciplinesDraft((current) => ({ ...current, clanPowers }))
                        }
                        pickedPredatorTypePower={predatorDisciplineDraft}
                        setPickedPredatorTypePower={(predatorPower) =>
                            setDisciplinesDraft((current) => ({ ...current, predatorPower }))
                        }
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
            case "ceremonies":
                return (
                    <CeremoniesPicker
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
                return (
                    <Final
                        character={character}
                        setCharacter={setCharacter}
                        setSelectedStep={setSelectedStep}
                    />
                )
            default:
                return <Text size={"xl"}>{`Error: Step ${selectedStep} is not implemented`}</Text>
        }
    }

    return (
        // position: relative is the anchor for ShellStyle-based steps that use position: absolute.
        // The padding reserves the space occupied by the desktop sidebars, which are overlaid by
        // AppShell rather than participating in this component's layout.
        <div
            style={{
                height: "100%",
                width: "100%",
                position: "relative",
                flex: 1,
                minHeight: 0,
                boxSizing: "border-box",
                paddingLeft: "var(--navbar-offset, 0px)",
                paddingRight: "var(--aside-offset, 0px)"
            }}
        >
            {/* 960px centered wrapper for steps that don't use their own full-width shell */}
            <div
                style={{
                    maxWidth: 960,
                    marginLeft: "auto",
                    marginRight: "auto",
                    width: "calc(100% - clamp(1rem, 4vw, 3rem))",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 0
                }}
            >
                <ErrorBoundary key={selectedStep}>{getStepComponent()}</ErrorBoundary>
            </div>
        </div>
    )
}

export default Generator
