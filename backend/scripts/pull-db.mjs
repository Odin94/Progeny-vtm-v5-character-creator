import { config } from "dotenv"
import { execSync } from "child_process"
import { mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

config({ quiet: true })

const { DB_BACKUP_HOST, DB_BACKUP_USER, DB_BACKUP_PATH } = process.env

if (!DB_BACKUP_HOST || !DB_BACKUP_USER || !DB_BACKUP_PATH) {
    console.error("Missing DB_BACKUP_HOST, DB_BACKUP_USER, or DB_BACKUP_PATH in .env")
    process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, "../../ignored/db_backups")
mkdirSync(outDir, { recursive: true })

const ts = new Date().toISOString().replace(/:/g, "-")
const dest = resolve(outDir, `${ts}.sqlite`)

console.log(`Pulling ${DB_BACKUP_USER}@${DB_BACKUP_HOST}:${DB_BACKUP_PATH}`)
console.log(`  → ${dest}`)
execSync(`scp "${DB_BACKUP_USER}@${DB_BACKUP_HOST}:${DB_BACKUP_PATH}" "${dest}"`, {
    stdio: "inherit"
})
console.log("Done.")
