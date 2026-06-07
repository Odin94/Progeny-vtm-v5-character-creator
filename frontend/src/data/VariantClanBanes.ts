import type { Character } from "./Character"
import { clans } from "./Clans"
import type { ClanName } from "./NameSchemas"

export type VariantClanBane = {
    name: string
    text: string
}

export const variantClanBanes: Record<ClanName, VariantClanBane | null> = {
    Brujah: {
        name: "Violence",
        text: "Violence: On a messy critical on any Skill test, cause physical or mental damage to the subject equal to BANE_SEVERITY in addition to any Hunger dice result. The damage is Aggravated unless you spend 1 Willpower to make it Superficial."
    },
    Gangrel: {
        name: "Survival Instincts",
        text: "Survival Instincts: Subtract BANE_SEVERITY dice from any roll to resist fear Frenzy. This cannot reduce the pool below one die."
    },
    Nosferatu: {
        name: "Infestation",
        text: "Infestation: Your Haven is infested with vermin, causing a 2 + BANE_SEVERITY penalty to concentration-based activities and social tests at Storyteller discretion. After you spend a scene in an enclosed location, a similar infestation appears with a BANE_SEVERITY penalty. Attempts to control the vermin with Animalism take a BANE_SEVERITY penalty."
    },
    Malkavian: {
        name: "Unnatural Manifestations",
        text: "Unnatural Manifestations: When you use a Discipline power, nearby mortals become uneasy for one scene. Social interactions with them, except intimidation, take a BANE_SEVERITY penalty. Other vampires recognize you as undead, but suffer no interaction penalty."
    },
    Tremere: {
        name: "Stolen Blood",
        text: "Stolen Blood: When you perform a Blood Surge, make Rouse Checks equal to BANE_SEVERITY. If these Rouse Checks raise Hunger to 5 or higher, you may cancel the Blood Surge or perform it and then immediately hit Hunger 5."
    },
    Ventrue: {
        name: "Hierarchy",
        text: "Hierarchy: Take a BANE_SEVERITY penalty to Discipline dice pools when using powers on a vampire of lower generation. You must also spend Willpower equal to BANE_SEVERITY to directly attack a vampire of lower generation."
    },
    Toreador: {
        name: "Agonizing Empathy",
        text: "Agonizing Empathy: When feeding causes damage to a mortal, suffer similar, usually Aggravated, damage in return. A single feeding cannot cause you more damage than BANE_SEVERITY."
    },
    Lasombra: {
        name: "Callousness",
        text: "Callousness: When making a Remorse roll, remove BANE_SEVERITY dice. This cannot reduce the pool below one die."
    },
    "Banu Haqim": {
        name: "Noxious Blood",
        text: "Noxious Blood: Mortals who drink your Blood suffer Aggravated Damage equal to BANE_SEVERITY for each Rouse Check's worth of Blood ingested. Your vitae cannot heal mortal injuries, but smaller amounts than needed for a Blood Bond are not otherwise toxic."
    },
    Ministry: {
        name: "Cold-Blooded",
        text: "Cold-Blooded: You can only use Blush of Life if you have recently fed from a living vessel in the same scene or roughly within the last hour. When you do, it requires Rouse Checks equal to BANE_SEVERITY instead of one."
    },
    Ravnos: {
        name: "Unbirth Name",
        text: "Unbirth Name: Anyone who speaks your unbirth name to your face gains a BANE_SEVERITY bonus to resist your Discipline powers, and you take a BANE_SEVERITY penalty to resist supernatural powers used by that opponent."
    },
    Tzimisce: {
        name: "Cursed Courtesy",
        text: "Cursed Courtesy: To enter a residence or haven uninvited, spend Willpower equal to BANE_SEVERITY and take the same penalty to Discipline pools while inside. The invitation must come from someone who lives or unlives there."
    },
    Hecata: {
        name: "Decay",
        text: "Decay: Suffer additional Flaw dots equal to BANE_SEVERITY, divided among Retainer, Haven, and Resources Flaws. These can be bought off at twice the Background dot cost, and later purchases of these Advantages cost additional experience equal to BANE_SEVERITY."
    },
    Salubri: {
        name: "Asceticism",
        text: "Asceticism: When your Hunger is below three, take a BANE_SEVERITY penalty to Discipline dice pools. The third eye remains part of this Bane."
    },
    Caitiff: null,
    "Thin-blood": null,
    "": null
}

export const formatBaneText = (text: string, baneSeverity: number) =>
    text.replace(/BANE_SEVERITY/g, `${baneSeverity} (bane severity)`)

export const getClanBaneText = (character: Character, baneSeverity: number) => {
    const clan = clans[character.clan] || clans[""]
    const variantBane = variantClanBanes[character.clan]
    const baneText = character.clanBane === "variant" && variantBane ? variantBane.text : clan.bane

    return baneText ? formatBaneText(baneText, baneSeverity) : ""
}

export const hasVariantClanBane = (clan: ClanName) => variantClanBanes[clan] !== null
