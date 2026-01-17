import { ActionIcon, Group, Tabs } from "@mantine/core"
import { IconX } from "@tabler/icons-react"

type ModalHeaderProps = {
    activeTab: string | null
    setActiveTab: (value: string | null) => void
    primaryColor: string
    onClose: () => void
}

const ModalHeader = ({ activeTab, setActiveTab, primaryColor, onClose }: ModalHeaderProps) => {
    return (
        <Group justify="center" mb="md" style={{ position: "relative", paddingRight: "40px" }}>
            <Tabs value={activeTab} onChange={setActiveTab} color={primaryColor} style={{ width: "100%" }}>
                <Tabs.List grow>
                    <Tabs.Tab value="custom">Custom</Tabs.Tab>
                    <Tabs.Tab value="selected">Selected Pool</Tabs.Tab>
                </Tabs.List>
            </Tabs>
            <ActionIcon 
                variant="subtle" 
                color="gray" 
                onClick={onClose}
                style={{ 
                    position: "absolute", 
                    right: 0,
                    top: 0,
                    zIndex: 10,
                    pointerEvents: "auto"
                }}
            >
                <IconX size={20} />
            </ActionIcon>
        </Group>
    )
}

export default ModalHeader
