import { Button, Select, Space, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import { Character, getEmptyCharacter } from "../../data/Character"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"

type GenerationPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const GenerationPicker = ({ character, setCharacter, nextStep }: GenerationPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Generation Picker" })
    }, [])

    const isThinBlood = character.clan === "Thin-blood"
    const defaultGeneration = isThinBlood ? "14" : "13"
    const initialGeneration = character.generation !== getEmptyCharacter().generation ? character.generation.toString() : defaultGeneration

    const [generation, setGeneration] = useState<string | null>(initialGeneration)

    return (
        <div style={{ width: "100%" }}>
            <Text fz={"30px"} ta={"center"}>
                Pick your <b>Generation</b>
            </Text>
            <Text style={{ fontSize: "25px", color: "grey" }} ta={"center"}>
                {isThinBlood ? "Thin-bloods are of high generation, so you have to pick 14" : "Most common choice is '13 - Neonate'"}
            </Text>

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">
                Generation
            </Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" gap="xl">
                <Select
                    styles={(theme) => ({})}
                    style={{ width: "100%" }}
                    value={generation}
                    onChange={setGeneration}
                    label="When were you turned?"
                    placeholder="Pick one"
                    data={
                        isThinBlood
                            ? [{ value: "14", label: "14: Childer - Recently" }]
                            : [
                                  { value: "14", label: "14: Childer - Recently" },
                                  { value: "13", label: "13: Neonate - Been a while" },
                                  { value: "12", label: "12: Neonate - Been a while" },
                                  { value: "11", label: "11: Ancillae - I barely remember" },
                                  { value: "10", label: "10: Ancillae - I barely remember" },
                              ]
                    }
                />

                <Button
                    disabled={generation === null}
                    color="grape"
                    onClick={() => {
                        setCharacter({ ...character, generation: parseInt(generation ?? "0") })
                        trackEvent({
                            action: "generation submit clicked",
                            category: "generation",
                            label: generation ?? "0",
                        })
                        nextStep()
                    }}
                >
                    Confirm
                </Button>
            </Stack>
        </div>
    )
}

export default GenerationPicker
