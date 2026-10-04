/** Let controls paint before preparing WebGL during a quiet browser task. */
export function scheduleDiceWarmup(prepare: () => void) {
    let frame = 0
    let idle: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    const run = () => {
        if (!cancelled) prepare()
    }
    frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
            if (typeof window.requestIdleCallback === "function") {
                idle = window.requestIdleCallback(run, { timeout: 300 })
            } else timer = setTimeout(run, 0)
        })
    })
    return () => {
        cancelled = true
        cancelAnimationFrame(frame)
        if (idle !== undefined) window.cancelIdleCallback(idle)
        if (timer !== undefined) clearTimeout(timer)
    }
}
