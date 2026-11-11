import { Menu, Portal, type MantineColor } from "@mantine/core"
import {
    cloneElement,
    useCallback,
    useMemo,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type ReactNode
} from "react"
import classes from "./ui.module.css"

export type ContextMenuAction = {
    type?: "item"
    key: string
    label: ReactNode
    icon?: ReactNode
    onClick: () => void
    /** e.g. "red" for destructive actions (which should still open a confirm dialog). */
    color?: MantineColor
    disabled?: boolean
    rightSection?: ReactNode
}

export type ContextMenuEntry =
    | ContextMenuAction
    | { type: "divider"; key: string }
    | { type: "label"; key: string; label: ReactNode }

type MenuState = { x: number; y: number; items: ContextMenuEntry[] }

type ContextMenuEvent = Pick<
    MouseEvent | ReactMouseEvent,
    "clientX" | "clientY" | "preventDefault" | "currentTarget"
>

/**
 * Right-click menus for list rows/cards, built on Mantine `Menu` (so it inherits the
 * themed, origin-aware dropdown and keyboard handling). One host per list — rows just call
 * `open(event, items)`. Fires on mouse right-click, Android long-press and the keyboard
 * context-menu key (Shift+F10).
 *
 * ```tsx
 * const contextMenu = useContextMenu()
 * …
 * {characters.map((c) => (
 *     <Panel key={c.id} onContextMenu={(e) => contextMenu.open(e, [
 *         { key: "open", label: "Open sheet", icon: <IconBook size={14} />, onClick: () => open(c) },
 *         { type: "divider", key: "d" },
 *         { key: "delete", label: "Delete…", color: "red", icon: <IconTrash size={14} />, onClick: () => askDelete(c) },
 *     ])}>…</Panel>
 * ))}
 * {contextMenu.menu}
 * ```
 */
export const useContextMenu = () => {
    const [state, setState] = useState<MenuState | null>(null)
    const [opened, setOpened] = useState(false)

    const open = useCallback((event: ContextMenuEvent, items: ContextMenuEntry[]) => {
        if (!items.length) {
            return
        }
        event.preventDefault()

        let { clientX: x, clientY: y } = event
        // Keyboard-triggered context menus report 0/0 — anchor to the element instead.
        if (x === 0 && y === 0 && event.currentTarget instanceof Element) {
            const rect = event.currentTarget.getBoundingClientRect()
            x = rect.left + Math.min(24, rect.width / 2)
            y = rect.top + Math.min(rect.height, 32)
        }

        setState({ x, y, items })
        setOpened(true)
    }, [])

    const close = useCallback(() => setOpened(false), [])

    const menu = state ? (
        <Portal>
            <Menu
                opened={opened}
                onChange={setOpened}
                position="bottom-start"
                offset={2}
                withinPortal
                returnFocus
                width={220}
            >
                <Menu.Target>
                    <span
                        className={classes.contextAnchor}
                        style={{ left: state.x, top: state.y }}
                        aria-hidden="true"
                    />
                </Menu.Target>
                <Menu.Dropdown onContextMenu={(event) => event.preventDefault()}>
                    {state.items.map((entry) => {
                        if (entry.type === "divider") {
                            return <Menu.Divider key={entry.key} />
                        }
                        if (entry.type === "label") {
                            return <Menu.Label key={entry.key}>{entry.label}</Menu.Label>
                        }
                        return (
                            <Menu.Item
                                key={entry.key}
                                leftSection={entry.icon}
                                rightSection={entry.rightSection}
                                color={entry.color}
                                disabled={entry.disabled}
                                onClick={entry.onClick}
                            >
                                {entry.label}
                            </Menu.Item>
                        )
                    })}
                </Menu.Dropdown>
            </Menu>
        </Portal>
    ) : null

    return { open, close, menu, opened }
}

/**
 * Convenience wrapper for a single element. Prefer `useContextMenu` for long lists so only
 * one Menu is mounted.
 *
 * ```tsx
 * <ContextMenu items={[{ key: "copy", label: "Copy link", onClick: copy }]}>
 *     <Panel>…</Panel>
 * </ContextMenu>
 * ```
 */
export const ContextMenu = ({
    items,
    children,
    disabled = false
}: {
    items: ContextMenuEntry[] | (() => ContextMenuEntry[])
    children: ReactElement<{ onContextMenu?: (event: ReactMouseEvent) => void }>
    disabled?: boolean
}) => {
    const { open, menu } = useContextMenu()
    const originalHandler = children.props.onContextMenu
    const onContextMenu = useMemo(
        () => (event: ReactMouseEvent) => {
            originalHandler?.(event)
            if (disabled || event.defaultPrevented) {
                return
            }
            open(event, typeof items === "function" ? items() : items)
        },
        [disabled, items, open, originalHandler]
    )

    return (
        <>
            {cloneElement(children, { onContextMenu })}
            {menu}
        </>
    )
}
