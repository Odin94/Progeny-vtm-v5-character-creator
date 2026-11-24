import { Badge, Tooltip } from "@mantine/core"
import type { HomebrewSource } from "~/data/Homebrew"

/** Marks generator/sheet entries that come from a homebrew collection. */
const HomebrewBadge = ({
    source,
    size = "xs"
}: {
    source?: HomebrewSource
    size?: "xs" | "sm"
}) => (
    <Tooltip label={source ? `From ${source.collectionName}` : "Homebrew content"}>
        <Badge size={size} color="grape" variant="outline" radius="sm" className="homebrew-badge">
            Homebrew
        </Badge>
    </Tooltip>
)

export default HomebrewBadge
