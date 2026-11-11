import { Character } from "../../data/Character"
import classes from "./Dossier.module.css"

export type BasicsProps = {
    character: Character
}

/** Description + sire/ambition/desire. The name itself sits in the dossier's identity card. */
const BasicsDisplay = ({ character }: BasicsProps) => {
    const fields = [
        { label: "Sire", value: character.sire },
        { label: "Ambition", value: character.ambition },
        { label: "Desire", value: character.desire }
    ].filter((field) => field.value.trim())

    if (!character.description.trim() && fields.length === 0) return null

    return (
        <section className={classes.section}>
            <h3 className={classes.sectionTitle}>Basics</h3>
            {character.description.trim() ? (
                <p className={classes.description} style={{ margin: 0 }}>
                    {character.description}
                </p>
            ) : null}
            {fields.length > 0 ? (
                <div className={classes.fields}>
                    {fields.map((field) => (
                        <div key={field.label} className={classes.field}>
                            <span className={classes.fieldLabel}>{field.label}</span>
                            <span className={classes.fieldValue}>{field.value}</span>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    )
}

export default BasicsDisplay
