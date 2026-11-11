import { memo } from "react"
import { attributesKeySchema, AttributesKey } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import { getAvailableXP } from "../utils/xp"
import classes from "../sheet.module.css"

type AttributesProps = {
    options: SheetOptions
}

type AttributeRowProps = {
    attribute: AttributesKey
    options: SheetOptions
}

const AttributeRow = ({ attribute, options }: AttributeRowProps) => {
    const { character } = options
    const { isSelected, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            isSelected:
                state.selectedDicePool.attribute === attribute ||
                state.selectedDicePool.secondAttribute === attribute,
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )

    const handleAttributeClick = (attribute: AttributesKey) => {
        const diceModalOpened = useDiceRollModalStore.getState().opened

        if (!diceModalOpened) {
            updateSelectedDicePool({
                attribute,
                secondAttribute: null,
                selectedDisciplinePowers: [],
                selectedMeritFlaws: []
            })
            useDiceRollModalStore.getState().openSelectedPool()
            return
        }

        const pool = useCharacterSheetStore.getState().selectedDicePool

        // While the companion slot is occupied by a skill or discipline, an
        // attribute click selects the primary attribute. Otherwise, the next
        // click fills or replaces the attribute companion, so the same
        // attribute can fill both slots (e.g. Strength + Strength).
        if (!pool.attribute || pool.skill || pool.discipline) {
            updateSelectedDicePool({
                attribute: pool.attribute === attribute ? null : attribute,
                secondAttribute: null,
                selectedDisciplinePowers: [],
                selectedMeritFlaws: []
            })
            return
        }

        // Removing the primary from a two-attribute pool promotes its
        // companion. That keeps the pool valid and makes changing either
        // member of a pair possible without resetting the whole roll.
        if (pool.attribute === attribute && pool.secondAttribute) {
            updateSelectedDicePool({
                attribute: pool.secondAttribute,
                secondAttribute: null
            })
            return
        }

        updateSelectedDicePool({
            secondAttribute: pool.secondAttribute === attribute ? null : attribute
        })
    }

    return (
        <div
            className={classes.traitRow}
            data-selected={isSelected || undefined}
            onClick={() => {
                if (useDiceRollModalStore.getState().opened) {
                    handleAttributeClick(attribute)
                }
            }}
        >
            <p
                className={classes.traitName}
                onClick={(event) => {
                    event.stopPropagation()
                    handleAttributeClick(attribute)
                }}
            >
                {upcase(attribute)}
            </p>
            <span className={classes.leader} aria-hidden="true" />
            <div className={classes.traitPips}>
                <Pips
                    level={character.attributes[attribute]}
                    minLevel={1}
                    options={options}
                    field={`attributes.${attribute}`}
                    label={upcase(attribute)}
                />
            </div>
        </div>
    )
}

const MemoizedAttributeRow = memo(AttributeRow, (prev, next) => {
    const previous = prev.options
    const following = next.options
    return (
        prev.attribute === next.attribute &&
        previous.mode === following.mode &&
        previous.primaryColor === following.primaryColor &&
        previous.canEdit === following.canEdit &&
        previous.editDisabledReason === following.editDisabledReason &&
        previous.setCharacter === following.setCharacter &&
        previous.character.attributes[prev.attribute] ===
            following.character.attributes[next.attribute] &&
        (previous.mode !== "xp" ||
            getAvailableXP(previous.character) === getAvailableXP(following.character))
    )
})

const attributeGroups: Array<{ title: string; attributes: string[] }> = [
    { title: "Physical", attributes: ["strength", "dexterity", "stamina"] },
    { title: "Social", attributes: ["charisma", "manipulation", "composure"] },
    { title: "Mental", attributes: ["intelligence", "wits", "resolve"] }
]

const Attributes = ({ options }: AttributesProps) => (
    <div className={classes.triad}>
        {attributeGroups.map(({ title, attributes }) => (
            <div key={title} className={classes.column}>
                <h3 className={classes.columnTitle}>{title}</h3>
                {attributes
                    .map((a) => attributesKeySchema.parse(a))
                    .map((attribute) => (
                        <MemoizedAttributeRow
                            key={attribute}
                            attribute={attribute}
                            options={options}
                        />
                    ))}
            </div>
        ))}
    </div>
)

export default memo(Attributes, (prev, next) => {
    return (
        prev.options.mode === next.options.mode &&
        prev.options.primaryColor === next.options.primaryColor &&
        prev.options.canEdit === next.options.canEdit &&
        prev.options.editDisabledReason === next.options.editDisabledReason &&
        prev.options.setCharacter === next.options.setCharacter &&
        prev.options.character.attributes === next.options.character.attributes &&
        (prev.options.mode !== "xp" ||
            getAvailableXP(prev.options.character) === getAvailableXP(next.options.character))
    )
})
