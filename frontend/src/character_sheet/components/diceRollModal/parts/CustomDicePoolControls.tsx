import { ActionIcon, Tooltip } from "@mantine/core"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { useDiceRollModalStore } from "../../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import classes from "../diceRoller.module.css"

type CustomDicePoolControlsProps = {
    primaryColor: string
}

const CustomDicePoolControls = ({ primaryColor }: CustomDicePoolControlsProps) => {
    const { diceCount, setDiceCount } = useDiceRollModalStore(
        useShallow((state) => ({
            diceCount: state.diceCount,
            setDiceCount: state.setDiceCount
        }))
    )

    const removeDie = () => {
        if (diceCount > 1) {
            setDiceCount(diceCount - 1)
        }
    }

    return (
        <div className={classes.stepper} role="group" aria-label="Custom dice pool">
            <Tooltip
                label={diceCount <= 1 ? "A pool needs at least one die" : "Remove a die"}
                zIndex={2100}
            >
                <span style={{ display: "inline-flex" }}>
                    <ActionIcon
                        size="lg"
                        variant="default"
                        aria-label="Remove a die"
                        onClick={removeDie}
                        disabled={diceCount <= 1}
                    >
                        <IconMinus size={18} />
                    </ActionIcon>
                </span>
            </Tooltip>
            <div className={classes.stepperValue} aria-live="polite">
                <span className={classes.stepperNumber}>{diceCount}</span>
                <span className={classes.stepperUnit}>{diceCount === 1 ? "Die" : "Dice"}</span>
            </div>
            <Tooltip label="Add a die" zIndex={2100}>
                <ActionIcon
                    size="lg"
                    variant="light"
                    color={primaryColor}
                    aria-label="Add a die"
                    onClick={() => setDiceCount(diceCount + 1)}
                >
                    <IconPlus size={18} />
                </ActionIcon>
            </Tooltip>
        </div>
    )
}

export default CustomDicePoolControls
