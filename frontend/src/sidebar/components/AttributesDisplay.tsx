import { memo } from "react"
import { upcase } from "../../generator/utils"
import { Attributes, attributesKeySchema } from "../../data/Attributes"
import Dots from "./Dots"
import classes from "./Dossier.module.css"

export type AttributesProps = {
    attributes: Attributes
}

const groups = [
    { label: "Physical", keys: ["strength", "dexterity", "stamina"] },
    { label: "Social", keys: ["charisma", "manipulation", "composure"] },
    { label: "Mental", keys: ["intelligence", "wits", "resolve"] }
]

const AttributesDisplay = ({ attributes }: AttributesProps) => (
    <section className={classes.section}>
        <h3 className={classes.sectionTitle}>Attributes</h3>
        {groups.map((group) => (
            <div key={group.label} className={classes.group}>
                <span className={classes.groupLabel}>{group.label}</span>
                {group.keys
                    .map((a) => attributesKeySchema.parse(a))
                    .map((attribute) => (
                        <div key={attribute} className={classes.row}>
                            <span className={classes.rowName}>{upcase(attribute)}</span>
                            <Dots n={attributes[attribute]} />
                        </div>
                    ))}
            </div>
        ))}
    </section>
)

export default memo(AttributesDisplay)
