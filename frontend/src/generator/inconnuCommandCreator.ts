import type { InconnuCreationBody } from "./inconnuJsonCreator"

type InconnuTrait = InconnuCreationBody["traits"][number]

const MAX_TRAITS_PER_COMMAND = 12

const splitIntoCommands = (
    entries: string[],
    command: string,
    parameter: string,
    characterName: string
): string[] => {
    const commands: string[] = []

    for (let index = 0; index < entries.length; index += MAX_TRAITS_PER_COMMAND) {
        const values = entries.slice(index, index + MAX_TRAITS_PER_COMMAND).join(" ")
        commands.push(`${command} ${parameter}:${values} character:${characterName}`)
    }

    return commands
}

const traitRatings = (traits: InconnuTrait[]) => traits.map((trait) => `${trait.name}=${trait.rating}`)

const traitSubtraits = (traits: InconnuTrait[]) =>
    traits.filter((trait) => trait.subtraits.length > 0).map((trait) => `${trait.name}=${trait.subtraits.join(",")}`)

/**
 * Creates individually pasteable Discord slash commands for an Inconnu character.
 * Inconnu does not support batch execution of slash commands, so users must run
 * each generated line after completing its character wizard.
 */
export const createInconnuCommandExport = (character: InconnuCreationBody): string => {
    const attributesAndSkills = character.traits.filter(
        (trait) => trait.type === "attribute" || trait.type === "skill"
    )
    const disciplines = character.traits.filter((trait) => trait.type === "discipline")
    const customTraits = character.traits.filter((trait) => trait.type === "custom")

    const commands = [
        `/character update parameters:health=${character.health} willpower=${character.willpower} humanity=${character.humanity} potency=${character.blood_potency} character:${character.name}`,
        ...splitIntoCommands(
            traitRatings(attributesAndSkills),
            "/traits update",
            "traits",
            character.name
        ),
        ...splitIntoCommands(
            traitRatings(disciplines),
            "/disciplines add",
            "disciplines",
            character.name
        ),
        ...splitIntoCommands(traitRatings(customTraits), "/traits add", "traits", character.name),
        ...splitIntoCommands(
            traitSubtraits(attributesAndSkills),
            "/specialties add",
            "specialties",
            character.name
        ),
        ...splitIntoCommands(traitSubtraits(disciplines), "/powers add", "powers", character.name)
    ]

    return [
        "INCONNU DISCORD COMMAND EXPORT",
        "",
        "1. In the target Discord server, run /character wizard. /character create has been removed by Inconnu.",
        "2. Complete the wizard with any valid values, using this character's name.",
        "3. Run each command below individually. Discord cannot execute a pasted group of slash commands at once.",
        "4. To add profile text and convictions, run /character profile edit:<character> and /character convictions edit:<character> after these commands.",
        "",
        ...commands
    ].join("\n")
}
