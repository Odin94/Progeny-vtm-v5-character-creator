import { Alert, Center, Text } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
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
