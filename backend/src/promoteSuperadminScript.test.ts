import Database from "better-sqlite3"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { promoteUserToSuperadmin } from "../scripts/promoteSuperadmin.js"

let tempDir: string
let databasePath: string

const createTestDatabase = () => {
    const db = new Database(databasePath)
    db.exec(`
        create table users (
            id text primary key not null,
            email text not null unique,
            first_name text,
            last_name text,
            nickname text unique,
            preferences text,
            is_superadmin integer default false not null,
            created_at integer default (unixepoch()) not null,
            updated_at integer default (unixepoch()) not null
        )
    `)
    db.prepare(
        "insert into users (id, email, first_name, last_name, nickname) values (?, ?, ?, ?, ?)"
    ).run("user-1", "user@example.com", "Test", "User", "tester")
    db.close()
}

const getSuperadminFlag = () => {
    const db = new Database(databasePath)
    const row = db.prepare("select is_superadmin as isSuperadmin from users where id = ?").get(
        "user-1"
    ) as { isSuperadmin: number }
    db.close()
    return row.isSuperadmin
}

describe("promoteSuperadmin script", () => {
    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "progeny-superadmin-"))
        databasePath = join(tempDir, "database.sqlite")
        createTestDatabase()
    })

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true })
    })

    it("prints the user and promotes after confirmation by email lookup", async () => {
        const output: string[] = []
        const result = await promoteUserToSuperadmin({
            databasePath,
            lookup: "user@example.com",
            confirm: async () => true,
            write: (message) => output.push(message)
        })

        expect(result.status).toBe("promoted")
        expect(getSuperadminFlag()).toBe(1)
        expect(output.join("\n")).toContain("Nickname: tester")
        expect(output.join("\n")).toContain("Email: user@example.com")
        expect(output.join("\n")).toContain("ID: user-1")
    })

    it("does not promote when confirmation is rejected", async () => {
        const result = await promoteUserToSuperadmin({
            databasePath,
            lookup: "user-1",
            confirm: async () => false,
            write: () => {}
        })

        expect(result.status).toBe("cancelled")
        expect(getSuperadminFlag()).toBe(0)
    })

    it("returns not-found without changing any user", async () => {
        const result = await promoteUserToSuperadmin({
            databasePath,
            lookup: "missing@example.com",
            confirm: async () => true,
            write: () => {}
        })

        expect(result.status).toBe("not-found")
        expect(getSuperadminFlag()).toBe(0)
    })
})
