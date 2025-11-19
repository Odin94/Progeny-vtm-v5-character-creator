import { AppShell, BackgroundImage, Container, Header, Navbar } from "@mantine/core"
import { useLocalStorage, useMediaQuery } from "@mantine/hooks"
import { useEffect, useState } from "react"
import "./App.css"
import { Character, getEmptyCharacter } from "./data/Character"
import Generator from "./generator/Generator"
import AsideBar from "./sidebar/AsideBar"
import Sidebar from "./sidebar/Sidebar"
import Topbar from "./topbar/Topbar"

import { useViewportSize } from "@mantine/hooks"
import { rndInt } from "./generator/utils"
import { globals } from "./globals"
import club from "./resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "./resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "./resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "./resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "./resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "./resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

function App() {
    const { height: viewportHeight, width: viewportWidth } = useViewportSize()
    globals.viewportHeightPx = viewportHeight
    globals.viewportWidthPx = viewportWidth
    globals.isPhoneScreen = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`)
    globals.isSmallScreen = useMediaQuery(`(max-width: ${globals.smallScreenW}px)`)

    useEffect(() => {
        globals.largeFontSize = globals.isPhoneScreen ? "21px" : "30px"
        globals.smallFontSize = globals.isPhoneScreen ? "16px" : "25px"
        globals.smallerFontSize = globals.isPhoneScreen ? "14px" : "20px"
    }, [globals.isPhoneScreen, globals.isSmallScreen])

    const [character, setCharacter] = useLocalStorage<Character>({ key: "character", defaultValue: getEmptyCharacter() })
    const [selectedStep, setSelectedStep] = useLocalStorage({ key: "selectedStep", defaultValue: 0 })
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))

    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    useEffect(() => {
        setShowAsideBar(!globals.isSmallScreen)
    }, [globals.isSmallScreen])

    return (
        <AppShell
            padding="0"
            navbar={
                globals.isSmallScreen ? (
                    <></>
                ) : (
                    <Navbar width={{ base: 250, xl: 300 }} height={"100%"} p="xs">
                        {<Sidebar character={character} />}
                    </Navbar>
                )
            }
            header={
                <Header height={75} p="xs">
                    <Topbar
                        character={character}
                        setCharacter={setCharacter}
                        setSelectedStep={setSelectedStep}
                        setShowAsideBar={setShowAsideBar}
                    />
                </Header>
            }
            aside={showAsideBar ? <AsideBar selectedStep={selectedStep} setSelectedStep={setSelectedStep} character={character} /> : <></>}
            styles={(theme) => ({
                main: { backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
        >
            {
                <BackgroundImage h={"99%"} src={backgrounds[backgroundIndex]}>
                    <div style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", height: "100%" }}>
                        <Container h={"100%"} style={{ width: "100%" }}>
                            <Generator
                                character={character}
                                setCharacter={setCharacter}
                                selectedStep={selectedStep}
                                setSelectedStep={setSelectedStep}
                            />
                        </Container>
                    </div>
                </BackgroundImage>
            }
        </AppShell>
    )
}

export default App
