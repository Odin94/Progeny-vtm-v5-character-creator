import { IconDroplet } from "@tabler/icons-react"
import type { CSSProperties } from "react"
import classes from "./me.module.css"

type ClanSigilProps = {
    logo?: string
    size?: number
    /** Draw the sigil inside a soft clan-tinted ring. */
    framed?: boolean
    className?: string
    style?: CSSProperties
}

/** Clan logo tinted with the surrounding `--clan-bright` color (falls back to blood). */
export const ClanSigil = ({
    logo,
    size = 40,
    framed = false,
    className,
    style
}: ClanSigilProps) => {
    const inner = Math.round(framed ? size * 0.62 : size)
    const glyph = logo ? (
        <span
            className={classes.sigil}
            style={{
                width: inner,
                height: inner,
                WebkitMaskImage: `url(${logo})`,
                maskImage: `url(${logo})`
            }}
            aria-hidden="true"
        />
    ) : (
        <IconDroplet size={Math.round(inner * 0.7)} stroke={1.6} aria-hidden="true" />
    )

    if (!framed) {
        return logo ? (
            <span
                className={[classes.sigil, className].filter(Boolean).join(" ")}
                style={{
                    width: size,
                    height: size,
                    WebkitMaskImage: `url(${logo})`,
                    maskImage: `url(${logo})`,
                    ...style
                }}
                aria-hidden="true"
            />
        ) : null
    }

    return (
        <span
            className={[classes.sigilFrame, className].filter(Boolean).join(" ")}
            style={{ width: size, height: size, ...style }}
            aria-hidden="true"
        >
            {glyph}
        </span>
    )
}
