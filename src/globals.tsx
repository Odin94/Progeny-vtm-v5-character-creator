export const globals = {
    // In globals because the useViewportSize-hook doesn't run immediately and triggers bouncing around of components that rely on it
    viewporHeightPx: 1200,
    isPhoneScreen: false,
    isSmallScreen: false,
    smallScreenW: 800,
    phoneScreenW: 420,
    tooltipTriggerEvents: { hover: true, focus: true, touch: true },  // TODO: How to make tooltips work for phone long-press..?
}