import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { config } from "dotenv"

config({ path: "./.env", quiet: true })

const { db } = await import("./index.js")
migrate(db, { migrationsFolder: "./src/db/migrations" })

console.log("Migration completed!")
