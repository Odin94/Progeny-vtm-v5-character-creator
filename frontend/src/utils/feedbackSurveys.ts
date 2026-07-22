export const feedbackSurveyEvents = {
    characterCreationCompleted: "character creation completed",
    characterSheetEligible: "character-sheet-feedback-eligible",
    coterieEligible: "coterie-feedback-eligible"
} as const

export const feedbackSurveyStorageKeys = {
    characterSheetRollCount: "progeny.feedback.characterSheetRollCount",
    characterSheetEligibilitySent: "progeny.feedback.characterSheetEligibilitySent",
    coterieVisitCount: "progeny.feedback.coterieVisitCount",
    coterieEligibilitySent: "progeny.feedback.coterieEligibilitySent"
} as const

export const CHARACTER_SHEET_ROLL_THRESHOLD = 2
export const COTERIE_VISIT_THRESHOLD = 10

export const getFeedbackSurveyStorageKey = (baseKey: string, identity: string) =>
    `${baseKey}:${encodeURIComponent(identity)}`

const parseStoredCount = (value: string | null) => {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0
}

export const getFeedbackSurveyCount = (storage: Storage, key: string) => {
    try {
        return parseStoredCount(storage.getItem(key))
    } catch {
        return 0
    }
}

export const incrementFeedbackSurveyCount = (storage: Storage, key: string) => {
    const nextCount = Math.min(getFeedbackSurveyCount(storage, key) + 1, Number.MAX_SAFE_INTEGER)

    try {
        storage.setItem(key, String(nextCount))
    } catch {
        return 0
    }

    return nextCount
}

export const triggerFeedbackSurveyEligibilityOnce = (
    storage: Storage,
    markerKey: string,
    captureEligibility: () => void
) => {
    try {
        if (storage.getItem(markerKey) === "true") {
            return false
        }

        captureEligibility()
        storage.setItem(markerKey, "true")
        return true
    } catch {
        return false
    }
}
