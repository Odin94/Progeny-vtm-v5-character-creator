import type {
    HomebrewCollection,
    HomebrewCollectionInput,
    HomebrewLibraryDetail,
    HomebrewLibrarySummary,
    HomebrewPublishRequest
} from "~/data/Homebrew"
import {
    characterApiResponseListSchema,
    characterApiResponseSchema,
    type CreateCharacterPayload,
    type UpdateCharacterPayload
} from "~/utils/characterApi"

// Use the Vite proxy for local dev so browser navigation, cookies, and IPv4/IPv6
// localhost resolution all stay on the same origin. Production still honors the
// configured API endpoint.
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const isLocalDevApiUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url)
        return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) && parsed.port === "3001"
    } catch {
        return false
    }
}

const API_URL =
    import.meta.env.DEV && (!configuredApiUrl || isLocalDevApiUrl(configuredApiUrl))
        ? "/api"
        : configuredApiUrl || (import.meta.env.DEV ? "/api" : "http://localhost:3001")

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
}

export const AUTH_UNAUTHORIZED_EVENT = "progeny:auth-unauthorized"

export type ApiValidationIssue = {
    message: string
    path: Array<string | number>
}

export type ApiError = Error & { status?: number; issues?: ApiValidationIssue[] }

const notifyAuthUnauthorized = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
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
        const response = await fetch(`${API_URL}/health`, {
            credentials: "include"
        })
        const csrfFromHeader = response.headers.get("X-CSRF-Token")
        if (csrfFromHeader) {
            csrfTokenCache = csrfFromHeader
        }
    }
}

let csrfTokenCache: string | null = null

const getCsrfToken = (): string | null => {
    return csrfTokenCache
}

