// Isolated HTTP fixtures for production UI checks. No authentication provider or real database.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { resolve, extname } from "node:path"
const [buildArg, portArg, fixtureArg] = process.argv.slice(2)
if (!buildArg || !portArg || !fixtureArg)
    throw new Error("Usage: node scripts/performancePreview.mjs BUILD PORT FIXTURE_JSON")
const build = resolve(buildArg),
    fixture = JSON.parse(await readFile(resolve(fixtureArg), "utf8"))
const now = "2026-10-03T00:00:00.000Z"
const user = {
    id: "fixture-user",
    email: "fixture@example.invalid",
    nickname: "Fixture Player",
    isSuperadmin: true,
    actorIsSuperadmin: true,
    nameTagEnabled: false,
    nameTagVisible: false,
    impersonation: { active: false }
}
const character = {
    id: "fixture-character",
    name: fixture.character.name,
    data: fixture.character,
    version: 1,
    characterVersion: 0,
    createdAt: now,
    updatedAt: now,
    ownerId: user.id,
    canEdit: true
}
const characters = Array.from({ length: 60 }, (_, i) => ({
    ...character,
    id: `fixture-character-${i}`,
    name: `Vampire ${i}`,
    data: { ...fixture.character, name: `Vampire ${i}` }
}))
const items = Array.from({ length: 60 }, (_, i) => ({
    id: `rule-${i}`,
    kind: "merit",
    name: `Rule ${i}`,
    summary: "A representative rule",
    description: "Rule details",
    costs: [1],
    excludes: []
}))
const collection = {
    id: "fixture",
    name: "Performance Collection",
    shortDescription: "Local benchmark fixture",
    description: "A synthetic collection for interface checks",
    tags: ["fixture"],
    contentWarning: "",
    items,
    createdAt: now,
    updatedAt: now,
    enabledForAccount: false,
    sourceLibraryEntryId: null,
    sourcePublicationId: null,
    rootSourceLibraryEntryId: null
}
const summary = {
    id: "fixture",
    authorId: "other-author",
    publicationId: "publication",
    version: 1,
    name: collection.name,
    shortDescription: collection.shortDescription,
    tags: collection.tags,
    contentWarning: "",
    authorNickname: "Fixture Author",
    publishedAt: now,
    itemCounts: { merit: 60 },
    ratingCount: 10,
    averageRating: 3.5,
    weightedRating: 3.5,
    copyCount: 5,
    commentCount: 0
}
const coterie = {
    id: "fixture",
    name: "Performance Coterie",
    createdAt: now,
    updatedAt: now,
    owned: true,
    canEdit: true,
    canManageInvites: true,
    canManagePlayers: true,
    playerCount: 1,
    players: [],
    members: characters.slice(0, 6).map((c, i) => ({
        id: `member-${i}`,
        characterId: c.id,
        character: { ...c, ownedByCurrentUser: true },
        createdAt: now,
        playerNickname: user.nickname
    }))
}
const requests = [],
    comments = [],
    notes = []
