import { createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Container, Loader, Text } from "@mantine/core"
import { useEffect } from "react"
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

// TODOdin: Give users a way out of here if they're stuck in `Completing sign in...`
function AuthCallback() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        if (!code) {
            clearStoredAuthReturnTo()
            window.location.replace("/")
            return
        }

        const request =
            activeAuthCallbackRequest?.code === code
                ? activeAuthCallbackRequest.promise
                : api.handleAuthCallback(code, state || undefined)

        if (activeAuthCallbackRequest?.code !== code) {
            activeAuthCallbackRequest = { code, promise: request }
        }

        void request
            .then((data) => {
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
                console.error("Auth callback error:", error)
                clearStoredAuthReturnTo()
                window.location.replace("/")
            })
            .finally(() => {
                if (activeAuthCallbackRequest?.code === code) {
                    activeAuthCallbackRequest = null
                }
            })
    }, [queryClient])

    return (
        <RenderProfiler id="AuthCallback">
            <Container
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    gap: "1rem"
                }}
            >
                <Loader size="lg" color="red" />
                <Text size="lg">Completing sign in...</Text>
            </Container>
        </RenderProfiler>
    )
}
