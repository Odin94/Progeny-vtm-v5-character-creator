import { createFileRoute } from "@tanstack/react-router"
import { Container, Loader, Text } from "@mantine/core"
import { useEffect, useRef } from "react"
import { clearStoredAuthReturnTo, getStoredAuthReturnTo, useAuth } from "~/hooks/useAuth"

export const Route = createFileRoute("/auth/callback")({
    component: AuthCallback,
})

const DEFAULT_POST_AUTH_PATH = "/"

function getSafeReturnTo(state?: string | null) {
    const candidate = state || getStoredAuthReturnTo() || DEFAULT_POST_AUTH_PATH

    if (!candidate.startsWith("/")) {
        return DEFAULT_POST_AUTH_PATH
    }

    if (candidate.startsWith("//")) {
        return DEFAULT_POST_AUTH_PATH
    }

    return candidate === "/auth/callback" ? DEFAULT_POST_AUTH_PATH : candidate
}

// TODOdin: Give users a way out of here if they're stuck in `Completing sign in...`
function AuthCallback() {
    const { handleCallback, isHandlingCallback } = useAuth()
    const callbackProcessedRef = useRef<string | null>(null)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")
        const returnTo = getSafeReturnTo(state)

        if (code && !isHandlingCallback && callbackProcessedRef.current !== code) {
            callbackProcessedRef.current = code

            window.history.replaceState({}, "", "/auth/callback")

            handleCallback(
                { code, state: state || undefined },
                {
                    onSuccess: () => {
                        clearStoredAuthReturnTo()
                        window.location.replace(returnTo)
                    },
                    onError: (error) => {
                        console.error("Auth callback error:", error)
                        clearStoredAuthReturnTo()
                        window.location.replace("/")
                        callbackProcessedRef.current = null
                    },
                }
            )
        } else if (!code) {
            clearStoredAuthReturnTo()
            window.location.replace("/")
        }
    }, [handleCallback, isHandlingCallback])

    useEffect(() => {
        return () => {
            if (!isHandlingCallback) {
                clearStoredAuthReturnTo()
            }
        }
    }, [isHandlingCallback])

    return (
        <Container
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                gap: "1rem",
            }}
        >
            <Loader size="lg" color="red" />
            <Text size="lg">Completing sign in...</Text>
        </Container>
    )
}
