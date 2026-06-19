import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { createConnection } from "node:net"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")
const projects = {
    frontend: {
        dir: join(rootDir, "frontend"),
        migrations: false
    },
    backend: {
        dir: join(rootDir, "backend"),
        migrations: true
    }
}

const requestedProject = process.argv[2]
const flags = new Set(process.argv.slice(3))

if (!requestedProject || requestedProject === "--help" || requestedProject === "-h") {
    console.log("Usage: node scripts/dev-preflight.mjs <frontend|backend> [--wait-for-backend]")
    process.exit(requestedProject ? 0 : 1)
}

const project = projects[requestedProject]

if (!project) {
    console.error(`Unknown project "${requestedProject}". Expected frontend or backend.`)
    process.exit(1)
}

const label = `[preflight:${requestedProject}]`

ensureDependencies(project)

if (project.migrations) {
    loadBackendEnv(project.dir)
    ensureMigrations(project.dir)
}

if (flags.has("--wait-for-backend")) {
    await waitForTcp({
        host: process.env.PROGENY_BACKEND_HOST ?? "127.0.0.1",
        port: Number(process.env.PROGENY_BACKEND_PORT ?? 3001),
        timeoutMs: Number(process.env.PROGENY_BACKEND_WAIT_TIMEOUT_MS ?? 30000)
    })
}

function ensureDependencies({ dir }) {
    const nodeModulesDir = join(dir, "node_modules")
    const stateFile = join(nodeModulesDir, ".cache", "progeny", "dev-preflight.json")
    const dependencyHash = hashExistingFiles([join(dir, "package.json"), join(dir, "pnpm-lock.yaml")])
    const state = readJson(stateFile) ?? {}

    if (existsSync(nodeModulesDir) && state.dependencyHash === dependencyHash) {
        console.log(`${label} dependencies unchanged`)
        return
    }

    console.log(`${label} installing dependencies`)
    run("pnpm", ["install", "--frozen-lockfile"], dir, {
        CI: process.env.CI ?? "true"
    })

    writeJson(stateFile, {
        ...state,
        dependencyHash,
        updatedAt: new Date().toISOString()
    })
}

function ensureMigrations(backendDir) {
    const migrationsDir = join(backendDir, "src", "db", "migrations")
    const latestMigration = getLatestMigration(migrationsDir)

    if (!latestMigration) {
        console.log(`${label} no migrations found`)
        return
    }

    const databaseUrl = process.env.DATABASE_URL ?? "./database.sqlite"

    if (databaseUrl === ":memory:") {
        console.log(`${label} skipping migrations for in-memory database`)
        return
    }

    const databasePath = resolveDatabasePath(backendDir, databaseUrl)

    if (!existsSync(databasePath)) {
        console.log(`${label} database missing; running migrations`)
        run("pnpm", ["run", "db:migrate"], backendDir)
        return
    }

    const appliedMigration = getLatestAppliedMigration(backendDir, databasePath)

    if (!appliedMigration || appliedMigration.createdAt < latestMigration.when) {
        console.log(`${label} migrations pending; running db:migrate`)
        run("pnpm", ["run", "db:migrate"], backendDir)
        return
    }

    console.log(`${label} migrations unchanged`)
}

function getLatestMigration(migrationsDir) {
    const journal = readJson(join(migrationsDir, "meta", "_journal.json"))

    if (!journal?.entries?.length) {
        return null
    }

    return journal.entries.reduce((latest, entry) => (entry.when > latest.when ? entry : latest))
}

function getLatestAppliedMigration(backendDir, databasePath) {
    const require = createRequire(join(backendDir, "package.json"))
    const Database = require("better-sqlite3")
    const database = new Database(databasePath, { readonly: true, fileMustExist: true })

    try {
        const row = database
            .prepare(
                "SELECT hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1"
            )
            .get()

        if (!row) {
            return null
        }

        return {
            createdAt: Number(row.createdAt)
        }
    } catch (error) {
        if (String(error.message).includes("no such table")) {
            return null
        }

        throw error
    } finally {
        database.close()
    }
}

function loadBackendEnv(backendDir) {
    const envFile = join(backendDir, ".env")

    if (!existsSync(envFile)) {
        return
    }

    const require = createRequire(join(backendDir, "package.json"))
    const { config } = require("dotenv")
    config({ path: envFile, quiet: true })
}

function resolveDatabasePath(backendDir, databaseUrl) {
    if (databaseUrl.startsWith("file:")) {
        return fileURLToPath(databaseUrl)
    }

    return resolve(backendDir, databaseUrl)
}

function hashExistingFiles(files) {
    const hash = createHash("sha256")

    for (const file of files) {
        if (!existsSync(file)) {
            continue
        }

        hash.update(relative(rootDir, file))
        hash.update("\0")
        hash.update(readFileSync(file))
        hash.update("\0")
    }

    return hash.digest("hex")
}

function readJson(file) {
    if (!existsSync(file)) {
        return null
    }

    return JSON.parse(readFileSync(file, "utf8"))
}

function writeJson(file, data) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function run(command, args, cwd, env = {}) {
    const executable = process.platform === "win32" ? `${command}.cmd` : command
    const result = spawnSync(executable, args, {
        cwd,
        stdio: "inherit",
        env: {
            ...process.env,
            ...env
        }
    })

    if (result.error) {
        throw result.error
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }
}

async function waitForTcp({ host, port, timeoutMs }) {
    const startedAt = Date.now()
    let logged = false

    while (Date.now() - startedAt < timeoutMs) {
        if (await canConnect(host, port)) {
            if (logged) {
                console.log(`${label} backend is ready`)
            }
            return
        }

        if (!logged) {
            console.log(`${label} waiting for backend on ${host}:${port}`)
            logged = true
        }

        await sleep(500)
    }

    console.warn(`${label} backend was not ready after ${timeoutMs}ms; starting anyway`)
}

function canConnect(host, port) {
    return new Promise((resolveConnect) => {
        const socket = createConnection({ host, port })
        const done = (ready) => {
            socket.removeAllListeners()
            socket.destroy()
            resolveConnect(ready)
        }

        socket.setTimeout(500)
        socket.once("connect", () => done(true))
        socket.once("error", () => done(false))
        socket.once("timeout", () => done(false))
    })
}

function sleep(ms) {
    return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}
