import { useEffect, useRef, type RefObject } from "react"
import { createPortal } from "react-dom"
import type { DieResult } from "../parts/DiceContainer"
import { PageDiceRenderer } from "./page-dice-renderer"
import type { VampireDiceStyle, VampireThrowSettings } from "./settings"

type Props = {
    dice: DieResult[]
    style: VampireDiceStyle
    settings: VampireThrowSettings
    controls: RefObject<HTMLDivElement | null>
    isMobile: boolean
    selectedDiceIds: Set<number>
    canSelect: boolean
    onDieClick: (id: number, isBloodDie: boolean) => void
    onComplete: (dice: DieResult[]) => void
    onUnavailable: () => void
}
export default function ThreeDice(props: Props) {
    const host = useRef<HTMLDivElement>(null)
    const renderer = useRef<PageDiceRenderer | null>(null)
    const latest = useRef(props)
    latest.current = props
    useEffect(() => {
        const element = host.current!
        const unavailable = () => latest.current.onUnavailable()
        try {
            renderer.current = new PageDiceRenderer(element, (id, blood) =>
                latest.current.onDieClick(id, blood)
            )
        } catch {
            unavailable()
            return
        }
        element.addEventListener("dice-renderer-unavailable", unavailable)
        return () => {
            element.removeEventListener("dice-renderer-unavailable", unavailable)
            renderer.current?.dispose()
            renderer.current = null
        }
    }, [])
    useEffect(() => {
        const update = () => {
            if (!host.current || !props.controls.current) return
            const rect = props.controls.current.getBoundingClientRect()
            // The dice arena stops before the controls. Its real bounds are used
            // for physics containment, so settled dice cannot hide under them.
            Object.assign(host.current.style, {
                right: props.isMobile ? "8px" : `${window.innerWidth - rect.left + 12}px`,
                bottom: props.isMobile ? `${window.innerHeight - rect.top + 8}px` : "8px"
            })
        }
        update()
        const observer = new ResizeObserver(update)
        if (props.controls.current) observer.observe(props.controls.current)
        window.addEventListener("resize", update)
        window.visualViewport?.addEventListener("resize", update)
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", update)
            window.visualViewport?.removeEventListener("resize", update)
        }
    }, [props.controls, props.isMobile])
    useEffect(() => {
        let active = true
        if (props.dice.length) {
            renderer.current
                ?.roll(props.dice, props.style, props.settings, (dice) => {
                    if (active) latest.current.onComplete(dice)
                })
                .catch(() => {
                    if (active) latest.current.onUnavailable()
                })
        }
        return () => {
            active = false
        }
    }, [props.dice, props.style, props.settings])
    useEffect(() => {
        renderer.current?.select(props.selectedDiceIds, props.canSelect)
    }, [props.selectedDiceIds, props.canSelect, props.dice])
    return createPortal(
        <div
            ref={host}
            data-testid="vampire-dice-arena"
            style={{
                position: "fixed",
                left: 8,
                top: 8,
                right: 8,
                bottom: 8,
                zIndex: 1998,
                pointerEvents: "none"
            }}
        />,
        document.body
    )
}
