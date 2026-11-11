import type { MantineColorsTuple } from "@mantine/core"

/**
 * Progeny design tokens (JS side).
 *
 * The CSS custom properties in `src/index.css` are the source of truth for
 * runtime styling; this module mirrors them as `var(...)` references so
 * components can use them in `style`/`styles` props with type safety, and
 * defines the Mantine color tuples that feed the theme.
 *
 * See `frontend/DESIGN.md` for usage rules.
 */

// ---------------------------------------------------------------------------
// Mantine palettes
// ---------------------------------------------------------------------------

/** Warm aubergine-black. Mantine maps dark-0 → text, dark-2 → dimmed, dark-4 → default border,
 * dark-6 → default/input surface, dark-7 → body. */
export const darkPalette: MantineColorsTuple = [
    "#ece3df",
    "#cfc3be",
    "#a3958f",
    "#7a6d6d",
    "#42363b",
    "#2e252a",
    "#1d171b",
    "#110d10",
    "#0a0809",
    "#050404"
]

/** Blood. `red-7` is the filled shade in the dark scheme. */
export const bloodPalette: MantineColorsTuple = [
    "#ffeef0",
    "#fcd3d8",
    "#f4a3ad",
    "#ec7280",
    "#e44b5c",
    "#dc3446",
    "#c82638",
    "#b01e2f",
    "#931826",
    "#6e111c"
]

/** Brand violet. `grape-7` is the original Progeny #7e4ac9. */
export const grapePalette: MantineColorsTuple = [
    "#f5effc",
    "#e6daf7",
    "#cbb3ee",
    "#b18ee6",
    "#9e74df",
    "#9263da",
    "#8d5ad6",
    "#7e4ac9",
    "#6a3cad",
    "#4e2a82"
]

/** Candlelight / tarnished brass. Use for ornaments, eyebrows and rare highlights. */
export const goldPalette: MantineColorsTuple = [
    "#fbf6ea",
    "#f3e7c8",
    "#e8d29e",
    "#ddbd76",
    "#d4af64",
    "#c79b4a",
    "#b0853a",
    "#8f6b2e",
    "#6e5224",
    "#4d3919"
]

/** Warm ash grey (secondary/neutral buttons, Nosferatu/Hecata sheets). */
export const ashPalette: MantineColorsTuple = [
    "#f7f3f1",
    "#ebe4e1",
    "#d6ccc8",
    "#bcaea9",
    "#a0918c",
    "#857672",
    "#6b5d5a",
    "#544845",
    "#3d3331",
    "#2a2322"
]

// ---------------------------------------------------------------------------
// CSS variable references (keep in sync with src/index.css)
// ---------------------------------------------------------------------------

export const color = {
    abyss: "var(--pg-abyss)",
    bg: "var(--pg-bg)",
    surface1: "var(--pg-surface-1)",
    surface2: "var(--pg-surface-2)",
    surface3: "var(--pg-surface-3)",
    surfaceOverlay: "var(--pg-surface-overlay)",
    surfaceGlass: "var(--pg-surface-glass)",
    sunken: "var(--pg-sunken)",
    scrim: "var(--pg-scrim)",

    ink: "var(--pg-ink)",
    ink2: "var(--pg-ink-2)",
    ink3: "var(--pg-ink-3)",
    ink4: "var(--pg-ink-4)",
    inkInverse: "var(--pg-ink-inverse)",

    accent: "var(--pg-accent)",
    accentSoft: "var(--pg-accent-soft)",
    blood: "var(--pg-blood)",
    bloodBright: "var(--pg-blood-bright)",
    bloodDeep: "var(--pg-blood-deep)",
    violet: "var(--pg-violet)",
    violetBright: "var(--pg-violet-bright)",
    gold: "var(--pg-gold)",
    goldDim: "var(--pg-gold-dim)",

    success: "var(--pg-success)",
    warning: "var(--pg-warning)",
    danger: "var(--pg-danger)",
    info: "var(--pg-info)",

    borderFaint: "var(--pg-border-faint)",
    border: "var(--pg-border)",
    borderStrong: "var(--pg-border-strong)",
    borderGold: "var(--pg-border-gold)",
    borderBlood: "var(--pg-border-blood)",
    borderAccent: "var(--pg-border-accent)"
} as const

export const font = {
    display: "var(--pg-font-display)",
    body: "var(--pg-font-body)",
    lore: "var(--pg-font-lore)",
    mono: "var(--pg-font-mono)"
} as const

export const radius = {
    xs: "var(--pg-radius-xs)",
    sm: "var(--pg-radius-sm)",
    md: "var(--pg-radius-md)",
    lg: "var(--pg-radius-lg)",
    xl: "var(--pg-radius-xl)",
    round: "var(--pg-radius-round)"
} as const

export const shadow = {
    1: "var(--pg-shadow-1)",
    2: "var(--pg-shadow-2)",
    3: "var(--pg-shadow-3)",
    4: "var(--pg-shadow-4)",
    glowAccent: "var(--pg-glow-accent)",
    glowBlood: "var(--pg-glow-blood)",
    glowCandle: "var(--pg-glow-candle)"
} as const

export const motion = {
    easeOut: "var(--ease-out)",
    easeIn: "var(--ease-in)",
    easeInOut: "var(--ease-in-out)",
    easeDrawer: "var(--ease-drawer)",
    /** Raw curves for framer-motion (which cannot read CSS variables). */
    curve: {
        out: [0.23, 1, 0.32, 1] as const,
        in: [0.55, 0.055, 0.675, 0.19] as const,
        inOut: [0.77, 0, 0.175, 1] as const,
        drawer: [0.32, 0.72, 0, 1] as const
    },
    /** Milliseconds. */
    duration: {
        press: 120,
        fast: 150,
        base: 200,
        slow: 260,
        exit: 140
    }
} as const

export const zIndex = {
    raised: 1,
    sticky: 10,
    header: 100,
    modal: 200,
    popover: 300,
    overlay: 400,
    spotlight: 1000,
    cookie: 2500,
    toast: 3000
} as const
