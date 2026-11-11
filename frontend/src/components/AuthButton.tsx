import { Button, Group } from "@mantine/core"
import { useAuth } from "../hooks/useAuth"

export const AuthButton = () => {
    const { user, isLoading, isAuthenticated, signIn, isSigningIn, signOut } = useAuth()

    if (isLoading) {
        return (
            <Button loading variant="default">
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
                    color="gray"
                >
                    {user.firstName || user.email}
                </Button>
                <Button onClick={signOut} variant="default">
                    Sign Out
                </Button>
            </Group>
        )
    }

    return (
        <Button onClick={signIn} loading={isSigningIn} variant="filled" color="red">
            {isSigningIn ? "Signing in…" : "Sign In"}
        </Button>
    )
}
