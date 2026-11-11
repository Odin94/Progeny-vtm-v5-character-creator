import { Button, CloseButton, Group, Text } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { globals } from "~/globals"
import { IconCookie } from "@tabler/icons-react"
import { useAuth } from "~/hooks/useAuth"
import {
    COOKIE_PREFERENCES_REQUEST_EVENT,
    notifyCookiePreferencesChanged
} from "~/utils/cookiePreferences"
import {
    openSupportConversation,
    showSupportUnavailableNotification,
    SUPPORT_CONSENT_REQUEST_EVENT,
    warmSupportConversation,
    type SupportConversationSource
} from "~/utils/supportConversations"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Panel } from "./ui/Panel"
import classes from "./CookiesBanner.module.css"

const LEARN_MORE_HREF = "https://odin-matthias.de/datenschutzerklaerung"

export const CookiesBanner = () => {
    const [showBanner, setShowBanner] = useState(false)
    const [pendingSupportSource, setPendingSupportSource] =
        useState<SupportConversationSource | null>(null)
    const isMobile = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`)
    const { isAuthenticated, isLoading } = useAuth()
    const shouldReduceMotion = useReducedMotion()

    useEffect(() => {
        if (isLoading) {
            setShowBanner(false)
            return
        }

        const consentStatus = posthog.get_explicit_consent_status()
        setShowBanner(
            pendingSupportSource !== null || (!isAuthenticated && consentStatus === "pending")
        )
    }, [isAuthenticated, isLoading, pendingSupportSource])

    useEffect(() => {
        const handleSupportConsentRequest = (event: Event) => {
            const consentRequest = event as CustomEvent<{ source: SupportConversationSource }>
            setPendingSupportSource(consentRequest.detail.source)
            setShowBanner(true)
        }

        const handleCookiePreferencesRequest = () => {
            setPendingSupportSource(null)
            setShowBanner(true)
        }

        window.addEventListener(SUPPORT_CONSENT_REQUEST_EVENT, handleSupportConsentRequest)
        window.addEventListener(COOKIE_PREFERENCES_REQUEST_EVENT, handleCookiePreferencesRequest)
        return () => {
            window.removeEventListener(SUPPORT_CONSENT_REQUEST_EVENT, handleSupportConsentRequest)
            window.removeEventListener(
                COOKIE_PREFERENCES_REQUEST_EVENT,
                handleCookiePreferencesRequest
            )
        }
    }, [])

    const handleAccept = () => {
        const supportSource = pendingSupportSource
        setPendingSupportSource(null)
        setShowBanner(false)

        try {
            posthog.opt_in_capturing()
            warmSupportConversation()
            notifyCookiePreferencesChanged()
        } catch (error) {
            console.warn("Failed to opt in PostHog capturing:", error)
            if (supportSource) {
                showSupportUnavailableNotification()
            }
            return
        }

        if (supportSource) {
            void openSupportConversation(supportSource).then((result) => {
                if (result === "unavailable") {
                    showSupportUnavailableNotification()
                }
            })
        }
    }

    const handleDecline = () => {
        setPendingSupportSource(null)
        setShowBanner(false)

        try {
            posthog.opt_out_capturing()
            notifyCookiePreferencesChanged()
        } catch (error) {
            console.warn("Failed to opt out PostHog capturing:", error)
        }
    }

    const handleClose = () => {
        setPendingSupportSource(null)
        setShowBanner(false)
    }

    return (
        <AnimatePresence>
            {showBanner ? (
                <motion.div
                    initial={{
                        opacity: 0,
                        transform: shouldReduceMotion
                            ? "translateX(-50%)"
                            : "translateX(-50%) translateY(12px)"
                    }}
                    animate={{ opacity: 1, transform: "translateX(-50%) translateY(0px)" }}
                    exit={{
                        opacity: 0,
                        transform: shouldReduceMotion
                            ? "translateX(-50%)"
                            : "translateX(-50%) translateY(12px)",
                        transition: { duration: 0.14, ease: [0.55, 0.055, 0.675, 0.19] }
                    }}
                    transition={{
                        duration: shouldReduceMotion ? 0.12 : 0.18,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    className={classes.root}
                    data-mobile={isMobile || undefined}
                >
                    <Panel tone="ornate" p="lg" radius="lg" grain>
                        <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                            <Group gap={10} align="center" wrap="nowrap">
                                <IconCookie size={22} stroke={1.5} className={classes.icon} />
                                <Text className={classes.title}>
                                    Sink your fangs into some cookies!
                                </Text>
                            </Group>
                            <CloseButton
                                mr={-8}
                                mt={-6}
                                size="sm"
                                aria-label="Close cookie banner"
                                data-testid="cookie-banner-close"
                                onClick={handleClose}
                            />
                        </Group>
                        <Text className={classes.body}>
                            I use cookies to get better insights on usage patterns, which helps me
                            improve Progeny for everyone.
                            <br /> More info:{" "}
                            <a
                                href={LEARN_MORE_HREF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes.link}
                            >
                                privacy policy
                            </a>
                            .
                        </Text>
                        <Group justify="flex-end" mt="md" gap="sm">
                            <Button variant="default" size="sm" onClick={handleDecline}>
                                Decline
                            </Button>
                            <Button variant="filled" size="sm" color="grape" onClick={handleAccept}>
                                Accept
                            </Button>
                        </Group>
                    </Panel>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
