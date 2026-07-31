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
    nameTagEnabled: integer("name_tag_enabled", { mode: "boolean" }).notNull().default(false),
    nameTagVisible: integer("name_tag_visible", { mode: "boolean" }).notNull().default(false),
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

export const characterNoteVersions = sqliteTable(
    "character_note_versions",
    {
        id: text("id").primaryKey(),
        characterId: text("character_id")
            .notNull()
            .references(() => characters.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        characterUserIdx: index("character_note_versions_character_user_idx").on(
            table.characterId,
            table.userId
        ),
        createdAtIdx: index("character_note_versions_created_at_idx").on(table.createdAt)
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

export const homebrewCollections = sqliteTable(
    "homebrew_collections",
    {
        id: text("id").primaryKey(),
        ownerId: text("owner_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        shortDescription: text("short_description").notNull().default(""),
        description: text("description").notNull().default(""),
        tags: text("tags").notNull().default("[]"),
        contentWarning: text("content_warning").notNull().default(""),
        sourceLibraryEntryId: text("source_library_entry_id"),
        sourcePublicationId: text("source_publication_id"),
        rootSourceLibraryEntryId: text("root_source_library_entry_id"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        ownerIdIdx: index("homebrew_collections_owner_id_idx").on(table.ownerId)
    })
)

export const homebrewItems = sqliteTable(
    "homebrew_items",
    {
        id: text("id").primaryKey(),
        collectionId: text("collection_id")
            .notNull()
            .references(() => homebrewCollections.id, { onDelete: "cascade" }),
        kind: text("kind", {
            enum: [
                "discipline",
                "power",
                "ritual",
                "ceremony",
                "formula",
                "loresheet",
                "merit",
                "flaw",
                "clan"
            ]
        }).notNull(),
        data: text("data").notNull(),
        sortOrder: integer("sort_order").notNull().default(0),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        collectionIdIdx: index("homebrew_items_collection_id_idx").on(table.collectionId)
    })
)

export const coterieHomebrewCollections = sqliteTable(
    "coterie_homebrew_collections",
    {
        id: text("id").primaryKey(),
        coterieId: text("coterie_id")
            .notNull()
            .references(() => coteries.id, { onDelete: "cascade" }),
        collectionId: text("collection_id")
            .notNull()
            .references(() => homebrewCollections.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        coterieIdIdx: index("coterie_homebrew_collections_coterie_id_idx").on(table.coterieId),
        uniqueCollection: uniqueIndex("coterie_homebrew_collections_unique_idx").on(
            table.coterieId,
            table.collectionId
        )
    })
)

export const homebrewLibraryEntries = sqliteTable(
    "homebrew_library_entries",
    {
        id: text("id").primaryKey(),
        originalCollectionId: text("original_collection_id"),
        authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
        authorNickname: text("author_nickname").notNull(),
        activePublicationId: text("active_publication_id"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        unpublishedAt: integer("unpublished_at", { mode: "timestamp" })
    },
    (table) => ({
        authorIdIdx: index("homebrew_library_entries_author_id_idx").on(table.authorId),
        uniqueOriginalCollectionAuthor: uniqueIndex(
            "homebrew_library_entries_original_collection_author_idx"
        ).on(table.originalCollectionId, table.authorId)
    })
)

export const homebrewPublications = sqliteTable(
    "homebrew_publications",
    {
        id: text("id").primaryKey(),
        libraryEntryId: text("library_entry_id")
            .notNull()
            .references(() => homebrewLibraryEntries.id, { onDelete: "cascade" }),
        version: integer("version").notNull(),
        snapshot: text("snapshot").notNull(),
        approvedById: text("approved_by_id").references(() => users.id, {
            onDelete: "set null"
        }),
        approvedAt: integer("approved_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        libraryEntryIdIdx: index("homebrew_publications_library_entry_id_idx").on(
            table.libraryEntryId
        ),
        uniqueVersion: uniqueIndex("homebrew_publications_unique_version_idx").on(
            table.libraryEntryId,
            table.version
        )
    })
)

export const homebrewPublishRequests = sqliteTable(
    "homebrew_publish_requests",
    {
        id: text("id").primaryKey(),
        collectionId: text("collection_id").references(() => homebrewCollections.id, {
            onDelete: "set null"
        }),
        requesterId: text("requester_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        libraryEntryId: text("library_entry_id").references(() => homebrewLibraryEntries.id, {
            onDelete: "set null"
        }),
        snapshot: text("snapshot").notNull(),
        status: text("status", { enum: ["pending", "approved", "denied", "withdrawn"] })
            .notNull()
            .default("pending"),
        denialMessage: text("denial_message"),
        reviewedById: text("reviewed_by_id").references(() => users.id, {
            onDelete: "set null"
        }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        reviewedAt: integer("reviewed_at", { mode: "timestamp" })
    },
    (table) => ({
        requesterIdIdx: index("homebrew_publish_requests_requester_id_idx").on(table.requesterId),
        statusIdx: index("homebrew_publish_requests_status_idx").on(table.status),
        createdAtIdx: index("homebrew_publish_requests_created_at_idx").on(table.createdAt)
    })
)

export const homebrewRatings = sqliteTable(
    "homebrew_ratings",
    {
        id: text("id").primaryKey(),
        libraryEntryId: text("library_entry_id")
            .notNull()
            .references(() => homebrewLibraryEntries.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        uniqueRating: uniqueIndex("homebrew_ratings_unique_idx").on(
            table.libraryEntryId,
            table.userId
        )
    })
)

export const homebrewComments = sqliteTable(
    "homebrew_comments",
    {
        id: text("id").primaryKey(),
        libraryEntryId: text("library_entry_id")
            .notNull()
            .references(() => homebrewLibraryEntries.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        body: text("body").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        entryCreatedIdx: index("homebrew_comments_entry_created_idx").on(
            table.libraryEntryId,
            table.createdAt
        )
    })
)

export const recentChanges = sqliteTable(
    "recent_changes",
    {
        id: text("id").primaryKey(),
        title: text("title").notNull(),
        body: text("body").notNull(),
        status: text("status", { enum: ["draft", "published"] })
            .notNull()
            .default("draft"),
        createdByUserId: text("created_by_user_id").references(() => users.id, {
            onDelete: "set null"
        }),
        publishedByUserId: text("published_by_user_id").references(() => users.id, {
            onDelete: "set null"
        }),
        publishedAt: integer("published_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        publishedAtIdx: index("recent_changes_published_at_idx").on(table.status, table.publishedAt)
    })
)

export const recentChangeDeliveries = sqliteTable(
    "recent_change_deliveries",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        recentChangeId: text("recent_change_id")
            .notNull()
            .references(() => recentChanges.id, { onDelete: "cascade" }),
        deliveredAt: integer("delivered_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (table) => ({
        userChangeUnique: uniqueIndex("recent_change_deliveries_user_change_idx").on(
            table.userId,
            table.recentChangeId
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
export type CharacterNoteVersion = typeof characterNoteVersions.$inferSelect
export type NewCharacterNoteVersion = typeof characterNoteVersions.$inferInsert
export type CharacterShare = typeof characterShares.$inferSelect
export type NewCharacterShare = typeof characterShares.$inferInsert
export type ImpersonationSession = typeof impersonationSessions.$inferSelect
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert
export type HomebrewCollection = typeof homebrewCollections.$inferSelect
export type HomebrewItem = typeof homebrewItems.$inferSelect
export type HomebrewLibraryEntry = typeof homebrewLibraryEntries.$inferSelect
export type HomebrewPublication = typeof homebrewPublications.$inferSelect
export type HomebrewPublishRequest = typeof homebrewPublishRequests.$inferSelect
export type RecentChange = typeof recentChanges.$inferSelect
export type RecentChangeDelivery = typeof recentChangeDeliveries.$inferSelect

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    characters: many(characters),
    ownedCoteries: many(coteries),
    coteriePlayerMemberships: many(coteriePlayerMemberships),
    characterNoteVersions: many(characterNoteVersions),
    sharedCharacters: many(characterShares, { relationName: "sharedWith" }),
    sharedBy: many(characterShares, { relationName: "sharedBy" }),
    impersonationSessionsStarted: many(impersonationSessions, { relationName: "superadmin" }),
    impersonationSessionsReceived: many(impersonationSessions, { relationName: "impersonated" }),
    homebrewCollections: many(homebrewCollections),
    homebrewRatings: many(homebrewRatings),
    homebrewComments: many(homebrewComments),
    recentChangeDeliveries: many(recentChangeDeliveries),
    recentChangesCreated: many(recentChanges, { relationName: "recentChangesCreated" }),
    recentChangesPublished: many(recentChanges, { relationName: "recentChangesPublished" })
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
    user: one(users, {
        fields: [characters.userId],
        references: [users.id]
    }),
    coterieMembers: many(coterieMembers),
    noteVersions: many(characterNoteVersions),
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
    noteVersions: many(coterieNoteVersions),
    homebrewCollections: many(coterieHomebrewCollections)
}))

export const homebrewCollectionsRelations = relations(homebrewCollections, ({ one, many }) => ({
    owner: one(users, {
        fields: [homebrewCollections.ownerId],
        references: [users.id]
    }),
    items: many(homebrewItems),
    coteries: many(coterieHomebrewCollections),
    publishRequests: many(homebrewPublishRequests)
}))

export const homebrewItemsRelations = relations(homebrewItems, ({ one }) => ({
    collection: one(homebrewCollections, {
        fields: [homebrewItems.collectionId],
        references: [homebrewCollections.id]
    })
}))

export const coterieHomebrewCollectionsRelations = relations(
    coterieHomebrewCollections,
    ({ one }) => ({
        coterie: one(coteries, {
            fields: [coterieHomebrewCollections.coterieId],
            references: [coteries.id]
        }),
        collection: one(homebrewCollections, {
            fields: [coterieHomebrewCollections.collectionId],
            references: [homebrewCollections.id]
        })
    })
)

export const homebrewLibraryEntriesRelations = relations(
    homebrewLibraryEntries,
    ({ one, many }) => ({
        author: one(users, {
            fields: [homebrewLibraryEntries.authorId],
            references: [users.id]
        }),
        publications: many(homebrewPublications),
        requests: many(homebrewPublishRequests),
        ratings: many(homebrewRatings),
        comments: many(homebrewComments)
    })
)

export const homebrewPublicationsRelations = relations(homebrewPublications, ({ one }) => ({
    libraryEntry: one(homebrewLibraryEntries, {
        fields: [homebrewPublications.libraryEntryId],
        references: [homebrewLibraryEntries.id]
    })
}))

export const homebrewPublishRequestsRelations = relations(homebrewPublishRequests, ({ one }) => ({
    collection: one(homebrewCollections, {
        fields: [homebrewPublishRequests.collectionId],
        references: [homebrewCollections.id]
    }),
    requester: one(users, {
        fields: [homebrewPublishRequests.requesterId],
        references: [users.id]
    }),
    libraryEntry: one(homebrewLibraryEntries, {
        fields: [homebrewPublishRequests.libraryEntryId],
        references: [homebrewLibraryEntries.id]
    })
}))

export const homebrewRatingsRelations = relations(homebrewRatings, ({ one }) => ({
    libraryEntry: one(homebrewLibraryEntries, {
        fields: [homebrewRatings.libraryEntryId],
        references: [homebrewLibraryEntries.id]
    }),
    user: one(users, {
        fields: [homebrewRatings.userId],
        references: [users.id]
    })
}))

export const homebrewCommentsRelations = relations(homebrewComments, ({ one }) => ({
    libraryEntry: one(homebrewLibraryEntries, {
        fields: [homebrewComments.libraryEntryId],
        references: [homebrewLibraryEntries.id]
    }),
    user: one(users, {
        fields: [homebrewComments.userId],
        references: [users.id]
    })
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

export const coteriePlayerMembershipsRelations = relations(coteriePlayerMemberships, ({ one }) => ({
    coterie: one(coteries, {
        fields: [coteriePlayerMemberships.coterieId],
        references: [coteries.id]
    }),
    user: one(users, {
        fields: [coteriePlayerMemberships.userId],
        references: [users.id]
    })
}))

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

export const characterNoteVersionsRelations = relations(characterNoteVersions, ({ one }) => ({
    character: one(characters, {
        fields: [characterNoteVersions.characterId],
        references: [characters.id]
    }),
    user: one(users, {
        fields: [characterNoteVersions.userId],
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

export const recentChangesRelations = relations(recentChanges, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [recentChanges.createdByUserId],
        references: [users.id],
        relationName: "recentChangesCreated"
    }),
    publishedBy: one(users, {
        fields: [recentChanges.publishedByUserId],
        references: [users.id],
        relationName: "recentChangesPublished"
    }),
    deliveries: many(recentChangeDeliveries)
}))

export const recentChangeDeliveriesRelations = relations(recentChangeDeliveries, ({ one }) => ({
    user: one(users, {
        fields: [recentChangeDeliveries.userId],
        references: [users.id]
    }),
    recentChange: one(recentChanges, {
        fields: [recentChangeDeliveries.recentChangeId],
        references: [recentChanges.id]
    })
}))
