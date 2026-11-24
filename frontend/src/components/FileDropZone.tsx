import { IconUpload } from "@tabler/icons-react"
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react"
import classes from "./FileDropZone.module.css"

type FileDropZoneProps = {
    /** Called with the dropped, pasted or picked file. */
    onFile: (file: File) => void
    /** `accept` attribute for the picker, e.g. "application/json" or "image/png,image/jpeg". */
    accept?: string
    /** Accept text pasted from the clipboard and turn it into a file (e.g. raw JSON). */
    textToFile?: (text: string) => File | null
    /** Listen for ⌘V / Ctrl+V anywhere on the page while mounted (e.g. inside a modal). */
    listenToPaste?: boolean
    title: ReactNode
    hint?: ReactNode
    icon?: ReactNode
    disabled?: boolean
    className?: string
    "aria-label"?: string
}

const matchesAccept = (file: File, accept?: string) => {
    if (!accept) return true
    const name = file.name.toLowerCase()
    return accept
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .some((entry) =>
            entry.startsWith(".")
                ? name.endsWith(entry)
                : entry.endsWith("/*")
                  ? file.type.startsWith(entry.slice(0, -1))
                  : file.type === entry || (entry === "application/json" && name.endsWith(".json"))
        )
}

/**
 * Click-to-pick file target that also accepts drag & drop and clipboard paste.
 * Files that don't match `accept` are ignored.
 */
const FileDropZone = ({
    onFile,
    accept,
    textToFile,
    listenToPaste = false,
    title,
    hint,
    icon,
    disabled = false,
    className,
    "aria-label": ariaLabel
}: FileDropZoneProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const dragDepth = useRef(0)
    const onFileRef = useRef(onFile)
    onFileRef.current = onFile
    const textToFileRef = useRef(textToFile)
    textToFileRef.current = textToFile

    useEffect(() => {
        if (!listenToPaste || disabled) return
        const onPaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement | null
            // Leave normal text fields alone.
            if (
                target &&
                (target.isContentEditable ||
                    ((target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
                        !(target as HTMLInputElement).readOnly))
            )
                return
            const file = Array.from(event.clipboardData?.files ?? []).find((candidate) =>
                matchesAccept(candidate, accept)
            )
            if (file) {
                event.preventDefault()
                onFileRef.current(file)
                return
            }
            const text = event.clipboardData?.getData("text/plain")
            const fromText = text ? textToFileRef.current?.(text) : null
            if (fromText) {
                event.preventDefault()
                onFileRef.current(fromText)
            }
        }
        window.addEventListener("paste", onPaste)
        return () => window.removeEventListener("paste", onPaste)
    }, [accept, disabled, listenToPaste])

    const takeFirst = (files: FileList | null | undefined) => {
        const file = Array.from(files ?? []).find((candidate) => matchesAccept(candidate, accept))
        if (file) onFileRef.current(file)
    }

    const stop = (event: DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    return (
        <>
            <button
                type="button"
                className={[classes.zone, className].filter(Boolean).join(" ")}
                data-dragging={dragging || undefined}
                data-disabled={disabled || undefined}
                aria-disabled={disabled || undefined}
                aria-label={ariaLabel}
                onClick={() => {
                    if (!disabled) inputRef.current?.click()
                }}
                onDragEnter={(event) => {
                    stop(event)
                    if (disabled) return
                    dragDepth.current += 1
                    setDragging(true)
                }}
                onDragOver={(event) => {
                    stop(event)
                    if (!disabled) event.dataTransfer.dropEffect = "copy"
                }}
                onDragLeave={(event) => {
                    stop(event)
                    dragDepth.current = Math.max(0, dragDepth.current - 1)
                    if (dragDepth.current === 0) setDragging(false)
                }}
                onDrop={(event) => {
                    stop(event)
                    dragDepth.current = 0
                    setDragging(false)
                    if (!disabled) takeFirst(event.dataTransfer.files)
                }}
            >
                <span className={classes.icon} aria-hidden="true">
                    {icon ?? <IconUpload size={18} stroke={1.6} />}
                </span>
                <span className={classes.text}>
                    <span className={classes.title}>{title}</span>
                    {hint ? <span className={classes.hint}>{hint}</span> : null}
                </span>
            </button>
            <input
                ref={inputRef}
                className={classes.input}
                type="file"
                accept={accept}
                tabIndex={-1}
                onChange={(event) => {
                    takeFirst(event.currentTarget.files)
                    event.currentTarget.value = ""
                }}
            />
        </>
    )
}

export default FileDropZone
