import type { CSSProperties } from "react"

/**
 * Progeny sigil: a gilded lozenge holding a drop of blood. Decorative; pair it with the
 * "Progeny" wordmark or an aria-label on the surrounding link.
 */
export const BrandMark = ({
    size = 22,
    className,
    style
}: {
    size?: number
    className?: string
    style?: CSSProperties
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className={className}
        style={style}
    >
        <path
            d="M12 1.6 22.4 12 12 22.4 1.6 12Z"
            stroke="var(--pg-gold)"
            strokeOpacity="0.85"
            strokeWidth="1.1"
        />
        <path
            d="M12 4.4 19.6 12 12 19.6 4.4 12Z"
            stroke="var(--pg-gold)"
            strokeOpacity="0.3"
            strokeWidth="0.8"
        />
        <path
            d="M12 7.2c0 0-3.1 3.9-3.1 6.2a3.1 3.1 0 0 0 6.2 0c0-2.3-3.1-6.2-3.1-6.2Z"
            fill="var(--pg-blood-bright)"
        />
        <path
            d="M10.9 13.3c.1-.9.6-1.8 1.1-2.6"
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="0.8"
            strokeLinecap="round"
        />
    </svg>
)
