import { Group, Kbd, Text } from "@mantine/core"
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

        const groups: SpotlightActionGroupData[] = [{ group: "Pages", actions: pages }]

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
            nothingFound="No matching pages"
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
                placeholder: "Go to…",
                "aria-label": "Search pages"
            }}
        />
    )
}

/** Footer hint row used inside the topbar trigger tooltip. */
export const QuickNavigatorShortcut = () => {
    const isMac =
        typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "")
    return (
        <Group gap={4} wrap="nowrap">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Text span size="xs" c="dimmed">
                +
            </Text>
            <Kbd>K</Kbd>
        </Group>
    )
}
