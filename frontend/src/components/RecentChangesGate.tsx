import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "~/hooks/useAuth"
import { api, type RecentChange } from "~/utils/api"
import RecentChangesModal from "./RecentChangesModal"

const RecentChangesGate = () => {
    const { user, isAuthenticated, isLoading } = useAuth()
    const deliveredForUser = useRef<string | null>(null)
    const [changes, setChanges] = useState<RecentChange[]>([])
    const [initialChangeId, setInitialChangeId] = useState<string | undefined>()
    const [opened, setOpened] = useState(false)
    const deliveryMutation = useMutation({
        mutationFn: api.deliverLatestRecentChange,
        onSuccess: ({ announcement, changes: history }) => {
            if (!announcement) return
            setChanges(history)
            setInitialChangeId(announcement.id)
            setOpened(true)
        }
    })

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !user)) {
            deliveredForUser.current = null
            return
        }

        if (
            isLoading ||
            !isAuthenticated ||
            !user ||
            user.impersonation.active ||
            deliveredForUser.current === user.id
        ) {
            return
        }

        deliveredForUser.current = user.id
        deliveryMutation.mutate()
    }, [deliveryMutation, isAuthenticated, isLoading, user])

    return (
        <RecentChangesModal
            opened={opened}
            onClose={() => setOpened(false)}
            changes={changes}
            initialChangeId={initialChangeId}
        />
    )
}

export default RecentChangesGate
