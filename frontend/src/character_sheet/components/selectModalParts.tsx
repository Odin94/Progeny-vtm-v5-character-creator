import { CloseButton, Modal, TextInput, type ModalProps } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { IconDropletFilled, IconLock, IconSearch } from "@tabler/icons-react"
import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode
} from "react"
import classes from "./selectModals.module.css"

export { classes as selectModalClasses }

export const usePhoneScreen = () => !!useMediaQuery("(max-width: 48em)")

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ")

/**
 * Themed modal frame for the sheet's pickers and forms. On phones it becomes a full-screen
 * sheet whose list scrolls under a fixed search header; elsewhere it's a centered modal with
 * a fixed-height scroll region so the search never leaves view.
 */
export const SheetModal = ({
    fullScreenOnPhone = true,
    children,
    classNames: _ignored,
    ...props
}: ModalProps & { fullScreenOnPhone?: boolean }) => {
    const phone = usePhoneScreen()
    const fullScreen = phone && fullScreenOnPhone
    return (
        <Modal
            {...props}
            fullScreen={fullScreen}
            radius={fullScreen ? 0 : props.radius}
            classNames={{
                content: cx(classes.content, fullScreen && classes.fullScreenContent),
                body: cx(classes.body, fullScreen && classes.fullScreenBody)
            }}
        >
            {children}
        </Modal>
    )
}

export const SelectToolbar = ({ children }: { children: ReactNode }) => (
    <div className={classes.toolbar}>{children}</div>
)

export const SelectFooter = ({ start, end }: { start?: ReactNode; end?: ReactNode }) => (
    <div className={classes.footer}>
        {start}
        {end ? <div className={classes.footerEnd}>{end}</div> : null}
    </div>
)

export const SelectScroll = forwardRef<
    HTMLDivElement,
    {
        children: ReactNode
        listId?: string
        label?: string
        listbox?: boolean
        /** Make the list itself the focus target (no search field in front of it). */
        focusNav?: ListNav
    }
>(({ children, listId, label, listbox = true, focusNav }, ref) => (
    <div
        ref={ref}
        className={classes.scroll}
        id={listId}
        role={listbox ? "listbox" : undefined}
        aria-label={listbox ? label : undefined}
        tabIndex={focusNav ? 0 : undefined}
        data-autofocus={focusNav ? true : undefined}
        aria-activedescendant={focusNav?.activeDescendant}
        onKeyDown={focusNav?.onKeyDown}
    >
        {children}
    </div>
))
SelectScroll.displayName = "SelectScroll"

export const SelectEmpty = ({ children }: { children: ReactNode }) => (
    <div className={classes.empty}>{children}</div>
)

export const OptionGroup = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
    <section className={classes.group} role="group" aria-label={String(label)}>
        <h3 className={classes.groupLabel}>{label}</h3>
        {children}
    </section>
)

type Tone = "default" | "accent" | "blood" | "success"
export const Tag = ({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) => (
    <span
        className={cx(
            classes.tag,
            tone === "accent" && classes.tagAccent,
            tone === "blood" && classes.tagBlood,
            tone === "success" && classes.tagSuccess
        )}
    >
        {children}
    </span>
)

/** Level as dots, the way the sheet shows ratings. */
export const LevelTag = ({ level, tone = "accent" }: { level: number; tone?: Tone }) => (
    <Tag tone={tone}>
        <span className={classes.dots} aria-label={`Level ${level}`}>
            {Array.from({ length: Math.max(0, Math.min(level, 5)) }, (_, i) => (
                <span key={i} className={classes.dot} />
            ))}
        </span>
    </Tag>
)

export const MetaRows = ({ rows }: { rows: Array<[string, ReactNode] | null | false> }) => {
    const visible = rows.filter(Boolean) as Array<[string, ReactNode]>
    if (visible.length === 0) return null
    return (
        <div className={classes.meta}>
            {visible.map(([label, value]) => (
                <div key={label} style={{ display: "contents" }}>
                    <span className={classes.metaLabel}>{label}</span>
                    <span className={classes.metaValue}>{value}</span>
                </div>
            ))}
        </div>
    )
}

export const DisabledLine = ({ children }: { children: ReactNode }) => (
    <div className={classes.reason}>
        <IconLock size={13} stroke={1.8} />
        <span>{children}</span>
    </div>
)

export const SearchField = ({
    value,
    onChange,
    label,
    placeholder,
    nav
}: {
    value: string
    onChange: (value: string) => void
    label: string
    placeholder: string
    nav?: ListNav
}) => (
    <TextInput
        data-autofocus
        autoFocus
        aria-label={label}
        placeholder={placeholder}
        value={value}
        leftSection={<IconSearch size={16} />}
        rightSection={
            value ? (
                <CloseButton size="sm" aria-label="Clear search" onClick={() => onChange("")} />
            ) : null
        }
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
            if (event.key === "Escape" && value) {
                event.preventDefault()
                event.stopPropagation()
                event.nativeEvent.stopImmediatePropagation()
                onChange("")
                return
            }
            nav?.onKeyDown(event)
        }}
        aria-controls={nav?.listId}
        aria-activedescendant={nav?.activeDescendant}
        autoComplete="off"
        spellCheck={false}
    />
)

