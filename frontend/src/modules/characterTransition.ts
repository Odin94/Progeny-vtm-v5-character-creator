import type { QueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { characterPersistence } from "./characterPersistence"

// Resolve at invocation so a handler never uses a retired account coordinator.
export const transitionCharacter = (
    queryClient: QueryClient,
    operation: (
        isCurrent: () => boolean,
        persistence: ReturnType<typeof characterPersistence>
    ) => Promise<void>
) => {
    const persistence = characterPersistence(queryClient)
    return persistence.transition(
        (isCurrent) => operation(isCurrent, persistence),
        (reason) =>
            notifications.show({
                title: reason === "busy" ? "Character operation in progress" : "Account changed",
                message:
                    reason === "busy"
                        ? "Wait for the current save or load to finish, then try again. Your draft is still in this browser."
                        : "Try again to use your current account. Your draft is still in this browser.",
                color: "orange"
            })
    )
}
