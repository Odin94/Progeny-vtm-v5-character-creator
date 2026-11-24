import type { ReactNode } from "react"
import classes from "./ui.module.css"

export type EmptyStateProps = {
    title: ReactNode
    description?: ReactNode
    /** Tabler icon (~26px). Rendered inside a gilded sigil ring. */
    icon?: ReactNode
    /** Primary/secondary buttons that resolve the empty state. */
    actions?: ReactNode
    /** Tighter padding for empty lists inside panels. */
    compact?: boolean
    className?: string
}

/**
 * For "nothing here yet" and "no results" states. Always offer the next step as an
 * action when there is one.
 *
 * ```tsx
 * <EmptyState
 *     icon={<IconUsersGroup size={26} />}
 *     title="No coteries yet"
 *     description="Create one and invite your players with a link."
 *     actions={<Button onClick={create}>Create coterie</Button>}
 * />
 * ```
 */
export const EmptyState = ({
    title,
    description,
    icon,
    actions,
    compact,
    className
}: EmptyStateProps) => (
    <div
        className={[classes.emptyState, className].filter(Boolean).join(" ")}
        data-compact={compact || undefined}
    >
        {icon ? (
            <div className={classes.emptySigil} aria-hidden="true">
                {icon}
            </div>
        ) : null}
        <p className={classes.emptyTitle}>{title}</p>
        {description ? <p className={classes.emptyDescription}>{description}</p> : null}
        {actions ? <div className={classes.emptyActions}>{actions}</div> : null}
    </div>
)
