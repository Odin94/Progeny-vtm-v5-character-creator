import { notifications } from "@mantine/notifications"
import {
    createSpotlight,
    Spotlight,
    useSpotlight,
    type SpotlightActionData,
    type SpotlightActionGroupData
} from "@mantine/spotlight"
import {
    IconBook2,
    IconBooks,
    IconCookie,
    IconDownload,
    IconFileTypePdf,
    IconDeviceGamepad2,
    IconBrandDiscord,
    IconDroplet,
    IconHome,
    IconInfoCircle,
    IconLogin2,
    IconNotebook,
    IconSearch,
    IconUserCircle,
    IconUserShield,
    IconUsersGroup
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { useAuth } from "~/hooks/useAuth"
import { useCoteries } from "~/hooks/useCoteries"
import { useHomebrewCollections } from "~/hooks/useHomebrew"
import { getEmptyCharacter, isCharacterEmpty } from "~/data/Character"
import { characterIntake } from "~/modules/characterIntake"
import type { VttDownloadFormat } from "~/generator/vttDownloads"
import { openCookiePreferences } from "~/utils/cookiePreferences"
import classes from "./QuickNavigator.module.css"

/** Store for the ⌘K / Ctrl+K navigator. `quickNavigator.open()` opens it from anywhere. */
export const [quickNavigatorStore, quickNavigator] = createSpotlight()

const ICON = { size: 18, stroke: 1.6 } as const

const FEATURE_GUIDES = [
    { slug: "character-creation", label: "Character creation" },
    { slug: "character-sheet", label: "Character sheet" },
    { slug: "account-and-multiple-characters", label: "Account & multiple characters" },
    { slug: "coteries", label: "Coteries & playing together" },
    { slug: "credits-and-contact", label: "Credits & contact" }
] as const

const EXPORT_ACTIONS = [
    {
        format: "pdf",
        label: "Download PDF",
        keywords: ["export", "print", "character sheet", "blank sheet"],
        icon: IconFileTypePdf
    },
    {
        format: "progeny-json",
        label: "Download character JSON",
        keywords: ["save file", "backup", "export json", "native json", "json download"],
        icon: IconDownload
    },
    {
        format: "foundry-json",
        label: "Export Foundry VTT JSON",
        keywords: ["download", "file", "foundry json", "vtt export"],
        icon: IconDeviceGamepad2
    },
    {
        format: "inconnu-json",
        label: "Export Inconnu JSON",
        keywords: ["download", "discord", "file", "inconnu export"],
        icon: IconBrandDiscord
    },
    {
        format: "inconnu-commands",
        label: "Download Inconnu Discord commands",
        keywords: ["export", "bot", "discord text", "command export"],
        icon: IconBrandDiscord
    }
] as const

const exportCharacter = async (format: VttDownloadFormat | "pdf" | "progeny-json") => {
    try {
        // Resolve the active draft at click time so account switches and sheet edits
        // are reflected even when the quick navigator is already open.
        const stored = localStorage.getItem("character")
        const result = stored ? characterIntake.read(stored, "local-storage") : null
        if (result && !result.success) {
            notifications.show({
                title: "Could not export character",
                message: "Open the character creator to recover this draft.",
                color: "red"
            })
            return
        }
        const character = result?.character ?? getEmptyCharacter()
        if (
            format !== "pdf" &&
            !character.name.trim() &&
            !character.id &&
            isCharacterEmpty(character)
        ) {
            notifications.show({
                title: "No character to export",
                message: "Create or load a character first."
            })
            return
        }
        const source = "quick-navigator"

        if (format === "pdf") {
            const { downloadCharacterSheet } = await import("~/generator/pdfCreator")
            await downloadCharacterSheet(character, source)
        } else if (format === "progeny-json") {
            const { downloadJson } = await import("~/generator/utils")
            await downloadJson(character, undefined, source)
        } else {
            const { downloadVttCharacter } = await import("~/generator/vttDownloads")
            await downloadVttCharacter(character, format, source)
        }
    } catch (error) {
        console.error(error)
        notifications.show({
            title: "Could not export character",
            message: "Try the download again.",
            color: "red"
        })
    }
}

/**
 * Global quick navigator (Mantine Spotlight) mounted once in `__root.tsx`.
 * Opens with ⌘K / Ctrl+K, autofocuses its search field, and lists pages plus the signed-in
 * user's coteries and homebrew collections (fetched lazily the first time it opens).
 */
export const QuickNavigator = () => {
    const navigate = useNavigate()
    const { isAuthenticated, signIn, user } = useAuth()
    const { opened } = useSpotlight(quickNavigatorStore)
    const canUseAdminTools = !!user?.actorIsSuperadmin && !user?.impersonation?.active
    // Only fetch account data once the navigator is actually used.
    const { data: coteries } = useCoteries(isAuthenticated && opened)
    const { data: collections } = useHomebrewCollections(isAuthenticated && opened)

    const actions = useMemo<(SpotlightActionData | SpotlightActionGroupData)[]>(() => {
        const go = (to: string) => () => {
            void navigate({ to })
        }

        const pages: SpotlightActionData[] = [
            {
                id: "home",
                label: "Home",
                description: "Landing page",
                leftSection: <IconHome {...ICON} />,
                onClick: go("/")
            },
            {
                id: "create",
                label: "Character creator",
                description: "Guided step-by-step creation",
                keywords: ["generator", "new", "create", "wizard"],
                leftSection: <IconDroplet {...ICON} />,
                onClick: go("/create")
            },
            {
                id: "sheet",
                label: "Character sheet",
                description: "Play, track damage, roll dice",
                keywords: ["play", "dice", "roll"],
                leftSection: <IconNotebook {...ICON} />,
                onClick: go("/sheet")
            },
            isAuthenticated
                ? {
                      id: "account",
                      label: "Account",
                      description: "Characters, coteries and settings",
                      keywords: ["me", "profile", "characters"],
                      leftSection: <IconUserCircle {...ICON} />,
                      onClick: go("/me")
                  }
                : {
                      id: "sign-in",
                      label: "Sign in",
                      description: "Save characters and join coteries",
                      keywords: ["login", "account"],
                      leftSection: <IconLogin2 {...ICON} />,
                      onClick: () => signIn()
                  },
            {
                id: "homebrew",
                label: "My homebrew",
                description: "Author custom rules and collections",
                leftSection: <IconBook2 {...ICON} />,
                onClick: go("/homebrew")
            },
            {
                id: "homebrew-library",
                label: "Homebrew library",
                description: "Browse community collections",
                keywords: ["community", "public", "browse"],
                leftSection: <IconBooks {...ICON} />,
                onClick: go("/homebrew/library")
            },
            ...(canUseAdminTools
                ? [
                      {
                          id: "admin",
                          label: "Admin",
                          leftSection: <IconUserShield {...ICON} />,
                          onClick: go("/admin")
                      }
                  ]
                : []),
            {
                id: "cookies",
                label: "Cookie preferences",
                keywords: ["privacy", "analytics", "consent"],
                leftSection: <IconCookie {...ICON} />,
                onClick: () => openCookiePreferences()
            }
        ]

        const groups: SpotlightActionGroupData[] = [
            { group: "Pages", actions: pages },
            {
                group: "Character exports",
                actions: EXPORT_ACTIONS.map(({ format, label, keywords, icon: ExportIcon }) => ({
                    id: `download-${format}`,
                    label,
                    keywords: [...keywords],
                    leftSection: <ExportIcon {...ICON} />,
                    onClick: () => void exportCharacter(format)
                }))
            }
        ]

        if (coteries?.length) {
            groups.push({
                group: "Coteries",
                actions: coteries.map((coterie) => ({
                    id: `coterie-${coterie.id}`,
                    label: coterie.name,
                    keywords: ["coterie"],
                    leftSection: <IconUsersGroup {...ICON} />,
                    onClick: go(`/coteries/${coterie.id}`)
                }))
            })
        }

        if (collections?.length) {
            groups.push({
                group: "Homebrew collections",
                actions: collections.map((collection) => ({
                    id: `homebrew-${collection.id}`,
                    label: collection.name,
                    description: collection.shortDescription || undefined,
                    keywords: ["homebrew", ...(collection.tags ?? [])],
                    leftSection: <IconBook2 {...ICON} />,
                    onClick: go(`/homebrew/${collection.id}`)
                }))
            })
        }

        groups.push({
            group: "Guide",
            actions: FEATURE_GUIDES.map((guide) => ({
                id: `guide-${guide.slug}`,
                label: guide.label,
                keywords: ["features", "help", "guide"],
                leftSection: <IconInfoCircle {...ICON} />,
                onClick: go(`/features/${guide.slug}`)
            }))
        })

        return groups
    }, [canUseAdminTools, collections, coteries, isAuthenticated, navigate, signIn])

    return (
        <Spotlight
            store={quickNavigatorStore}
            actions={actions}
            shortcut={["mod + K"]}
            nothingFound="No matches"
            highlightQuery
            limit={40}
            scrollable
            maxHeight={420}
            radius="lg"
            classNames={{
                content: classes.content,
                search: classes.search,
                actionsList: classes.actionsList,
                actionsGroup: classes.actionsGroup,
                action: classes.action,
                actionLabel: classes.actionLabel,
                actionDescription: classes.actionDescription,
                actionSection: classes.actionSection,
                empty: classes.empty,
                footer: classes.footer
            }}
            searchProps={{
                leftSection: <IconSearch size={18} stroke={1.6} />,
                placeholder: "Jump to a page or export…",
                "aria-label": "Search pages and exports"
            }}
        />
    )
}
