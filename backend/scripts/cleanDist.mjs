import { rm } from "node:fs/promises"
import { resolve } from "node:path"

await rm(resolve("dist"), { recursive: true, force: true })
