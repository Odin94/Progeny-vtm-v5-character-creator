import type { MantineTransition, TransitionProps } from "@mantine/core"

/**
 * Shared Mantine transitions.
 *
 * Mantine applies the `in` styles while entering/entered and the `out` styles while
 * exiting, so putting the timing function inside each state gives us ease-out on the way
 * in and ease-in on the way out with a single transition object.
 *
 * The start scale comes from a CSS variable so `prefers-reduced-motion` can flatten it to
 * 1 (opacity still fades) without JavaScript — see `--pg-scale-from-*` in index.css.
 * The transform origin also comes from a CSS variable so floating dropdowns can grow out
 * of the side that touches their target (see `[data-position]` rules in
 * theme/components.module.css).
 */
const scaleFade = (
    fromVar: string,
    origin = "var(--pg-transform-origin, center)"
): MantineTransition => ({
    in: {
        opacity: 1,
        transform: "scale(1)",
        transitionTimingFunction: "var(--ease-out)"
    },
    out: {
        opacity: 0,
        transform: `scale(var(${fromVar}))`,
        transitionTimingFunction: "var(--ease-in)"
    },
    common: { transformOrigin: origin },
    transitionProperty: "transform, opacity"
})

/** Modals and dialogs: scale in from .96 around the center. */
export const modalTransition = scaleFade("--pg-scale-from-modal", "center")

/** Menus, popovers, select dropdowns: scale in from .95 out of the anchored side. */
export const popoverTransition = scaleFade("--pg-scale-from-popover")

/** Tooltips: barely-there .97 scale. */
export const tooltipTransition = scaleFade("--pg-scale-from-tooltip", "center")

export const modalTransitionProps: Partial<Omit<TransitionProps, "mounted">> = {
    transition: modalTransition,
    duration: 220,
    exitDuration: 150
}

export const popoverTransitionProps: Partial<Omit<TransitionProps, "mounted">> = {
    transition: popoverTransition,
    duration: 180,
    exitDuration: 120
}

export const tooltipTransitionProps: Partial<Omit<TransitionProps, "mounted">> = {
    transition: tooltipTransition,
    duration: 130,
    exitDuration: 90
}

export const drawerTransitionProps: Partial<Omit<TransitionProps, "mounted">> = {
    duration: 320,
    exitDuration: 220,
    timingFunction: "var(--ease-drawer)"
}
