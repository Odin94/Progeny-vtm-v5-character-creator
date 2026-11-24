import { Badge } from "@mantine/core"
import classes from "./NameTag.module.css"

type NameTagProps = {
    name: string
    size?: "xs" | "sm" | "md" | "lg"
}

const NameTag = ({ name, size = "sm" }: NameTagProps) => (
    <Badge size={size} variant="outline" className={classes.tag}>
        {name}
    </Badge>
)

export default NameTag
