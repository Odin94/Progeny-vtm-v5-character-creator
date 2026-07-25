import { Button, type ButtonProps } from "@mantine/core"
import { IconCookie, IconMessageCircle } from "@tabler/icons-react"
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import {
    openSupportConversation,
    showSupportUnavailableNotification,
    type SupportConversationSource
} from "~/utils/supportConversations"
import { useAnalyticsConsent } from "~/hooks/useAnalyticsConsent"
import { openCookiePreferences } from "~/utils/cookiePreferences"

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
    const hasAnalyticsConsent = useAnalyticsConsent()

    if (!hasAnalyticsConsent) {
        return (
            <Button
                {...buttonProps}
                leftSection={<IconCookie size={18} />}
                onClick={() => {
                    onClickStart?.()
                    openCookiePreferences()
                }}
            >
                Cookie preferences
            </Button>
        )
    }

    const handleClick = async () => {
        onClickStart?.()
        setOpening(true)

        const result = await openSupportConversation(source)
        if (result === "unavailable") {
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
