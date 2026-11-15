import { Select } from "@mantine/core"
import type { MeritFlaw } from "~/data/Character"
import { clans } from "~/data/Clans"

const baneDescriptions: Record<string, string> = {
    Brujah: "harder to resist fury frenzy",
    Gangrel: "animal features after frenzy",
    Nosferatu: "repulsive appearance",
    Malkavian: "mental derangement",
    Tremere: "weaker blood bonds",
    Ventrue: "specific feeding restriction",
    Toreador: "penalties in ugly surroundings",
    Lasombra: "distorted reflections and technology",
    "Banu Haqim": "addiction to vampire blood",
    Ministry: "sensitivity to bright light",
    Ravnos: "must keep changing sleeping places",
    Tzimisce: "bound to a place or group",
    Hecata: "painful feeding",
    Salubri: "third eye and tempting blood"
}

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
            color="red"
            label="Clan Curse bane"
            placeholder="Select a clan bane"
            data={Object.keys(clans)
                .filter((name) => name && name !== "Caitiff" && name !== "Thin-blood")
                .map((name) => ({ value: name, label: `${name} - ${baneDescriptions[name]}` }))}
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
