import { AppShell, Container, type ContainerProps } from "@mantine/core"
import type { ReactNode } from "react"
import AppTopbar, { type AppTopbarProps } from "~/components/AppTopbar"
import classes from "./PageShell.module.css"

export type PageShellProps = {
    children: ReactNode
    /** Mantine Container size for the content column. Pass `false` to render children full-bleed. */
    size?: ContainerProps["size"] | false
    /** Props forwarded to the shared top bar. */
    topbarProps?: AppTopbarProps
    /** Extra class on `AppShell.Main` (e.g. for a page-specific backdrop). */
    mainClassName?: string
}

/**
 * Standard page frame: sticky glass top bar + scrolling main area on the global candlelit
 * backdrop, with responsive gutters and bottom safe-area padding. Use it for account,
 * homebrew, coterie, admin and info pages. (The generator and sheet keep their own shells.)
 *
 * ```tsx
 * <PageShell size="lg">
 *     <PageHeader title="Homebrew" … />
 *     …
 * </PageShell>
 * ```
 */
export const PageShell = ({
    children,
    size = "lg",
    topbarProps,
    mainClassName
}: PageShellProps) => (
    <AppShell header={{ height: 52 }} padding={0}>
        <AppShell.Header>
            <AppTopbar {...topbarProps} />
        </AppShell.Header>
        <AppShell.Main className={[classes.main, mainClassName].filter(Boolean).join(" ")}>
            {size === false ? (
                children
            ) : (
                <Container size={size} className={classes.content}>
                    {children}
                </Container>
            )}
        </AppShell.Main>
    </AppShell>
)
