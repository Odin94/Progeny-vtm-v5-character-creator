import { UnstyledButton, type UnstyledButtonProps } from "@mantine/core"
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import classes from "./PickTile.module.css"

export { classes as pickTileClasses }

/** Rank colors: blood = best, crimson = strong, gold = decent/medium, ash = weakest. */
export type PickTone = "blood" | "crimson" | "gold" | "ash"

const toneVar: Record<PickTone, string> = {
    blood: "var(--pg-blood-bright)",
    crimson: "#e8606f",
    gold: "var(--pg-gold)",
    ash: "#bcaea9"
}

type PickTileProps = UnstyledButtonProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "style"> & {
        label: ReactNode
        /** Assigned dots, or null while unassigned. */
        level: number | null
        tone?: PickTone
        /** Dots and tone the next click would assign; previewed on hover. */
        previewLevel?: number
        previewTone?: PickTone
        nudge?: boolean
        maxDots?: number
    }

/**
 * Tactile allocation tile for the attribute and skill steps: name + five pips. Assigned tiles
 * take the rank's tone; unassigned tiles preview the rank they would receive on hover.
 */
export const PickTile = forwardRef<HTMLButtonElement, PickTileProps>(
    (
        { label, level, tone, previewLevel, previewTone, nudge, maxDots = 5, className, ...others },
        ref
    ) => {
        const picked = level !== null
        return (
            <UnstyledButton
                ref={ref}
                type="button"
                className={[classes.tile, nudge ? classes.nudge : null, className]
                    .filter(Boolean)
                    .join(" ")}
                data-picked={picked || undefined}
                data-tone={picked ? tone : undefined}
                style={previewTone ? { "--preview": toneVar[previewTone] } : undefined}
                {...others}
            >
                <span className={classes.inner}>
                    <span className={classes.name}>{label}</span>
                    <span className={classes.pips} aria-hidden="true">
                        {Array.from({ length: maxDots }, (_, index) => (
                            <span
                                key={index}
                                className={classes.pip}
                                data-filled={(picked && index < level) || undefined}
                                data-ghost={
                                    (!picked &&
                                        previewLevel !== undefined &&
                                        index < previewLevel) ||
                                    undefined
                                }
                            />
                        ))}
                    </span>
                </span>
            </UnstyledButton>
        )
    }
)

PickTile.displayName = "PickTile"

export const PickColumnHeader = ({ children }: { children: ReactNode }) => (
    <div className={classes.column}>{children}</div>
)

export const PickGrid = ({
    children,
    className,
    ...others
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
    <div className={[classes.grid, className].filter(Boolean).join(" ")} {...others}>
        {children}
    </div>
)
