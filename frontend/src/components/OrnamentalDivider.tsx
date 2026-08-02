import { Text } from "@mantine/core"
import ornamentalDivider from "~/assets/ornamental-divider.svg"
import "./OrnamentalDivider.css"

const OrnamentalDivider = ({ label, compact = false }: { label: string; compact?: boolean }) => (
    <div
        className={`ornamental-divider${compact ? " ornamental-divider--compact" : ""}`}
        aria-label={label}
    >
        <img src={ornamentalDivider} alt="" />
        <Text>{label}</Text>
        <img src={ornamentalDivider} alt="" />
    </div>
)

export default OrnamentalDivider
