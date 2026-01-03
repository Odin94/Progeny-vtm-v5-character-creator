import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // WorkOS user ID
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const characters = sqliteTable(
  "characters",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    data: text("data").notNull(), // JSON string of character data
    version: integer("version").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    userIdIdx: index("characters_user_id_idx").on(table.userId),
  })
)

export const coteries = sqliteTable("coteries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const coterieMembers = sqliteTable(
  "coterie_members",
  {
    id: text("id").primaryKey(),
    coterieId: text("coterie_id")
      .notNull()
      .references(() => coteries.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    coterieIdIdx: index("coterie_members_coterie_id_idx").on(table.coterieId),
    characterIdIdx: index("coterie_members_character_id_idx").on(table.characterId),
  })
)

export const characterShares = sqliteTable(
  "character_shares",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sharedWithUserId: text("shared_with_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sharedById: text("shared_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    characterIdIdx: index("character_shares_character_id_idx").on(table.characterId),
    sharedWithUserIdIdx: index("character_shares_shared_with_user_id_idx").on(table.sharedWithUserId),
    uniqueShare: index("character_shares_unique_idx").on(table.characterId, table.sharedWithUserId),
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Character = typeof characters.$inferSelect
export type NewCharacter = typeof characters.$inferInsert
export type Coterie = typeof coteries.$inferSelect
export type NewCoterie = typeof coteries.$inferInsert
export type CoterieMember = typeof coterieMembers.$inferSelect
export type NewCoterieMember = typeof coterieMembers.$inferInsert
export type CharacterShare = typeof characterShares.$inferSelect
export type NewCharacterShare = typeof characterShares.$inferInsert

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  ownedCoteries: many(coteries),
  sharedCharacters: many(characterShares, { relationName: "sharedWith" }),
  sharedBy: many(characterShares, { relationName: "sharedBy" }),
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  coterieMembers: many(coterieMembers),
  shares: many(characterShares),
}))

export const coteriesRelations = relations(coteries, ({ one, many }) => ({
  owner: one(users, {
    fields: [coteries.ownerId],
    references: [users.id],
  }),
  members: many(coterieMembers),
}))

export const coterieMembersRelations = relations(coterieMembers, ({ one }) => ({
  coterie: one(coteries, {
    fields: [coterieMembers.coterieId],
    references: [coteries.id],
  }),
  character: one(characters, {
    fields: [coterieMembers.characterId],
    references: [characters.id],
  }),
}))

export const characterSharesRelations = relations(characterShares, ({ one }) => ({
  character: one(characters, {
    fields: [characterShares.characterId],
    references: [characters.id],
  }),
  sharedWith: one(users, {
    fields: [characterShares.sharedWithUserId],
    references: [users.id],
    relationName: "sharedWith",
  }),
  sharedBy: one(users, {
    fields: [characterShares.sharedById],
    references: [users.id],
    relationName: "sharedBy",
  }),
}))
