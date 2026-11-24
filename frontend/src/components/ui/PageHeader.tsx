import type { ReactNode } from "react"
import classes from "./ui.module.css"

export type PageHeaderProps = {
    title: ReactNode
    /** Context for the page, such as a version or chapter number. */
    metadata?: ReactNode
    /** One short sentence in the serif "lore" voice. */
    description?: ReactNode
    /** Icon shown before the title (Tabler icon, ~30px). */
    icon?: ReactNode
    /** Buttons aligned to the right on desktop, wrapping below on small screens. */
    actions?: ReactNode
    align?: "start" | "center"
    className?: string
}

/**
 * The top-of-page heading block. Renders an `<h1>`; use once per page.
 *
 * ```tsx
 * <PageHeader
 *     title="Community Library"
 *     description="Rules, Disciplines and predator types shared by other Storytellers."
 *     actions={<Button>Request to publish</Button>}
 * />
 * ```
 */
export const PageHeader = ({
    title,
    metadata,
    description,
    icon,
    actions,
    align = "start",
    className
}: PageHeaderProps) => (
    <header
        className={[classes.pageHeader, className].filter(Boolean).join(" ")}
        data-align={align}
    >
        <div className={classes.pageHeaderText}>
            <div className={classes.pageHeaderTitleRow}>
                {icon ? <span className={classes.pageHeaderIcon}>{icon}</span> : null}
                <h1 className={classes.pageHeaderTitle}>{title}</h1>
            </div>
            {metadata ? <p className={classes.pageHeaderMetadata}>{metadata}</p> : null}
            {description ? <p className={classes.pageHeaderDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={classes.pageHeaderActions}>{actions}</div> : null}
    </header>
)
