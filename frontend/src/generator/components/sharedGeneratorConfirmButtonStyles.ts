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
