import type { CSSProperties } from "react"

/** The original red ankh, also used as the site's favicon. */
export const BrandMark = ({
    size = 22,
    className,
    style
}: {
    size?: number
    className?: string
    style?: CSSProperties
}) => (
    <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain", ...style }}
        alt=""
    />
)
