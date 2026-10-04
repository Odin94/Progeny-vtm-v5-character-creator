import { Box, Menu } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { useEffect, useRef, useState, type RefObject } from "react"
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
    onRemoveDie: (id: number) => void
}
export default function ThreeDice(props: Props) {
    const host = useRef<HTMLDivElement>(null)
    const renderer = useRef<PageDiceRenderer | null>(null)
    const latest = useRef(props)
    latest.current = props
    const [context, setContext] = useState<{ id: number; x: number; y: number } | null>(null)
    useEffect(() => {
        const element = host.current!
        const unavailable = () => latest.current.onUnavailable()
        try {
            renderer.current = new PageDiceRenderer(
                element,
                (id, blood) => latest.current.onDieClick(id, blood),
                (id, position) => {
                    if (!latest.current.dice.some((die) => die.isRolling))
                        setContext({ id, ...position })
                }
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
            // Desktop uses the full page, excluding only the controls rectangle.
            // Mobile keeps a full-width arena above its bottom controls.
            Object.assign(host.current.style, {
                right: "8px",
                bottom: props.isMobile ? `${window.innerHeight - rect.top + 24}px` : "8px"
            })
            const arena = host.current.getBoundingClientRect()
            renderer.current?.setControlsBounds(
                props.isMobile
                    ? undefined
                    : {
                          left: rect.left - arena.left - 12,
                          top: rect.top - arena.top - 28,
                          right: rect.right - arena.left + 12,
                          bottom: rect.bottom - arena.top + 12
                      }
            )
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
        } else renderer.current?.clear()
        return () => {
            active = false
        }
    }, [props.dice, props.style, props.settings])
    useEffect(() => {
        if (
            context &&
            (props.dice.some((die) => die.isRolling) ||
                !props.dice.some((die) => die.id === context.id))
        )
            setContext(null)
    }, [props.dice, context])
    useEffect(() => {
        renderer.current?.select(props.selectedDiceIds, props.canSelect)
    }, [props.selectedDiceIds, props.canSelect, props.dice])
    return (
        <>
            {createPortal(
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
            )}
            <Menu
                opened={!!context}
                onChange={(opened) => {
                    if (!opened) setContext(null)
                }}
                position="bottom-start"
                zIndex={3100}
                withinPortal
            >
                <Menu.Target>
                    <Box
                        aria-hidden="true"
                        style={{
                            position: "fixed",
                            left: context?.x ?? 0,
                            top: context?.y ?? 0,
                            width: 1,
                            height: 1,
                            pointerEvents: "none"
                        }}
                    />
                </Menu.Target>
                <Menu.Dropdown aria-label="Die actions" aria-labelledby="">
                    <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                            if (context) latest.current.onRemoveDie(context.id)
                            setContext(null)
                        }}
                    >
                        Remove die
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </>
    )
}
