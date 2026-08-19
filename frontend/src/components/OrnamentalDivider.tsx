import { Text } from "@mantine/core"
import ornamentalDivider from "~/assets/ornamental-divider.svg"
import type { CSSProperties } from "react"
import "./OrnamentalDivider.css"

type OrnamentalDividerProps = {
    label: string
    compact?: boolean
    color?: string
    size?: "default" | "large"
}

const OrnamentalDivider = ({
    label,
    compact = false,
    color = "#b9414c",
    size = "default"
}: OrnamentalDividerProps) => (
    <div
        className={`ornamental-divider${compact ? " ornamental-divider--compact" : ""}${
            size === "large" ? " ornamental-divider--large" : ""
        }`}
        style={{ "--ornamental-divider-color": color } as CSSProperties}
        aria-label={label}
    >
        <span
            className="ornamental-divider__flourish"
            aria-hidden="true"
            style={{
                maskImage: `url(${ornamentalDivider})`,
                WebkitMaskImage: `url(${ornamentalDivider})`
            }}
        />
        <Text>{label}</Text>
        <span
            className="ornamental-divider__flourish"
            aria-hidden="true"
            style={{
                maskImage: `url(${ornamentalDivider})`,
                WebkitMaskImage: `url(${ornamentalDivider})`
            }}
        />
    </div>
)

export default OrnamentalDivider
