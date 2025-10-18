export const globals = {
    // In globals because the useViewportSize-hook doesn't run immediately and triggers bouncing around of components that rely on it
    viewportHeightPx: 1200,
    viewportWidthPx: 800,
    isPhoneScreen: false,
    isSmallScreen: false,
    smallScreenW: 1300,
    phoneScreenW: 440,
    tooltipTriggerEvents: { hover: true, focus: true, touch: true }, // TODO: How to make tooltips work for phone long-press..?

    largeFontSize: "30px",
    smallFontSize: "25px",
    smallerFontSize: "20px",
}