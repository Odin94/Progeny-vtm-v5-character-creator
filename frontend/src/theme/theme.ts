import {
    Accordion,
    ActionIcon,
    Alert,
    Anchor,
    AppShell,
    Autocomplete,
    Badge,
    Button,
    Card,
    Checkbox,
    CloseButton,
    Combobox,
    createTheme,
    defaultVariantColorsResolver,
    Divider,
    Drawer,
    HoverCard,
    Input,
    Kbd,
    Loader,
    Menu,
    Modal,
    MultiSelect,
    Notification,
    NumberInput,
    Paper,
    Popover,
    Progress,
    ScrollArea,
    SegmentedControl,
    Select,
    Skeleton,
    Switch,
    Table,
    Tabs,
    TagsInput,
    Title,
    Tooltip,
    type MantineThemeOverride,
    type VariantColorsResolver
} from "@mantine/core"
import { globals } from "~/globals"
import classes from "./components.module.css"
import { inputFocusTheme } from "./inputFocus"
import { modalTheme } from "./modal"
import { SigilLoader } from "./SigilLoader"
import { ashPalette, bloodPalette, darkPalette, goldPalette, grapePalette } from "./tokens"
import {
    drawerTransitionProps,
    popoverTransitionProps,
    tooltipTransitionProps
} from "./transitions"

const NEUTRAL_COLORS = new Set(["gray", "dark"])

/**
 * Tunes Mantine's variants for a dark, candlelit UI:
 * - `light` becomes a translucent tint with a faint same-hue border (reads well over imagery)
 * - `default` is the raised "secondary" surface
 * - `subtle`/`outline` hovers are translucent tints instead of opaque fills
 * - neutral (gray/dark) light/subtle use bone ink instead of cool grey
 * Everything is expressed in CSS variables so it follows the nested clan theme on the sheet.
 */
const variantColorResolver: VariantColorsResolver = (input) => {
    const base = defaultVariantColorsResolver(input)
    const colorName = (input.color || input.theme.primaryColor).split(".")[0]
    const isThemeColor = colorName in input.theme.colors && !input.color?.includes(".")
    const isNeutral = NEUTRAL_COLORS.has(colorName)
    const shade = (n: number) => `var(--mantine-color-${colorName}-${n})`
    const mix = (value: string, pct: number) => `color-mix(in srgb, ${value} ${pct}%, transparent)`

    if (input.variant === "default") {
        return {
            background: "var(--pg-surface-3)",
            hover: "var(--pg-surface-4)",
            color: "var(--pg-ink)",
            border: "1px solid var(--pg-border)"
        }
    }

    if (!isThemeColor) {
        return base
    }

    if (input.variant === "light") {
        return isNeutral
            ? {
                  background: "rgba(242, 220, 210, 0.06)",
                  hover: "rgba(242, 220, 210, 0.1)",
                  color: "var(--pg-ink-2)",
                  border: "1px solid var(--pg-border)"
              }
            : {
                  background: mix(shade(6), 16),
                  hover: mix(shade(6), 24),
                  color: shade(3),
                  border: `1px solid ${mix(shade(5), 24)}`
              }
    }

    if (input.variant === "subtle") {
        return isNeutral
            ? {
                  background: "transparent",
                  hover: "rgba(242, 220, 210, 0.07)",
                  color: "var(--pg-ink-2)",
                  border: "1px solid transparent"
              }
            : {
                  background: "transparent",
                  hover: mix(shade(6), 14),
                  color: shade(3),
                  border: "1px solid transparent"
              }
    }

    if (input.variant === "outline") {
        return isNeutral
            ? {
                  background: "transparent",
                  hover: "rgba(242, 220, 210, 0.06)",
                  color: "var(--pg-ink-2)",
                  border: "1px solid var(--pg-border-strong)"
              }
            : {
                  background: "transparent",
                  hover: mix(shade(6), 12),
                  color: shade(3),
                  border: `1px solid ${mix(shade(5), 55)}`
              }
    }

    return base
}

const comboboxClassNames = {
    dropdown: classes.floating,
    option: classes.option,
    empty: classes.comboboxEmpty,
    groupLabel: classes.comboboxGroupLabel
}

