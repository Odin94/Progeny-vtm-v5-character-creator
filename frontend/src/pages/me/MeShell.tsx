import { AppShell, Container } from "@mantine/core"
import { useState, type ReactNode } from "react"
import pageShellClasses from "~/components/ui/PageShell.module.css"
import { rndInt } from "~/generator/utils"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import Topbar from "~/topbar/Topbar"
import classes from "./me.module.css"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

/**
 * Account page frame: the shared glass top bar plus one of the city photographs fading out of
 * the top of the page. (Uses `~/topbar/Topbar` rather than `PageShell` so the page keeps working
 * where the router is not mounted, e.g. in the account page tests.)
 */
export const MeShell = ({ children }: { children: ReactNode }) => {
    const [background] = useState(() => backgrounds[rndInt(0, backgrounds.length)])

    return (
        <AppShell header={{ height: 52 }} padding={0}>
            <AppShell.Header>
                <Topbar />
            </AppShell.Header>
            <AppShell.Main className={`${pageShellClasses.main} ${classes.main}`}>
                <div
                    className={classes.hero}
                    style={{ backgroundImage: `url(${background})` }}
                    aria-hidden="true"
                />
                <Container size="lg" className={`${pageShellClasses.content} ${classes.content}`}>
                    {children}
                </Container>
            </AppShell.Main>
        </AppShell>
    )
}
