import { useEffect } from "react"
import { notifications } from "@mantine/notifications"
import { consumeAuthSignInConfirmation } from "~/hooks/useAuth"

// Shows a one-time "you're signed in" toast after the post-sign-in reload lands
// on the returnTo page, so a successful sign-in has visible confirmation beyond
// the small topbar label changing.
export const AuthSignInConfirmation = () => {
    useEffect(() => {
        if (!consumeAuthSignInConfirmation()) return

        notifications.show({
            title: "Signed in",
            message: "You're signed in.",
            color: "green",
            autoClose: 4000
        })
    }, [])

    return null
}

export default AuthSignInConfirmation
