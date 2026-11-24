/**
 * Presentation-only reading of a finished V5 roll. Success counting stays in the roller
 * (and in the shared chat payload); this only names the dramatic outcome so the roller,
 * its history and the session chat signal criticals, messy criticals and bestial
 * failures the same way.
 */
export type RollOutcomeKind =
    | "messy"
    | "critical"
    | "bestial"
    | "bestial-risk"
    | "total-failure"
    | "plain"

export type RollOutcome = {
    kind: RollOutcomeKind
    /** Short label, e.g. "Messy critical". Empty for an ordinary roll. */
    label: string
    /** One line of context, e.g. "A Hunger die shows a 10". */
    detail: string
    criticalPairs: number
    hungerTens: number
    hungerOnes: number
}

type OutcomeDie = { value: number; isBloodDie: boolean }

export const getRollOutcome = (dice: OutcomeDie[], totalSuccesses: number): RollOutcome => {
    const tens = dice.filter((die) => die.value === 10)
    const criticalPairs = Math.floor(tens.length / 2)
    const hungerTens = tens.filter((die) => die.isBloodDie).length
    const hungerOnes = dice.filter((die) => die.isBloodDie && die.value === 1).length
    const base = { criticalPairs, hungerTens, hungerOnes }

    if (criticalPairs > 0 && hungerTens > 0) {
        return {
            ...base,
            kind: "messy",
            label: "Messy critical",
            detail: "You succeed, but the Beast chooses how"
        }
    }
    if (criticalPairs > 0) {
        return {
            ...base,
            kind: "critical",
            label: "Critical",
            detail: `${criticalPairs} ${criticalPairs === 1 ? "pair" : "pairs"} of tens`
        }
    }
    if (hungerOnes > 0 && totalSuccesses === 0) {
        return {
            ...base,
            kind: "bestial",
            label: "Bestial failure",
            detail: "A Hunger die rolled a 1"
        }
    }
    if (hungerOnes > 0) {
        return {
            ...base,
            kind: "bestial-risk",
            label: "Bestial if it fails",
            detail: "A Hunger 1 turns any failure bestial"
        }
    }
    if (totalSuccesses === 0) {
        return { ...base, kind: "total-failure", label: "Total failure", detail: "" }
    }
    return { ...base, kind: "plain", label: "", detail: "" }
}

/** "0" is how a d10 shows a ten. */
export const dieFace = (value: number) => (value === 10 ? "0" : String(value))
