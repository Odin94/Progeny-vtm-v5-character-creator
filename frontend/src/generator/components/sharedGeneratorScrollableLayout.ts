// position: absolute so these full-page scroll steps can escape any max-width wrapper in the parent.
// left/right use CSS vars set by CreatorPage so the shell aligns with the visible content area between both sidebars.
// The generator canvas runs underneath the glass top bar (and, on small screens, the step progress
// strip); CreatorPage publishes their combined height as --generator-top-offset.
export const generatorScrollableShellStyle = {
    position: "absolute" as const,
    top: 0,
    left: "var(--navbar-offset, 0px)",
    right: "var(--aside-offset, 0px)",
    bottom: 0,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    paddingTop: "calc(var(--generator-top-offset, 52px) + 10px)",
    paddingBottom: "calc(18px + var(--pg-safe-bottom, 0px))",
    boxSizing: "border-box" as const
}

export const generatorScrollableAreaStyle = {
    flex: 1,
    minHeight: 0
}

// Center content inside a full-width ScrollArea at the same width as the non-scroll steps
export const generatorScrollableContentStyle = {
    maxWidth: 960,
    marginLeft: "auto",
    marginRight: "auto",
    width: "calc(100% - clamp(1rem, 4vw, 3rem))",
    paddingTop: 12,
    paddingBottom: 24
} as const
