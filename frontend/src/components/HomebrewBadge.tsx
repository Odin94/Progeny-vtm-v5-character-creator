import { Badge, Tooltip } from "@mantine/core"
import type { HomebrewSource } from "~/data/Homebrew"

const HomebrewBadge = ({
    source,
    size = "xs"
}: {
    source?: HomebrewSource
    size?: "xs" | "sm"
}) => (
    <Tooltip label={source ? `From ${source.collectionName}` : "Homebrew content"}>
        <Badge size={size} color="grape" variant="light">
            Homebrew
        </Badge>
    </Tooltip>
)

export default HomebrewBadge
