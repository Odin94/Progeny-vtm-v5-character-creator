import { createFileRoute } from "@tanstack/react-router"
import { Container, Loader, Text } from "@mantine/core"
import { useEffect, useRef } from "react"
import { useAuth } from "~/hooks/useAuth"
import { useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/callback")({
    component: AuthCallback,
})

// TODOdin: Give users a way out of here if they're stuck in `Completing sign in...`
function AuthCallback() {
    const { handleCallback, isHandlingCallback, isAuthenticated, user } = useAuth()
    const callbackProcessedRef = useRef<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        if (code && !isHandlingCallback && callbackProcessedRef.current !== code) {
            callbackProcessedRef.current = code

            window.history.replaceState({}, "", "/auth/callback")

            handleCallback(
                { code, state: state || undefined },
                {
                    onError: (error) => {
                        console.error("Auth callback error:", error)
                        window.history.replaceState({}, "", "/")
                        navigate({ to: "/" })
                        callbackProcessedRef.current = null
                    },
                }
            )
        }
    }, [handleCallback, isHandlingCallback, navigate])

    useEffect(() => {
        if (isAuthenticated && user && !isHandlingCallback) {
            console.log("Redirecting to /me after successful authentication", { isAuthenticated, user: user?.id })
            navigate({ to: "/me" })
        }
    }, [isAuthenticated, user, isHandlingCallback, navigate])

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
