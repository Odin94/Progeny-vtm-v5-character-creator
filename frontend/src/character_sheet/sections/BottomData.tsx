import { memo, useCallback } from "react"
import DamagePips from "~/character_sheet/components/DamagePips"
import HumanityStainsPips from "~/character_sheet/components/HumanityStainsPips"
import Pips from "~/character_sheet/components/Pips"
import RemorseTestButton from "~/character_sheet/components/RemorseTestButton"
import RouseCheckButton from "~/character_sheet/components/RouseCheckButton"
import SquarePips from "~/character_sheet/components/SquarePips"
import { SheetOptions } from "../CharacterSheet"
import classes from "../sheet.module.css"

type BottomDataProps = {
    options: SheetOptions
}

// Boxes still unmarked, matching how DamagePips draws a track (aggravated is a subset of the
// marked boxes, but tolerate data where it is not).
const remainingBoxes = (max: number, superficial: number, aggravated: number) =>
    Math.max(0, max - Math.max(superficial, aggravated))

const BottomData = ({ options }: BottomDataProps) => {
    const { character, setCharacter, primaryColor, mode } = options
    const {
        superficialDamage,
        aggravatedDamage,
        superficialWillpowerDamage,
        aggravatedWillpowerDamage,
        hunger,
        humanityStains
    } = character.ephemeral
    const emptyHumanityPips = 10 - character.humanity
    const showMaxTracks = mode === "free"
    const healthLeft = remainingBoxes(character.maxHealth, superficialDamage, aggravatedDamage)
    const willpowerLeft = remainingBoxes(
        character.willpower,
        superficialWillpowerDamage,
        aggravatedWillpowerDamage
    )
    const updateHealthDamage = useCallback(
        (newSuperficial: number, newAggravated: number) =>
            setCharacter((current) => ({
                ...current,
                ephemeral: {
                    ...current.ephemeral,
                    superficialDamage: newSuperficial,
                    aggravatedDamage: newAggravated
                }
            })),
        [setCharacter]
    )
    const updateWillpowerDamage = useCallback(
        (newSuperficial: number, newAggravated: number) =>
            setCharacter((current) => ({
                ...current,
                ephemeral: {
                    ...current.ephemeral,
                    superficialWillpowerDamage: newSuperficial,
                    aggravatedWillpowerDamage: newAggravated
                }
            })),
        [setCharacter]
    )

    return (
        <div className={classes.vitals}>
            <div className={classes.vital}>
                <div className={classes.vitalHead}>
                    <h3 className={classes.vitalTitle}>Health</h3>
                    <span className={classes.vitalValue} aria-label="Health remaining">
                        {healthLeft}
                        <small> / {character.maxHealth}</small>
                    </span>
                </div>
                <div className={classes.vitalTrack}>
                    {showMaxTracks ? (
                        <div className={classes.vitalCaption}>
                            <span className={classes.label}>Max</span>
                            <Pips
                                level={character.maxHealth}
                                maxLevel={10}
                                options={options}
                                field="maxHealth"
                                label="Max health"
                            />
                        </div>
                    ) : null}
                    <DamagePips
                        maxValue={character.maxHealth}
                        superficial={superficialDamage}
                        aggravated={aggravatedDamage}
                        onChange={updateHealthDamage}
                        disabledReason={options.editDisabledReason}
                        label="Health"
                    />
                    {character.maxHealth > 0 && healthLeft === 0 ? (
                        <p className={classes.vitalStatus}>Impaired</p>
                    ) : null}
                </div>
            </div>

            <div className={classes.vital}>
                <div className={classes.vitalHead}>
                    <h3 className={classes.vitalTitle}>Willpower</h3>
                    <span className={classes.vitalValue} aria-label="Willpower remaining">
                        {willpowerLeft}
                        <small> / {character.willpower}</small>
                    </span>
                </div>
                <div className={classes.vitalTrack}>
                    {showMaxTracks ? (
                        <div className={classes.vitalCaption}>
                            <span className={classes.label}>Max</span>
                            <Pips
                                level={character.willpower}
                                maxLevel={10}
                                options={options}
                                field="willpower"
                                label="Max willpower"
                            />
                        </div>
                    ) : null}
                    <DamagePips
                        maxValue={character.willpower}
                        superficial={superficialWillpowerDamage}
                        aggravated={aggravatedWillpowerDamage}
                        onChange={updateWillpowerDamage}
                        disabledReason={options.editDisabledReason}
                        label="Willpower"
                    />
                    {character.willpower > 0 && willpowerLeft === 0 ? (
                        <p className={classes.vitalStatus}>Impaired</p>
                    ) : null}
                </div>
            </div>

            <div className={classes.vital}>
                <div className={classes.vitalHead}>
                    <h3 className={classes.vitalTitle}>Humanity</h3>
                    <span className={classes.vitalValue}>{character.humanity}</span>
                    <RemorseTestButton
                        character={character}
                        setCharacter={setCharacter}
                        primaryColor={primaryColor}
                        size="md"
                        iconSize={18}
                        disabledReason={options.editDisabledReason}
                    />
                </div>
                <div className={classes.vitalTrack} style={{ width: "fit-content" }}>
                    <SquarePips
                        value={character.humanity}
                        options={options}
                        field="humanity"
                        maxLevel={10}
                        groupSize={5}
                        label="Humanity"
                    />
                    {emptyHumanityPips > 0 ? (
                        <div className={classes.stainsRow}>
                            <span className={classes.label}>Stains</span>
                            <HumanityStainsPips
                                value={humanityStains}
                                maxLevel={emptyHumanityPips}
                                filledHumanity={character.humanity}
                                options={options}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            <div className={classes.vital} data-tone="blood">
                <div className={classes.vitalHead}>
                    <h3 className={classes.vitalTitle}>Hunger</h3>
                    <span className={classes.vitalValue}>
                        {hunger}
                        <small> / 5</small>
                    </span>
                    <RouseCheckButton
                        character={character}
                        setCharacter={setCharacter}
                        primaryColor={primaryColor}
                        size="md"
                        iconSize={18}
                        disabledReason={options.editDisabledReason}
                    />
                </div>
                <SquarePips
                    value={hunger}
                    options={options}
                    field="ephemeral.hunger"
                    maxLevel={5}
                    shape="drop"
                    label="Hunger"
                />
            </div>
        </div>
    )
}

export default memo(BottomData, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.maxHealth === n.character.maxHealth &&
        p.character.willpower === n.character.willpower &&
        p.character.humanity === n.character.humanity &&
        p.character.ephemeral === n.character.ephemeral
    )
})
