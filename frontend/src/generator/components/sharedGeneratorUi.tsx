import { Box, Stack, Text } from "@mantine/core"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { RAW_GOLD, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"

type GeneratorStepHeroProps = {
    leadText: string
    accentText: string
    description?: ReactNode
    secondaryDescription?: ReactNode
    maxWidth?: number | string
    mobileTitleSize?: string
    desktopTitleSize?: string
    marginBottom?: number
}

type GeneratorSectionDividerProps = {
    label: string
    lineHeight?: 1 | 2
    accentAlpha?: 0.3 | 0.32 | 0.38
    titleSize?: "0.88rem" | "0.95rem" | "0.96rem"
    marginY?: "xs" | "sm" | "md" | "lg"
}

type GeneratorPhasePromptLine = {
    key: string
    prompt: string
    bold: string
    suffix: string
    level?: number
    done: boolean
}

type GeneratorPhasePromptProps = {
    lines: GeneratorPhasePromptLine[]
    activeKey: string
    phoneScreen: boolean
    showChevron?: boolean
    footerText?: ReactNode
    caption?: ReactNode
    marginBottom?: string
}

export const generatorFieldStyles = {
    goldLabel: {
        fontFamily: "Cinzel, Georgia, serif",
        fontSize: "0.9rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: rgba(RAW_GOLD, 1),
        marginBottom: 8,
    },
    mutedLabel: {
        fontFamily: "Cinzel, Georgia, serif",
        fontSize: "0.82rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: rgba(RAW_GREY, 0.72),
        marginBottom: 8,
    },
    description: {
        fontFamily: "Inter, Segoe UI, sans-serif",
        fontSize: "0.76rem",
        color: rgba(RAW_GREY, 0.7),
        marginBottom: 4,
    },
    input: {
        background: "rgba(20, 16, 18, 0.82)",
        borderColor: "rgba(125, 91, 72, 0.4)",
        color: "rgba(244, 236, 232, 0.95)",
        fontFamily: "Inter, Segoe UI, sans-serif",
    },
} as const

export const getGeneratorFieldStyles = (labelTone: "gold" | "muted" = "gold") => ({
    label: labelTone === "gold" ? generatorFieldStyles.goldLabel : generatorFieldStyles.mutedLabel,
    input: generatorFieldStyles.input,
    description: generatorFieldStyles.description,
})

export const GeneratorStepHero = ({
    leadText,
    accentText,
    description,
    secondaryDescription,
    maxWidth,
    mobileTitleSize = "1.95rem",
    desktopTitleSize = "2.35rem",
    marginBottom = 26,
}: GeneratorStepHeroProps) => (
    <Stack gap={6} align="center" mb={marginBottom}>
        <Text
            ta="center"
            maw={maxWidth}
            style={{
                fontFamily: "Crimson Text, Georgia, serif",
                fontSize: `clamp(${mobileTitleSize}, 4vw, ${desktopTitleSize})`,
                lineHeight: 1.1,
                color: "rgba(244, 236, 232, 0.95)",
            }}
        >
            {leadText}{" "}
            <span
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    letterSpacing: "0.05em",
                    color: rgba(RAW_RED, 1),
                }}
            >
                {accentText}
            </span>
        </Text>
        {description ? (
            <Text
                ta="center"
                maw={maxWidth}
                style={{
                    fontFamily: "Inter, Segoe UI, sans-serif",
                    fontSize: "clamp(0.82rem, 2vw, 0.9rem)",
                    letterSpacing: "0.04em",
                    color: rgba(RAW_GREY, 0.5),
                }}
            >
                {description}
            </Text>
        ) : null}
        {secondaryDescription ? (
            <Text
                ta="center"
                maw={maxWidth}
                style={{
                    fontFamily: "Inter, Segoe UI, sans-serif",
                    fontSize: "0.76rem",
                    letterSpacing: "0.05em",
                    color: rgba(RAW_GREY, 0.36),
                }}
            >
                {secondaryDescription}
            </Text>
        ) : null}
    </Stack>
)

