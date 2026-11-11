import { Box } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Component, ErrorInfo, ReactNode } from "react"
import posthog from "posthog-js"
import ErrorDetails from "./ErrorDetails"
import { Panel } from "./ui/Panel"

type Props = {
    children?: ReactNode
    resetKey?: string
}

type State = {
    hasError: boolean
    error?: Error
    resetKey?: string
}

const getCharacterFromStorage = () => {
    try {
        const characterData = localStorage.getItem("character")
        if (characterData) {
            const parsed = JSON.parse(characterData)
            return parsed
        }
    } catch (_error) {
        // Silently fail if we can't read character data
    }
    return null
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: undefined
    }

    public static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        if (props.resetKey !== state.resetKey) {
            return { resetKey: props.resetKey, hasError: false, error: undefined }
        }
        return null
    }

    public static getDerivedStateFromError(e: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: e }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)

        try {
            const character = getCharacterFromStorage()
            posthog.captureException(error, {
                error_boundary: true,
                error_boundary_fallback: "reddit_screenshot_request",
                react_component_stack: errorInfo.componentStack,
                character: character
            })
        } catch (posthogError) {
            console.warn("Failed to capture error in PostHog:", posthogError)
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Box
                    role="alert"
                    maw={760}
                    mx="auto"
                    px="var(--pg-gutter)"
                    py={{ base: 32, sm: 64 }}
                >
                    <Panel tone="ornate" p={{ base: "lg", sm: "xl" }} grain>
                        <Box
                            mx="auto"
                            mb="md"
                            w={52}
                            h={52}
                            style={{
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "50%",
                                color: "var(--pg-blood-bright)",
                                border: "1px solid var(--pg-border-blood)",
                                boxShadow: "var(--pg-glow-blood)"
                            }}
                        >
                            <IconAlertTriangle size={24} stroke={1.6} />
                        </Box>
                        {this.state.error ? (
                            <ErrorDetails error={this.state.error} linkColor="gold.4" />
                        ) : null}
                    </Panel>
                </Box>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
