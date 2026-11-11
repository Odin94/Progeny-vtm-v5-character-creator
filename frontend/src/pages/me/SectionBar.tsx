import { VisuallyHidden } from "@mantine/core"
import type { ReactNode } from "react"
import classes from "./me.module.css"

type SectionBarProps = {
    /** Heading for assistive tech; the active tab already labels the section visually. */
    title: string
    id: string
    summary?: ReactNode
    actions?: ReactNode
}

/** Summary line + actions at the top of a tab panel. */
export const SectionBar = ({ title, id, summary, actions }: SectionBarProps) => (
    <div className={classes.sectionBar}>
        <VisuallyHidden component="h2" id={id}>
            {title}
        </VisuallyHidden>
        <p className={classes.sectionSummary}>{summary}</p>
        {actions ? <div className={classes.toolbar}>{actions}</div> : null}
    </div>
)
