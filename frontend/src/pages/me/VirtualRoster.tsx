import { useEffect, useRef, useState, type ReactNode } from "react"
import classes from "./me.module.css"

type VirtualRosterProps<T> = {
    items: T[]
    /** Fixed height of each entry in pixels. */
    itemHeight: number
    getKey: (item: T) => string
    renderItem: (item: T) => ReactNode
    /** Rows rendered beyond the viewport on each side — keeps fast scrolling from showing gaps. */
    overscan?: number
}

/** Window-scrolled roster. Keep a few extra entries mounted during fast scrolling. */
export function VirtualRoster<T>({
    items,
    itemHeight,
    getKey,
    renderItem,
    overscan = 3
}: VirtualRosterProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [range, setRange] = useState({ start: 0, end: 8 })
    const rowCount = items.length

    useEffect(() => {
        const element = containerRef.current
        if (!element) return
        let frame = 0
        const measure = () => {
            frame = 0
            const top = -element.getBoundingClientRect().top
            const viewport = window.innerHeight
            const start = Math.max(0, Math.floor(top / itemHeight) - overscan)
            const end = Math.min(rowCount, Math.ceil((top + viewport) / itemHeight) + overscan)
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
    }, [itemHeight, overscan, rowCount])

    return (
        <div
            ref={containerRef}
            role="list"
            className={classes.virtualRoster}
            style={{ height: rowCount * itemHeight }}
        >
            {items.slice(range.start, range.end).map((item, index) => (
                <div
                    key={getKey(item)}
                    role="listitem"
                    className={classes.virtualRow}
                    aria-setsize={rowCount}
                    aria-posinset={range.start + index + 1}
                    style={{ top: (range.start + index) * itemHeight }}
                >
                    {renderItem(item)}
                </div>
            ))}
        </div>
    )
}
