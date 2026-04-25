import { RAW_RED, rgba } from "~/theme/colors"

export const nightfallScrollbarSize = 11

export const nightfallScrollAreaStyles = {
    scrollbar: {
        background: "transparent"
    },
    thumb: {
        background: rgba(RAW_RED, 0.3),
        borderRadius: "999px",
        transition: "background 140ms ease",
        "&:hover": {
            background: rgba(RAW_RED, 0.52)
        },
        "&:active": {
            background: rgba(RAW_RED, 0.7)
        }
    },
    corner: {
        background: "transparent"
    }
} as const
