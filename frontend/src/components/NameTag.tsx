import { Badge } from "@mantine/core"
import { IconSparkles } from "@tabler/icons-react"
import classes from "./NameTag.module.css"

type NameTagProps = {
    name: string
    size?: "xs" | "sm" | "md" | "lg"
}

const NameTag = ({ name, size = "sm" }: NameTagProps) => (
    <Badge
        size={size}
        variant="filled"
        className={classes.tag}
        leftSection={
            <IconSparkles className={classes.icon} size={size === "xs" ? 10 : 12} stroke={1.8} />
        }
    >
        {name}
    </Badge>
)

export default NameTag
