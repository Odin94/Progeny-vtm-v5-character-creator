import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react"

type RenderProfilerProps = {
    id: string
    children: ReactNode
}

export type RenderProfileSample = {
    id: string
    phase: "mount" | "update" | "nested-update"
    actualDuration: number
    baseDuration: number
    startTime: number
    commitTime: number
}

declare global {
    interface Window {
        __PROGENY_REACT_PROFILER__?: RenderProfileSample[]
    }
}

const PROFILER_STORAGE_KEY = "progenyReactProfiler"
const MAX_PROFILE_SAMPLES = 200
const SLOW_RENDER_THRESHOLD_MS = 16

const getBooleanPreference = (value: string | null) => {
    if (value === "1" || value === "true") {
        return true
    }

    if (value === "0" || value === "false") {
        return false
    }

    return null
}

const getBrowserProfilerPreference = () => {
    if (typeof window === "undefined") {
        return null
    }

    const queryPreference = getBooleanPreference(
        new URLSearchParams(window.location.search).get("profiler")
    )

    if (queryPreference !== null) {
        window.localStorage.setItem(PROFILER_STORAGE_KEY, String(queryPreference))
        return queryPreference
    }

    return getBooleanPreference(window.localStorage.getItem(PROFILER_STORAGE_KEY))
}

export const isRenderProfilerEnabled = () => {
    const envPreference = getBooleanPreference(import.meta.env.VITE_REACT_PROFILER ?? null)

    if (envPreference !== null) {
        return envPreference
    }

    return getBrowserProfilerPreference() ?? import.meta.env.DEV
}

const recordProfileSample = (sample: RenderProfileSample) => {
    if (typeof window === "undefined") {
        return
    }

    const samples = window.__PROGENY_REACT_PROFILER__ ?? []
    samples.push(sample)

    if (samples.length > MAX_PROFILE_SAMPLES) {
        samples.splice(0, samples.length - MAX_PROFILE_SAMPLES)
    }

    window.__PROGENY_REACT_PROFILER__ = samples
}

const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
) => {
    const sample: RenderProfileSample = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime
    }
    recordProfileSample(sample)

    const message = `[React Profiler] ${id} ${phase}: ${actualDuration.toFixed(2)}ms`
    const details = {
        actualDuration,
        baseDuration,
        startTime,
        commitTime
    }

    if (actualDuration > SLOW_RENDER_THRESHOLD_MS) {
        console.warn(message, details)
    } else {
        console.debug(message, details)
    }
}

export default function RenderProfiler({ id, children }: RenderProfilerProps) {
    if (!isRenderProfilerEnabled()) {
        return <>{children}</>
    }

    return (
        <Profiler id={id} onRender={handleRender}>
            {children}
        </Profiler>
    )
}
