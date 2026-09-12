import { nanoid } from "nanoid"
import {
    getNextNoteVersionCreatedAt,
    getPrivateNoteDuplicateVersionIdAfterUpdate,
    getPrivateNoteVersionIdsToPrune,
    getPrivateNoteWriteAction
} from "../utils/privateNotes.js"

export type NoteVersion = { id: string; content: string; createdAt: Date }

export type NoteWriter<Scope, Version extends NoteVersion> = {
    create(input: Scope & { userId: string; content: string; createdAt: Date; id: string }): Version
    update(id: string, content: string): Version
    remove(id: string): void
    listOldest(scope: Scope, userId: string): Array<Pick<Version, "id">>
}

export type VersionedNotesStore<Scope, Version extends NoteVersion> = {
    list(scope: Scope, userId: string): Promise<Version[]>
    find(scope: Scope, userId: string, versionId: string): Promise<Version | null>
    transaction<T>(work: (writer: NoteWriter<Scope, Version>) => T): T
}

const prune = <Scope, Version extends NoteVersion>(
    writer: NoteWriter<Scope, Version>,
    scope: Scope,
    userId: string
) => {
    for (const id of getPrivateNoteVersionIdsToPrune(writer.listOldest(scope, userId))) {
        writer.remove(id)
    }
}

export const loadVersionedNotes = async <Scope, Version extends NoteVersion>(
    store: VersionedNotesStore<Scope, Version>,
    scope: Scope,
    userId: string
) => store.list(scope, userId)

export const saveVersionedNotes = async <Scope, Version extends NoteVersion>(
    store: VersionedNotesStore<Scope, Version>,
    scope: Scope,
    userId: string,
    content: string
) => {
    const existingVersions = await store.list(scope, userId)
    const latestVersion = existingVersions[0]
    const writeAction = getPrivateNoteWriteAction({
        previousContent: latestVersion?.content,
        nextContent: content,
        latestCreatedAt: latestVersion?.createdAt
    })

    if (writeAction === "unchanged") {
        return { current: latestVersion ?? null, versions: existingVersions, createdNewVersion: false }
    }

    const createdNewVersion = writeAction === "create"
    const duplicateVersionId = createdNewVersion
        ? undefined
        : getPrivateNoteDuplicateVersionIdAfterUpdate(content, existingVersions[1])

    const current = store.transaction((writer) => {
        if (createdNewVersion) {
            const created = writer.create({
                ...scope,
                id: nanoid(),
                userId,
                content,
                createdAt: getNextNoteVersionCreatedAt(latestVersion?.createdAt)
            })
            prune(writer, scope, userId)
            return created
        }

        const updated = writer.update(latestVersion!.id, content)
        if (duplicateVersionId) writer.remove(duplicateVersionId)
        return updated
    })

    return { current, versions: await store.list(scope, userId), createdNewVersion }
}

export const restoreVersionedNotes = async <Scope, Version extends NoteVersion>(
    store: VersionedNotesStore<Scope, Version>,
    scope: Scope,
    userId: string,
    versionId: string
) => {
    const versionToRestore = await store.find(scope, userId, versionId)
    if (!versionToRestore) return null

    const existingVersions = await store.list(scope, userId)
    const latestVersion = existingVersions[0]
    if (latestVersion?.content === versionToRestore.content) {
        return { current: latestVersion, versions: existingVersions, createdNewVersion: false }
    }

    const current = store.transaction((writer) => {
        const created = writer.create({
            ...scope,
            id: nanoid(),
            userId,
            content: versionToRestore.content,
            createdAt: getNextNoteVersionCreatedAt(latestVersion?.createdAt)
        })
        prune(writer, scope, userId)
        return created
    })

    return { current, versions: await store.list(scope, userId), createdNewVersion: true }
}
