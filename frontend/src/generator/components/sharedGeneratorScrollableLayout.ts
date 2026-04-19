// position: absolute so these full-page scroll steps can escape any max-width wrapper in the parent.
// right uses --aside-offset (set by CreatorPage) so the scrollbar stays in the visible area.
export const generatorScrollableShellStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: "var(--aside-offset, 0px)",
    bottom: 0,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    paddingTop: 62,
    paddingBottom: 18,
    boxSizing: "border-box" as const,
}

export const generatorScrollableAreaStyle = {
    flex: 1,
    minHeight: 0,
}

// Center content inside a full-width ScrollArea at the same width as the non-scroll steps
export const generatorScrollableContentStyle = {
    maxWidth: 960,
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
} as const
