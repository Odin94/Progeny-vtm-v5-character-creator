import { Grid, List, Stack, Title } from "@mantine/core"
import { DisciplineName, Power, Ritual } from "../../data/Disciplines"
import { upcase } from "../../generator/utils"

export type DisciplinesProps = {
    powers: Power[]
    rituals: Ritual[]
}

const DisciplineDisplay = ({ powers, rituals }: DisciplinesProps) => {
    const powersByDisciplines = new Map<DisciplineName, Power[]>()
    powers.forEach((power) => {
        if (!powersByDisciplines.has(power.discipline)) {
            powersByDisciplines.set(power.discipline, [power])
        } else {
            powersByDisciplines.set(power.discipline, [...powersByDisciplines.get(power.discipline)!, power])
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
                                    return <List.Item key={power.name}>{power.name}</List.Item>
                                })}
                                {disciplineName === "blood sorcery"
                                    ? rituals.map((ritual) => {
                                          return (
                                              <List.Item ml={"-3px"} icon={"⛤"} key={ritual.name}>
                                                  {ritual.name}
                                              </List.Item>
                                          )
                                      })
                                    : null}
                            </List>
                        </Grid.Col>
                    )
                })}
            </Grid>
        </Stack>
    )
}

export default DisciplineDisplay
