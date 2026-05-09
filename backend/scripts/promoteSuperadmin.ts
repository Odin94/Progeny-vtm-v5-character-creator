import Database from "better-sqlite3"
import { config } from "dotenv"
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export type PromoteSuperadminResult =
    | { status: "promoted"; user: SuperadminUser }
    | { status: "already-superadmin"; user: SuperadminUser }
    | { status: "cancelled"; user: SuperadminUser }
    | { status: "not-found"; lookup: string }

export type SuperadminUser = {
    id: string
    email: string
    nickname: string | null
    isSuperadmin: boolean
}

type PromoteSuperadminOptions = {
    databasePath: string
    lookup: string
    confirm: (user: SuperadminUser) => Promise<boolean>
    write?: (message: string) => void
}

const formatUser = (user: SuperadminUser) =>
    [
        `Nickname: ${user.nickname ?? "(none)"}`,
        `Email: ${user.email}`,
        `ID: ${user.id}`,
        `Already superadmin: ${user.isSuperadmin ? "yes" : "no"}`
    ].join("\n")

const findUser = (db: Database.Database, lookup: string): SuperadminUser | null => {
    const query = db.prepare(`
        select
            id,
            email,
            nickname,
            is_superadmin as isSuperadmin
        from users
        where id = ? or lower(email) = lower(?)
        limit 1
    `)

    const row = query.get(lookup, lookup) as
        | (Omit<SuperadminUser, "isSuperadmin"> & { isSuperadmin: number })
        | undefined

    return row ? { ...row, isSuperadmin: !!row.isSuperadmin } : null
}

export async function promoteUserToSuperadmin({
    databasePath,
    lookup,
    confirm,
    write = console.log
}: PromoteSuperadminOptions): Promise<PromoteSuperadminResult> {
    const resolvedDatabasePath = databasePath === ":memory:" ? databasePath : resolve(databasePath)
    const db = new Database(resolvedDatabasePath)
    db.pragma("foreign_keys = ON")

    try {
        write(`Database: ${resolvedDatabasePath}`)
        const user = findUser(db, lookup)

        if (!user) {
            write(`No user found for "${lookup}".`)
            return { status: "not-found", lookup }
        }

        write(formatUser(user))

        if (user.isSuperadmin) {
            write("No change needed; user is already a superadmin.")
            return { status: "already-superadmin", user }
        }

        const confirmed = await confirm(user)
        if (!confirmed) {
            write("Cancelled. No changes made.")
            return { status: "cancelled", user }
        }

        db.prepare("update users set is_superadmin = 1, updated_at = unixepoch() where id = ?").run(
            user.id
        )

        const promoted = findUser(db, user.id)
        if (!promoted?.isSuperadmin) {
            throw new Error("Superadmin promotion did not persist; verify the database path.")
        }

        write("User promoted to superadmin.")
        return { status: "promoted", user: promoted }
    } finally {
        db.close()
    }
}

const runCli = async () => {
    const lookup = process.argv[2]?.trim()
    if (!lookup) {
        console.error("Usage: pnpm run admin:promote-superadmin -- <user-id-or-email>")
        process.exitCode = 1
        return
    }

    config({ path: resolve(process.cwd(), ".env"), quiet: true })

    const databasePath = process.env.DATABASE_URL ?? "./database.sqlite"
    const rl = createInterface({ input, output })

    try {
        const result = await promoteUserToSuperadmin({
            databasePath,
            lookup,
            confirm: async (user) => {
                const answer = await rl.question(
                    `Type ${user.email} to confirm superadmin promotion: `
                )
                return answer.trim() === user.email
            }
        })

        if (result.status === "not-found" || result.status === "cancelled") {
            process.exitCode = 1
        }
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
    } finally {
        rl.close()
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    void runCli()
}
