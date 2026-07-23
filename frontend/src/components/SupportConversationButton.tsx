import { Button, type ButtonProps } from "@mantine/core"
import { IconMessageCircle } from "@tabler/icons-react"
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import {
    openSupportConversation,
    showSupportUnavailableNotification,
    type SupportConversationSource
} from "~/utils/supportConversations"

type SupportConversationButtonProps = Omit<
    ComponentPropsWithoutRef<typeof Button>,
    "children" | "loading" | "onClick"
> & {
    children?: ReactNode
    source: SupportConversationSource
    onClickStart?: () => void
}

const SupportConversationButton = ({
    children = "Message Odin",
    source,
    onClickStart,
    leftSection = <IconMessageCircle size={18} />,
    ...buttonProps
}: SupportConversationButtonProps & ButtonProps) => {
    const [opening, setOpening] = useState(false)

    const handleClick = async () => {
        onClickStart?.()
        setOpening(true)

        const opened = await openSupportConversation(source)
        if (!opened) {
            showSupportUnavailableNotification()
        }

        setOpening(false)
    }

    return (
        <Button {...buttonProps} leftSection={leftSection} loading={opening} onClick={handleClick}>
            {children}
        </Button>
    )
}

export default SupportConversationButton
