import { Button, Select, Space, Stack, Text } from "@mantine/core"
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
        <div style={{ width: "100%" }}>
            <h1>Pick your generation</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Generation</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" spacing="xl">
                <Select
                    styles={(theme) => ({
                        item: {
                            // applies styles to selected item
                            '&[data-selected]': {
                                '&, &:hover': {
                                    backgroundColor: theme.colors.grape,
                                    color: theme.colors.white,
                                },
                            },

                            // applies styles to hovered item (with mouse or keyboard)
                            '&[data-hovered]': {},
                        },
                    })}
                    style={{ width: "100%" }}
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