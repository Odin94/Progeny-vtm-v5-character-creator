import { Text, Textarea, Tooltip } from "@mantine/core"
import type { MouseEvent } from "react"
import { Power } from "~/data/Disciplines"
import { Character } from "~/data/Character"
import { getValueForKey } from "~/generator/utils"
import classes from "../sheet.module.css"
import HomebrewBadge from "~/components/HomebrewBadge"

type DisciplinePowerCardProps = {
    power: Power
    primaryColor: string
    onClick?: () => void
    inModal: boolean
    renderActions?: () => React.ReactNode
    character?: Character
    disabled?: boolean
    disabledTooltip?: string | null
    onDisabledClick?: () => void
    customText?: string
    onCustomTextChange?: (value: string) => void
    isEditingCustomText?: boolean
    onFinishCustomTextEditing?: () => void
    onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
}

export const calculateDicePoolValues = (
    dicePoolString: string,
    character: Character
): string | null => {
    if (!dicePoolString || dicePoolString.trim() === "" || dicePoolString === "-") {
        return null
    }

    const components = dicePoolString.split("+").map((comp) => comp.trim())

    const values: number[] = []

    for (const component of components) {
        const alternatives = component.split("/").map((alt) => alt.trim())

        if (alternatives.length === 1) {
            const value = getValueForKey(alternatives[0].toLowerCase(), character)
            values.push(value)
        } else {
            let bestValue = getValueForKey(alternatives[0].toLowerCase(), character)
            for (let i = 1; i < alternatives.length; i++) {
                const value = getValueForKey(alternatives[i].toLowerCase(), character)
                if (value > bestValue) {
                    bestValue = value
                }
            }
            values.push(bestValue)
        }
    }

    return values.join(" + ")
}

const ROUSE_DROP_PATH = "M9 1.2C9 1.2 1.6 9.6 1.6 14.6a7.4 7.4 0 0 0 14.8 0C16.4 9.6 9 1.2 9 1.2Z"

/** Rouse cost as blood drops ("Free" when it costs nothing). */
export const RouseCost = ({ count }: { count: number }) => (
    <span
        className={classes.rouse}
        aria-label={count > 0 ? `${count} rouse check${count === 1 ? "" : "s"}` : "No rouse check"}
    >
        {count > 0 ? (
            <>
                {Array.from({ length: count }, (_, index) => (
                    <svg key={index} className={classes.rouseDrop} viewBox="0 0 18 23">
                        <path d={ROUSE_DROP_PATH} fill="currentColor" />
                    </svg>
                ))}
                <span>Rouse</span>
            </>
        ) : (
            <span>Free</span>
        )}
    </span>
)

const DicePool = ({ dicePool, character }: { dicePool: string; character?: Character }) => {
    const values = character ? calculateDicePoolValues(dicePool, character) : null
    return values ? (
        <Tooltip label={values} withArrow>
            <span className={classes.dicePool} data-help>
                {dicePool}
            </span>
        </Tooltip>
    ) : (
        <span className={classes.dicePool}>{dicePool}</span>
    )
}

const DisciplinePowerCard = ({
    power,
    onClick,
    inModal,
    renderActions,
    character,
    disabled = false,
    disabledTooltip,
    onDisabledClick,
    customText = "",
    onCustomTextChange,
    isEditingCustomText = false,
    onFinishCustomTextEditing,
    onContextMenu
}: DisciplinePowerCardProps) => {
    const hasDicePool = !!power.dicePool && power.dicePool !== "-"
    const card = (
        <div
            className={`${classes.card} ${classes.powerCard}`}
            data-sheet-power={power.name}
            data-in-modal={inModal || undefined}
            data-disabled={(inModal && disabled) || undefined}
            data-actionable={onContextMenu ? true : undefined}
            onClick={inModal ? (disabled ? onDisabledClick : onClick) : undefined}
            onContextMenu={onContextMenu}
        >
            <div className={classes.cardHead}>
                <span className={classes.powerLevel} aria-label={`Level ${power.level}`}>
                    {power.level}
                </span>
                <p className={classes.cardTitle}>{power.name}</p>
                {renderActions ? (
                    <div className={classes.cardActions}>{renderActions()}</div>
                ) : null}
            </div>
            {power.homebrewSource ? <HomebrewBadge source={power.homebrewSource} /> : null}
            {power.summary ? (
                <Text component="p" className={classes.cardBody} lineClamp={4}>
                    {power.summary.charAt(0).toUpperCase() + power.summary.slice(1)}
                </Text>
            ) : null}
            {onCustomTextChange && isEditingCustomText ? (
                <Textarea
                    aria-label={`${power.name} custom note`}
                    value={customText}
                    onChange={(event) => onCustomTextChange(event.currentTarget.value)}
                    placeholder="Add a custom note..."
                    minRows={2}
                    size="xs"
                    autoFocus
                    onBlur={onFinishCustomTextEditing}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            onFinishCustomTextEditing?.()
                        }
                    }}
                />
            ) : customText ? (
                <p className={classes.cardNote}>{customText}</p>
            ) : null}
            {power.requiredTime || power.ingredients ? (
                <div className={classes.cardMeta}>
                    {power.requiredTime ? (
                        <span>
                            <strong>Time</strong> {power.requiredTime}
                        </span>
                    ) : null}
                    {power.ingredients ? (
                        <span>
                            <strong>Ingredients</strong> {power.ingredients}
                        </span>
                    ) : null}
                </div>
            ) : null}
            <div className={classes.cardFoot}>
                {hasDicePool ? (
                    <DicePool dicePool={power.dicePool} character={character} />
                ) : (
                    <span />
                )}
                <RouseCost count={power.rouseChecks} />
            </div>
        </div>
    )

    if (inModal && disabled && disabledTooltip) {
        return (
            <Tooltip label={disabledTooltip} withArrow>
                <div style={{ width: "100%" }}>{card}</div>
            </Tooltip>
        )
    }

    return card
}

export default DisciplinePowerCard
