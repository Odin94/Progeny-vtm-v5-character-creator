import { Button, Group } from "@mantine/core"
import { useAuth } from "../hooks/useAuth"
import { isBackendDisabled } from "../utils/backend"

export const AuthButton = () => {
    if (isBackendDisabled()) {
        return null
    }
    const { user, loading, isAuthenticated, signIn, signOut } = useAuth()

    if (loading) {
        return <Button loading>Loading...</Button>
    }

    if (isAuthenticated && user) {
        return (
            <Group gap="xs">
                <Button
                    onClick={() => {
                        window.location.href = "/me"
                    }}
                    variant="subtle"
                >
                    {user.firstName || user.email}
                </Button>
                <Button onClick={signOut} variant="outline">
                    Sign Out
                </Button>
            </Group>
        )
    }

    return (
        <Button onClick={signIn} variant="filled">
            Sign In
        </Button>
    )
}
