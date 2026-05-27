import { Alert, Center } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { Component, ErrorInfo, ReactNode } from "react"
import posthog from "posthog-js"
import ErrorDetails from "./ErrorDetails"

type Props = {
    children?: ReactNode
}

type State = {
    hasError: boolean
    error?: Error
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
                <Center>
                    <Alert
                        mt={"50px"}
                        icon={<IconAlertCircle size="1rem" />}
                        color="red"
                        variant="outline"
                        bg={"rgba(0, 0, 0, 0.6)"}
                    >
                        {this.state.error ? <ErrorDetails error={this.state.error} /> : null}
                    </Alert>
                </Center>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
