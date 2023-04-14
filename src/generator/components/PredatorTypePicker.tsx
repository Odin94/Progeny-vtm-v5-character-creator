import { Button, Grid, Stack } from "@mantine/core"
import { Character, PredatorType } from "../../data/Character"


type PredatorTypePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const PredatorTypePicker = ({ character, setCharacter, nextStep }: PredatorTypePickerProps) => {
    const createButton = (predatorType: PredatorType) => {
        return (
            <Button key={predatorType} color="grape" onClick={() => {
                setCharacter({ ...character, predatorType: predatorType })
                nextStep()
            }}>{predatorType}</Button>
        )
    }

    return (
        <div>
            <h1>How do you obtain blood?</h1>
            <Stack spacing="xl">
                <Grid>
                    <Grid.Col span={5}><h1>Brutal</h1></Grid.Col>
                    <Grid.Col span={2}>
                        <Stack>{(["Alleycat", "Extortionist", "Roadside Killer",] as PredatorType[]).map((clan) => createButton(clan))}</Stack>
                    </Grid.Col>
                </Grid>

                <hr style={{ width: "100%" }} />

                <Grid>
                    <Grid.Col span={5}><h1>Sociable</h1></Grid.Col>
                    <Grid.Col span={2}>
                        <Stack>{(["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren",] as PredatorType[]).map((clan) => createButton(clan))}</Stack>
                    </Grid.Col>
                </Grid>

                <hr style={{ width: "100%" }} />

                <Grid>
                    <Grid.Col span={5}><h1>Stealthy</h1></Grid.Col>
                    <Grid.Col span={2}>
                        <Stack>{(["Sandman", "Graverobber",] as PredatorType[]).map((clan) => createButton(clan))}</Stack>
                    </Grid.Col>
                </Grid>

                <hr style={{ width: "100%" }} />

                <Grid>
                    <Grid.Col span={5}><h1>Excluding Mortals</h1></Grid.Col>
                    <Grid.Col span={2}>
                        <Stack>{(["Bagger", "Blood Leech", "Farmer",] as PredatorType[]).map((clan) => createButton(clan))}</Stack>
                    </Grid.Col>
                </Grid>
            </Stack>
        </div>
    )
}

export default PredatorTypePicker