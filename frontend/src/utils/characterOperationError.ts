export type CharacterFailureReason =
    | "account_changed"
    | "characters_unavailable"
    | "name_required"
    | "ownership_unverified"
    | "read_only"
    | "version_conflict"

export class CharacterOperationError extends Error {
    constructor(
        readonly reason: CharacterFailureReason,
        message: string
    ) {
        super(message)
        this.name = "CharacterOperationError"
    }
}
