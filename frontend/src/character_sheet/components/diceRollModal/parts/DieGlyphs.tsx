import { memo } from "react"
import classes from "../diceRoller.module.css"

type GlyphDie = { value?: number; isBloodDie: boolean }

const resultOf = (die: GlyphDie) => {
    if (die.value === undefined || die.value === 0) return undefined
    if (die.isBloodDie && die.value === 1) return "skull"
    if (die.value === 10) return "crit"
    return die.value >= 6 ? "success" : "fail"
}

/** A d10 silhouette (pentagonal trapezohedron, seen from above). */
export const DieGlyph = ({
    die,
    size = 18,
    animate = false,
    index = 0
}: {
    die: GlyphDie
    size?: number
    animate?: boolean
    index?: number
}) => {
    const result = resultOf(die)
    return (
        <span
            className={classes.glyph}
            data-hunger={die.isBloodDie || undefined}
            data-result={result}
            data-animate={animate || undefined}
            style={{
                width: size,
                height: size,
                animationDelay: animate ? `${Math.min(index, 12) * 18}ms` : undefined
            }}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path className={classes.glyphShape} d="M12 1.5 22.5 9.6 12 22.5 1.5 9.6Z" />
                <path className={classes.glyphFacet} d="M1.5 9.6 12 13.4 22.5 9.6M12 13.4V22.5" />
            </svg>
            {die.value ? (
                <span className={classes.glyphValue} style={{ fontSize: size * 0.4 }}>
                    {die.value}
                </span>
            ) : null}
        </span>
    )
}

/**
 * A row of d10 glyphs. Without values it previews a pool (Hunger dice in blood);
 * with values it summarises a finished roll.
 */
const DieGlyphs = ({
    dice,
    size = 18,
    max = 24,
    animate = false,
    label
}: {
    dice: GlyphDie[]
    size?: number
    max?: number
    animate?: boolean
    label?: string
}) => {
    const shown = dice.slice(0, max)
    const hidden = dice.length - shown.length
    return (
        <span className={classes.glyphRow} role={label ? "img" : undefined} aria-label={label}>
            {shown.map((die, index) => (
                <DieGlyph key={index} die={die} size={size} animate={animate} index={index} />
            ))}
            {hidden > 0 ? <span className={classes.glyphMore}>+{hidden}</span> : null}
        </span>
    )
}

export default memo(DieGlyphs)
