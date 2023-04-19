import { Button, Divider, Grid, Space, Stack, Text, Tooltip } from "@mantine/core"
import { Character, PredatorType } from "../../data/Character"


type PredatorTypePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const summaryByPredatorType: Record<PredatorType, string> = {
    Alleycat: "Ambush prey in alleys",
    Extortionist: "Strongarm prey into giving you their blood",
    "Roadside Killer": "Hunt prey on desolate roads",
    Cleaver: "Feed on friends and family",
    Consensualist: "Take blood only from the willing",
    Osiris: "Feed on your followers",
    "Scene Queen": "Feed in your scene",
    Siren: "Seduce prey and take their blood",
    Sandman: "Break into homes and feed on sleeping prey",
    Graverobber: "Feed on fresh corpses and mourning families",
    Bagger: "Feed on blood bags",
    "Blood Leech": "Feed on other vampires",
    Farmer: "Feed on animals",
    "": ""
}

const PredatorTypePicker = ({ character, setCharacter, nextStep }: PredatorTypePickerProps) => {
    const createButton = (predatorType: PredatorType, color: string) => {
        return (
            <Tooltip label={summaryByPredatorType[predatorType]} key={predatorType}>
                <Button disabled={character.clan === "Ventrue" && ["Bagger", "Farmer"].includes(predatorType)} color={color} onClick={() => {
                    setCharacter({ ...character, predatorType: predatorType })
                    nextStep()
                }}>{predatorType}</Button>
            </Tooltip>
        )
    }

    return (
        <div style={{ width: "100%" }}>
            <h1>How do you obtain blood?</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Predator Type</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack spacing="xl">
                <Grid>
                    <Grid.Col span={4}><h1>Violent</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Alleycat", "Extortionist", "Roadside Killer",] as PredatorType[]).map((clan) => createButton(clan, "red"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="grape" />

                <Grid>
                    <Grid.Col span={4}><h1>Sociable</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren",] as PredatorType[]).map((clan) => createButton(clan, "grape"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="gray" />

                <Grid>
                    <Grid.Col span={4}><h1>Stealth</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Sandman", "Graverobber",] as PredatorType[]).map((clan) => createButton(clan, "gray"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="violet" />

                <Grid>
                    <Grid.Col span={4}><h1>Excluding Mortals</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Bagger", "Blood Leech", "Farmer",] as PredatorType[]).map((clan) => createButton(clan, "violet"))}</Stack>
                    </Grid.Col>
                </Grid>
            </Stack>
        </div>
    )
}

export default PredatorTypePicker