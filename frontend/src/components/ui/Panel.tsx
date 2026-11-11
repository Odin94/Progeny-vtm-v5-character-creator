import { createPolymorphicComponent, Paper, type PaperProps } from "@mantine/core"
import { forwardRef } from "react"
import classes from "./ui.module.css"

export type PanelTone = "plain" | "raised" | "inset" | "glass" | "ornate"

export type PanelProps = PaperProps & {
    /**
     * - `plain` (default): surface-1 with a hairline border — the everyday container
     * - `raised`: surface-2 + shadow — cards that sit above a plain panel
     * - `inset`: sunken well — grouped form fields, read-only values, code
     * - `glass`: blurred translucent — over background photography
     * - `ornate`: gilded border + corner brackets — hero/feature blocks, use sparingly
     */
    tone?: PanelTone
    /** Hover lift + accent glow + press scale. Use for clickable cards. */
    interactive?: boolean
    /** Accent border + glow for the chosen card in a set. */
    selected?: boolean
    /** Layer the film-grain texture over the surface. */
    grain?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- polymorphic passthrough
const PanelImpl = forwardRef<HTMLDivElement, PanelProps & { component?: any }>(
    (
        { tone = "plain", interactive, selected, grain, className, p = "md", mod, ...others },
        ref
    ) => (
        <Paper
            ref={ref}
            p={p}
            className={[classes.panel, grain ? "pg-grain" : null, className]
                .filter(Boolean)
                .join(" ")}
            data-tone={tone}
            mod={[{ interactive, selected }, mod]}
            {...others}
        />
    )
)

PanelImpl.displayName = "Panel"

/**
 * Themed container built on Mantine `Paper` (polymorphic — pass `component="button"`,
 * `component={Link}`, etc.).
 *
 * ```tsx
 * <Panel tone="raised" p="lg">…</Panel>
 * <Panel component={Link} to="/homebrew/$collectionId" params={{ collectionId }} interactive>…</Panel>
 * ```
 */
export const Panel = createPolymorphicComponent<"div", PanelProps>(PanelImpl)
