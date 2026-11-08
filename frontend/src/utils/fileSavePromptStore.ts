import { useSyncExternalStore } from "react"
import type { DownloadTracker } from "./downloadAnalytics"

type SavePrompt = {
    id: number
    file: File
    url: string
    canShare: boolean
    track: DownloadTracker
    trigger: HTMLElement | null
}
let prompts: SavePrompt[] = []
let nextId = 0
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
const snapshot = () => prompts
const publish = () => {
    for (const listener of listeners) listener()
}
export const useFileSavePrompts = () => useSyncExternalStore(subscribe, snapshot, snapshot)
export const useFileSavePromptOpen = () => useFileSavePrompts().length > 0

export const showFileSavePrompt = (file: File, canShare: boolean, track: DownloadTracker) => {
    const url = URL.createObjectURL(file)
    try {
        prompts = [
            ...prompts,
            {
                id: ++nextId,
                file,
                url,
                canShare,
                track,
                trigger:
                    document.activeElement instanceof HTMLElement ? document.activeElement : null
            }
        ]
        publish()
        track("prompt_shown", { stage: "prompt", method: "prompt", file_share_supported: canShare })
    } catch (error) {
        prompts = prompts.filter((prompt) => prompt.url !== url)
        URL.revokeObjectURL(url)
        throw error
    }
}

export const dismissFileSavePrompt = (id: number) => {
    const prompt = prompts.find((item) => item.id === id)
    if (!prompt) return
    prompts = prompts.filter((item) => item.id !== id)
    publish()
    prompt.track("dismissed", { stage: "prompt", method: "prompt" })
    // A separately opened viewer may still be consuming this Blob.
    setTimeout(() => URL.revokeObjectURL(prompt.url), 60_000)
}

export const dismissFileSavePrompts = () => {
    for (const prompt of prompts) dismissFileSavePrompt(prompt.id)
}