const responseFor = (url, method, body) => {
    const path = url.pathname.replace(/^\/api/, "")
    if (path === "/health") return { status: "ok" }
    if (path === "/coteries/fixture/notes") {
        if (method === "PUT")
            notes.unshift({ id: `notes-${notes.length}`, content: body.content, createdAt: now })
        return { current: notes[0] ?? null, versions: notes, createdNewVersion: method === "PUT" }
    }
    if (path === "/homebrew/library/fixture/comments" && method === "POST") {
        const comment = {
            id: `comment-${comments.length}`,
            userId: user.id,
            authorNickname: user.nickname,
            body: body.body,
            createdAt: now,
            updatedAt: now
        }
        comments.push(comment)
        return comment
    }
    if (path === "/auth/me") return method === "PUT" ? Object.assign(user, body) : user
    if (path === "/auth/preferences") return { colorTheme: null, backgroundImage: null }
    if (path === "/auth/callback") return { success: true, returnTo: "/me", user }
    if (path === "/characters") return characters
    if (path.startsWith("/characters/") && path.endsWith("/notes"))
        return { current: null, versions: [] }
    if (path.startsWith("/characters/") && path.endsWith("/homebrew")) return []
    if (path.startsWith("/characters/") && path.endsWith("/shares")) return []
    if (path.startsWith("/characters/")) return character
    if (path === "/shares") return []
    if (path === "/coteries") return [coterie]
    if (path === "/coteries/vitals") return []
    if (path.endsWith("/notes")) return { current: null, versions: [] }
    if (path.startsWith("/coteries/") && path.endsWith("/homebrew")) return []
    if (path.startsWith("/coteries/") && path.endsWith("/invites")) return []
    if (path.startsWith("/coteries/")) return coterie
    if (path === "/chat/recent-session") return { available: false }
    if (path.includes("recent-changes")) return { changes: [], announcement: null }
    if (path === "/homebrew/collections") return [collection]
    if (path.startsWith("/homebrew/collections/"))
        return method === "PUT" ? Object.assign(collection, body) : collection
    if (path === "/homebrew/library")
        return [summary].filter(
            (entry) =>
                !url.searchParams.get("query") ||
                entry.name.toLowerCase().includes(url.searchParams.get("query").toLowerCase())
        )
    if (path === "/homebrew/library/fixture")
        return { ...summary, snapshot: collection, source: null, comments }
    if (path === "/admin/users")
        return { users: [user], page: 1, pageSize: 50, total: 1, totalPages: 1 }
    if (path.includes("publish-requests")) return []
    return undefined
}
const mime = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".png": "image/png",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".woff2": "font/woff2"
}
createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost")
    res.setHeader("Cache-Control", "no-store")
    if (url.pathname === "/__fixture/requests") {
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify(requests))
        return
    }
    if (url.pathname.startsWith("/api/")) {
        let raw = ""
        for await (const chunk of req) raw += chunk
        const body = raw ? JSON.parse(raw) : undefined
        requests.push({ path: url.pathname + url.search, method: req.method, body })
        const result = responseFor(url, req.method, body)
        res.setHeader("Content-Type", "application/json")
        res.setHeader("X-CSRF-Token", "fixture-csrf")
        res.statusCode = result === undefined ? 404 : 200
        res.end(JSON.stringify(result ?? { error: "Missing fixture", path: url.pathname }))
        return
    }
    try {
        const safePath = resolve(build, "." + decodeURIComponent(url.pathname))
        if (!safePath.startsWith(build + "/") && safePath !== build) throw new Error("Invalid path")
        let file =
            url.pathname.startsWith("/assets/") ||
            url.pathname.startsWith("/fonts/") ||
            url.pathname === "/favicon.svg"
                ? safePath
                : resolve(build, "index.html")
        let data = await readFile(file)
        if (extname(file) === ".html") {
            const bootstrap = `<script>const fixtureFetch=window.fetch.bind(window);window.fetch=(input,init)=>{let url=typeof input==='string'?input:input.url;return fixtureFetch(url.startsWith('http://localhost:3001')?'/api'+url.slice('http://localhost:3001'.length):input,init)};if(!localStorage.getItem('character'))localStorage.setItem('character',${JSON.stringify(JSON.stringify(fixture.character))});window.WebSocket=class extends window.WebSocket{constructor(url,protocols){const fixtureUrl=new URL(url,location.href);fixtureUrl.host=location.host;super(fixtureUrl,protocols)}};window.__PERFORMANCE_FIXTURE__=true;</script>`
            data = Buffer.from(data.toString().replace("<head>", "<head>" + bootstrap))
        }
        res.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream")
        res.end(data)
    } catch {
        res.statusCode = 404
        res.end("Not found")
    }
}).listen(Number(portArg), "127.0.0.1", () =>
    console.log(`Fixture preview: http://127.0.0.1:${portArg}`)
)
