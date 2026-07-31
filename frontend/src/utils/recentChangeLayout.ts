export const RECENT_CHANGE_COLUMN_SEPARATOR = "\n\n<!-- progeny-update-column -->\n\n"

const splitMarkdownBlocks = (markdown: string) =>
    markdown
        .trim()
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)

export const splitRecentChangeLayout = (body: string) => {
    if (body.includes(RECENT_CHANGE_COLUMN_SEPARATOR)) {
        const [topSection = "", ...columns] = body
            .split(RECENT_CHANGE_COLUMN_SEPARATOR)
            .map((section) => section.trim())
        const lastPopulatedColumn = columns.findLastIndex(Boolean)

        return {
            topSection,
            columns: columns.slice(0, lastPopulatedColumn + 1)
        }
    }

    const [topSection = "", ...detailBlocks] = splitMarkdownBlocks(body)
    const columnCount = Math.min(3, detailBlocks.length)
    const columns = Array.from({ length: columnCount }, () => [] as string[])

    detailBlocks.forEach((block, index) => columns[index % columnCount].push(block))

    return {
        topSection,
        columns: columns.map((column) => column.join("\n\n"))
    }
}

export const composeRecentChangeBody = (topSection: string, columns: string[]) => {
    const lastPopulatedColumn = columns.findLastIndex((column) => column.trim())

    if (lastPopulatedColumn < 0) return topSection.trim()

    return [
        topSection.trim(),
        ...columns.slice(0, lastPopulatedColumn + 1).map((column) => column.trim())
    ].join(RECENT_CHANGE_COLUMN_SEPARATOR)
}
