import type { ButtonProps } from "@mantine/core"

/**
 * Inline styles for the generator's primary confirm button. Prefer `GeneratorConfirmButton`
 * from `./sharedGeneratorUi` for new code: it adds the hover glow, arrow and `disabledReason`
 * tooltip. These styles render the same resting look for existing `<Button styles={…}>` call sites.
 */
export const generatorConfirmButtonStyles: ButtonProps["styles"] = (_theme, props) => ({
    root: {
        minWidth: 180,
        ...(props.disabled || props["data-disabled"]
            ? {
                  background: "var(--pg-surface-3)",
                  borderColor: "var(--pg-border)",
                  color: "var(--pg-ink-4)",
                  boxShadow: "none",
                  cursor: "not-allowed"
              }
            : {
                  background: "linear-gradient(135deg, var(--pg-blood) 0%, var(--pg-violet) 140%)",
                  borderColor: "rgba(255, 220, 220, 0.1)",
                  color: "var(--pg-ink)",
                  boxShadow:
                      "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 12px 28px -10px rgba(176, 30, 47, 0.7)"
              })
    },
    label: {
        fontFamily: "var(--pg-font-display)",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const
    }
})

export const generatorOutlineActionButtonStyles = {
    root: {
        borderColor: "var(--pg-border-blood)",
        background: "rgba(176, 30, 47, 0.08)",
        boxShadow: "none",
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        fontFamily: "var(--pg-font-display)"
    },
    section: {
        color: "var(--pg-blood-bright)"
    }
}

export const confirmationModalDangerConfirmButtonStyles = {
    root: {
        background: "linear-gradient(180deg, #c82638 0%, #931826 100%)",
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        fontFamily: "var(--pg-font-display)",
        boxShadow:
            "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 24px -6px rgba(220, 52, 70, 0.45)"
    }
}
