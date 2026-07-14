import { and, eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"

export const getCharacterAccess = async (characterId: string, userId: string) => {
    const character = await db.query.characters.findFirst({
        where: eq(schema.characters.id, characterId)
    })

    if (!character) {
        return null
    }

    const isOwner = character.userId === userId
    const share = isOwner
        ? null
        : await db.query.characterShares.findFirst({
              where: and(
                  eq(schema.characterShares.characterId, characterId),
                  eq(schema.characterShares.sharedWithUserId, userId)
              )
          })
    const isShared = !!share

    return {
        character,
        isOwner,
        isShared,
        hasAccess: isOwner || isShared
    }
}
