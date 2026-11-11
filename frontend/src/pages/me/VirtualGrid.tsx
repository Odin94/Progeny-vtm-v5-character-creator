import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import classes from "./me.module.css"

type VirtualGridProps<T> = {
    items: T[]
    /** Fixed height of every cell, in px. */
    itemHeight: number
    gap: number
    minColumnWidth: number
    getKey: (item: T) => string
    renderItem: (item: T) => ReactNode
    /** Rows rendered beyond the viewport on each side — keeps fast scrolling from showing gaps. */
    overscan?: number
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

const columnsFor = (width: number, minColumnWidth: number, gap: number) =>
    Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)))

/**
 * Window-scrolled, row-virtualized grid for long card lists. Uses the same column maths as the
 * CSS `auto-fill` grid so switching between the two never changes the layout. Rows are real DOM
 * (no canvas, no blur), so fast flicks stay crisp; only rows near the viewport are mounted.
 */
export function VirtualGrid<T>({
    items,
    itemHeight,
    gap,
    minColumnWidth,
    getKey,
    renderItem,
    overscan = 3
}: VirtualGridProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [range, setRange] = useState({ start: 0, end: 8 })
    const columns = width ? columnsFor(width, minColumnWidth, gap) : 1
    const rowCount = Math.ceil(items.length / columns)
    const stride = itemHeight + gap

    useIsomorphicLayoutEffect(() => {
        const element = containerRef.current
        if (!element) return
        setWidth(element.clientWidth)
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const element = containerRef.current
        if (!element) return
        let frame = 0
        const measure = () => {
            frame = 0
            const top = -element.getBoundingClientRect().top
            const viewport = window.innerHeight
            const start = Math.max(0, Math.floor(top / stride) - overscan)
            const end = Math.min(rowCount, Math.ceil((top + viewport) / stride) + overscan)
            setRange((previous) =>
                previous.start === start && previous.end === end ? previous : { start, end }
            )
        }
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure)
        }
        measure()
        window.addEventListener("scroll", schedule, { passive: true })
        window.addEventListener("resize", schedule)
        return () => {
            if (frame) cancelAnimationFrame(frame)
            window.removeEventListener("scroll", schedule)
            window.removeEventListener("resize", schedule)
        }
    }, [overscan, rowCount, stride])

    const rows: ReactNode[] = []
    for (let row = range.start; row < Math.min(range.end, rowCount); row++) {
        const slice = items.slice(row * columns, row * columns + columns)
        rows.push(
            <div
                key={row}
                role="presentation"
                className={classes.virtualRow}
                style={{
                    transform: `translateY(${row * stride}px)`,
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                }}
            >
                {slice.map((item) => (
                    <div key={getKey(item)} role="listitem">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="list"
            className={classes.virtualGrid}
            style={{ height: Math.max(0, rowCount * stride - gap) }}
        >
            {rows}
        </div>
    )
}
