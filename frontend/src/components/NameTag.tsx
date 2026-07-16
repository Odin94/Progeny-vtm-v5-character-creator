import { Badge } from "@mantine/core"
import { IconSparkles } from "@tabler/icons-react"

type NameTagProps = {
    name: string
    size?: "xs" | "sm" | "md" | "lg"
}

const NameTag = ({ name, size = "sm" }: NameTagProps) => (
    <Badge
        size={size}
        variant="gradient"
        gradient={{ from: "grape", to: "pink", deg: 110 }}
        leftSection={<IconSparkles size={size === "xs" ? 10 : 12} stroke={1.8} />}
        style={{
            textTransform: "none",
            letterSpacing: "0.01em",
            boxShadow: "0 0 14px rgba(190, 75, 219, 0.28)",
            border: "1px solid rgba(255, 255, 255, 0.18)"
        }}
    >
        {name}
    </Badge>
)

export default NameTag
