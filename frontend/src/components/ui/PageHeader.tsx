import type { ReactNode } from "react"
import { Ornament } from "./Ornament"
import classes from "./ui.module.css"

export type PageHeaderProps = {
    title: ReactNode
    /** Small tracked caps line above the title (e.g. "Homebrew", "Account"). */
    eyebrow?: ReactNode
    /** One short sentence in the serif "lore" voice. */
    description?: ReactNode
    /** Icon shown before the title (Tabler icon, ~30px). */
    icon?: ReactNode
    /** Buttons aligned to the right on desktop, wrapping below on small screens. */
    actions?: ReactNode
    align?: "start" | "center"
    /** Show the lozenge flourish under the title. Default: true. */
    ornament?: boolean
    className?: string
}

/**
 * The top-of-page heading block. Renders an `<h1>`; use once per page.
 *
 * ```tsx
 * <PageHeader
 *     eyebrow="Homebrew"
 *     title="Community Library"
 *     description="Rules, Disciplines and predator types shared by other Storytellers."
 *     actions={<Button>Request to publish</Button>}
 * />
 * ```
 */
export const PageHeader = ({
    title,
    eyebrow,
    description,
    icon,
    actions,
    align = "start",
    ornament = true,
    className
}: PageHeaderProps) => (
    <header
        className={[classes.pageHeader, className].filter(Boolean).join(" ")}
        data-align={align}
    >
        <div className={classes.pageHeaderText}>
            {eyebrow ? <span className="pg-eyebrow">{eyebrow}</span> : null}
            <div className={classes.pageHeaderTitleRow}>
                {icon ? <span className={classes.pageHeaderIcon}>{icon}</span> : null}
                <h1 className={classes.pageHeaderTitle}>{title}</h1>
            </div>
            {ornament ? (
                <Ornament
                    className={classes.pageHeaderOrnament}
                    align={align === "center" ? "center" : "start"}
                />
            ) : null}
            {description ? <p className={classes.pageHeaderDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={classes.pageHeaderActions}>{actions}</div> : null}
    </header>
)
