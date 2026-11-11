import { memo } from "react"
import { MeritFlaw } from "../../data/Character"
import Dots from "./Dots"
import classes from "./Dossier.module.css"

export type MeritsAndFlawsProps = {
    merits: MeritFlaw[]
    flaws: MeritFlaw[]
}

const MeritsAndFlawsDisplay = ({ merits, flaws }: MeritsAndFlawsProps) => (
    <section className={classes.section}>
        <h3 className={classes.sectionTitle}>Merits & Flaws</h3>
        {merits.length > 0 ? (
            <div className={classes.group}>
                <span className={classes.groupLabel}>Merits</span>
                {merits.map((merit) => (
                    <div key={merit.name} className={classes.row}>
                        <span className={classes.rowName}>{merit.name}</span>
                        <Dots n={merit.level} max={merit.level} color="var(--pg-success)" />
                    </div>
                ))}
            </div>
        ) : null}
        {flaws.length > 0 ? (
            <div className={classes.group}>
                <span className={classes.groupLabel}>Flaws</span>
                {flaws.map((flaw) => (
                    <div key={flaw.name} className={classes.row}>
                        <span className={classes.rowName}>{flaw.name}</span>
                        <Dots n={flaw.level} max={flaw.level} color="var(--pg-blood-bright)" />
                    </div>
                ))}
            </div>
        ) : null}
    </section>
)

export default memo(MeritsAndFlawsDisplay)
