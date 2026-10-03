import { performance } from "node:perf_hooks"
import { sql } from "drizzle-orm"

// Always create a disposable in-memory database, even when a shell has a real
// DATABASE_URL set. Dynamic imports keep database initialization after this guard.
process.env.DATABASE_URL = ":memory:"
const { db, schema } = await import("../src/db/index.js")
const { getCharacterAccess } = await import("../src/utils/characterAccess.js")

db.run(sql.raw(`CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL)`))
db.run(
    sql.raw(`CREATE TABLE characters (
    id text PRIMARY KEY, user_id text NOT NULL, name text NOT NULL,
    data text NOT NULL, version integer NOT NULL DEFAULT 1,
    character_version integer NOT NULL DEFAULT 0,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch())
)`)
)
db.run(
    sql.raw(`CREATE TABLE character_shares (
    id text PRIMARY KEY, character_id text NOT NULL, shared_with_user_id text NOT NULL,
    shared_by_id text NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch())
)`)
)
db.run(sql.raw(`CREATE INDEX character_shares_character_id_idx ON character_shares(character_id)`))
db.insert(schema.characters)
    .values({
        id: "benchmark-character",
        userId: "owner",
        name: "Benchmark",
        data: JSON.stringify({ notes: "x".repeat(10000) })
    })
    .run()
db.insert(schema.characterShares)
    .values({
        id: "share",
        characterId: "benchmark-character",
        sharedWithUserId: "reader",
        sharedById: "owner"
    })
    .run()

const scenarios = [
    { name: "owner", characterId: "benchmark-character", userId: "owner", hasAccess: true },
    {
        name: "shared-reader",
        characterId: "benchmark-character",
        userId: "reader",
        hasAccess: true
    },
    {
        name: "unauthorized",
        characterId: "benchmark-character",
        userId: "outsider",
        hasAccess: false
    },
    { name: "missing", characterId: "missing", userId: "owner", hasAccess: null }
]
const iterations = 2000
for (const scenario of scenarios) {
    for (let warmup = 0; warmup < 100; warmup += 1) {
        await getCharacterAccess(scenario.characterId, scenario.userId)
    }
    const samples: number[] = []
    for (let sample = 0; sample < 7; sample += 1) {
        const started = performance.now()
        for (let index = 0; index < iterations; index += 1) {
            const result = await getCharacterAccess(scenario.characterId, scenario.userId)
            if ((result?.hasAccess ?? null) !== scenario.hasAccess)
                throw new Error("Access changed")
        }
        samples.push((performance.now() - started) / iterations)
    }
    const sorted = [...samples].sort((a, b) => a - b)
    console.log(
        JSON.stringify({
            scenario: scenario.name,
            iterations,
            samplesMs: samples,
            medianMs: sorted[3]
        })
    )
}
