import { Button, Group } from "@mantine/core"
import { useAuth } from "../hooks/useAuth"

export const AuthButton = () => {
    const { user, loading, isAuthenticated, signIn, signOut } = useAuth()

    if (loading) {
        return (
            <Button loading color="gray">
                Loading...
            </Button>
        )
    }

    if (isAuthenticated && user) {
        return (
            <Group gap="xs">
                <Button
                    onClick={() => {
                        window.location.href = "/me"
                    }}
                    variant="subtle"
                    color="red"
                >
                    {user.firstName || user.email}
                </Button>
                <Button onClick={signOut} variant="outline" color="red">
                    Sign Out
                </Button>
            </Group>
        )
    }

    return (
        <Button onClick={signIn} variant="filled" color="red">
            Sign In
        </Button>
    )
}
