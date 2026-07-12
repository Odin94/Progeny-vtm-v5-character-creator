import { useEffect, useRef, useState } from "react"

export const useProgressiveRendering = (
    itemCount: number,
    initialCount: number,
    batchSize: number
) => {
    const [visibleCount, setVisibleCount] = useState(() => Math.min(initialCount, itemCount))
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setVisibleCount(Math.min(initialCount, itemCount))
    }, [initialCount, itemCount])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || visibleCount >= itemCount) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount((current) => Math.min(current + batchSize, itemCount))
                }
            },
            { rootMargin: "500px 0px" }
        )
        observer.observe(sentinel)

        return () => observer.disconnect()
    }, [batchSize, itemCount, visibleCount])

    return { visibleCount, sentinelRef }
}
