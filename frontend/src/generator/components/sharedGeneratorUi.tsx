import { Box, Button, Stack, Text, VisuallyHidden, type ButtonProps } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { motion, useReducedMotion } from "framer-motion"
import { createContext, useContext, type MouseEventHandler, type ReactNode } from "react"
import { DisabledReason, Ornament } from "~/components/ui"
import { motion as motionTokens } from "~/theme/tokens"
import classes from "./sharedGeneratorUi.module.css"

export { classes as generatorUiClasses }

// ---------------------------------------------------------------------------
// Step context: lets any step render "Step 3 of 10" without prop drilling.
// Provided by Generator.tsx; absent in isolated renders (tests), where the eyebrow hides.
// ---------------------------------------------------------------------------

export type GeneratorStepInfo = {
    /** Zero-based position in the visible step list. */
    index: number
    total: number
    label: string
}

export const GeneratorStepContext = createContext<GeneratorStepInfo | null>(null)

export const useGeneratorStepInfo = () => useContext(GeneratorStepContext)

/** Small gold "Step 3 of 10" label. Renders nothing outside the generator. */
export const GeneratorStepEyebrow = ({ children }: { children?: ReactNode }) => {
    const step = useGeneratorStepInfo()
    if (!children && !step) return null

    return (
        <span className={classes.eyebrow}>
            {children ?? `Step ${step!.index + 1} of ${step!.total}`}
        </span>
    )
}

type GeneratorStepHeroProps = {
    leadText: string
    accentText: string
    description?: ReactNode
    secondaryDescription?: ReactNode
    maxWidth?: number | string
    /** @deprecated Titles use the shared type scale now; kept for API compatibility. */
    mobileTitleSize?: string
    /** @deprecated Titles use the shared type scale now; kept for API compatibility. */
    desktopTitleSize?: string
    marginBottom?: number
    /** Overrides the automatic "Step N of M" eyebrow. Pass `false` to hide it. */
    eyebrow?: ReactNode | false
    titleTestId?: string
}

type GeneratorSectionDividerProps = {
    label: string
    lineHeight?: 1 | 2
    /** @deprecated The divider uses the gold border token now; kept for API compatibility. */
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

const labelBase = {
    fontFamily: "var(--pg-font-body)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "var(--pg-tracking-caps)",
    textTransform: "uppercase" as const,
    marginBottom: 8
}

/**
 * Field styles for generator forms. The inputs themselves come from the Mantine theme;
 * these only add the generator's caps labels. Keys are kept for backwards compatibility.
 */
export const generatorFieldStyles = {
    goldLabel: {
        ...labelBase,
        color: "var(--pg-gold)"
    },
    mutedLabel: {
        ...labelBase,
        color: "var(--pg-ink-3)"
    },
    description: {
        fontFamily: "var(--pg-font-body)",
        fontSize: "0.78rem",
        color: "var(--pg-ink-3)",
        marginBottom: 6
    },
    input: {
        fontFamily: "var(--pg-font-body)"
    }
} as const

export const getGeneratorFieldStyles = (labelTone: "gold" | "muted" = "gold") => ({
    label: labelTone === "gold" ? generatorFieldStyles.goldLabel : generatorFieldStyles.mutedLabel,
    input: generatorFieldStyles.input,
    description: generatorFieldStyles.description
})

export const GeneratorStepHero = ({
    leadText,
    accentText,
    description,
    secondaryDescription,
    maxWidth,
    marginBottom = 26,
    eyebrow,
    titleTestId
}: GeneratorStepHeroProps) => (
    <Box className={classes.hero} maw={maxWidth ?? 680} mb={marginBottom}>
        {eyebrow === false ? null : <GeneratorStepEyebrow>{eyebrow}</GeneratorStepEyebrow>}
        <h2 className={classes.heroTitle} data-testid={titleTestId}>
            {leadText} <span className={classes.heroAccent}>{accentText}</span>
        </h2>
        <Ornament className={classes.heroOrnament} />
        {description ? <p className={classes.heroDescription}>{description}</p> : null}
        {secondaryDescription ? (
            <p className={classes.heroSecondary}>{secondaryDescription}</p>
        ) : null}
    </Box>
)

export const GeneratorSectionDivider = ({
    label,
    lineHeight = 1,
    titleSize = "0.88rem",
    marginY = "lg"
}: GeneratorSectionDividerProps) => (
    <Box my={marginY} className={classes.divider} role="separator" aria-label={label}>
        <span className={classes.dividerRule} data-weight={lineHeight} />
        <span className={classes.dividerLabel} style={{ fontSize: titleSize }}>
            {label}
        </span>
        <span className={classes.dividerRule} data-side="end" data-weight={lineHeight} />
    </Box>
)

const LevelPips = ({ level }: { level: number }) => (
    <span className={classes.promptLevel} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={classes.promptPip}
                data-empty={index >= level || undefined}
            />
        ))}
    </span>
)

