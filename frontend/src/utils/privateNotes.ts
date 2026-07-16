export const getPrivateNoteWordCount = (content: string) =>
    content.match(/[\p{L}\p{N}']+/gu)?.length ?? 0

export const formatPrivateNoteWordCount = (content: string) => {
    const wordCount = getPrivateNoteWordCount(content)
    return `${wordCount} ${wordCount === 1 ? "word" : "words"}`
}
