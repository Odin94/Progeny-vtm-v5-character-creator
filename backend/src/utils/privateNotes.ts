import { Buffer } from "node:buffer"

export const NOTE_MAX_BYTES = 200 * 1024
export const NOTE_VERSION_LIMIT = 10
export const NOTE_VERSION_SPLIT_MS = 60 * 60 * 1000

const NOTE_SUBSTANTIAL_MIN_CHANGED_WORDS = 4
const NOTE_SUBSTANTIAL_MIN_CHANGED_CHARS = 24

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
