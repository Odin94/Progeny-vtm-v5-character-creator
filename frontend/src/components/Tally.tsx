import { Text } from "@mantine/core"
import { IconTallymark1, IconTallymark2, IconTallymark3, IconTallymark4, IconTallymarks } from "@tabler/icons-react"

export type TallyProps = {
    n: number
    style?: React.CSSProperties
    size?: string | number
}

const Tally = ({ n, style, size }: TallyProps) => {
    const tallyStyle: React.CSSProperties = {
        ...style,
        verticalAlign: "middle",
    }

    switch (n) {
        case 0:
            return <></>
        case 1:
            return <IconTallymark1 style={tallyStyle} size={size} />
        case 2:
            return <IconTallymark2 style={tallyStyle} size={size} />
        case 3:
            return <IconTallymark3 style={tallyStyle} size={size} />
        case 4:
            return <IconTallymark4 style={tallyStyle} size={size} />
        case 5:
            return <IconTallymarks style={tallyStyle} size={size} />
        default:
            return <Text color="red">{`Invalid tally number: ${n}`}</Text>
    }
}

export default Tally
