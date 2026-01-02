import { Alert, Center, Text } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { Component, ErrorInfo, ReactNode } from "react"
import posthog from "posthog-js"

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
        error: undefined,
    }

    public static getDerivedStateFromError(e: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: e }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)

        try {
            const character = getCharacterFromStorage()
            posthog.capture("$exception", {
                $exception_message: error.message,
                $exception_type: error.name,
                $exception_stack_trace_raw: error.stack,
                $exception_stack_trace: errorInfo.componentStack,
                character: character,
            })
        } catch (posthogError) {
            console.warn("Failed to capture error in PostHog:", posthogError)
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Center>
                    <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="red" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                        <Text fz={"xl"} ta={"center"}>
                            There was an error: {this.state.error?.message}
                        </Text>
                        <Text fz={"lg"} ta={"center"} mb={"xl"}>
                            Send a screenshot of this to me on{" "}
                            <a target="_blank" rel="noreferrer" href="https://twitter.com/Odin68092534">
                                Twitter
                            </a>{" "}
                            to help me fix it
                        </Text>
                        <Text fz={"xs"} ta={"center"}>
                            {this.state.error?.stack}
                        </Text>
                    </Alert>
                </Center>
            )
        }

        // eslint-disable-next-line react/prop-types
        return this.props.children
    }
}

export default ErrorBoundary
