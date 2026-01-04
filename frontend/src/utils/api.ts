// In development, use the proxy path so cookies work (same origin)
// In production, use the full API URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:3001")

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
}

const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = "GET", body, headers = {} } = options

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        credentials: "include",
        ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = error.message || error.error || `HTTP ${response.status}`
        const httpError = new Error(errorMessage) as Error & { status?: number }
        httpError.status = response.status
        throw httpError
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

export const api = {
    // Auth
    getCurrentUser: () => apiRequest<{ id: string; email: string; firstName?: string; lastName?: string }>("/auth/me"),
    handleAuthCallback: (code: string, state?: string) =>
        apiRequest<{ success: true; user: { id: string; email: string; firstName?: string; lastName?: string } }>(
            `/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`
        ),
    logout: () => apiRequest<{ success: true; logoutUrl: string | null }>("/auth/logout"),

    // Characters
    getCharacters: () => apiRequest<Array<unknown>>("/characters"),
    getCharacter: (id: string) => apiRequest<unknown>(`/characters/${id}`),
    createCharacter: (data: { name: string; data?: unknown; version?: number }) =>
        apiRequest<unknown>("/characters", { method: "POST", body: data }),
    updateCharacter: (id: string, data: { name?: string; data?: unknown; version?: number }) =>
        apiRequest<unknown>(`/characters/${id}`, { method: "PUT", body: data }),
    deleteCharacter: (id: string) => apiRequest<void>(`/characters/${id}`, { method: "DELETE" }),

    // Coteries
    getCoteries: () => apiRequest<Array<unknown>>("/coteries"),
    getCoterie: (id: string) => apiRequest<unknown>(`/coteries/${id}`),
    createCoterie: (data: { name: string }) => apiRequest<unknown>("/coteries", { method: "POST", body: data }),
    updateCoterie: (id: string, data: { name?: string }) => apiRequest<unknown>(`/coteries/${id}`, { method: "PUT", body: data }),
    deleteCoterie: (id: string) => apiRequest<void>(`/coteries/${id}`, { method: "DELETE" }),
    addCharacterToCoterie: (coterieId: string, data: { characterId: string }) =>
        apiRequest<unknown>(`/coteries/${coterieId}/characters`, { method: "POST", body: data }),
    removeCharacterFromCoterie: (coterieId: string, characterId: string) =>
        apiRequest<void>(`/coteries/${coterieId}/characters/${characterId}`, { method: "DELETE" }),

    // Shares
    shareCharacter: (characterId: string, data: { sharedWithUserEmail: string }) =>
        apiRequest<unknown>(`/characters/${characterId}/share`, { method: "POST", body: data }),
    unshareCharacter: (characterId: string, userId: string) =>
        apiRequest<void>(`/characters/${characterId}/share/${userId}`, { method: "DELETE" }),
    getCharacterShares: (characterId: string) => apiRequest<Array<unknown>>(`/characters/${characterId}/shares`),
}

export { API_URL }
