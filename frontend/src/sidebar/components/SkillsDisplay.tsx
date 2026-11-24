import { memo } from "react"
import { upcase } from "../../generator/utils"
import { Skills, skillsKeySchema } from "../../data/Skills"
import Dots from "./Dots"
import classes from "./Dossier.module.css"

export type SkillsProps = {
    skills: Skills
}

const groups = [
    {
        label: "Physical",
        keys: [
            "athletics",
            "brawl",
            "craft",
            "drive",
            "firearms",
            "melee",
            "larceny",
            "stealth",
            "survival"
        ]
    },
    {
        label: "Social",
        keys: [
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance",
            "persuasion",
            "streetwise",
            "subterfuge"
        ]
    },
    {
        label: "Mental",
        keys: [
            "academics",
            "awareness",
            "finance",
            "investigation",
            "medicine",
            "occult",
            "politics",
            "science",
            "technology"
        ]
    }
]

/** Trained skills only; untrained ones would just be 27 rows of empty dots. */
const SkillDisplay = ({ skills }: SkillsProps) => (
    <section className={classes.section}>
        <h3 className={classes.sectionTitle}>Skills</h3>
        {groups.map((group) => {
            const trained = group.keys
                .map((s) => skillsKeySchema.parse(s))
                .filter((skill) => skills[skill] > 0)
            if (trained.length === 0) return null

            return (
                <div key={group.label} className={classes.group}>
                    <span className={classes.groupLabel}>{group.label}</span>
                    {trained.map((skill) => (
                        <div key={skill} className={classes.row}>
                            <span className={classes.rowName}>{upcase(skill)}</span>
                            <Dots n={skills[skill]} />
                        </div>
                    ))}
                </div>
            )
        })}
    </section>
)

export default memo(SkillDisplay)
