import { createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Alert, Button, Container, Group, Loader, Stack, Text } from "@mantine/core"
import { IconAlertCircle, IconHome, IconRefresh } from "@tabler/icons-react"
import { useCallback, useEffect, useState } from "react"
import posthog from "posthog-js"
import RenderProfiler from "~/components/RenderProfiler"
import { clearStoredAuthReturnTo, getSafeAuthReturnTo } from "~/hooks/useAuth"
import { PREFERENCES_QUERY_KEY } from "~/hooks/useUserPreferences"
import { api, type CurrentUser } from "~/utils/api"

export const Route = createFileRoute("/auth/callback")({
    component: AuthCallback
})

type AuthCallbackResponse = {
    success: true
    returnTo: string
    user: CurrentUser
}

let activeAuthCallbackRequest: { code: string; promise: Promise<AuthCallbackResponse> } | null =
    null

export const AUTH_CALLBACK_TIMEOUT_MS = 15_000

export function AuthCallback() {
    const queryClient = useQueryClient()
    const [attempt, setAttempt] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const retry = useCallback(() => {
        activeAuthCallbackRequest = null
        setErrorMessage(null)
        setAttempt((current) => current + 1)
    }, [])

    const returnHome = useCallback(() => {
        activeAuthCallbackRequest = null
        clearStoredAuthReturnTo()
        window.location.replace("/")
    }, [])

    useEffect(() => {
        let cancelled = false
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        if (!code) {
            clearStoredAuthReturnTo()
            window.location.replace("/")
            return
        }

        const timeoutId = window.setTimeout(() => {
            if (!cancelled) {
                setErrorMessage(
                    "Sign-in is taking longer than expected. Check your connection, then try again."
                )
            }
        }, AUTH_CALLBACK_TIMEOUT_MS)

        const request =
            activeAuthCallbackRequest?.code === code
                ? activeAuthCallbackRequest.promise
                : api.handleAuthCallback(code, state || undefined)

        if (activeAuthCallbackRequest?.code !== code) {
            activeAuthCallbackRequest = { code, promise: request }
        }

        void request
            .then((data) => {
                if (cancelled) return

                queryClient.setQueryData(["auth", "me"], data.user)
                queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
                queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })

                try {
                    posthog.identify(data.user.id, {
                        email: data.user.email,
                        firstName: data.user.firstName,
                        lastName: data.user.lastName
                    })
                } catch (error) {
                    console.warn("PostHog identify failed:", error)
                }

                clearStoredAuthReturnTo()
                window.location.replace(getSafeAuthReturnTo(data.returnTo || state))
            })
            .catch((error) => {
                if (cancelled) return

                console.error("Auth callback error:", error)
                setErrorMessage("We couldn't finish signing you in. Please try again.")
            })
            .finally(() => {
                window.clearTimeout(timeoutId)
                if (activeAuthCallbackRequest?.code === code) {
                    activeAuthCallbackRequest = null
                }
            })

        return () => {
            cancelled = true
            window.clearTimeout(timeoutId)
        }
    }, [attempt, queryClient])

    return (
        <RenderProfiler id="AuthCallback">
            <Container
                aria-live="polite"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    gap: "1rem"
                }}
            >
                {errorMessage ? (
                    <Stack align="center" gap="lg" maw={460}>
                        <Alert
                            icon={<IconAlertCircle size={20} />}
                            title="Sign-in didn't finish"
                            color="red"
                            variant="light"
                        >
                            {errorMessage}
                        </Alert>
                        <Group justify="center">
                            <Button leftSection={<IconRefresh size={18} />} onClick={retry}>
                                Try again
                            </Button>
                            <Button
                                variant="default"
                                leftSection={<IconHome size={18} />}
                                onClick={returnHome}
                            >
                                Return home
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <>
                        <Loader size="lg" color="red" />
                        <Text size="lg">Completing sign in...</Text>
                    </>
                )}
            </Container>
        </RenderProfiler>
    )
}
