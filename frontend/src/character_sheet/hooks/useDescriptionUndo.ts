import { useEffect, useRef, useState } from "react"

const HISTORY_DELAY_MS = 1000
const HISTORY_MAX_ENTRIES = 20

type DescriptionUndoOptions = {
    identity: string
    value: string
    onChange: (value: string) => void
}

export const useDescriptionUndo = ({ identity, value, onChange }: DescriptionUndoOptions) => {
    const [history, setHistory] = useState<string[]>([])
    const historyRef = useRef<string[]>([])
    const latest = useRef({ identity, value })
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimer = () => {
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = null
    }
    const updateHistory = (entries: string[]) => {
        historyRef.current = entries
        setHistory(entries)
    }

    useEffect(() => {
        // Local writes update latest before the field rerenders. A different value
        // comes from a document replacement or external edit, not this undo stack.
        if (latest.current.identity !== identity || latest.current.value !== value) {
            clearTimer()
            updateHistory([])
            latest.current = { identity, value }
        }
    }, [identity, value])

    useEffect(() => () => clearTimer(), [])

    const finishGroup = () => {
        clearTimer()
        // A burst that returns to its starting value should not create a step.
        if (historyRef.current.at(-1) === latest.current.value) {
            updateHistory(historyRef.current.slice(0, -1))
        }
    }

    const edit = (nextValue: string) => {
        if (latest.current.identity !== identity || nextValue === latest.current.value) return
        // Capture the pre-edit text immediately so deletion can be undone even
        // before the debounce expires. Subsequent keystrokes share this snapshot.
        if (timer.current === null) {
            updateHistory([...historyRef.current, latest.current.value].slice(-HISTORY_MAX_ENTRIES))
        }
        latest.current.value = nextValue
        clearTimer()
        timer.current = setTimeout(finishGroup, HISTORY_DELAY_MS)
        onChange(nextValue)
    }

    const undo = () => {
        if (latest.current.identity !== identity) return
        clearTimer()
        const entries = [...historyRef.current]
        while (entries.at(-1) === latest.current.value) entries.pop()
        const previous = entries.pop()
        updateHistory(entries)
        if (previous === undefined) return
        latest.current.value = previous
        onChange(previous)
    }

    return { onChange: edit, undo, finishGroup, canUndo: history.some((entry) => entry !== value) }
}
