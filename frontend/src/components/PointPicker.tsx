import { ActionIcon } from "@mantine/core"
import { IconCircleX, IconDroplet } from "@tabler/icons-react"

type PointPickerProps = {
    points: number
    setPoints: (n: number) => void
    maxLevel?: number
    displayCount?: number
}

const PointPicker = ({
    points,
    setPoints,
    maxLevel: maxPoints,
    displayCount
}: PointPickerProps) => {
    const size = "1.25rem"
    const count = maxPoints ?? 5
    const slots = displayCount ?? count

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ActionIcon variant="subtle" color="gray" onClick={() => setPoints(0)}>
                <IconCircleX color="gray" />
            </ActionIcon>
            {Array.from({ length: slots }).map((_, i) => {
                const pos = i + 1
                const isActive = pos <= points
                const isClickable = pos <= count

                return (
                    <span
                        key={i}
                        onClick={() => isClickable && setPoints(pos === points ? pos - 1 : pos)}
                        style={{
                            cursor: isClickable ? "pointer" : "default",
                            opacity: isClickable ? 1 : 0,
                            pointerEvents: isClickable ? "auto" : "none",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        {isActive ? (
                            <IconDroplet color="red" style={{ fill: "red" }} size={size} />
                        ) : (
                            <IconDroplet color="gray" stroke={2.25} size={size} />
                        )}
                    </span>
                )
            })}
        </div>
    )
}

export default PointPicker
