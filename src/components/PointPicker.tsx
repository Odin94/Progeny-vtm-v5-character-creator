import { ActionIcon, Group, Rating } from "@mantine/core"
import { IconCircleX, IconDroplet } from "@tabler/icons-react"

type PointPickerProps = {
    points: number
    setPoints: (n: number) => void
    maxLevel?: number
}

const PointPicker = ({ points, setPoints, maxLevel: maxPoints }: PointPickerProps) => {
    const size = "1.25rem"
    return (
        <Group>
            <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                    setPoints(0)
                }}
            >
                <IconCircleX color="gray" />
            </ActionIcon>
            <Rating
                value={points}
                onChange={setPoints}
                emptySymbol={<IconDroplet color="gray" stroke={2.25} size={size} />}
                fullSymbol={<IconDroplet color="red" style={{ fill: "red" }} size={size} />}
                count={maxPoints ?? 5}
            />
        </Group>
    )
}

export default PointPicker
