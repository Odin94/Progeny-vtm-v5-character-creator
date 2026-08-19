import { Text } from "@mantine/core"
import type { CSSProperties } from "react"
import "./OrnamentalDivider.css"

type OrnamentalDividerProps = {
    label: string
    compact?: boolean
    color?: string
    size?: "default" | "large"
}

const OrnamentalDividerFlourish = () => (
    <svg
        className="ornamental-divider__flourish"
        viewBox="0 0 516 54"
        fill="none"
        aria-hidden="true"
        focusable="false"
    >
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M29 26.75H499" strokeWidth="0.9" opacity="0.62" />
            <path
                d="M16.5 26.75C19 24.7 23.4 24.55 27.1 26.75C23.4 28.95 19 28.8 16.5 26.75Z"
                fill="currentColor"
                stroke="none"
            />
            <path
                d="M30.2 26.75 C32.2 22.95 36.1 22.45 41.9 23.05 C40.8 20.55 42.45 18.65 45.15 18.65 C48.95 18.65 51.05 22.05 50.65 26.75 C51.05 31.45 48.95 34.85 45.15 34.85 C42.45 34.85 40.8 32.95 41.9 30.45 C36.1 31.05 32.2 30.55 30.2 26.75Z"
                strokeWidth="1.25"
            />
            <path d="M30.2 23.95V29.55" strokeWidth="1.1" />
            <path
                d="M484.15 19.35 C488.25 21.4 493.1 24.25 497.35 26.75 C493.1 29.25 488.25 32.1 484.15 34.15 C485.85 31.25 487.15 28.85 487.85 26.75 C487.15 24.65 485.85 22.25 484.15 19.35Z"
                strokeWidth="1.15"
            />
            <path
                d="M501.25 21.5 C501.9 24.1 502.7 25.75 506.45 26.75 C502.7 27.75 501.9 29.4 501.25 32 C500.6 29.4 499.8 27.75 496.05 26.75 C499.8 25.75 500.6 24.1 501.25 21.5Z"
                fill="currentColor"
                stroke="none"
            />
        </g>
    </svg>
)

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
        <OrnamentalDividerFlourish />
        <Text>{label}</Text>
        <OrnamentalDividerFlourish />
    </div>
)

export default OrnamentalDivider
