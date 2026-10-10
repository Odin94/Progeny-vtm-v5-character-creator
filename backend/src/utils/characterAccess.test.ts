import { sql, eq } from "drizzle-orm"
import { beforeAll, beforeEach, expect, it } from "vitest"
import { db, schema } from "../db/index.js"
import { getCharacterAccess } from "./characterAccess.js"

beforeAll(() => {
    if (process.env.DATABASE_URL !== ":memory:" || process.env.NODE_ENV !== "test") {
        throw new Error("Character access tests require the isolated in-memory test database")
    }
    db.run(
        sql.raw(`CREATE TABLE characters (
        id text PRIMARY KEY, user_id text NOT NULL, name text NOT NULL, data text NOT NULL,
        version integer NOT NULL DEFAULT 1, character_version integer NOT NULL DEFAULT 0,
        created_at integer NOT NULL DEFAULT (unixepoch()), updated_at integer NOT NULL DEFAULT (unixepoch())
    )`)
    )
    db.run(
        sql.raw(`CREATE TABLE character_shares (
        id text PRIMARY KEY, character_id text NOT NULL, shared_with_user_id text NOT NULL,
        shared_by_id text NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch())
    )`)
    )
})

beforeEach(() => {
    db.delete(schema.characterShares).run()
    db.delete(schema.characters).run()
    db.insert(schema.characters)
        .values({ id: "character", userId: "owner", name: "Original", data: "{}" })
        .run()
    db.insert(schema.characterShares)
        .values({
            id: "share",
            characterId: "character",
            sharedWithUserId: "reader",
            sharedById: "owner"
        })
        .run()
})

it("preserves owner, shared reader, unauthorized and missing results", async () => {
    expect(await getCharacterAccess("character", "owner")).toMatchObject({
        isOwner: true,
        isShared: false,
        hasAccess: true
    })
    expect(await getCharacterAccess("character", "reader")).toMatchObject({
        isOwner: false,
        isShared: true,
        hasAccess: true
    })
    expect(await getCharacterAccess("character", "outsider")).toMatchObject({
        isOwner: false,
        isShared: false,
        hasAccess: false
    })
    expect(await getCharacterAccess("missing", "owner")).toBeNull()
})

it("reads updated data and immediately respects share revocation and deletion", async () => {
    await getCharacterAccess("character", "reader")
    db.update(schema.characters)
        .set({ name: "Updated", characterVersion: 7 })
        .where(eq(schema.characters.id, "character"))
        .run()
    expect((await getCharacterAccess("character", "reader"))?.character).toMatchObject({
        name: "Updated",
        characterVersion: 7
    })
    db.delete(schema.characterShares).run()
    expect(await getCharacterAccess("character", "reader")).toMatchObject({
        isShared: false,
        hasAccess: false
    })
    db.delete(schema.characters).run()
    expect(await getCharacterAccess("character", "reader")).toBeNull()
})
