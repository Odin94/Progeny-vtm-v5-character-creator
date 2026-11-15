import { Select } from "@mantine/core"
import type { MeritFlaw } from "~/data/Character"
import { clans } from "~/data/Clans"

export default function ClanCurseSelect({
    flaw,
    onChange,
    disabled = false
}: {
    flaw: MeritFlaw
    onChange: (flaw: MeritFlaw) => void
    disabled?: boolean
}) {
    return (
        <Select
            label="Clan Curse bane"
            placeholder="Select a clan bane"
            data={Object.keys(clans).filter(
                (name) => name && name !== "Caitiff" && name !== "Thin-blood"
            )}
            value={flaw.clanCurse ?? null}
            disabled={disabled}
            allowDeselect={false}
            onChange={(value) => {
                if (value)
                    onChange({ ...flaw, clanCurse: value as NonNullable<MeritFlaw["clanCurse"]> })
            }}
        />
    )
}
