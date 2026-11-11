import { memo } from "react"
import { Power, Ritual } from "../../data/Disciplines"
import { Ceremony } from "../../data/Ceremonies"
import { upcase } from "../../generator/utils"
import { DisciplineName } from "~/data/NameSchemas"
import { getPowerDisciplineIdentity, getPowerIdentity } from "~/utils/homebrewOptions"
import classes from "./Dossier.module.css"

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
        <section className={classes.section}>
            <h3 className={classes.sectionTitle}>Disciplines</h3>
            {Array.from(powersByDisciplines.entries()).map(
                ([identity, { disciplineName, powers }]) => (
                    <div key={identity} className={classes.group}>
                        <div className={classes.row}>
                            <span className={classes.rowName} style={{ color: "var(--pg-ink)" }}>
                                {upcase(disciplineName)}
                            </span>
                        </div>
                        <ul className={classes.list}>
                            {powers.map((power) => (
                                <li key={getPowerIdentity(power)} className={classes.listItem}>
                                    {power.name}
                                </li>
                            ))}
                            {identity === "official:blood sorcery"
                                ? rituals.map((ritual) => (
                                      <li key={ritual.name} className={classes.listItem} data-rite>
                                          {ritual.name}
                                      </li>
                                  ))
                                : null}
                            {identity === "official:oblivion"
                                ? ceremonies.map((ceremony) => (
                                      <li
                                          key={ceremony.name}
                                          className={classes.listItem}
                                          data-rite
                                      >
                                          {ceremony.name}
                                      </li>
                                  ))
                                : null}
                        </ul>
                    </div>
                )
            )}
        </section>
    )
}

export default memo(DisciplineDisplay)
