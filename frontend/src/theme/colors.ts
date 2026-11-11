// Canonical color constants for the app.
// Use RAW_* with the rgba() helper for alpha variants.
// Use COLOR_* where an opaque color string is needed.

export const RAW_RED = "224, 49, 49"
export const RAW_GRAPE = "126, 74, 201"
export const RAW_GOLD = "212, 175, 100"
export const RAW_GREY = "214, 204, 198"

export const COLOR_RED = `rgb(${RAW_RED})` // #e03131
export const COLOR_GRAPE = `rgb(${RAW_GRAPE})` // #7e4ac9
export const COLOR_GOLD = `rgb(${RAW_GOLD})` // #d4af64
export const COLOR_MODAL_DIVIDER = "rgba(212, 175, 100, 0.18)"

// Prefer the CSS custom properties from src/index.css (or `color` in theme/tokens.ts) for
// new code — they follow the clan color on the sheet. These constants remain for code
// that needs literal values (canvas/PDF/three.js, alpha math).
export const RAW_BLOOD = "220, 52, 70"
export const COLOR_BLOOD = `rgb(${RAW_BLOOD})` // #dc3446

/** Builds "rgba(r, g, b, alpha)" from a RAW_* constant. */
export const rgba = (raw: string, alpha: number) => `rgba(${raw}, ${alpha})`