export const GeneratorPhasePrompt = ({
    lines,
    activeKey,
    phoneScreen,
    showChevron = true,
    footerText,
    caption,
    marginBottom = "md"
}: GeneratorPhasePromptProps) => {
    const shouldReduceMotion = useReducedMotion()
    const hasFooterText = footerText !== undefined && footerText !== null

    return (
        // translate="no" / notranslate: this subtree re-renders its text on every pick (the
        // "Pick N" counter and active-line switch). Browser page-translation (Chrome, Safari,
        // Edge) rewrites text nodes out from under React, so those re-renders would otherwise
        // crash the reconciler with a DOMException (insertBefore/removeChild NotFoundError).
        <Stack gap={4} align="center" mb={marginBottom} className="notranslate" translate="no">
            <GeneratorStepEyebrow />
            {caption ? <Text className={classes.promptCaption}>{caption}</Text> : null}
            {lines.map((line) => {
                const isActive = activeKey === line.key
                const isPast = line.done && !isActive

                return (
                    <Box
                        key={line.key}
                        style={{
                            position: "relative",
                            height: phoneScreen ? "1.9rem" : "2.35rem",
                            width: "100%"
                        }}
                    >
                        <motion.div
                            initial={{
                                opacity: 0,
                                transform: shouldReduceMotion ? "none" : "translateY(4px)"
                            }}
                            animate={{
                                opacity: isPast ? 0.6 : isActive ? 1 : 0.78,
                                transform: "none"
                            }}
                            transition={{ duration: 0.16, ease: motionTokens.curve.out }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <Text
                                ta="center"
                                className={classes.promptLine}
                                data-active={isActive || undefined}
                                data-past={isPast || undefined}
                                style={{
                                    fontSize: isActive
                                        ? phoneScreen
                                            ? "1.15rem"
                                            : "1.45rem"
                                        : phoneScreen
                                          ? "0.95rem"
                                          : "1.02rem"
                                }}
                            >
                                {isActive && showChevron ? (
                                    <span className={classes.promptChevron}>{"›"}</span>
                                ) : null}
                                {line.prompt}{" "}
                                <span className={classes.promptBold}>{line.bold}</span>{" "}
                                {line.suffix}
                                {line.level ? (
                                    <>
                                        <LevelPips level={line.level} />
                                        <VisuallyHidden>lvl {line.level}</VisuallyHidden>
                                    </>
                                ) : null}
                            </Text>
                        </motion.div>
                    </Box>
                )
            })}
            {/* Keep the instruction slot in the layout after its copy is cleared. Otherwise the
                section below jumps upward and shifts the attribute buttons under the pointer. */}
            <Text
                aria-hidden={!hasFooterText}
                data-testid="generator-phase-prompt-footer"
                ta="center"
                className={classes.promptFooter}
                style={{ visibility: hasFooterText ? "visible" : "hidden" }}
            >
                {hasFooterText ? footerText : " "}
            </Text>
        </Stack>
    )
}

// ---------------------------------------------------------------------------
// Confirm button + footer: the one "advance" action every step shares.
// ---------------------------------------------------------------------------

export type GeneratorConfirmButtonProps = Omit<ButtonProps, "children"> & {
    children?: ReactNode
    onClick?: MouseEventHandler<HTMLButtonElement>
    /** Disables the button and explains why on hover/focus. */
    disabledReason?: ReactNode
    /** Hide the trailing arrow (e.g. for a final/"Done" action). */
    hideIcon?: boolean
    "data-testid"?: string
    type?: "button" | "submit"
}

/**
 * The generator's primary "Confirm"/"Continue" button: blood-to-violet fill, Cinzel caps,
 * trailing arrow. When `disabledReason` is set the button is disabled and a tooltip says why.
 */
export const GeneratorConfirmButton = ({
    children = "Confirm",
    disabledReason,
    disabled,
    hideIcon,
    className,
    classNames,
    type = "button",
    ...others
}: GeneratorConfirmButtonProps) => {
    const isDisabled = disabled || Boolean(disabledReason)

    return (
        <DisabledReason reason={isDisabled ? disabledReason : undefined}>
            <Button
                type={type}
                color="red"
                size="md"
                disabled={isDisabled}
                rightSection={
                    hideIcon ? undefined : (
                        <IconArrowRight size={17} stroke={1.8} className={classes.confirmIcon} />
                    )
                }
                className={[classes.confirmButton, className].filter(Boolean).join(" ")}
                classNames={{ label: classes.confirmLabel, ...(classNames as object) }}
                {...others}
            >
                {children}
            </Button>
        </DisabledReason>
    )
}

/** Centered action row under a step (secondary actions left of the confirm button). */
export const GeneratorStepFooter = ({
    children,
    className
}: {
    children: ReactNode
    className?: string
}) => <div className={[classes.stepFooter, className].filter(Boolean).join(" ")}>{children}</div>