const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = "GET", body, headers = {} } = options

    // Ensure CSRF token exists for state-changing operations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        await ensureCsrfToken()
    }

    const requestHeaders: Record<string, string> = {
        ...headers
    }

    if (body) {
        requestHeaders["Content-Type"] = "application/json"
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
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
        ...(body ? { body: JSON.stringify(body) } : {})
    })

    const csrfFromHeader = response.headers.get("X-CSRF-Token")
    if (csrfFromHeader) {
        csrfTokenCache = csrfFromHeader
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = error.message || error.error || `HTTP ${response.status}`
        const httpError = new Error(errorMessage) as ApiError
        httpError.status = response.status
        if (Array.isArray(error.issues)) httpError.issues = error.issues
        if (response.status === 401) {
            notifyAuthUnauthorized()
        }
        throw httpError
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

const apiRequestBlob = async (endpoint: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}${endpoint}`, { credentials: "include" })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        const httpError = new Error(
            error.message || error.error || `HTTP ${response.status}`
        ) as ApiError
        httpError.status = response.status
        if (response.status === 401) notifyAuthUnauthorized()
        throw httpError
    }

    return response.blob()
}

const uploadFile = async <T>(endpoint: string, file: File): Promise<T> => {
    await ensureCsrfToken()
    const csrfToken = getCsrfToken()
    const formData = new FormData()
    formData.append("image", file)
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
        body: formData
    })

    const csrfFromHeader = response.headers.get("X-CSRF-Token")
    if (csrfFromHeader) csrfTokenCache = csrfFromHeader

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        const httpError = new Error(
            error.message || error.error || `HTTP ${response.status}`
        ) as ApiError
        httpError.status = response.status
        if (response.status === 401) notifyAuthUnauthorized()
        throw httpError
    }

    return response.json()
}

type UserPreferences = {
    colorTheme: string | null
    backgroundImage: string | null
}

export type CurrentUser = {
    id: string
    email: string
    firstName?: string
    lastName?: string
    nickname?: string | null
    isSuperadmin: boolean
    nameTagEnabled: boolean
    nameTagVisible: boolean
    actorIsSuperadmin: boolean
    impersonation:
        | { active: false }
        | {
              active: true
              expiresAt: string
              actorUser: AdminUser
              impersonatedUser: AdminUser
          }
}

export type AdminUser = {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    nickname?: string | null
    isSuperadmin: boolean
    nameTagEnabled: boolean
    nameTagVisible: boolean
    isActive?: boolean
    lastActiveAt?: string | null
}

export type AdminUsersResponse = {
    users: AdminUser[]
    page: number
    pageSize: number
    total: number
    totalPages: number
}

export type StartImpersonationResponse = {
    sessionId: string
    expiresAt: string
    actorUser: AdminUser
    impersonatedUser: AdminUser
}

export type RecentChange = {
    id: string
    title: string
    body: string
    imageUrl: string | null
    hasImage: boolean
    status: "draft" | "published" | "deleted"
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export type RecentChangesResponse = {
    changes: RecentChange[]
}

export type RecentChangeDeliveryResponse = RecentChangesResponse & {
    announcement: RecentChange | null
}

type ApiTimestamp = string

export type UpdateCharacterVitalsPayload = {
    maxHealth: number
    willpower: number
    humanity: number
    ephemeral: {
        superficialDamage: number
        aggravatedDamage: number
        hunger: number
        superficialWillpowerDamage: number
        aggravatedWillpowerDamage: number
        humanityStains: number
    }
}

export type UpdateCharacterVitalsResponse = {
    id: string
    characterVersion: number
    updatedAt: ApiTimestamp
}

export type CoterieVitalsResponse = {
    coterieId: string
    characterId: string
    maxHealth: number
    superficialDamage: number
    aggravatedDamage: number
    hunger: number
    willpower: number
    currentWillpower: number
    superficialWillpowerDamage: number
    aggravatedWillpowerDamage: number
    humanity: number
    humanityStains: number
    characterVersion: number
    updatedAt: ApiTimestamp
}

export type CoterieCharacter = {
    id: string
    name: string
    data: unknown
    version: number
    characterVersion?: number
    createdAt: ApiTimestamp
    updatedAt: ApiTimestamp
    shared?: boolean
    ownedByCurrentUser?: boolean
}

export type CoterieMemberResponse = {
    id: string
    characterId: string
    createdAt: ApiTimestamp
    playerNickname?: string | null
    showPlayerNameTag?: boolean
    character?: CoterieCharacter
}

export type CoteriePlayerResponse = {
    membershipId: string | null
    nickname: string | null
    showNameTag: boolean
    isOwner: boolean
    joinedAt: ApiTimestamp
}

export type CoterieResponse = {
    id: string
    name: string
    createdAt: ApiTimestamp
    updatedAt: ApiTimestamp
    owned?: boolean
    canEdit?: boolean
    canManageInvites?: boolean
    canManagePlayers?: boolean
    playerCount: number
    members?: CoterieMemberResponse[]
    players?: CoteriePlayerResponse[]
}

export type CoterieInviteResponse = {
    id: string
    createdAt: ApiTimestamp
    expiresAt: ApiTimestamp
    revokedAt?: ApiTimestamp | null
    active?: boolean
}

export type CreatedCoterieInviteResponse = CoterieInviteResponse & {
    token: string
}

export type AcceptCoterieInviteResponse = {
    coterie: CoterieResponse
}

export type PrivateNoteVersionResponse = {
    id: string
    content: string
    createdAt: ApiTimestamp
}

export type PrivateNotesResponse = {
    current: PrivateNoteVersionResponse | null
    versions: PrivateNoteVersionResponse[]
}

export type SavePrivateNotesResponse = PrivateNotesResponse & {
    createdNewVersion: boolean
}

export type CoterieNoteVersionResponse = PrivateNoteVersionResponse
export type CoterieNotesResponse = PrivateNotesResponse
export type SaveCoterieNotesResponse = SavePrivateNotesResponse
export type CharacterNoteVersionResponse = PrivateNoteVersionResponse
export type CharacterNotesResponse = PrivateNotesResponse
export type SaveCharacterNotesResponse = SavePrivateNotesResponse

export type RecentChatSessionResponse =
    | {
          available: false
      }
    | {
          available: true
          sessionId: string
          sessionType: "temporary" | "coterie"
          coterieId?: string
          participantCount: number
      }

export type CharacterShareResponse = {
    id?: string
    characterId: string
    characterName?: string
    createdAt: ApiTimestamp
    sharedWith: {
        nickname: string | null
        showNameTag: boolean
    }
}

// TODOdin: Put proper types in APIs
export const api = {
    // Auth
    getCurrentUser: async (): Promise<CurrentUser | null> => {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        })

        const csrfFromHeader = response.headers.get("X-CSRF-Token")
        if (csrfFromHeader) {
            csrfTokenCache = csrfFromHeader
        }

        if (response.status === 401) {
            notifyAuthUnauthorized()
            return null
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }))
            const errorMessage = error.message || error.error || `HTTP ${response.status}`
            const httpError = new Error(errorMessage) as ApiError
            httpError.status = response.status
            throw httpError
        }

        return response.json()
    },
    handleAuthCallback: (code: string, state?: string) =>
        apiRequest<{ success: true; returnTo: string; user: CurrentUser }>(
            `/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`
        ),
    logout: () => apiRequest<{ success: true; logoutUrl: string | null }>("/auth/logout"),
    updateUserProfile: (data: { nickname?: string | null; nameTagVisible?: boolean }) =>
        apiRequest<CurrentUser>("/auth/me", { method: "PUT", body: data }),
    getPreferences: () => apiRequest<UserPreferences>("/auth/preferences"),
    updatePreferences: (data: Partial<UserPreferences>) =>
        apiRequest<UserPreferences>("/auth/preferences", { method: "PUT", body: data }),
    getRecentChatSession: () => apiRequest<RecentChatSessionResponse>("/chat/recent-session"),

    // Admin
    getAdminUsers: ({
        query,
        page = 1,
        pageSize = 25
    }: {
        query?: string
        page?: number
        pageSize?: number
    } = {}) => {
        const searchParams = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize)
        })
        if (query) searchParams.set("query", query)

        return apiRequest<AdminUsersResponse>(`/admin/users?${searchParams}`)
    },
    updateSuperadmin: (id: string, data: { isSuperadmin: boolean }) =>
        apiRequest<AdminUser>(`/admin/users/${id}/superadmin`, {
            method: "PATCH",
            body: data
        }),
    updateNameTagAccess: (id: string, data: { nameTagEnabled: boolean }) =>
        apiRequest<AdminUser>(`/admin/users/${id}/name-tag`, {
            method: "PATCH",
            body: data
        }),
    startImpersonation: (userId: string) =>
        apiRequest<StartImpersonationResponse>("/admin/impersonation", {
            method: "POST",
            body: { userId }
        }),
    stopImpersonation: () =>
        apiRequest<{ stopped: boolean }>("/admin/impersonation/stop", { method: "POST" }),
    getRecentChangesHistory: () => apiRequest<RecentChangesResponse>("/recent-changes/history"),
    deliverLatestRecentChange: () =>
        apiRequest<RecentChangeDeliveryResponse>("/recent-changes/deliver-latest", {
            method: "POST"
        }),
    getAdminRecentChanges: () => apiRequest<RecentChangesResponse>("/admin/recent-changes"),
    getRecentChangeImage: (id: string) => apiRequestBlob(`/recent-changes/${id}/image`),
    createAdminRecentChange: (data: { title: string; body: string }) =>
        apiRequest<RecentChange>("/admin/recent-changes", { method: "POST", body: data }),
    updateAdminRecentChange: (id: string, data: { title: string; body: string }) =>
        apiRequest<RecentChange>(`/admin/recent-changes/${id}`, { method: "PATCH", body: data }),
    uploadAdminRecentChangeImage: (id: string, file: File) =>
        uploadFile<RecentChange>(`/admin/recent-changes/${id}/image`, file),
    removeAdminRecentChangeImage: (id: string) =>
        apiRequest<RecentChange>(`/admin/recent-changes/${id}/image`, { method: "DELETE" }),
    publishAdminRecentChange: (id: string) =>
        apiRequest<RecentChange>(`/admin/recent-changes/${id}/publish`, { method: "POST" }),
    softDeleteAdminRecentChange: (id: string) =>
        apiRequest<RecentChange>(`/admin/recent-changes/${id}/delete`, { method: "POST" }),
    hardDeleteAdminRecentChange: (id: string) =>
        apiRequest<void>(`/admin/recent-changes/${id}`, { method: "DELETE" }),

    // Characters
    getCharacters: () =>
        apiRequest<unknown>("/characters").then((response) =>
            characterApiResponseListSchema.parse(response)
        ),
    getCharacter: (id: string) =>
        apiRequest<unknown>(`/characters/${id}`).then((response) =>
            characterApiResponseSchema.parse(response)
        ),
    createCharacter: (data: CreateCharacterPayload) =>
        apiRequest<unknown>("/characters", { method: "POST", body: data }).then((response) =>
            characterApiResponseSchema.parse(response)
        ),
    updateCharacter: (id: string, data: UpdateCharacterPayload) =>
        apiRequest<unknown>(`/characters/${id}`, { method: "PUT", body: data }).then((response) =>
            characterApiResponseSchema.parse(response)
        ),
    updateCharacterVitals: (id: string, data: UpdateCharacterVitalsPayload) =>
        apiRequest<UpdateCharacterVitalsResponse>(`/characters/${id}/vitals`, {
            method: "PATCH",
            body: data
        }),
    deleteCharacter: (id: string) => apiRequest<void>(`/characters/${id}`, { method: "DELETE" }),
    getCharacterNotes: (characterId: string) =>
        apiRequest<CharacterNotesResponse>(`/characters/${characterId}/notes`),
    saveCharacterNotes: (characterId: string, data: { content: string }) =>
        apiRequest<SaveCharacterNotesResponse>(`/characters/${characterId}/notes`, {
            method: "PUT",
            body: data
        }),
    restoreCharacterNoteVersion: (characterId: string, versionId: string) =>
        apiRequest<SaveCharacterNotesResponse>(
            `/characters/${characterId}/notes/versions/${versionId}/restore`,
            { method: "POST" }
        ),

    // Coteries
    getCoteries: () => apiRequest<CoterieResponse[]>("/coteries"),
    getCoterieVitals: () => apiRequest<CoterieVitalsResponse[]>("/coteries/vitals"),
    getCoterie: (id: string) => apiRequest<CoterieResponse>(`/coteries/${id}`),
    createCoterie: (data: { name: string }) =>
        apiRequest<CoterieResponse>("/coteries", { method: "POST", body: data }),
    updateCoterie: (id: string, data: { name?: string }) =>
        apiRequest<CoterieResponse>(`/coteries/${id}`, { method: "PUT", body: data }),
    deleteCoterie: (id: string) => apiRequest<void>(`/coteries/${id}`, { method: "DELETE" }),
    addCharacterToCoterie: (coterieId: string, data: { characterId: string }) =>
        apiRequest<unknown>(`/coteries/${coterieId}/characters`, { method: "POST", body: data }),
    removeCharacterFromCoterie: (coterieId: string, characterId: string) =>
        apiRequest<void>(`/coteries/${coterieId}/characters/${characterId}`, { method: "DELETE" }),
    createCoterieInvite: (coterieId: string) =>
        apiRequest<CreatedCoterieInviteResponse>(`/coteries/${coterieId}/invites`, {
            method: "POST"
        }),
    getCoterieInvites: (coterieId: string) =>
        apiRequest<CoterieInviteResponse[]>(`/coteries/${coterieId}/invites`),
    revokeCoterieInvite: (coterieId: string, inviteId: string) =>
        apiRequest<void>(`/coteries/${coterieId}/invites/${inviteId}`, { method: "DELETE" }),
    acceptCoterieInvite: (token: string) =>
        apiRequest<AcceptCoterieInviteResponse>("/coterie-invites/accept", {
            method: "POST",
            body: { token }
        }),
    removeCoteriePlayer: (coterieId: string, membershipId: string) =>
        apiRequest<void>(`/coteries/${coterieId}/players/${membershipId}`, { method: "DELETE" }),
    getCoterieNotes: (coterieId: string) =>
        apiRequest<CoterieNotesResponse>(`/coteries/${coterieId}/notes`),
    saveCoterieNotes: (coterieId: string, data: { content: string }) =>
        apiRequest<SaveCoterieNotesResponse>(`/coteries/${coterieId}/notes`, {
            method: "PUT",
            body: data
        }),
    restoreCoterieNoteVersion: (coterieId: string, versionId: string) =>
        apiRequest<SaveCoterieNotesResponse>(
            `/coteries/${coterieId}/notes/versions/${versionId}/restore`,
            {
                method: "POST"
            }
        ),

    // Homebrew
    getHomebrewCollections: () => apiRequest<HomebrewCollection[]>("/homebrew/collections"),
    getHomebrewCollection: (id: string) =>
        apiRequest<HomebrewCollection>(`/homebrew/collections/${id}`),
    createHomebrewCollection: (data: HomebrewCollectionInput) =>
        apiRequest<HomebrewCollection>("/homebrew/collections", { method: "POST", body: data }),
    updateHomebrewCollection: (id: string, data: HomebrewCollectionInput) =>
        apiRequest<HomebrewCollection>(`/homebrew/collections/${id}`, {
            method: "PUT",
            body: data
        }),
    deleteHomebrewCollection: (id: string) =>
        apiRequest<void>(`/homebrew/collections/${id}`, { method: "DELETE" }),
    getCoterieHomebrew: (coterieId: string) =>
        apiRequest<{ canManage: boolean; collections: HomebrewCollection[] }>(
            `/coteries/${coterieId}/homebrew`
        ),
    setCoterieHomebrew: (coterieId: string, collectionIds: string[]) =>
        apiRequest<{ collectionIds: string[] }>(`/coteries/${coterieId}/homebrew`, {
            method: "PUT",
            body: { collectionIds }
        }),
    getCharacterHomebrew: (characterId: string) =>
        apiRequest<HomebrewCollection[]>(`/characters/${characterId}/homebrew`),
    getHomebrewLibrary: (filters?: {
        query?: string
        type?: string
        tag?: string
        sort?: "top" | "trending" | "newest" | "copied"
    }) => {
        const query = new URLSearchParams()
        if (filters?.query) query.set("query", filters.query)
        if (filters?.type) query.set("type", filters.type)
        if (filters?.tag) query.set("tag", filters.tag)
        if (filters?.sort) query.set("sort", filters.sort)
        const suffix = query.size > 0 ? `?${query}` : ""
        return apiRequest<HomebrewLibrarySummary[]>(`/homebrew/library${suffix}`)
    },
    getHomebrewLibraryDetail: (id: string) =>
        apiRequest<HomebrewLibraryDetail>(`/homebrew/library/${id}`),
    getHomebrewPublishRequests: () =>
        apiRequest<HomebrewPublishRequest[]>("/homebrew/publish-requests"),
    requestHomebrewPublication: (collectionId: string) =>
        apiRequest<HomebrewPublishRequest>("/homebrew/publish-requests", {
            method: "POST",
            body: { collectionId, shareAcknowledged: true }
        }),
    withdrawHomebrewPublishRequest: (id: string) =>
        apiRequest<{ status: "withdrawn" }>(`/homebrew/publish-requests/${id}/withdraw`, {
            method: "POST"
        }),
    copyHomebrewLibraryCollection: (id: string) =>
        apiRequest<HomebrewCollection>(`/homebrew/library/${id}/copy`, { method: "POST" }),
    rateHomebrewLibraryCollection: (id: string, rating: number) =>
        apiRequest<{ rating: number }>(`/homebrew/library/${id}/rating`, {
            method: "POST",
            body: { rating }
        }),
    removeHomebrewLibraryRating: (id: string) =>
        apiRequest<void>(`/homebrew/library/${id}/rating`, { method: "DELETE" }),
    commentOnHomebrewLibraryCollection: (id: string, body: string) =>
        apiRequest(`/homebrew/library/${id}/comments`, { method: "POST", body: { body } }),
    updateHomebrewLibraryComment: (id: string, commentId: string, body: string) =>
        apiRequest(`/homebrew/library/${id}/comments/${commentId}`, {
            method: "PATCH",
            body: { body }
        }),
    deleteHomebrewLibraryComment: (id: string, commentId: string) =>
        apiRequest<void>(`/homebrew/library/${id}/comments/${commentId}`, {
            method: "DELETE"
        }),
    unpublishHomebrewLibraryCollection: (id: string) =>
        apiRequest<{ unpublished: true }>(`/homebrew/library/${id}/unpublish`, {
            method: "POST"
        }),
    getAdminHomebrewPublishRequests: () =>
        apiRequest<HomebrewPublishRequest[]>("/admin/homebrew/publish-requests"),
    moderateHomebrewPublishRequest: (
        id: string,
        decision: { decision: "approve" } | { decision: "deny"; message: string }
    ) =>
        apiRequest(`/admin/homebrew/publish-requests/${id}`, {
            method: "POST",
            body: decision
        }),

    // Shares
    shareCharacter: (characterId: string, data: { sharedWithUserNickname: string }) =>
        apiRequest<CharacterShareResponse>(`/characters/${characterId}/share`, {
            method: "POST",
            body: data
        }),
    unshareCharacter: (characterId: string, userId: string) =>
        apiRequest<void>(`/characters/${characterId}/share/${userId}`, { method: "DELETE" }),
    getCharacterShares: (characterId: string) =>
        apiRequest<CharacterShareResponse[]>(`/characters/${characterId}/shares`)
}

export { API_URL }
