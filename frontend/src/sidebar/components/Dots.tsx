import classes from "./Dossier.module.css"

/** Five-dot rating used throughout the dossier. */
const Dots = ({ n, max = 5, color }: { n: number; max?: number; color?: string }) => (
    <span
        className={classes.dots}
        aria-label={`${n} of ${max}`}
        style={color ? ({ "--dot": color } as React.CSSProperties) : undefined}
    >
        {Array.from({ length: Math.max(max, n) }, (_, index) => (
            <span key={index} className={classes.dot} data-filled={index < n || undefined} />
        ))}
    </span>
)

export default Dots
