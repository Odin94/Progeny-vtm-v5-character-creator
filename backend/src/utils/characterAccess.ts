import { and, eq, placeholder } from "drizzle-orm"
import { db, schema } from "../db/index.js"

const createCharacterQuery = () =>
    db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.id, placeholder("characterId")))
        .limit(1)
        .prepare()
const createShareQuery = () =>
    db
        .select({ id: schema.characterShares.id })
        .from(schema.characterShares)
        .where(
            and(
                eq(schema.characterShares.characterId, placeholder("characterId")),
                eq(schema.characterShares.sharedWithUserId, placeholder("userId"))
            )
        )
        .limit(1)
        .prepare()

// Cache compiled statements, never access results. Prepare lazily so migrations
// and isolated tests can create their tables after importing application modules.
let characterQuery: ReturnType<typeof createCharacterQuery> | undefined
let shareQuery: ReturnType<typeof createShareQuery> | undefined

export const getCharacterAccess = async (characterId: string, userId: string) => {
    characterQuery ??= createCharacterQuery()
    const character = characterQuery.get({ characterId })

    if (!character) {
        return null
    }

    const isOwner = character.userId === userId
    if (!isOwner) shareQuery ??= createShareQuery()
    const share = isOwner ? null : shareQuery!.get({ characterId, userId })
    const isShared = !!share

    return {
        character,
        isOwner,
        isShared,
        hasAccess: isOwner || isShared
    }
}
