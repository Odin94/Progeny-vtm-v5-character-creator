import { AppShell, Container } from "@mantine/core"
import type { ReactNode } from "react"
import pageShellClasses from "~/components/ui/PageShell.module.css"
import Topbar from "~/topbar/Topbar"
import classes from "./me.module.css"

// Use Topbar directly so this frame can also render in account tests without the router.
export const MeShell = ({ children }: { children: ReactNode }) => (
    <AppShell header={{ height: 52 }} padding={0}>
        <AppShell.Header>
            <Topbar />
        </AppShell.Header>
        <AppShell.Main className={pageShellClasses.main}>
            <Container size="lg" className={`${pageShellClasses.content} ${classes.content}`}>
                {children}
            </Container>
        </AppShell.Main>
    </AppShell>
)
