import type { QueryClient } from "@tanstack/react-query"
import { PREFERENCES_QUERY_KEY } from "~/hooks/useUserPreferences"

export async function refreshIdentityBoundQueries(queryClient: QueryClient): Promise<void> {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
        queryClient.invalidateQueries({ queryKey: ["characters"] }),
        queryClient.invalidateQueries({ queryKey: ["coteries"] }),
        queryClient.invalidateQueries({ queryKey: ["shares"] }),
        queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })
    ])
}
