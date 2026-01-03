import { Button } from "@mantine/core"
import { useAuth } from "../hooks/useAuth"

export const AuthButton = () => {
    const { user, loading, isAuthenticated, signIn, signOut } = useAuth()

    if (loading) {
        return <Button loading>Loading...</Button>
    }

    if (isAuthenticated && user) {
        return (
            <Button onClick={signOut} variant="outline">
                Sign Out {user.firstName ? `(${user.firstName})` : ""}
            </Button>
        )
    }

    return (
        <Button onClick={signIn} variant="filled">
            Sign In
        </Button>
    )
}
