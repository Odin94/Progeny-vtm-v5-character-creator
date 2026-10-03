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
    create: (data: { name: string }) =>
        request<CoterieResponse>("/coteries", { method: "POST", body: data }),
    update: (id: string, data: { name?: string }) =>
        request<CoterieResponse>(`/coteries/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<void>(`/coteries/${id}`, { method: "DELETE" }),
    addCharacter: (coterieId: string, characterId: string, isCurrentSession?: () => boolean) =>
        request(`/coteries/${coterieId}/characters`, {
            method: "POST",
            body: { characterId },
            isCurrentSession
        }),
    removeCharacter: (coterieId: string, characterId: string, isCurrentSession?: () => boolean) =>
        request<void>(`/coteries/${coterieId}/characters/${characterId}`, {
            method: "DELETE",
            isCurrentSession
        }),
    getInvites: (coterieId: string) =>
        request<CoterieInviteResponse[]>(`/coteries/${coterieId}/invites`),
    createInvite: (coterieId: string, isCurrentSession?: () => boolean) =>
        request<CreatedCoterieInviteResponse>(`/coteries/${coterieId}/invites`, {
            method: "POST",
            isCurrentSession
        }),
    revokeInvite: (coterieId: string, inviteId: string, isCurrentSession?: () => boolean) =>
        request<void>(`/coteries/${coterieId}/invites/${inviteId}`, {
            method: "DELETE",
            isCurrentSession
        }),
    acceptInvite: (token: string, isCurrentSession?: () => boolean) =>
        request<AcceptCoterieInviteResponse>("/coterie-invites/accept", {
            method: "POST",
            body: { token },
            isCurrentSession
        }),
    removePlayer: (coterieId: string, membershipId: string, isCurrentSession?: () => boolean) =>
        request<void>(`/coteries/${coterieId}/players/${membershipId}`, {
            method: "DELETE",
            isCurrentSession
        }),
    getNotes: (coterieId: string) => request<CoterieNotesResponse>(`/coteries/${coterieId}/notes`),
    saveNotes: (coterieId: string, content: string) =>
        request<SaveCoterieNotesResponse>(`/coteries/${coterieId}/notes`, {
            method: "PUT",
            body: { content }
        }),
    restoreNote: (coterieId: string, versionId: string) =>
        request<SaveCoterieNotesResponse>(
            `/coteries/${coterieId}/notes/versions/${versionId}/restore`,
            { method: "POST" }
        )
}
