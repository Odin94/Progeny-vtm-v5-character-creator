export const nightfallScrollbarSize = 10

/**
 * Generator scroll areas. The thumb look (bone → accent on hover) comes from the Mantine theme
 * (`theme/components.module.css`); inline thumb colors would disable its hover state, so this
 * only keeps the track transparent over the background photography.
 */
export const nightfallScrollAreaStyles = {
    scrollbar: {
        background: "transparent"
    },
    corner: {
        background: "transparent"
    }
} as const
