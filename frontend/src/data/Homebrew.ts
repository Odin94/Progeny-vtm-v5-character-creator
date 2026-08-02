export const homebrewItemKinds = [
    "discipline",
    "power",
    "ritual",
    "ceremony",
    "formula",
    "loresheet",
    "merit",
    "flaw",
    "clan"
] as const

export type HomebrewItemKind = (typeof homebrewItemKinds)[number]

export type HomebrewSource = {
    itemId: string
    collectionId: string
    collectionName: string
}

export type HomebrewDisciplineReference = {
    type: "official" | "homebrew"
    name: string
    itemId?: string
}

export type HomebrewItemBase = {
    id?: string
    kind: HomebrewItemKind
    name: string
}

export type HomebrewDiscipline = HomebrewItemBase & {
    kind: "discipline"
    summary: string
    description: string
    logo: string
}

export type HomebrewPower = HomebrewItemBase & {
    kind: "power" | "ritual" | "ceremony" | "formula"
    summary: string
    description: string
    discipline: string
    disciplineRef?: HomebrewDisciplineReference
    level: number
    dicePool: string
    rouseChecks: number
    amalgamPrerequisites: Array<{ discipline: string; level: number }>
    requiredTime?: string
    ingredients?: string
    prerequisitePowers?: string[]
}

export type HomebrewMeritFlaw = HomebrewItemBase & {
    kind: "merit" | "flaw"
    summary: string
    description: string
    costs: number[]
    excludes: string[]
}

export type HomebrewLoresheet = HomebrewItemBase & {
    kind: "loresheet"
    summary: string
    description: string
    source: string
    requirements: string
    tiers: Array<{ level: number; name: string; summary: string }>
}

export type HomebrewClan = HomebrewItemBase & {
    kind: "clan"
    summary: string
    description: string
    logo: string
    bane: string
    compulsion: string
    nativeDisciplines: string[]
    nativeDisciplineRefs?: HomebrewDisciplineReference[]
    excludedPredatorTypes: string[]
    excludedMeritsAndFlaws: string[]
}

export type HomebrewItem =
    | HomebrewDiscipline
    | HomebrewPower
    | HomebrewMeritFlaw
    | HomebrewLoresheet
    | HomebrewClan

export type HomebrewCollection = {
    id: string
    name: string
    shortDescription: string
    description: string
    tags: string[]
    contentWarning: string
    sourceLibraryEntryId: string | null
    sourcePublicationId: string | null
    rootSourceLibraryEntryId: string | null
    createdAt: string
    updatedAt: string
    items: Array<HomebrewItem & { id: string }>
    coteries?: Array<{ id: string; name: string }>
    enabledForAccount?: boolean
}

export type HomebrewCollectionInput = {
    name: string
    shortDescription: string
    description: string
    tags: string[]
    contentWarning: string
    items: HomebrewItem[]
}

export type HomebrewLibrarySummary = {
    id: string
    authorId: string | null
    publicationId: string
    version: number
    name: string
    shortDescription: string
    tags: string[]
    contentWarning: string
    authorNickname: string
    publishedAt: string
    itemCounts: Partial<Record<HomebrewItemKind, number>>
    ratingCount: number
    averageRating: number
    weightedRating: number
    copyCount: number
    commentCount: number
}

export type HomebrewComment = {
    id: string
    userId: string
    authorNickname: string
    body: string
    createdAt: string
    updatedAt: string
}

export type HomebrewLibraryDetail = {
    id: string
    publicationId: string
    version: number
    authorId: string | null
    authorNickname: string
    publishedAt: string
    snapshot: HomebrewCollection
    source: {
        entryId: string
        publicationId: string
        version: number
        name: string
        authorNickname: string
        available: boolean
    } | null
    ratingCount: number
    averageRating: number
    comments: HomebrewComment[]
}

export type HomebrewPublishRequest = {
    id: string
    collectionId: string | null
    libraryEntryId: string | null
    status: "pending" | "approved" | "denied" | "withdrawn"
    denialMessage: string | null
    snapshot: HomebrewCollection
    createdAt: string
    reviewedAt: string | null
    requester?: { id: string; nickname: string | null; email: string }
}

export const createEmptyHomebrewItem = (kind: HomebrewItemKind): HomebrewItem => {
    if (kind === "discipline") {
        return { kind, name: "", summary: "", description: "", logo: "" }
    }
    if (["power", "ritual", "ceremony", "formula"].includes(kind)) {
        const discipline =
            kind === "ritual" ? "blood sorcery" : kind === "ceremony" ? "oblivion" : ""
        return {
            kind: kind as HomebrewPower["kind"],
            name: "",
            summary: "",
            description: "",
            discipline,
            disciplineRef: {
                type: "official",
                name: discipline
            },
            level: 1,
            dicePool: "",
            rouseChecks: 0,
            amalgamPrerequisites: [],
            ...((kind === "ritual" || kind === "ceremony" || kind === "formula") && {
                requiredTime: "",
                ingredients: ""
            }),
            ...(kind === "ceremony" && {
                prerequisitePowers: []
            })
        }
    }
    if (kind === "merit" || kind === "flaw") {
        return {
            kind,
            name: "",
            summary: "",
            description: "",
            costs: [1],
            excludes: []
        }
    }
    if (kind === "loresheet") {
        return {
            kind,
            name: "",
            summary: "",
            description: "",
            source: "Homebrew",
            requirements: "",
            tiers: [1, 2, 3, 4, 5].map((level) => ({ level, name: "", summary: "" }))
        }
    }
    return {
        kind: "clan",
        name: "",
        summary: "",
        description: "",
        logo: "",
        bane: "",
        compulsion: "",
        nativeDisciplines: [],
        nativeDisciplineRefs: [],
        excludedPredatorTypes: [],
        excludedMeritsAndFlaws: []
    }
}

export const homebrewKindLabel = (kind: HomebrewItemKind) =>
    kind === "formula" ? "Thin-Blood Formula" : kind.charAt(0).toUpperCase() + kind.slice(1)
