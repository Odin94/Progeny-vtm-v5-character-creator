import { Grid, Button } from "@mantine/core"
import { Character } from "../data/Character"


type ClanPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const ClanPicker = ({ character, setCharacter, nextStep }: ClanPickerProps) => {
    const createButton = (clan: string) => {
        return (
            <Grid.Col key={clan} span={4}>
                <Button color="grape" fullWidth onClick={() => {
                    setCharacter({ ...character, clan })
                    nextStep()
                }}>{clan}</Button>
            </Grid.Col>
        )
    }

    return (
        <div>
            <h1>Pick your clan</h1>
            <Grid grow>
                {
                    ["Brujah", "Gangrel", "Nosferatu", "Malkavian", "Tremere", "Ventrue", "Toreador"].map((clan) => createButton(clan))
                }
            </Grid>
        </div>
    )
}

export default ClanPicker