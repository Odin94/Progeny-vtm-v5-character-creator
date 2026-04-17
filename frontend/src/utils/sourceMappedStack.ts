import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping"

type ParsedStackFrame = {
    functionName?: string
    url: string
    line: number
    column: number
    raw: string
}

export type SourceMappedFrame = {
    functionName?: string
    generatedLocation: string
    originalLocation: string
    sourceExcerpt?: string
}

export type SourceMappedStack = {
    name: string
    message: string
    frames: SourceMappedFrame[]
    rawStack: string
}

type LoadedSourceMap = {
    traceMap: TraceMap
    sources: string[]
    sourcesContent: Array<string | null | undefined>
}

const sourceMapCache = new Map<string, Promise<LoadedSourceMap | null>>()

const STACK_PATTERNS = [
    /^\s*at (?<functionName>.+?) \((?<url>.+):(?<line>\d+):(?<column>\d+)\)\s*$/u,
    /^\s*at (?<url>.+):(?<line>\d+):(?<column>\d+)\s*$/u,
]

const SOURCE_MAPPING_URL_PATTERN = /\/\/# sourceMappingURL=(?<sourceMap>.+)\s*$/mu

const formatLocation = (source: string, line: number, column: number) => `${source}:${line}:${column}`

const parseStackFrame = (line: string): ParsedStackFrame | null => {
    for (const pattern of STACK_PATTERNS) {
        const match = pattern.exec(line)
        if (!match?.groups?.url || !match.groups.line || !match.groups.column) {
            continue
        }

        const lineNumber = Number.parseInt(match.groups.line, 10)
        const columnNumber = Number.parseInt(match.groups.column, 10)
        if (Number.isNaN(lineNumber) || Number.isNaN(columnNumber)) {
            return null
        }

        return {
            functionName: match.groups.functionName?.trim(),
            url: match.groups.url,
            line: lineNumber,
            column: columnNumber,
            raw: line.trim(),
        }
    }

    return null
}

const resolveSourceMapUrl = (scriptUrl: string, scriptContents: string) => {
    const match = SOURCE_MAPPING_URL_PATTERN.exec(scriptContents)
    const sourceMapReference = match?.groups?.sourceMap?.trim()
    if (!sourceMapReference) {
        return null
    }

    return new URL(sourceMapReference, scriptUrl).href
}

const loadSourceMap = async (scriptUrl: string) => {
    const cached = sourceMapCache.get(scriptUrl)
    if (cached) {
        return cached
    }

    const pending = (async () => {
        try {
            const scriptResponse = await fetch(scriptUrl)
            if (!scriptResponse.ok) {
                return null
            }

            const scriptContents = await scriptResponse.text()
            const sourceMapUrl = resolveSourceMapUrl(scriptUrl, scriptContents)
            if (!sourceMapUrl) {
                return null
            }

            const sourceMapResponse = await fetch(sourceMapUrl)
            if (!sourceMapResponse.ok) {
                return null
            }

            const rawSourceMap = (await sourceMapResponse.json()) as {
                sources?: string[]
                sourcesContent?: Array<string | null>
            }

            return {
                traceMap: new TraceMap(rawSourceMap as ConstructorParameters<typeof TraceMap>[0]),
                sources: rawSourceMap.sources ?? [],
                sourcesContent: rawSourceMap.sourcesContent ?? [],
            }
        } catch (_error) {
            return null
        }
    })()

    sourceMapCache.set(scriptUrl, pending)
    return pending
}

const getSourceExcerpt = (sourceContent: string | null | undefined, lineNumber: number) => {
    if (!sourceContent) {
        return undefined
    }

    const lines = sourceContent.split(/\r?\n/u)
    const startLine = Math.max(lineNumber - 2, 1)
    const endLine = Math.min(lineNumber + 2, lines.length)

    return lines
        .slice(startLine - 1, endLine)
        .map((line, index) => {
            const currentLineNumber = startLine + index
            const marker = currentLineNumber === lineNumber ? ">" : " "
            return `${marker} ${currentLineNumber.toString().padStart(4, " ")} | ${line}`
        })
        .join("\n")
}

const mapStackFrame = async (frame: ParsedStackFrame): Promise<SourceMappedFrame> => {
    const generatedLocation = formatLocation(frame.url, frame.line, frame.column)
    const loadedSourceMap = await loadSourceMap(frame.url)

    if (!loadedSourceMap) {
        return {
            functionName: frame.functionName,
            generatedLocation,
            originalLocation: generatedLocation,
        }
    }

    const originalPosition = originalPositionFor(loadedSourceMap.traceMap, {
        line: frame.line,
        column: frame.column - 1,
    })

    if (!originalPosition.source || originalPosition.line == null || originalPosition.column == null) {
        return {
            functionName: frame.functionName,
            generatedLocation,
            originalLocation: generatedLocation,
        }
    }

    const sourceIndex = loadedSourceMap.sources.findIndex((source) => source === originalPosition.source)
    const sourceExcerpt = sourceIndex >= 0 ? getSourceExcerpt(loadedSourceMap.sourcesContent[sourceIndex], originalPosition.line) : undefined

    return {
        functionName: frame.functionName,
        generatedLocation,
        originalLocation: formatLocation(originalPosition.source, originalPosition.line, originalPosition.column + 1),
        sourceExcerpt,
    }
}

export const getSourceMappedStack = async (error: Error): Promise<SourceMappedStack | null> => {
    if (!error.stack) {
        return null
    }

    const stackLines = error.stack.split("\n")
    const parsedFrames = stackLines.map(parseStackFrame).filter((frame): frame is ParsedStackFrame => frame !== null)

    if (parsedFrames.length === 0) {
        return {
            name: error.name,
            message: error.message,
            frames: [],
            rawStack: error.stack,
        }
    }

    const frames = await Promise.all(parsedFrames.slice(0, 8).map(mapStackFrame))

    return {
        name: error.name,
        message: error.message,
        frames,
        rawStack: error.stack,
    }
}
