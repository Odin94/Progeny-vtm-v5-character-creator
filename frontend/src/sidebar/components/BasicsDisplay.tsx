import { Center, Grid, Stack, Text, Title } from "@mantine/core"
import { Character } from "../../data/Character"

export type BasicsProps = {
    character: Character
}

const BasicsDisplay = ({ character }: BasicsProps) => {
    return (
        <Stack>
            <Center>
                <Title order={2}>{character.name}</Title>
            </Center>
            <Text c="dimmed">{character.description}</Text>

            <Grid>
                <Grid.Col span={4}>
                    <Text>
                        <b>Sire:</b>
                    </Text>
                    <Text>{character.sire}</Text>
                </Grid.Col>

                <Grid.Col span={4}>
                    <Text>
                        <b>Ambition:</b>
                    </Text>
                    <Text>{character.ambition}</Text>
                </Grid.Col>

                <Grid.Col span={4}>
                    <Text>
                        <b>Desire:</b>
                    </Text>
                    <Text>{character.desire}</Text>
                </Grid.Col>
            </Grid>
        </Stack>
    )
}

export default BasicsDisplay
