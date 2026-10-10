import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { gzipSync } from "node:zlib"
const directory = resolve(process.argv[2] || "build")
const manifest = JSON.parse(await readFile(resolve(directory, ".vite/manifest.json"), "utf8"))
const routePages = {
    "/": "LandingPage",
    "/create": "CreatorPage",
    "/sheet": "CharacterSheet",
    "/me": "MePage",
    "/coteries/$coterieId": "CoteriePage",
    "/homebrew": "HomebrewPage",
    "/homebrew/$collectionId": "HomebrewDetailsPage",
    "/homebrew/library": "HomebrewLibraryPage",
    "/homebrew/library/$collectionId": "HomebrewLibraryDetailsPage",
    "/admin": "AdminImpersonationPage",
    "/auth/callback": null
}
for (const file of await readdir(new URL("../src/routes/", import.meta.url)))
    if (file.startsWith("features"))
        routePages["/" + file.replace(/\.tsx$/, "").replaceAll(".", "/")] = "FeaturesPage"
for (const [route, page] of Object.entries(routePages)) {
    const seen = new Set()
    const visit = (key) => {
        if (!key || seen.has(key)) return
        seen.add(key)
        for (const dep of manifest[key]?.imports ?? []) visit(dep)
    }
    visit("index.html")
    visit(Object.keys(manifest).find((k) => page && k.endsWith("/" + page + ".tsx")))
    let bytes = 0,
        gzipBytes = 0
    for (const key of seen) {
        const data = await readFile(resolve(directory, manifest[key].file))
        bytes += data.length
        gzipBytes += gzipSync(data).length
    }
    console.log(JSON.stringify({ route, page, staticChunks: seen.size, bytes, gzipBytes }))
}
