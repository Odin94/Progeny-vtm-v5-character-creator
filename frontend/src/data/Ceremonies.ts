import { z } from "zod"
import { ritualSchema } from "./Disciplines.js"
import type { Character } from "./Character.js"

export const ceremonySchema = ritualSchema.extend({
    prerequisitePowers: z.string().array()
})

export type Ceremony = z.infer<typeof ceremonySchema>

const defaultDicePool = "Resolve + Oblivion"

export const Ceremonies: Ceremony[] = [
    {
        name: "The Gift of False Life",
        summary:
            "Animate prepared corpses to carry out one simple command until they finish the task or are destroyed.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: defaultDicePool,
        ingredients: "One or more human bodies, plus a mixture of blood, phlegm, and bile",
        level: 1,
        discipline: "oblivion",
        prerequisitePowers: ["Ashes to Ashes"]
    },
    {
        name: "Summon Spirit",
        summary:
            "Call a named wraith through the Shroud by using one of its fetters, without forcing it to obey.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: defaultDicePool,
        ingredients:
            "A wraith's fetter, your vitae, and an image, signature, or name of the wraith",
        level: 1,
        discipline: "oblivion",
        prerequisitePowers: ["The Binding Fetter"]
    },
    {
        name: "Traveler's Call",
        summary:
            "Send a vision of your surroundings through Oblivion to call another Shalimite to you.",
        rouseChecks: 1,
        requiredTime: "5min",
        dicePool: defaultDicePool,
        ingredients: "The black book given during Shalimite indoctrination",
        level: 1,
        discipline: "oblivion",
        prerequisitePowers: ["Oblivion's Sight"]
    },
    {
        name: "Awaken the Homuncular Servant",
        summary: "Create a loyal spy or stalker from a severed body part or small animal carcass.",
        rouseChecks: 1,
        requiredTime: "10min",
        dicePool: defaultDicePool,
        ingredients:
            "A body part or small carcass, the weapon used on it, and a foul bodily mixture",
        level: 2,
        discipline: "oblivion",
        prerequisitePowers: ["Where the Shroud Thins"]
    },
    {
        name: "Compel Spirit",
        summary:
            "Force a nearby wraith into service for a limited task, with harsher demands possible on stronger wins.",
        rouseChecks: 1,
        requiredTime: "10min",
        dicePool: defaultDicePool,
        ingredients: "A wraith's fetter, your vitae, and leverage against the fetter",
        level: 2,
        discipline: "oblivion",
        prerequisitePowers: ["Where the Shroud Thins"]
    },
    {
        name: "Host Spirit",
        summary:
            "Invite a wraith into your body, gaining physical strength and health while risking possession.",
        rouseChecks: 1,
        requiredTime: "15min",
        dicePool: defaultDicePool,
        ingredients: "A tribute for a wraith, a parasitic bug, and two of your teeth",
        level: 3,
        discipline: "oblivion",
        prerequisitePowers: ["Aura of Decay"]
    },
    {
        name: "Shambling Hordes",
        summary:
            "Raise several aggressive corpses that obey commands and attack others when left idle.",
        rouseChecks: 1,
        requiredTime: "15min",
        dicePool: defaultDicePool,
        ingredients: "Prepared corpses and a fresh human sacrifice",
        level: 3,
        discipline: "oblivion",
        prerequisitePowers: ["Aura of Decay"]
    },
    {
        name: "Name of the Father",
        summary:
            "Invoke Shalim to overwhelm a victim with sensory darkness and paralyzing despair.",
        rouseChecks: 1,
        requiredTime: "15min",
        dicePool: defaultDicePool,
        ingredients: "Ancient Greek speech, eye contact with the victim, and five charcoal sticks",
        level: 3,
        discipline: "oblivion",
        prerequisitePowers: ["Shadow Perspective"]
    },
    {
        name: "Bind the Spirit",
        summary:
            "Anchor a compelled wraith to a place or person, causing its strongest emotions to haunt the target.",
        rouseChecks: 1,
        requiredTime: "20min",
        dicePool: defaultDicePool,
        ingredients:
            "A wraith's fetter, your vitae, a human sacrifice, salt, and a link to the target",
        level: 4,
        discipline: "oblivion",
        prerequisitePowers: ["Necrotic Plague"]
    },
    {
        name: "Split the Shroud",
        summary:
            "Tear open the boundary to the Shadowlands, making passage easier and allowing ghosts through if widened enough.",
        rouseChecks: 1,
        requiredTime: "20min",
        dicePool: defaultDicePool,
        ingredients: "A used scalpel, chalk or charcoal, silk, and a human sacrifice",
        level: 4,
        discipline: "oblivion",
        prerequisitePowers: ["Necrotic Plague"]
    },
    {
        name: "Ex Nihilo",
        summary:
            "Cross physically into the Shadowlands with companions, remaining there until you end the power or are destroyed.",
        rouseChecks: 3,
        requiredTime: "25min",
        dicePool: defaultDicePool,
        ingredients: "Masks, your vitae for each participant's feet, and two coins per traveler",
        level: 5,
        discipline: "oblivion",
        prerequisitePowers: ["Withering Spirit"]
    },
    {
        name: "Lazarene Blessing",
        summary:
            "Offer a newly dead body as a vessel for a willing wraith, restoring it to a fragile imitation of life.",
        rouseChecks: 1,
        requiredTime: "25min",
        dicePool: defaultDicePool,
        ingredients: "A human sacrifice, incense, a mammal heart, and powdered silver",
        level: 5,
        discipline: "oblivion",
        prerequisitePowers: ["Skuld Fulfilled"]
    },
    {
        name: "Pit of Contemplation",
        summary:
            "Open a doorway into Oblivion that pulls victims into an empty black prison.",
        rouseChecks: 1,
        requiredTime: "25min",
        dicePool: defaultDicePool,
        ingredients:
            "A pot of ink, blood from an innocent victim, and an unlit room with a painted doorway",
        level: 5,
        discipline: "oblivion",
        prerequisitePowers: ["Tenebrous Avatar"]
    }
]

export const containsOblivion = (character: Pick<Character, "disciplines">): boolean =>
    character.disciplines.some((power) => power.discipline === "oblivion")

export const characterHasCeremonyPrerequisite = (
    character: Pick<Character, "disciplines">,
    ceremony: Ceremony
): boolean =>
    character.disciplines.some(
        (power) =>
            power.discipline === "oblivion" && ceremony.prerequisitePowers.includes(power.name)
    )

export const getCeremonyPrerequisiteLabel = (ceremony: Pick<Ceremony, "prerequisitePowers">) =>
    ceremony.prerequisitePowers.join(" or ")
