import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
    id: text("id").primaryKey(), // WorkOS user ID
    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    nickname: text("nickname").unique(),
    preferences: text("preferences"),
    isSuperadmin: integer("is_superadmin", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
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
        characterVersion: integer("character_version").notNull().default(0),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        userIdIdx: index("characters_user_id_idx").on(table.userId)
    })
)

export const coteries = sqliteTable("coteries", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
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
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        coterieIdIdx: index("coterie_members_coterie_id_idx").on(table.coterieId),
        characterIdIdx: index("coterie_members_character_id_idx").on(table.characterId)
    })
)

export const coteriePlayerMemberships = sqliteTable(
    "coterie_player_memberships",
    {
        id: text("id").primaryKey(),
        coterieId: text("coterie_id")
            .notNull()
            .references(() => coteries.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        coterieIdIdx: index("coterie_player_memberships_coterie_id_idx").on(table.coterieId),
        userIdIdx: index("coterie_player_memberships_user_id_idx").on(table.userId),
        uniqueMembership: uniqueIndex("coterie_player_memberships_unique_idx").on(
            table.coterieId,
            table.userId
        )
    })
)

export const coterieInvites = sqliteTable(
    "coterie_invites",
    {
        id: text("id").primaryKey(),
        coterieId: text("coterie_id")
            .notNull()
            .references(() => coteries.id, { onDelete: "cascade" }),
        tokenHash: text("token_hash").notNull(),
        createdById: text("created_by_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        revokedAt: integer("revoked_at", { mode: "timestamp" })
    },
    (table) => ({
        coterieIdIdx: index("coterie_invites_coterie_id_idx").on(table.coterieId),
        tokenHashUnique: uniqueIndex("coterie_invites_token_hash_unique_idx").on(table.tokenHash)
    })
)

export const coterieNoteVersions = sqliteTable(
    "coterie_note_versions",
    {
        id: text("id").primaryKey(),
        coterieId: text("coterie_id")
            .notNull()
            .references(() => coteries.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        coterieUserIdx: index("coterie_note_versions_coterie_user_idx").on(
            table.coterieId,
            table.userId
        ),
        createdAtIdx: index("coterie_note_versions_created_at_idx").on(table.createdAt)
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
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        characterIdIdx: index("character_shares_character_id_idx").on(table.characterId),
        sharedWithUserIdIdx: index("character_shares_shared_with_user_id_idx").on(
            table.sharedWithUserId
        ),
        uniqueShare: index("character_shares_unique_idx").on(
            table.characterId,
            table.sharedWithUserId
        )
    })
)

export const impersonationSessions = sqliteTable(
    "impersonation_sessions",
    {
        id: text("id").primaryKey(),
        superadminUserId: text("superadmin_user_id")
            .notNull()
            .references(() => users.id),
        impersonatedUserId: text("impersonated_user_id")
            .notNull()
            .references(() => users.id),
        startedAt: integer("started_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        endedAt: integer("ended_at", { mode: "timestamp" }),
        endedReason: text("ended_reason"),
        auditLog: text("audit_log").notNull().default("[]")
    },
    (table) => ({
        superadminUserIdIdx: index("impersonation_sessions_superadmin_user_id_idx").on(
            table.superadminUserId
        ),
        impersonatedUserIdIdx: index("impersonation_sessions_impersonated_user_id_idx").on(
            table.impersonatedUserId
        )
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
export type CoteriePlayerMembership = typeof coteriePlayerMemberships.$inferSelect
export type NewCoteriePlayerMembership = typeof coteriePlayerMemberships.$inferInsert
export type CoterieInvite = typeof coterieInvites.$inferSelect
export type NewCoterieInvite = typeof coterieInvites.$inferInsert
export type CoterieNoteVersion = typeof coterieNoteVersions.$inferSelect
export type NewCoterieNoteVersion = typeof coterieNoteVersions.$inferInsert
export type CharacterShare = typeof characterShares.$inferSelect
export type NewCharacterShare = typeof characterShares.$inferInsert
export type ImpersonationSession = typeof impersonationSessions.$inferSelect
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    characters: many(characters),
    ownedCoteries: many(coteries),
    coteriePlayerMemberships: many(coteriePlayerMemberships),
    sharedCharacters: many(characterShares, { relationName: "sharedWith" }),
    sharedBy: many(characterShares, { relationName: "sharedBy" }),
    impersonationSessionsStarted: many(impersonationSessions, { relationName: "superadmin" }),
    impersonationSessionsReceived: many(impersonationSessions, { relationName: "impersonated" })
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
    user: one(users, {
        fields: [characters.userId],
        references: [users.id]
    }),
    coterieMembers: many(coterieMembers),
    shares: many(characterShares)
}))

export const coteriesRelations = relations(coteries, ({ one, many }) => ({
    owner: one(users, {
        fields: [coteries.ownerId],
        references: [users.id]
    }),
    members: many(coterieMembers),
    playerMemberships: many(coteriePlayerMemberships),
    invites: many(coterieInvites),
    noteVersions: many(coterieNoteVersions)
}))

export const coterieMembersRelations = relations(coterieMembers, ({ one }) => ({
    coterie: one(coteries, {
        fields: [coterieMembers.coterieId],
        references: [coteries.id]
    }),
    character: one(characters, {
        fields: [coterieMembers.characterId],
        references: [characters.id]
    })
}))

export const coteriePlayerMembershipsRelations = relations(
    coteriePlayerMemberships,
    ({ one }) => ({
        coterie: one(coteries, {
            fields: [coteriePlayerMemberships.coterieId],
            references: [coteries.id]
        }),
        user: one(users, {
            fields: [coteriePlayerMemberships.userId],
            references: [users.id]
        })
    })
)

export const coterieInvitesRelations = relations(coterieInvites, ({ one }) => ({
    coterie: one(coteries, {
        fields: [coterieInvites.coterieId],
        references: [coteries.id]
    }),
    createdBy: one(users, {
        fields: [coterieInvites.createdById],
        references: [users.id]
    })
}))

export const coterieNoteVersionsRelations = relations(coterieNoteVersions, ({ one }) => ({
    coterie: one(coteries, {
        fields: [coterieNoteVersions.coterieId],
        references: [coteries.id]
    }),
    user: one(users, {
        fields: [coterieNoteVersions.userId],
        references: [users.id]
    })
}))

export const characterSharesRelations = relations(characterShares, ({ one }) => ({
    character: one(characters, {
        fields: [characterShares.characterId],
        references: [characters.id]
    }),
    sharedWith: one(users, {
        fields: [characterShares.sharedWithUserId],
        references: [users.id],
        relationName: "sharedWith"
    }),
    sharedBy: one(users, {
        fields: [characterShares.sharedById],
        references: [users.id],
        relationName: "sharedBy"
    })
}))

export const impersonationSessionsRelations = relations(impersonationSessions, ({ one }) => ({
    superadmin: one(users, {
        fields: [impersonationSessions.superadminUserId],
        references: [users.id],
        relationName: "superadmin"
    }),
    impersonated: one(users, {
        fields: [impersonationSessions.impersonatedUserId],
        references: [users.id],
        relationName: "impersonated"
    })
}))
