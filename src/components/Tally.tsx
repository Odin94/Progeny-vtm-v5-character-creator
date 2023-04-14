import { Text } from "@mantine/core"
import { IconTallymark1, IconTallymark2, IconTallymark3, IconTallymark4, IconTallymarks } from "@tabler/icons-react"

export type TallyProps = {
    n: number
}

const Tally = ({ n }: TallyProps) => {
    const style: React.CSSProperties = {
        verticalAlign: "middle"
    }

    switch (n) {
        case 0: return <></>
        case 1: return <IconTallymark1 style={style} />
        case 2: return <IconTallymark2 style={style} />
        case 3: return <IconTallymark3 style={style} />
        case 4: return <IconTallymark4 style={style} />
        case 5: return <IconTallymarks style={style} />
        default: return <Text color="red">{`Invalid tally number: ${n}`}</Text>
    }
}

export default Tally