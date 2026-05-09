import { Grid, List, Stack, Title } from "@mantine/core"
import { Power, Ritual } from "../../data/Disciplines"
import { Ceremony } from "../../data/Ceremonies"
import { upcase } from "../../generator/utils"
import { DisciplineName } from "~/data/NameSchemas"

export type DisciplinesProps = {
    powers: Power[]
    rituals: Ritual[]
    ceremonies?: Ceremony[]
}

const DisciplineDisplay = ({ powers, rituals, ceremonies = [] }: DisciplinesProps) => {
    const powersByDisciplines = new Map<DisciplineName, Power[]>()
    powers.forEach((power) => {
        if (!powersByDisciplines.has(power.discipline)) {
            powersByDisciplines.set(power.discipline, [power])
        } else {
            powersByDisciplines.set(power.discipline, [
                ...powersByDisciplines.get(power.discipline)!,
                power
            ])
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
                                {disciplineName === "oblivion"
                                    ? ceremonies.map((ceremony) => {
                                          return (
                                              <List.Item ml={"-3px"} icon={"⛤"} key={ceremony.name}>
                                                  {ceremony.name}
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
