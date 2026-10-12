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
        message: string,
        readonly versions?: { local: number; remote: number }
    ) {
        super(message)
        this.name = "CharacterOperationError"
    }
}
