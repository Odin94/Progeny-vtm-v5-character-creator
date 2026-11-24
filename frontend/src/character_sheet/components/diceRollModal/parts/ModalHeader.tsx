import { ActionIcon, Tabs, Tooltip } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { useDiceRollModalStore } from "../../../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import classes from "../diceRoller.module.css"

type ModalHeaderProps = {
    primaryColor: string
    onClose: () => void
}

const ModalHeader = ({ primaryColor, onClose }: ModalHeaderProps) => {
    const { activeTab, setActiveTab } = useDiceRollModalStore(
        useShallow((state) => ({
            activeTab: state.activeTab,
            setActiveTab: state.setActiveTab
        }))
    )

    return (
        <div className={classes.header}>
            <span className={classes.title}>
                <span className={classes.titleMark} aria-hidden="true" />
                Roll
            </span>
            <Tabs
                className={classes.tabs}
                classNames={{ list: classes.tabList, tab: classes.tab }}
                variant="unstyled"
                value={activeTab ?? "custom"}
                onChange={setActiveTab}
                color={primaryColor}
            >
                <Tabs.List aria-label="Dice pool source" grow>
                    <Tabs.Tab value="custom">Custom</Tabs.Tab>
                    <Tabs.Tab value="selected">Selected pool</Tabs.Tab>
                </Tabs.List>
            </Tabs>
            <Tooltip label="Close dice roller" position="left" zIndex={2100}>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Close dice roller"
                    onClick={onClose}
                >
                    <IconX size={18} />
                </ActionIcon>
            </Tooltip>
        </div>
    )
}

export default ModalHeader
