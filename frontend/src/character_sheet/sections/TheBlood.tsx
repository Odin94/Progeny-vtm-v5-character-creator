import { Button } from "@mantine/core"
import { IconSwitchHorizontal } from "@tabler/icons-react"
import { memo } from "react"
import {
    getBloodPotencyEffectLevel,
    potencyEffects,
    potencyLimitByGeneration
} from "~/data/BloodPotency"
import {
    getClanBaneText,
    getClanCompulsionText,
    hasVariantClanBane,
    variantClanBanes
} from "~/data/VariantClanBanes"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import classes from "../sheet.module.css"
import { getOrdinal } from "../utils/ordinal"

type TheBloodProps = {
    options: SheetOptions
}

const BloodStat = ({ label, value }: { label: string; value: string }) => {
    const isEmpty = !value || value === "-"
    return (
        <div className={classes.bloodStat}>
            <span className={classes.label}>{label}</span>
            <p className={classes.bloodStatValue} data-muted={isEmpty || undefined}>
                {isEmpty ? "None" : value}
            </p>
        </div>
    )
}

const TheBlood = ({ options }: TheBloodProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const effects =
        potencyEffects[getBloodPotencyEffectLevel(character.bloodPotency)] || potencyEffects[0]
    const variantBane = variantClanBanes[character.clan]
    const baneText = getClanBaneText(character, effects.bane)
    const compulsionText = getClanCompulsionText(character)
    const limits = potencyLimitByGeneration[character.generation]

    const canToggleClanBane = mode !== "play" && hasVariantClanBane(character.clan)

    return (
        <div className={classes.blood}>
            <div className={classes.potency}>
                <div className={classes.potencyHead}>
                    <p className={classes.potencyNumeral} aria-hidden="true">
                        {character.bloodPotency}
                    </p>
                    <div>
                        <h3 className={classes.potencyTitle}>Blood Potency</h3>
                        {limits ? (
                            <p className={classes.potencyLimit}>
                                {getOrdinal(character.generation)} generation:{" "}
                                {limits.min === limits.max
                                    ? limits.min
                                    : `${limits.min}–${limits.max}`}
                            </p>
                        ) : null}
                    </div>
                </div>
                <Pips
                    level={character.bloodPotency}
                    maxLevel={10}
                    minLevel={0}
                    mobileColumns={5}
                    options={options}
                    field="bloodPotency"
                    label="Blood Potency"
                />
            </div>

            <div className={classes.bloodStats}>
                <BloodStat
                    label="Blood Surge"
                    value={`+${effects.surge} ${effects.surge === 1 ? "die" : "dice"}`}
                />
                <BloodStat label="Mend" value={effects.mend} />
                <BloodStat label="Power bonus" value={effects.discBonus} />
                <BloodStat label="Rouse re-roll" value={effects.discRouse} />
                <BloodStat label="Bane severity" value={String(effects.bane)} />
            </div>

            <div className={classes.bloodLore}>
                <div className={classes.loreBlock}>
                    <span className={classes.label}>Feeding penalty</span>
                    {effects.penalty === "-" ? (
                        <p className={classes.loreText} data-empty>
                            None
                        </p>
                    ) : (
                        effects.penalty.split("\n").map((line, i) => (
                            <p key={i} className={classes.loreText}>
                                {line}
                            </p>
                        ))
                    )}
                </div>
                <div className={classes.loreBlock}>
                    <span className={classes.label}>Clan bane</span>
                    <p className={classes.loreText} data-empty={!baneText || undefined}>
                        {baneText || "—"}
                    </p>
                    {canToggleClanBane ? (
                        <Button
                            size="xs"
                            variant="light"
                            color={primaryColor}
                            leftSection={<IconSwitchHorizontal size={14} />}
                            onClick={() =>
                                setCharacter((current) => ({
                                    ...current,
                                    clanBane: current.clanBane === "variant" ? "default" : "variant"
                                }))
                            }
                        >
                            {character.clanBane === "variant"
                                ? "Use Default Bane"
                                : `Use ${variantBane?.name ?? "Variant"} Bane`}
                        </Button>
                    ) : null}
                </div>
                <div className={classes.loreBlock}>
                    <span className={classes.label}>Clan compulsion</span>
                    <p className={classes.loreText} data-empty={!compulsionText || undefined}>
                        {compulsionText || "—"}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default memo(TheBlood, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.bloodPotency === n.character.bloodPotency &&
        p.character.generation === n.character.generation &&
        p.character.clan === n.character.clan &&
        p.character.clanBane === n.character.clanBane &&
        p.character.homebrewClan?.bane === n.character.homebrewClan?.bane &&
        p.character.homebrewClan?.compulsion === n.character.homebrewClan?.compulsion &&
        (p.mode !== "xp" ||
            p.character.experience - p.character.ephemeral.experienceSpent ===
                n.character.experience - n.character.ephemeral.experienceSpent)
    )
})
