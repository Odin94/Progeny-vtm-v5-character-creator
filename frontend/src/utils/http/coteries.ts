import {
    type AcceptCoterieInviteResponse,
    type CoterieInviteResponse,
    type CoterieNotesResponse,
    type CoterieResponse,
    type CoterieVitalsResponse,
    type CreatedCoterieInviteResponse,
    type SaveCoterieNotesResponse,
    request
} from "../api"

export const coterieHttp = {
    getAll: () => request<CoterieResponse[]>("/coteries"),
    getVitals: () => request<CoterieVitalsResponse[]>("/coteries/vitals"),
    get: (id: string) => request<CoterieResponse>(`/coteries/${id}`),
    create: (data: { name: string }) => request<CoterieResponse>("/coteries", { method: "POST", body: data }),
    update: (id: string, data: { name?: string }) => request<CoterieResponse>(`/coteries/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<void>(`/coteries/${id}`, { method: "DELETE" }),
    addCharacter: (coterieId: string, characterId: string) => request(`/coteries/${coterieId}/characters`, { method: "POST", body: { characterId } }),
    removeCharacter: (coterieId: string, characterId: string) => request<void>(`/coteries/${coterieId}/characters/${characterId}`, { method: "DELETE" }),
    getInvites: (coterieId: string) => request<CoterieInviteResponse[]>(`/coteries/${coterieId}/invites`),
    createInvite: (coterieId: string) => request<CreatedCoterieInviteResponse>(`/coteries/${coterieId}/invites`, { method: "POST" }),
    revokeInvite: (coterieId: string, inviteId: string) => request<void>(`/coteries/${coterieId}/invites/${inviteId}`, { method: "DELETE" }),
    acceptInvite: (token: string) => request<AcceptCoterieInviteResponse>("/coterie-invites/accept", { method: "POST", body: { token } }),
    removePlayer: (coterieId: string, membershipId: string) => request<void>(`/coteries/${coterieId}/players/${membershipId}`, { method: "DELETE" }),
    getNotes: (coterieId: string) => request<CoterieNotesResponse>(`/coteries/${coterieId}/notes`),
    saveNotes: (coterieId: string, content: string) => request<SaveCoterieNotesResponse>(`/coteries/${coterieId}/notes`, { method: "PUT", body: { content } }),
    restoreNote: (coterieId: string, versionId: string) => request<SaveCoterieNotesResponse>(`/coteries/${coterieId}/notes/versions/${versionId}/restore`, { method: "POST" })
}
