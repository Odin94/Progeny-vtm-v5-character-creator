import { Badge, Button, Card, Center, Grid, Group, ScrollArea, Space, Stack, Text } from "@mantine/core"
import { useEffect } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, containsBloodSorcery } from "../../data/Character"
import { Rituals } from "../../data/Disciplines"
import { globals } from "../../globals"
import { upcase } from "../utils"

type RitualsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const RitualsPicker = ({ character, setCharacter, nextStep }: RitualsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Rituals Picker" })
    }, [])
    if (!containsBloodSorcery(character.disciplines)) {
        return <></>
    }

    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen

    const getRitualCardCols = () => {
        return Rituals.map((ritual) => {
            const trackClick = () => {
                trackEvent({
                    action: "ritual clicked",
                    category: "rituals",
                    label: ritual.name,
                })
            }
            const onClick = () => {
                setCharacter({
                    ...character,
                    rituals: [ritual], // TODO: turn this into "RitualPicker-ritual" attribute and add function to get all rituals from character
                })

                trackClick()

                nextStep()
            }

            let cardHeight = phoneScreen ? 180 : 215
            if (ritual.name.length > 15) cardHeight += 25
            return (
                <Grid.Col key={ritual.name} span={smallScreen ? 12 : 6}>
                    <Card mb={20} h={cardHeight} style={{ backgroundColor: "rgba(26, 27, 30, 0.90)" }}>
                        <Group justify="space-between" mt="0" mb="xs">
                            <Text fz={smallScreen && !phoneScreen ? "xs" : "sm"} weight={500}>
                                {ritual.name}
                            </Text>
                            <Badge pos={"absolute"} top={0} right={0} radius={"xs"} color="pink" variant="light">
                                lv {ritual.level}
                            </Badge>
                        </Group>

                        <Text fz={"sm"} size="sm" color="dimmed">
                            {upcase(ritual.summary)}
                        </Text>

                        <div style={{ position: "absolute", bottom: "0", width: "100%", padding: "inherit", left: 0 }}>
                            <Button onClick={onClick} variant="light" color="blue" fullWidth radius="md">
                                <Text truncate>Take {ritual.name}</Text>
                            </Button>
                        </div>
                    </Card>
                </Grid.Col>
            )
        })
    }

    const height = globals.viewportHeightPx
    return (
        <div style={{ width: smallScreen ? "393px" : "810px", marginTop: phoneScreen ? "60px" : "80px" }}>
            <Text fw={700} fz={smallScreen ? "14px" : "28px"} ta="center">
                ⛤ Pick 1 free Ritual ⛤
            </Text>

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">
                Rituals
            </Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" gap="xl" w={"100%"}>
                <ScrollArea h={smallScreen ? height - 320 : height - 400} pb={20} w={"105%"}>
                    <Center>
                        <Stack>
                            <Grid w={"100%"}>{getRitualCardCols()}</Grid>
                        </Stack>
                    </Center>
                </ScrollArea>
            </Stack>
        </div>
    )
}

export default RitualsPicker
