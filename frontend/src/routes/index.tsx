import { createFileRoute } from "@tanstack/react-router"
import { AppShell, BackgroundImage, Container, useComputedColorScheme } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useEffect, useState } from "react"
import Generator from "~/generator/Generator"
import AsideBar from "~/sidebar/AsideBar"
import Sidebar from "~/sidebar/Sidebar"
import Topbar from "~/topbar/Topbar"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { rndInt } from "~/generator/utils"
import { globals } from "~/globals"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import { useViewportSize, useMediaQuery } from "@mantine/hooks"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

export const Route = createFileRoute("/")({
    component: Index,
})

function Index() {
    const { height: viewportHeight, width: viewportWidth } = useViewportSize()
    globals.viewportHeightPx = viewportHeight
    globals.viewportWidthPx = viewportWidth
    globals.isPhoneScreen = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`)
    globals.isSmallScreen = useMediaQuery(`(max-width: ${globals.smallScreenW}px)`)
    const computedColorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true })

    useEffect(() => {
        globals.largeFontSize = globals.isPhoneScreen ? "21px" : "30px"
        globals.smallFontSize = globals.isPhoneScreen ? "16px" : "25px"
        globals.smallerFontSize = globals.isPhoneScreen ? "14px" : "20px"
    }, [globals.isPhoneScreen, globals.isSmallScreen])

    const [character, setCharacter] = useCharacterLocalStorage()
    const [selectedStep, setSelectedStep] = useLocalStorage({ key: "selectedStep", defaultValue: 0 })
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))

    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    useEffect(() => {
        setShowAsideBar(!globals.isSmallScreen)
    }, [globals.isSmallScreen])

    return (
        <AppShell
            padding="0"
            styles={(theme) => ({
                root: {
                    height: "100vh",
                },
                main: {
                    backgroundColor: computedColorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                },
            })}
        >
            {!globals.isSmallScreen && (
                <AppShell.Navbar p="xs" w={{ base: 250, xl: 300 }}>
                    <Sidebar character={character} />
                </AppShell.Navbar>
            )}
            <AppShell.Header p="xs" h={75}>
                <Topbar setShowAsideBar={setShowAsideBar} showAsideBar={showAsideBar} />
            </AppShell.Header>
            {showAsideBar && (
                <AppShell.Aside
                    p="md"
                    w={{ xs: 200 }}
                    style={{ display: "flex", flexDirection: "column" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <AsideBar selectedStep={selectedStep} setSelectedStep={setSelectedStep} character={character} />
                </AppShell.Aside>
            )}
            <BackgroundImage
                h={"100%"}
                src={backgrounds[backgroundIndex]}
                style={{ flex: 1, minHeight: 0 }}
                onClick={() => {
                    if (globals.isSmallScreen && showAsideBar) {
                        setShowAsideBar(false)
                    }
                }}
            >
                <div style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Container h={"100%"} style={{ width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                        <Generator
                            character={character}
                            setCharacter={setCharacter}
                            selectedStep={selectedStep}
                            setSelectedStep={setSelectedStep}
                        />
                    </Container>
                </div>
            </BackgroundImage>
        </AppShell>
    )
}
