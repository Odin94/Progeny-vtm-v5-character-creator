const ACTIVE_WINDOW_MS = 5 * 60 * 1000

const userLastActiveAt = new Map<string, number>()

export function markUserActive(userId: string): void {
    userLastActiveAt.set(userId, Date.now())
}

export function getUserActivity(userId: string): {
    isActive: boolean
    lastActiveAt: string | null
} {
    const lastActiveAt = userLastActiveAt.get(userId)
    if (!lastActiveAt) {
        return { isActive: false, lastActiveAt: null }
    }

    return {
        isActive: Date.now() - lastActiveAt <= ACTIVE_WINDOW_MS,
        lastActiveAt: new Date(lastActiveAt).toISOString()
    }
}

export function clearUserActivityForTests(): void {
    userLastActiveAt.clear()
}
