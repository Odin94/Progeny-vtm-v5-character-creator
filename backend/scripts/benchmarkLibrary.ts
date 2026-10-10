import { readFileSync } from "node:fs"
import { sql } from "drizzle-orm"
process.env.DATABASE_URL = ":memory:"
process.env.NODE_ENV = "test"
process.env.WORKOS_API_KEY = "fixture-key"
process.env.WORKOS_CLIENT_ID = "fixture-client"
process.env.WORKOS_COOKIE_PASSWORD = "fixture-password-at-least-32-characters"
process.env.PUBLIC_POSTHOG_KEY = ""
const { db, schema } = await import("../src/db/index.js")
const { buildApp } = await import("../src/app.js")
const tables = readFileSync(new URL("../src/homebrew.test.ts", import.meta.url), "utf8")
    .split("const statements = [")[1]!
    .split("\n    ]")[0]!
for (const match of tables.matchAll(/`([^`]+)`/g)) db.run(sql.raw(match[1]!))
const now = new Date("2026-10-03T00:00:00Z"),
    entries = 150,
    relatedPerEntry = 100
for (let i = 0; i <= relatedPerEntry; i++)
    db.insert(schema.users)
        .values({ id: `user-${i}`, email: `user-${i}@fixture.invalid`, nickname: `User ${i}` })
        .run()
for (let i = 0; i < entries; i++) {
    const id = `entry-${i}`
    db.insert(schema.homebrewLibraryEntries)
        .values({
            id,
            authorId: "user-0",
            authorNickname: "Original",
            activePublicationId: `publication-${i}`
        })
        .run()
    db.insert(schema.homebrewPublications)
        .values({
            id: `publication-${i}`,
            libraryEntryId: id,
            version: 1,
            approvedAt: now,
            snapshot: JSON.stringify({
                id: `collection-${i}`,
                name: `Collection ${i}`,
                shortDescription: "Fixture rules",
                description: "Description",
                tags: ["fixture"],
                contentWarning: "",
                items: [
                    {
                        id: `rule-${i}`,
                        kind: "merit",
                        name: "Rule",
                        summary: "Summary",
                        description: "Description",
                        costs: [1],
                        excludes: []
                    }
                ],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            })
        })
        .run()
    for (let j = 1; j <= relatedPerEntry; j++) {
        db.insert(schema.homebrewRatings)
            .values({
                id: `rating-${i}-${j}`,
                libraryEntryId: id,
                userId: `user-${j}`,
                rating: (j % 5) + 1
            })
            .run()
        db.insert(schema.homebrewComments)
            .values({
                id: `comment-${i}-${j}`,
                libraryEntryId: id,
                userId: `user-${j}`,
                body: "Fixture"
            })
            .run()
        db.insert(schema.homebrewCollections)
            .values({
                id: `copy-${i}-${j}`,
                ownerId: `user-${j}`,
                name: "Copy",
                sourceLibraryEntryId: id
            })
            .run()
    }
}
const app = await buildApp()
await app.ready()
const requests = 3,
    samples: number[] = []
let expected = ""
for (let sample = -1; sample < 7; sample++) {
    const start = performance.now()
    for (let i = 0; i < requests; i++) {
        const response = await app.inject({ method: "GET", url: "/homebrew/library?sort=top" })
        if (response.statusCode !== 200) throw new Error(response.body)
        const body = response.json()
        if (
            body.length !== entries ||
            body[0].ratingCount !== relatedPerEntry ||
            body[0].copyCount !== relatedPerEntry ||
            body[0].commentCount !== relatedPerEntry
        )
            throw new Error("Summary changed")
        const normalized = JSON.stringify(
            body.map(({ trendingScore, ...summary }: Record<string, unknown>) => summary)
        )
        if (expected && normalized !== expected) throw new Error("Unstable summary")
        expected = normalized
    }
    if (sample >= 0) samples.push((performance.now() - start) / requests)
}
console.log(
    JSON.stringify({
        scenario: "library-http",
        entries,
        ratings: entries * relatedPerEntry,
        copies: entries * relatedPerEntry,
        comments: entries * relatedPerEntry,
        requests: 24,
        samplesMs: samples,
        medianMs: [...samples].sort((a, b) => a - b)[3]
    })
)
await app.close()

// The benchmark owns this disposable process; telemetry shutdown timers are not part of its workload.
process.exit(0)
