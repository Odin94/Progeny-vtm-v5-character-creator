import { Grid, List, Stack, Title } from "@mantine/core"
import { Power, Ritual } from "../../data/Disciplines"
import { Ceremony } from "../../data/Ceremonies"
import { upcase } from "../../generator/utils"
import { DisciplineName } from "~/data/NameSchemas"
import { getPowerDisciplineIdentity, getPowerIdentity } from "~/utils/homebrewOptions"

export type DisciplinesProps = {
    powers: Power[]
    rituals: Ritual[]
    ceremonies?: Ceremony[]
}

const DisciplineDisplay = ({ powers, rituals, ceremonies = [] }: DisciplinesProps) => {
    const powersByDisciplines = new Map<
        string,
        { disciplineName: DisciplineName; powers: Power[] }
    >()
    powers.forEach((power) => {
        const identity = getPowerDisciplineIdentity(power)
        const group = powersByDisciplines.get(identity)
        powersByDisciplines.set(identity, {
            disciplineName: power.discipline,
            powers: [...(group?.powers ?? []), power]
        })
    })

    return (
        <Stack>
            <Grid>
                {Array.from(powersByDisciplines.entries()).map(
                    ([identity, { disciplineName, powers }]) => {
                        return (
                            <Grid.Col span={6} key={identity}>
                                <Title order={4}>{upcase(disciplineName)}</Title>
                                <List>
                                    {powers.map((power) => {
                                        return (
                                            <List.Item key={getPowerIdentity(power)}>
                                                {power.name}
                                            </List.Item>
                                        )
                                    })}
                                    {identity === "official:blood sorcery"
                                        ? rituals.map((ritual) => {
                                              return (
                                                  <List.Item
                                                      ml={"-3px"}
                                                      icon={"⛤"}
                                                      key={ritual.name}
                                                  >
                                                      {ritual.name}
                                                  </List.Item>
                                              )
                                          })
                                        : null}
                                    {identity === "official:oblivion"
                                        ? ceremonies.map((ceremony) => {
                                              return (
                                                  <List.Item
                                                      ml={"-3px"}
                                                      icon={"⛤"}
                                                      key={ceremony.name}
                                                  >
                                                      {ceremony.name}
                                                  </List.Item>
                                              )
                                          })
                                        : null}
                                </List>
                            </Grid.Col>
                        )
                    }
                )}
            </Grid>
        </Stack>
    )
}

export default DisciplineDisplay
