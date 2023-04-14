import { List, Stack, Text, Title } from "@mantine/core"
import { Touchstone } from "../../data/Character"

export type TouchstoneProps = {
    touchstones: Touchstone[]
}


const TouchstoneDisplay = ({ touchstones }: TouchstoneProps) => {
    return (
        <Stack>
            <Title order={2}>Touchstones</Title>
            <List>
                {touchstones.map((stone) => {
                    return (
                        <List.Item key={stone.name}>
                            <Text><b>{stone.name}</b></Text>
                            <Text c="dimmed">{stone.conviction}</Text>
                        </List.Item>
                    )
                })}
            </List>

        </Stack >
    )
}

export default TouchstoneDisplay
