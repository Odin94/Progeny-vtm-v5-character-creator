import { Grid, List, Stack, Title } from "@mantine/core"
import { DisciplineName, Power } from "../../data/Disciplines"
import { upcase } from "../../generator/utils"

export type DisciplinesProps = {
    powers: Power[]
}

const DisciplineDisplay = ({ powers }: DisciplinesProps) => {
    const powersByDisciplines = new Map<DisciplineName, Power[]>()
    powers.forEach((power) => {
        if (!powersByDisciplines.has(power.discipline)) {
            powersByDisciplines.set(power.discipline, [power])
        } else {
            powersByDisciplines.set(power.discipline, [...(powersByDisciplines.get(power.discipline))!, power])
        }
    })


    return (
        <Stack>
            <Grid>
                {Array.from(powersByDisciplines.entries()).map(([disciplineName, powers]) => {
                    return (
                        <Grid.Col span={6} key={disciplineName}>
                            <Title order={4}>{upcase(disciplineName)}</Title>
                            <List>
                                {powers.map((power) => {
                                    return (<List.Item key={power.name}>{power.name}</List.Item>)
                                })}
                            </List>
                        </Grid.Col>
                    )
                })}
            </Grid>
        </Stack>
    )
}

export default DisciplineDisplay
