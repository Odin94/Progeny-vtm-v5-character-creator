import {
    type CharacterNoteVersionResponse,
    type CharacterNotesResponse,
    type SaveCharacterNotesResponse,
    request
} from "../api"
import {
    characterApiResponseListSchema,
    characterApiResponseSchema,
    type CreateCharacterPayload,
    type UpdateCharacterPayload
} from "../characterApi"

export const characterHttp = {
    getAll: () => request("/characters").then(characterApiResponseListSchema.parse),
    get: (id: string) => request(`/characters/${id}`).then(characterApiResponseSchema.parse),
    create: (data: CreateCharacterPayload) => request("/characters", { method: "POST", body: data }).then(characterApiResponseSchema.parse),
    update: (id: string, data: UpdateCharacterPayload) => request(`/characters/${id}`, { method: "PUT", body: data }).then(characterApiResponseSchema.parse),
    remove: (id: string) => request<void>(`/characters/${id}`, { method: "DELETE" }),
    getNotes: (characterId: string) => request<CharacterNotesResponse>(`/characters/${characterId}/notes`),
    saveNotes: (characterId: string, content: string) => request<SaveCharacterNotesResponse>(`/characters/${characterId}/notes`, { method: "PUT", body: { content } }),
    restoreNote: (characterId: string, versionId: string) => request<SaveCharacterNotesResponse>(`/characters/${characterId}/notes/versions/${versionId}/restore`, { method: "POST" })
}