const comboboxDefaultProps = {
    comboboxProps: { transitionProps: popoverTransitionProps, shadow: "lg" }
}

export const progenyTheme: MantineThemeOverride = createTheme({
    colors: {
        dark: darkPalette,
        red: bloodPalette,
        grape: grapePalette,
        gray: ashPalette,
        gold: goldPalette
    },
    primaryColor: "grape",
    primaryShade: { light: 6, dark: 7 },
    white: "#fbf7f5",
    black: "#0a0809",
    autoContrast: true,
    luminanceThreshold: 0.36,

    fontFamily: "var(--pg-font-body)",
    fontFamilyMonospace: "var(--pg-font-mono)",
    headings: {
        fontFamily: "var(--pg-font-display)",
        fontWeight: "600",
        textWrap: "balance",
        sizes: {
            h1: { fontSize: "2.25rem", lineHeight: "1.15" },
            h2: { fontSize: "1.75rem", lineHeight: "1.2" },
            h3: { fontSize: "1.375rem", lineHeight: "1.25" },
            h4: { fontSize: "1.125rem", lineHeight: "1.3" },
            h5: { fontSize: "1rem", lineHeight: "1.35" },
            h6: { fontSize: "0.875rem", lineHeight: "1.4" }
        }
    },

    defaultRadius: "md",
    radius: { xs: "2px", sm: "4px", md: "6px", lg: "10px", xl: "16px" },
    shadows: {
        xs: "var(--pg-shadow-1)",
        sm: "var(--pg-shadow-2)",
        md: "var(--pg-shadow-2)",
        lg: "var(--pg-shadow-3)",
        xl: "var(--pg-shadow-4)"
    },
    breakpoints: {
        xs: "576px",
        sm: "768px",
        md: "992px",
        lg: `${globals.smallScreenW}px`,
        xl: `${globals.largeScreenW}px`
    },

    cursorType: "pointer",
    focusRing: "auto",
    // Reduced motion is handled by CSS variables (scale → 1, fades kept) — see index.css.
    respectReducedMotion: false,
    variantColorResolver,

    components: {
        ...inputFocusTheme,
        ...modalTheme,

        // ---- Actions ----------------------------------------------------------
        Button: Button.extend({
            classNames: { root: classes.button, section: classes.buttonSection }
        }),
        ActionIcon: ActionIcon.extend({
            classNames: { root: classes.actionIcon }
        }),
        CloseButton: CloseButton.extend({
            classNames: { root: classes.closeButton }
        }),
        Anchor: Anchor.extend({
            classNames: { root: classes.anchor }
        }),

        // ---- Surfaces -----------------------------------------------------------
        Paper: Paper.extend({
            classNames: { root: classes.paper }
        }),
        Card: Card.extend({
            defaultProps: { radius: "md" },
            classNames: { root: classes.card, section: classes.cardSection }
        }),
        Divider: Divider.extend({
            classNames: { root: classes.divider, label: classes.dividerLabel }
        }),
        AppShell: AppShell.extend({
            classNames: {
                header: classes.appShellHeader,
                navbar: classes.appShellNavbar,
                aside: classes.appShellAside,
                main: classes.appShellMain
            }
        }),
        Drawer: Drawer.extend({
            defaultProps: {
                transitionProps: drawerTransitionProps,
                overlayProps: { blur: 6 }
            },
            classNames: {
                content: classes.drawerContent,
                title: classes.modalTitle,
                overlay: classes.overlay
            }
        }),

        // ---- Typography --------------------------------------------------------
        Title: Title.extend({
            classNames: { root: classes.title }
        }),
        Kbd: Kbd.extend({
            classNames: { root: classes.kbd }
        }),

        // ---- Floating ---------------------------------------------------------
        Popover: Popover.extend({
            defaultProps: { transitionProps: popoverTransitionProps, shadow: "lg" },
            classNames: { dropdown: classes.floating, arrow: classes.floatingArrow }
        }),
        HoverCard: HoverCard.extend({
            defaultProps: { transitionProps: popoverTransitionProps, shadow: "lg" },
            classNames: { dropdown: classes.floating, arrow: classes.floatingArrow }
        }),
        Menu: Menu.extend({
            defaultProps: { transitionProps: popoverTransitionProps, shadow: "lg" },
            classNames: {
                dropdown: classes.floating,
                arrow: classes.floatingArrow,
                item: classes.menuItem,
                itemSection: classes.menuItemSection,
                label: classes.menuLabel,
                divider: classes.menuDivider
            }
        }),
        Tooltip: Tooltip.extend({
            defaultProps: {
                transitionProps: tooltipTransitionProps,
                withArrow: true,
                arrowSize: 6
            },
            classNames: { tooltip: classes.tooltip, arrow: classes.tooltipArrow }
        }),
        Combobox: Combobox.extend({
            defaultProps: { transitionProps: popoverTransitionProps, shadow: "lg" },
            classNames: comboboxClassNames
        }),
        Select: Select.extend({
            defaultProps: { ...comboboxDefaultProps, checkIconPosition: "right" },
            classNames: comboboxClassNames
        }),
        MultiSelect: MultiSelect.extend({
            defaultProps: comboboxDefaultProps,
            classNames: { ...comboboxClassNames, pill: classes.pill }
        }),
        Autocomplete: Autocomplete.extend({
            defaultProps: comboboxDefaultProps,
            classNames: comboboxClassNames
        }),
        TagsInput: TagsInput.extend({
            defaultProps: comboboxDefaultProps,
            classNames: { ...comboboxClassNames, pill: classes.pill }
        }),
        NumberInput: NumberInput.extend({
            classNames: { controls: classes.inputSection }
        }),

        // ---- Feedback ---------------------------------------------------------
        Notification: Notification.extend({
            classNames: {
                root: classes.notification,
                title: classes.notificationTitle,
                description: classes.notificationDescription
            }
        }),
        Alert: Alert.extend({
            defaultProps: { radius: "md" },
            classNames: { root: classes.alert, title: classes.alertTitle }
        }),
        Badge: Badge.extend({
            defaultProps: { radius: "sm" },
            classNames: { root: classes.badge }
        }),
        Loader: Loader.extend({
            defaultProps: {
                loaders: { ...Loader.defaultLoaders, sigil: SigilLoader },
                type: "sigil"
            }
        }),
        Skeleton: Skeleton.extend({
            classNames: { root: classes.skeleton }
        }),
        Progress: Progress.extend({
            classNames: { root: classes.progressRoot }
        }),

        // ---- Navigation / data ----------------------------------------------------
        Tabs: Tabs.extend({
            classNames: { list: classes.tabsList, tab: classes.tab }
        }),
        Accordion: Accordion.extend({
            classNames: {
                item: classes.accordionItem,
                control: classes.accordionControl,
                chevron: classes.accordionChevron
            }
        }),
        Table: Table.extend({
            classNames: { table: classes.table, th: classes.tableTh }
        }),
        SegmentedControl: SegmentedControl.extend({
            classNames: {
                root: classes.segmentedRoot,
                indicator: classes.segmentedIndicator,
                label: classes.segmentedLabel
            }
        }),
        Checkbox: Checkbox.extend({
            classNames: { input: classes.checkboxInput }
        }),
        Switch: Switch.extend({
            defaultProps: { withThumbIndicator: false },
            classNames: {
                input: classes.switchInput,
                track: classes.switchTrack,
                thumb: classes.switchThumb
            }
        }),
        ScrollArea: ScrollArea.extend({
            defaultProps: { scrollbarSize: 10 },
            classNames: { scrollbar: classes.scrollbar, thumb: classes.scrollThumb }
        }),
        Input: Input.extend({
            ...inputFocusTheme.Input,
            classNames: {
                wrapper: classes.inputWrapper,
                input: classes.input,
                section: classes.inputSection
            }
        }),
        InputWrapper: Input.Wrapper.extend({
            classNames: {
                label: classes.inputLabel,
                description: classes.inputDescription,
                error: classes.inputError
            }
        })
    }
})
