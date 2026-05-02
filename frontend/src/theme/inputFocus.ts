import { Input, InputProps, MantineTheme, parseThemeColor } from "@mantine/core"

const getFocusBorderColor = (theme: MantineTheme, color: unknown) => {
    const focusColor = typeof color === "string" ? color : theme.primaryColor

    try {
        const parsed = parseThemeColor({ color: focusColor, theme })
        return parsed.variable ? `var(${parsed.variable})` : parsed.value
    } catch {
        return "var(--mantine-primary-color-filled)"
    }
}

export const inputFocusTheme = {
    Input: Input.extend({
        styles: (theme, props: InputProps) => ({
            wrapper: {
                "--input-bd-focus": getFocusBorderColor(
                    theme,
                    (props as InputProps & { color?: unknown }).color
                )
            } as React.CSSProperties
        })
    })
}