export type ListNav = ReturnType<typeof useListNav>

/**
 * Roving "active option" for a search-driven listbox: ↑/↓ move, Home/End jump (when the
 * search is empty), Enter picks. Hover also moves the highlight so pointer and keyboard
 * never show two different items. Only keyboard moves scroll the list.
 */
export function useListNav<T>({
    items,
    onPick,
    resetKey,
    scrollToIndex
}: {
    items: T[]
    onPick: (item: T) => void
    resetKey?: unknown
    scrollToIndex?: (index: number) => void
}) {
    const listId = useId()
    const [active, setActive] = useState(0)
    const keyboardMove = useRef(false)
    const count = items.length

    useEffect(() => {
        setActive(0)
    }, [resetKey])

    const clamped = count === 0 ? -1 : Math.min(active, count - 1)
    const optionId = useCallback((index: number) => `${listId}-option-${index}`, [listId])

    useEffect(() => {
        if (!keyboardMove.current || clamped < 0) return
        keyboardMove.current = false
        if (scrollToIndex) scrollToIndex(clamped)
        else document.getElementById(optionId(clamped))?.scrollIntoView({ block: "nearest" })
    }, [clamped, optionId, scrollToIndex])

    const move = (next: number) => {
        keyboardMove.current = true
        setActive(Math.max(0, Math.min(next, count - 1)))
    }

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (count === 0) return
        const hasText = "value" in event.currentTarget && !!event.currentTarget.value
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault()
                move(clamped + 1)
                break
            case "ArrowUp":
                event.preventDefault()
                move(clamped - 1)
                break
            case "PageDown":
                event.preventDefault()
                move(clamped + 6)
                break
            case "PageUp":
                event.preventDefault()
                move(clamped - 6)
                break
            case "Home":
                if (hasText) return
                event.preventDefault()
                move(0)
                break
            case "End":
                if (hasText) return
                event.preventDefault()
                move(count - 1)
                break
            case "Enter":
                if (clamped < 0 || event.nativeEvent.isComposing) return
                event.preventDefault()
                onPick(items[clamped])
                break
        }
    }

    const optionProps = (index: number) => ({
        id: optionId(index),
        role: "option" as const,
        "aria-selected": index === clamped,
        "data-active": index === clamped ? true : undefined,
        onMouseMove: () => {
            if (index !== clamped) setActive(index)
        },
        onClick: () => onPick(items[index])
    })

    return {
        listId,
        active: clamped,
        activeDescendant: clamped >= 0 ? optionId(clamped) : undefined,
        onKeyDown,
        optionProps
    }
}

export const OptionCard = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement> & {
        disabled?: boolean
        picked?: boolean
        variant?: "default" | "discipline"
    }
>(({ disabled, picked, variant = "default", className, children, ...props }, ref) => (
    <div
        ref={ref}
        {...props}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        data-picked={picked || undefined}
        className={cx(
            classes.option,
            variant === "discipline" && classes.disciplineOption,
            className
        )}
    >
        {children}
    </div>
))
OptionCard.displayName = "OptionCard"

export const OptionHead = ({
    name,
    tags,
    display = false
}: {
    name: ReactNode
    tags?: ReactNode
    display?: boolean
}) => (
    <div className={classes.optionHead}>
        <span className={cx(classes.optionName, display && classes.optionDisplayName)}>{name}</span>
        {tags ? <span className={classes.optionTags}>{tags}</span> : null}
    </div>
)

export const Summary = ({ children, lines }: { children?: ReactNode; lines?: number }) =>
    children ? (
        <div className={classes.summary} style={lines ? { WebkitLineClamp: lines } : undefined}>
            {children}
        </div>
    ) : null

/** Normalised substring match over name + summary. */
export const matchesQuery = (query: string, ...fields: Array<string | undefined | null>) => {
    const q = query.trim().toLocaleLowerCase()
    if (!q) return true
    return fields.some((field) => field?.toLocaleLowerCase().includes(q))
}

/** Rouse checks as blood drops. */
export const RouseDrops = ({ n }: { n: number }) => (
    <span
        aria-label={`${n} Rouse ${n === 1 ? "check" : "checks"}`}
        style={{ display: "inline-flex", gap: 2, verticalAlign: "middle" }}
    >
        {Array.from({ length: n }, (_, i) => (
            <IconDropletFilled key={i} size={12} style={{ color: "var(--pg-blood-bright)" }} />
        ))}
    </span>
)
