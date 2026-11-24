import { useId, type CSSProperties } from "react"

type OrnamentProps = {
    className?: string
    style?: CSSProperties
    /** Which way the rule fades. `center` = symmetrical (default). */
    align?: "center" | "start"
}

/**
 * Thin tapered rule with a central lozenge — the small flourish under page titles and
 * between hero blocks. Inherits `color`; decorative only.
 */
export const Ornament = ({ className, style, align = "center" }: OrnamentProps) => {
    const id = useId().replace(/:/g, "")
    const fadeLeft = `${id}-l`
    const fadeRight = `${id}-r`
    const startAligned = align === "start"

    return (
        <svg
            className={className}
            style={style}
            viewBox="0 0 220 14"
            fill="none"
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio={startAligned ? "xMinYMid meet" : "xMidYMid meet"}
        >
            <defs>
                {/* userSpaceOnUse: a horizontal line has a zero-height bounding box, which
                    would make an objectBoundingBox gradient paint nothing. */}
                <linearGradient
                    id={fadeLeft}
                    gradientUnits="userSpaceOnUse"
                    x1={startAligned ? 22 : 2}
                    x2={startAligned ? 218 : 96}
                    y1="0"
                    y2="0"
                >
                    <stop offset="0" stopColor="currentColor" stopOpacity={startAligned ? 1 : 0} />
                    <stop offset="1" stopColor="currentColor" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                    id={fadeRight}
                    gradientUnits="userSpaceOnUse"
                    x1={startAligned ? 22 : 124}
                    x2="218"
                    y1="0"
                    y2="0"
                >
                    <stop offset="0" stopColor="currentColor" stopOpacity="1" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            {startAligned ? (
                <>
                    <path d="M2 7 L5.5 3.5 L9 7 L5.5 10.5 Z" fill="currentColor" />
                    <circle cx="16" cy="7" r="1.3" fill="currentColor" />
                    <path d="M22 7 H218" stroke={`url(#${fadeRight})`} strokeWidth="1" />
                </>
            ) : (
                <>
                    <path d="M2 7 H96" stroke={`url(#${fadeLeft})`} strokeWidth="1" />
                    <circle cx="100.5" cy="7" r="1.3" fill="currentColor" />
                    <path d="M110 1.5 L115.5 7 L110 12.5 L104.5 7 Z" fill="currentColor" />
                    <path
                        d="M110 4.2 L112.8 7 L110 9.8 L107.2 7 Z"
                        fill="var(--pg-abyss)"
                        opacity="0.55"
                    />
                    <circle cx="119.5" cy="7" r="1.3" fill="currentColor" />
                    <path d="M124 7 H218" stroke={`url(#${fadeRight})`} strokeWidth="1" />
                </>
            )}
        </svg>
    )
}
