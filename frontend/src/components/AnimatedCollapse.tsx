import { useEffect, useState } from "react"
import "./AnimatedCollapse.css"

type Props = {
    opened: boolean
    motionEnabled?: boolean
    children: React.ReactNode
}

const TRANSITION_DURATION_MS = 180

const AnimatedCollapse = ({ opened, motionEnabled = true, children }: Props) => {
    const [isMounted, setIsMounted] = useState(opened)
    const [isVisible, setIsVisible] = useState(opened)

    useEffect(() => {
        if (!motionEnabled) {
            setIsMounted(opened)
            setIsVisible(opened)
            return
        }

        if (opened) {
            setIsMounted(true)
            const frame = requestAnimationFrame(() => setIsVisible(true))
            return () => cancelAnimationFrame(frame)
        }

        setIsVisible(false)
        const timeout = window.setTimeout(() => setIsMounted(false), TRANSITION_DURATION_MS)
        return () => window.clearTimeout(timeout)
    }, [motionEnabled, opened])

    if (!isMounted) return null

    return (
        <div
            className={`animated-collapse${isVisible ? " animated-collapse--visible" : ""}${!motionEnabled ? " animated-collapse--instant" : ""}`}
            aria-hidden={!opened}
        >
            {children}
        </div>
    )
}

export default AnimatedCollapse