export const GeneratorSectionDivider = ({
    label,
    lineHeight = 2,
    accentAlpha = 0.3,
    titleSize = "0.95rem",
    marginY = "lg",
}: GeneratorSectionDividerProps) => (
    <Box my={marginY}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
                style={{
                    flex: 1,
                    height: `${lineHeight}px`,
                    background: `linear-gradient(90deg, transparent 0%, ${rgba(RAW_RED, accentAlpha)} 50%, transparent 100%)`,
                }}
            />
            <Text
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: titleSize,
                    fontWeight: 600,
                    letterSpacing: titleSize === "0.88rem" ? "0.2em" : "0.22em",
                    textTransform: "uppercase",
                    color: rgba(RAW_RED, 1),
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </Text>
            <div
                style={{
                    flex: 1,
                    height: `${lineHeight}px`,
                    background: `linear-gradient(90deg, transparent 0%, ${rgba(RAW_RED, accentAlpha)} 50%, transparent 100%)`,
                }}
            />
        </div>
    </Box>
)

export const GeneratorPhasePrompt = ({
    lines,
    activeKey,
    phoneScreen,
    showChevron = true,
    footerText,
    caption,
    marginBottom = "md",
}: GeneratorPhasePromptProps) => (
    <Stack gap={6} align="center" mb={marginBottom}>
        {caption ? (
            <Text
                ta="center"
                style={{
                    fontFamily: "Inter, Segoe UI, sans-serif",
                    fontSize: "0.78rem",
                    letterSpacing: "0.06em",
                    color: rgba(RAW_GREY, 0.42),
                }}
            >
                {caption}
            </Text>
        ) : null}
        {lines.map((line) => {
            const isActive = activeKey === line.key
            const isPast = line.done && !isActive

            return (
                <Box
                    key={line.key}
                    style={{
                        position: "relative",
                        height: phoneScreen ? "1.9rem" : "2.35rem",
                        width: "100%",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: isPast ? 0.28 : isActive ? 1 : 0.5, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Crimson Text, Georgia, serif",
                                fontSize: isActive ? (phoneScreen ? "1.15rem" : "1.45rem") : phoneScreen ? "0.95rem" : "1rem",
                                lineHeight: 1.1,
                                color: isActive ? "rgba(244, 236, 232, 0.95)" : rgba(RAW_GREY, 0.56),
                                transition: "all 220ms ease",
                            }}
                        >
                            {isActive && showChevron ? (
                                <motion.span
                                    animate={{ opacity: [0.65, 1, 0.65] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                    style={{
                                        fontFamily: "Cinzel, Georgia, serif",
                                        color: rgba(RAW_RED, 1),
                                        marginRight: "0.4rem",
                                    }}
                                >
                                    {"›"}
                                </motion.span>
                            ) : null}
                            {line.prompt}{" "}
                            <span
                                style={{
                                    fontFamily: "Cinzel, Georgia, serif",
                                    letterSpacing: "0.05em",
                                    color: isActive ? rgba(RAW_RED, 1) : "inherit",
                                    textDecoration: isPast ? "line-through" : "none",
                                }}
                            >
                                {line.bold}
                            </span>{" "}
                            {line.suffix}
                            {line.level ? (
                                <span
                                    style={{
                                        marginLeft: "0.45rem",
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        fontSize: phoneScreen ? "0.68rem" : "0.72rem",
                                        letterSpacing: "0.11em",
                                        textTransform: "uppercase",
                                        opacity: isActive ? 0.72 : 0.5,
                                    }}
                                >
                                    lvl {line.level}
                                </span>
                            ) : null}
                        </Text>
                    </motion.div>
                </Box>
            )
        })}
        {footerText ? (
            <Text
                ta="center"
                style={{
                    fontFamily: "Inter, Segoe UI, sans-serif",
                    fontSize: "0.78rem",
                    letterSpacing: "0.06em",
                    color: rgba(RAW_GREY, 0.42),
                }}
            >
                {footerText}
            </Text>
        ) : null}
    </Stack>
)
