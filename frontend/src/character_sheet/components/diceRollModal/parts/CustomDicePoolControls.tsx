import { Button, Group, Text } from "@mantine/core"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { useDiceRollModalStore } from "../../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"

type CustomDicePoolControlsProps = {
    primaryColor: string
}

const CustomDicePoolControls = ({ primaryColor }: CustomDicePoolControlsProps) => {
    const { diceCount, setDiceCount } = useDiceRollModalStore(
        useShallow((state) => ({
            diceCount: state.diceCount,
            setDiceCount: state.setDiceCount,
        }))
    )

    const removeDie = () => {
        if (diceCount > 1) {
            setDiceCount(diceCount - 1)
        }
    }

    return (
        <Group justify="center" gap="md" style={{ flexShrink: 0 }}>
            <Button variant="subtle" onClick={removeDie} color={primaryColor} disabled={diceCount <= 1}>
                <IconMinus size={18} />
            </Button>
            <Text fw={600} fz="lg">
                {diceCount} {diceCount === 1 ? "Die" : "Dice"}
            </Text>
            <Button variant="subtle" onClick={() => setDiceCount(diceCount + 1)} color={primaryColor}>
                <IconPlus size={18} />
            </Button>
        </Group>
    )
}

export default CustomDicePoolControls
