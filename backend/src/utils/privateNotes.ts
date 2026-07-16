import { Buffer } from "node:buffer"

export const NOTE_MAX_BYTES = 200 * 1024
export const NOTE_HISTORY_LIMIT = 10
export const NOTE_VERSION_LIMIT = NOTE_HISTORY_LIMIT + 1
export const NOTE_VERSION_SPLIT_MS = 60 * 60 * 1000

const NOTE_SUBSTANTIAL_MIN_CHANGED_WORDS = 4
const NOTE_SUBSTANTIAL_MIN_CHANGED_CHARS = 24
const NOTE_DESTRUCTIVE_MIN_REMOVED_CHARS = 100
const NOTE_DESTRUCTIVE_MIN_CHANGED_CHARS = 24
const NOTE_DESTRUCTIVE_MIN_CHANGED_RATIO = 0.2

export type PrivateNoteWriteAction = "create" | "update" | "unchanged"

export const getUtf8ByteLength = (value: string) => Buffer.byteLength(value, "utf8")

export const getNextNoteVersionCreatedAt = (latestCreatedAt?: Date) =>
    new Date(Math.max(Date.now(), (latestCreatedAt?.getTime() ?? 0) + 1000))

const tokenizeNoteWords = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []

const getMultisetWordDelta = (previous: string, next: string) => {
    const counts = new Map<string, number>()

    for (const word of tokenizeNoteWords(previous)) {
        counts.set(word, (counts.get(word) ?? 0) + 1)
    }

    for (const word of tokenizeNoteWords(next)) {
        counts.set(word, (counts.get(word) ?? 0) - 1)
    }

    let changedWords = 0
    for (const count of counts.values()) {
        changedWords += Math.abs(count)
    }

    return changedWords
}

export const isSubstantialNoteEdit = (previous: string, next: string) => {
    const normalizedPrevious = previous.trim().replace(/\s+/g, " ")
    const normalizedNext = next.trim().replace(/\s+/g, " ")

    if (normalizedPrevious === normalizedNext) {
        return false
    }

    const changedWords = getMultisetWordDelta(normalizedPrevious, normalizedNext)
    const changedChars = Math.abs(normalizedNext.length - normalizedPrevious.length)

    return (
        changedWords >= NOTE_SUBSTANTIAL_MIN_CHANGED_WORDS ||
        changedChars >= NOTE_SUBSTANTIAL_MIN_CHANGED_CHARS
    )
}

const getChangedSpan = (previous: string, next: string) => {
    let prefixLength = 0
    const sharedLength = Math.min(previous.length, next.length)

    while (prefixLength < sharedLength && previous[prefixLength] === next[prefixLength]) {
        prefixLength += 1
    }

    let suffixLength = 0
    while (
        suffixLength < previous.length - prefixLength &&
        suffixLength < next.length - prefixLength &&
        previous[previous.length - suffixLength - 1] === next[next.length - suffixLength - 1]
    ) {
        suffixLength += 1
    }

    return {
        removedChars: previous.length - prefixLength - suffixLength,
        insertedChars: next.length - prefixLength - suffixLength
    }
}

export const isDestructiveNoteEdit = (previous: string, next: string) => {
    const previousTrimmed = previous.trim()
    const nextTrimmed = next.trim()

    if (!previousTrimmed || previous === next) {
        return false
    }

    if (!nextTrimmed) {
        return true
    }

    const { removedChars } = getChangedSpan(previous, next)
    const netRemovedChars = Math.max(0, previous.length - next.length)
    const changedRatio = removedChars / previous.length

    return (
        netRemovedChars >= NOTE_DESTRUCTIVE_MIN_REMOVED_CHARS ||
        (removedChars >= NOTE_DESTRUCTIVE_MIN_CHANGED_CHARS &&
            changedRatio >= NOTE_DESTRUCTIVE_MIN_CHANGED_RATIO)
    )
}

export const getPrivateNoteWriteAction = ({
    previousContent,
    nextContent,
    latestCreatedAt,
    now = Date.now()
}: {
    previousContent?: string
    nextContent: string
    latestCreatedAt?: Date
    now?: number
}): PrivateNoteWriteAction => {
    if (previousContent === undefined) {
        return "create"
    }

    if (previousContent === nextContent) {
        return "unchanged"
    }

    if (isDestructiveNoteEdit(previousContent, nextContent)) {
        return "create"
    }

    const isOldEnoughForPeriodicSnapshot =
        latestCreatedAt !== undefined && now - latestCreatedAt.getTime() >= NOTE_VERSION_SPLIT_MS

    return isOldEnoughForPeriodicSnapshot && isSubstantialNoteEdit(previousContent, nextContent)
        ? "create"
        : "update"
}

export const getPrivateNoteDuplicateVersionIdAfterUpdate = <T extends {
    id: string
    content: string
}>(nextContent: string, previousHistoricalVersion?: T) =>
    previousHistoricalVersion?.content === nextContent ? previousHistoricalVersion.id : undefined

export const getPrivateNoteVersionIdsToPrune = <T extends { id: string }>(
    versionsOldestFirst: T[]
) =>
    versionsOldestFirst
        .slice(0, Math.max(0, versionsOldestFirst.length - NOTE_VERSION_LIMIT))
        .map(({ id }) => id)
