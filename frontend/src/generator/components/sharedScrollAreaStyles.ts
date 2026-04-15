export const nightfallScrollbarSize = 11

export const nightfallScrollAreaStyles = {
    scrollbar: {
        background: "transparent",
    },
    thumb: {
        background: "rgba(224, 49, 49, 0.3)",
        borderRadius: "999px",
        transition: "background 140ms ease",
        "&:hover": {
            background: "rgba(224, 49, 49, 0.52)",
        },
        "&:active": {
            background: "rgba(224, 49, 49, 0.7)",
        },
    },
    corner: {
        background: "transparent",
    },
} as const
