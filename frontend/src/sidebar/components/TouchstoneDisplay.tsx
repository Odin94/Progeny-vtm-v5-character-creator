import { memo } from "react"
import { Touchstone } from "../../data/Character"
import classes from "./Dossier.module.css"

export type TouchstoneProps = {
    touchstones: Touchstone[]
}

const TouchstoneDisplay = ({ touchstones }: TouchstoneProps) => (
    <section className={classes.section}>
        <h3 className={classes.sectionTitle}>Touchstones</h3>
        <div className={classes.fields}>
            {touchstones.map((stone, i) => (
                <div key={i} className={classes.field}>
                    <span className={classes.fieldValue} style={{ color: "var(--pg-ink)" }}>
                        {stone.name}
                    </span>
                    {stone.conviction ? (
                        <span className={classes.muted}>{stone.conviction}</span>
                    ) : null}
                </div>
            ))}
        </div>
    </section>
)

export default memo(TouchstoneDisplay)
