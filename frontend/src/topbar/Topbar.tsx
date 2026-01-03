import { Burger, Center, Grid, Group, Stack, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect } from "react"
import { globals } from "../globals"
import { AuthButton } from "../components/AuthButton"

export type TopBarProps = {
    setShowAsideBar: (v: boolean) => void
    showAsideBar: boolean
}

const Topbar = ({ setShowAsideBar, showAsideBar }: TopBarProps) => {
    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen
    const [burgerOpened, { close: closeBurger, open: openBurger }] = useDisclosure(false)

    useEffect(() => {
        if (showAsideBar) {
            openBurger()
        } else {
            closeBurger()
        }
    }, [showAsideBar, openBurger, closeBurger])

    return (
        <>
            <Grid>
                {smallScreen ? (
                    <Grid.Col span={1}>
                        <Burger
                            opened={burgerOpened}
                            onClick={() => {
                                setShowAsideBar(!showAsideBar)
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
                <Grid.Col span={smallScreen ? 5 : 4}>
                    <Group justify="flex-end">
                        <AuthButton />
                    </Group>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default Topbar
