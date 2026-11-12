import type { CSSProperties } from "react"
import classes from "./ui.module.css"

export type DotsProps = {
    /** Number of filled dots. */
    filled: number
    /** Track length; defaults to `filled` (only filled dots). */
    total?: number
    size?: "sm" | "md" | "lg"
    /** Soft glow around filled dots (generator cards, featured spots). */
    glow?: boolean
    /** Empty-dot ring: tinted with the dot color, or a neutral bone hairline. */
    emptyTone?: "accent" | "quiet"
    /** Accessible label; without it the track is decorative and hidden from assistive tech. */
    label?: string
    /** Dot color; otherwise inherits `--dot-color` from an ancestor (blood by default). */
    color?: string
    className?: string
}

/** VtM-style dot rating (●●○○○). Shared by the generator, sidebar, coterie and modals. */
export const Dots = ({
    filled,
    total = filled,
    size = "md",
    glow = false,
    emptyTone = "accent",
    label,
    color,
    className
}: DotsProps) => (
    <span
        className={className ? `${classes.dots} ${className}` : classes.dots}
        data-size={size}
        data-glow={glow || undefined}
        data-empty-tone={emptyTone}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={color ? ({ "--dot-color": color } as CSSProperties) : undefined}
    >
        {Array.from({ length: Math.max(total, filled, 0) }, (_, index) => (
            <span key={index} className={classes.dot} data-filled={index < filled || undefined} />
        ))}
    </span>
)
