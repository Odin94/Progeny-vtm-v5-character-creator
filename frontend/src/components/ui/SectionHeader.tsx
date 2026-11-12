import type { ReactNode } from "react"
import classes from "./ui.module.css"

export type SectionHeaderProps = {
    title: ReactNode
    description?: ReactNode
    actions?: ReactNode
    /** Heading level for the title. Default: 2. */
    order?: 2 | 3 | 4
    size?: "md" | "lg"
    /** Draw the gold hairline that runs from the title to the actions. Default: true. */
    rule?: boolean
    id?: string
    className?: string
}

/**
 * Section title inside a page or panel: accent lozenge + Cinzel caps + a fading gold rule,
 * with optional actions on the right. The lozenge follows the active primary color, so it
 * turns clan-colored on the character sheet.
 *
 * ```tsx
 * <SectionHeader title="Characters" actions={<Button size="xs">New</Button>} />
 * ```
 */
export const SectionHeader = ({
    title,
    description,
    actions,
    order = 2,
    size = "md",
    rule = true,
    id,
    className
}: SectionHeaderProps) => {
    const Heading = `h${order}` as const

    return (
        <div
            className={[classes.sectionHeader, className].filter(Boolean).join(" ")}
            data-size={size}
            data-has-description={description ? true : undefined}
        >
            <div className={classes.sectionHeaderLead}>
                <Heading id={id} className={classes.sectionHeaderTitle}>
                    <span className={classes.sectionHeaderGlyph} aria-hidden="true" />
                    {title}
                </Heading>
            </div>
            {rule ? <span className={classes.sectionHeaderRule} aria-hidden="true" /> : null}
            {actions ? <div className={classes.sectionHeaderActions}>{actions}</div> : null}
            {/* Wraps onto its own line so the rule stays on the title's line. */}
            {description ? <p className={classes.sectionHeaderDescription}>{description}</p> : null}
        </div>
    )
}
