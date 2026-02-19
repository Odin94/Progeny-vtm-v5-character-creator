// Use VITE_API_URL if provided, otherwise fallback to proxy in dev or localhost in production
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:3001")

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
}

// TODOdin: We're now getting token from header because of domain conflict issues
// TODOdin: Switch to JWT-in-header auth (like in cozycrowns) and ditch all CSRF stuff
// verify that what we're doing now is legit and good practice
// const getCsrfToken = (): string | null => {
//     // Read CSRF token from cookie
//     const cookies = document.cookie.split(";")
//     for (const cookie of cookies) {
//         const [name, value] = cookie.trim().split("=")
//         if (name === "csrf-token") {
//             return decodeURIComponent(value)
//         }
//     }
//     return null
// }

// Ensure CSRF token is available before making requests
// TODOdin: This is not pretty, find an established best practice for initializing CSRF for SPAs
const ensureCsrfToken = async (): Promise<void> => {
    if (!getCsrfToken()) {
        // Make a GET request to trigger CSRF token generation
        await fetch(`${API_URL}/health`, {
            credentials: "include",
        })
    }
}

let csrfTokenCache: string | null = null

const getCsrfToken = (): string | null => {
    return csrfTokenCache
}

const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = "GET", body, headers = {} } = options

    // Ensure CSRF token exists for state-changing operations
    if (["POST", "PUT", "DELETE"].includes(method)) {
        await ensureCsrfToken()
    }

    const requestHeaders: Record<string, string> = {
        ...headers,
    }

    if (body) {
        requestHeaders["Content-Type"] = "application/json"
    }

    if (["POST", "PUT", "DELETE"].includes(method)) {
        const csrfToken = getCsrfToken()
        if (csrfToken) {
            requestHeaders["x-csrf-token"] = csrfToken
        } else {
            console.warn("No CSRF token found in headers!")
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        credentials: "include",
        ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const csrfFromHeader = response.headers.get("X-CSRF-Token")
    if (csrfFromHeader) {
        csrfTokenCache = csrfFromHeader
    }

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

// TODOdin: Put proper types in APIs
export const api = {
    // Auth
    getCurrentUser: () =>
        apiRequest<{ id: string; email: string; firstName?: string; lastName?: string; nickname?: string | null }>("/auth/me"),
    handleAuthCallback: (code: string, state?: string) =>
        apiRequest<{ success: true; user: { id: string; email: string; firstName?: string; lastName?: string; nickname?: string | null } }>(
            `/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`,
        ),
    logout: () => apiRequest<{ success: true; logoutUrl: string | null }>("/auth/logout"),
    updateUserProfile: (data: { nickname?: string | null }) =>
        apiRequest<{ id: string; email: string; firstName?: string; lastName?: string; nickname?: string | null }>("/auth/me", {
            method: "PUT",
            body: data,
        }),

    // Characters
    // TODOdin: type these APIs and validate in fetch
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
    shareCharacter: (characterId: string, data: { sharedWithUserNickname: string }) =>
        apiRequest<unknown>(`/characters/${characterId}/share`, { method: "POST", body: data }),
    unshareCharacter: (characterId: string, userId: string) =>
        apiRequest<void>(`/characters/${characterId}/share/${userId}`, { method: "DELETE" }),
    getCharacterShares: (characterId: string) => apiRequest<Array<unknown>>(`/characters/${characterId}/shares`),
}

export { API_URL }
