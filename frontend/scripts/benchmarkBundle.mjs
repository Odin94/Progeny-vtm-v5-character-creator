import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { gzipSync } from "node:zlib"

const directory = resolve(process.argv[2] || "build")
const manifest = JSON.parse(await readFile(resolve(directory, ".vite/manifest.json"), "utf8"))
for (const [name, root] of Object.entries(manifest)) {
    if (!root.isEntry && !name.endsWith("CharacterSheet.tsx")) continue
    const seen = new Set()
    const visit = (key) => {
        if (seen.has(key)) return
        seen.add(key)
        for (const dependency of manifest[key]?.imports ?? []) visit(dependency)
    }
    visit(name)
    let bytes = 0
    let gzipBytes = 0
    for (const key of seen) {
        const chunk = await readFile(resolve(directory, manifest[key].file))
        bytes += chunk.length
        gzipBytes += gzipSync(chunk).length
    }
    console.log(JSON.stringify({ entry: name, staticChunks: seen.size, bytes, gzipBytes }))
}
