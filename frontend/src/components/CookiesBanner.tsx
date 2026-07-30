import { Button, CloseButton, Group, Paper, Text } from "@mantine/core"
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
            window.removeEventListener(COOKIE_PREFERENCES_REQUEST_EVENT, handleCookiePreferencesRequest)
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
                            : "translateX(-50%) translateY(12px)"
                    }}
                    transition={{
                        duration: shouldReduceMotion ? 0.12 : 0.18,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{
                        position: "fixed",
                        bottom: "1rem",
                        left: isMobile ? "50%" : "25%",
                        zIndex: 2500,
                        maxWidth: "400px",
                        width: "calc(100% - 2rem)"
                    }}
                >
                    <Paper withBorder p="lg" radius="md" shadow="md">
                        <Group justify="space-between" mb="xs">
                            <Group gap="xs" align="center">
                                <Text fz="md" fw={500}>
                                    Sink your fangs into some cookies!
                                </Text>
                                <IconCookie size={25} />
                            </Group>
                            <CloseButton
                                mr={-9}
                                mt={-9}
                                aria-label="Close cookie banner"
                                data-testid="cookie-banner-close"
                                onClick={handleClose}
                            />
                        </Group>
                        <Text c="dimmed" fz="xs">
                            I use cookies to get better insights on usage patterns, which helps me
                            improve Progeny for everyone.
                            <br /> More info:{" "}
                            <a
                                href={LEARN_MORE_HREF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-4 hover:no-underline"
                            >
                                privacy policy
                            </a>
                            .
                        </Text>
                        <Group justify="space-between" mt="lg" gap={"xl"}>
                            <Button variant="light" size="sm" color="gray" onClick={handleDecline}>
                                Decline
                            </Button>
                            <Button variant="filled" size="sm" color="grape" onClick={handleAccept}>
                                Accept
                            </Button>
                        </Group>
                    </Paper>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
