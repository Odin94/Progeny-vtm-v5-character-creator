import { Button, Select, Stack } from "@mantine/core"
import { useState } from "react"
import { Character } from "../../data/Character"


type GenerationPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const GenerationPicker = ({ character, setCharacter, nextStep }: GenerationPickerProps) => {
    const [generation, setGeneration] = useState<string | null>("13");

    return (
        <div>
            <h1>Pick your generation</h1>
            <Stack align="center" spacing="xl">
                <Select
                    style={{ width: "300px" }}
                    value={generation}
                    onChange={setGeneration}
                    label="When were you turned?"
                    placeholder="Pick one"
                    data={[
                        { value: '14', label: '14: Childer - Recently' },
                        { value: '13', label: '13: Neonate - Been a while' },
                        { value: '12', label: '12: Neonate - Been a while' },
                        { value: '11', label: '11: Ancillae - I barely remember' },
                        { value: '10', label: '10: Ancillae - I barely remember' },
                    ]}
                />

                <Button disabled={generation === null} color="grape" onClick={() => {
                    setCharacter({ ...character, generation: parseInt(generation ?? "0") })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div>
    )
}

export default GenerationPicker