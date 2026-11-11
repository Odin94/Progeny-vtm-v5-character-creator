import {
    ActionIcon,
    Tooltip,
    type ActionIconProps,
    type FloatingPosition,
    type TooltipProps
} from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { forwardRef, type MouseEventHandler, type ReactElement, type ReactNode } from "react"
import classes from "./ui.module.css"

type BaseIconButtonProps = Omit<ActionIconProps, "children"> & {
    /** Used for the tooltip AND the accessible name. Keep it a short verb phrase. */
    label: string
    onClick?: MouseEventHandler<HTMLButtonElement>
    /** When set, the button is disabled and the tooltip explains why. */
    disabledReason?: string
    tooltipPosition?: FloatingPosition
    type?: "button" | "submit"
    "data-testid"?: string
}

export type IconButtonProps = BaseIconButtonProps & { icon: ReactNode }

/**
 * Icon-only button with a themed tooltip + aria-label. Default: `variant="subtle"`,
 * `color="gray"` (bone ink, faint hover). Pass `variant="filled"` for a primary FAB.
 *
 * ```tsx
 * <IconButton label="Copy invite link" icon={<IconLink size={16} />} onClick={copy} />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            label,
            icon,
            disabledReason,
            disabled,
            tooltipPosition = "top",
            variant = "subtle",
            color = "gray",
            type = "button",
            ...others
        },
        ref
    ) => {
        const isDisabled = disabled || Boolean(disabledReason)
        const button = (
            <ActionIcon
                ref={ref}
                variant={variant}
                color={color}
                aria-label={label}
                type={type}
                disabled={isDisabled}
                {...others}
            >
                {icon}
            </ActionIcon>
        )

        return (
            <Tooltip label={disabledReason ?? label} position={tooltipPosition}>
                {isDisabled ? (
                    <span className={classes.disabledReason} tabIndex={disabledReason ? 0 : -1}>
                        {button}
                    </span>
                ) : (
                    button
                )}
            </Tooltip>
        )
    }
)

IconButton.displayName = "IconButton"

/**
 * The one way to render a delete action in a list/card: a quiet trash icon that turns blood
 * red on hover. Always pair it with a confirmation (`ConfirmActionModal`, confirm label
 * "Delete") unless the action is trivially undoable — then use an Undo toast instead.
 *
 * ```tsx
 * <DeleteIconButton label={`Delete ${character.name}`} onClick={() => setPendingDelete(character)} />
 * ```
 */
export const DeleteIconButton = forwardRef<HTMLButtonElement, BaseIconButtonProps>(
    ({ className, size = "md", ...others }, ref) => (
        <IconButton
            ref={ref}
            icon={<IconTrash size={size === "xs" || size === "sm" ? 14 : 17} stroke={1.7} />}
            size={size}
            className={[classes.deleteButton, className].filter(Boolean).join(" ")}
            {...others}
        />
    )
)

DeleteIconButton.displayName = "DeleteIconButton"

/**
 * Wraps a disabled control so its explanation still shows on hover/focus (disabled buttons
 * do not emit pointer events). Renders the child untouched when `reason` is empty.
 *
 * ```tsx
 * <DisabledReason reason={!name ? "Name your character first" : undefined}>
 *     <Button disabled={!name}>Save</Button>
 * </DisabledReason>
 * ```
 */
export const DisabledReason = ({
    reason,
    children,
    position = "top",
    ...tooltipProps
}: {
    reason?: ReactNode
    children: ReactElement
    position?: FloatingPosition
} & Partial<Omit<TooltipProps, "label" | "children">>) => {
    if (!reason) {
        return children
    }

    return (
        <Tooltip label={reason} position={position} multiline maw={280} {...tooltipProps}>
            <span className={classes.disabledReason} tabIndex={0}>
                {children}
            </span>
        </Tooltip>
    )
}
