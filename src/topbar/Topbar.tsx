import { Burger, Center, Grid, Stack, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Character } from "../data/Character"
import { globals } from "../globals"

export type TopBarProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
    setShowAsideBar: (v: boolean) => void
}

const Topbar = ({ character, setCharacter, setSelectedStep, setShowAsideBar }: TopBarProps) => {
    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen
    const [burgerOpened, { toggle: toggleBurger }] = useDisclosure(false)

    return (
        <>
            <Grid>
                {smallScreen ? (
                    <Grid.Col span={1}>
                        <Burger
                            opened={burgerOpened}
                            onClick={() => {
                                setShowAsideBar(!burgerOpened)
                                toggleBurger()
                            }}
                            aria-label={burgerOpened ? "Close side bar" : "Open side bar"}
                        />
                    </Grid.Col>
                ) : null}
                <Grid.Col offset={smallScreen ? 0 : 4} span={smallScreen ? 6 : 4}>
                    <Center>
                        <Stack gap={"0px"} ml={"80px"}>
                            <span style={{ textAlign: "center" }}>
                                <Title style={{ display: "inline", marginLeft: "50px" }} order={smallScreen ? 3 : 1}>
                                    Progeny
                                </Title>
                                {phoneScreen ? null : (
                                    <Text style={{ display: "inline", verticalAlign: "top" }} c="dimmed" fz="xs">
                                        &nbsp; by Odin
                                    </Text>
                                )}
                            </span>

                            {phoneScreen ? null : (
                                <Text c="dimmed" fz="sm" ta="center">
                                    A VtM v5 Character Creator
                                </Text>
                            )}
                        </Stack>
                    </Center>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default Topbar
