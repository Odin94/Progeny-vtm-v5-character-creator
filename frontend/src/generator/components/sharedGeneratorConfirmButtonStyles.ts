import { RAW_RED, RAW_GRAPE, rgba } from "~/theme/colors"

export const generatorConfirmButtonStyles = {
    root: {
        minWidth: 180,
        background: `linear-gradient(135deg, ${rgba(RAW_GRAPE, 0.92)}, ${rgba(RAW_RED, 0.88)})`,
        boxShadow: `0 16px 32px ${rgba(RAW_GRAPE, 0.3)}`,
    },
    label: {
        fontFamily: "Cinzel, Georgia, serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
    },
}

export const generatorOutlineActionButtonStyles = {
    root: {
        borderColor: rgba(RAW_RED, 0.4),
        background: rgba(RAW_RED, 0.08),
        boxShadow: "none",
        transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        fontFamily: "Cinzel, Georgia, serif",
    },
    section: {
        color: rgba(RAW_RED, 1),
    },
}

export const confirmationModalDangerConfirmButtonStyles = {
    root: {
        background: `linear-gradient(180deg, ${rgba(RAW_RED, 0.92)} 0%, rgba(186, 38, 38, 0.95) 100%)`,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        fontFamily: "Cinzel, Georgia, serif",
        boxShadow: `0 10px 24px ${rgba(RAW_RED, 0.24)}`,
    },
}
