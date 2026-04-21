import { Badge, Box, Button, Card, Grid, Group, ScrollArea, Stack, Text } from "@mantine/core"
import { RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { IconChevronLeft } from "@tabler/icons-react"
import { useState } from "react"
import { Loresheet, MeritOrFlaw, loresheets } from "../../data/MeritsAndFlaws"
import { globals } from "../../globals"
import { Character, MeritFlaw } from "../../data/Character"
import { intersection } from "../utils"
import React from "react"

type LoresheetProps = {
    character: Character
    getMeritOrFlawLine: (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => JSX.Element
    pickedMeritsAndFlaws: MeritFlaw[]
}

// TODO: Create text-filter for loresheets?
export const Loresheets = ({ character, getMeritOrFlawLine, pickedMeritsAndFlaws }: LoresheetProps) => {
    const [openLoresheetTitle, setOpenLoresheetTitle] = useState("")
    const openLoresheet = loresheets.find((sheet) => sheet.title === openLoresheetTitle)

    const getLoresheetCol = (loresheet: Loresheet) => {
        const sheetPicked =
            intersection(
                pickedMeritsAndFlaws.map((m) => m.name),
                loresheet.merits.map((m) => m.name)
            ).length > 0

        const requirementsMet = loresheet.requirementFunctions.every((fun) => fun(character))
        if (!requirementsMet) return <React.Fragment key={loresheet.title}></React.Fragment>

        return (
            <Grid.Col span={smallScreen ? 12 : 4} key={loresheet.title}>
                <Card
                    padding="lg"
                    radius="lg"
                    h={330}
                    style={{
                        background: sheetPicked ? "linear-gradient(180deg, rgba(27, 58, 41, 0.72), rgba(14, 15, 18, 0.96))" : "linear-gradient(180deg, rgba(28, 28, 33, 0.92), rgba(12, 13, 16, 0.96))",
                        border: `1px solid ${sheetPicked ? "rgba(63, 192, 120, 0.34)" : "rgba(255, 255, 255, 0.07)"}`,
                        boxShadow: "0 20px 48px rgba(0, 0, 0, 0.22)",
                    }}
                >
                    <Stack justify="space-between" h="100%" gap="md">
                        <ScrollArea
                            type="always"
                           
                            scrollbarSize={6}
                            styles={{
                                scrollbar: {
                                    background: "transparent",
                                },
                                thumb: {
                                    background: rgba(RAW_RED, 0.22),
                                    borderRadius: "999px",
                                },
                            }}
                        >
                            <Group justify="space-between" align="flex-start" mb="sm">
                                <Text
                                    ta="left"
                                    style={{
                                        fontFamily: "Cinzel, Georgia, serif",
                                        fontSize: smallScreen ? "1.02rem" : "1.12rem",
                                        fontWeight: 600,
                                        color: "rgba(244, 236, 232, 0.95)",
                                        lineHeight: 1.3,
                                        flex: 1,
                                    }}
                                >
                                    {loresheet.title}
                                </Text>
                                {sheetPicked ? (
                                    <Badge color="teal" variant="light">
                                        picked
                                    </Badge>
                                ) : null}
                            </Group>
                            <Text
                                style={{
                                    fontFamily: "Crimson Text, Georgia, serif",
                                    fontSize: "1rem",
                                    lineHeight: 1.45,
                                    color: rgba(RAW_GREY, 0.82),
                                }}
                            >
                                {loresheet.summary}
                            </Text>
                        </ScrollArea>

                        <Button
                            variant="light"
                            color={sheetPicked ? "teal" : "red"}
                            fullWidth
                            radius="md"
                            onClick={() => setOpenLoresheetTitle(loresheet.title)}
                            styles={{
                                label: {
                                    fontFamily: "Cinzel, Georgia, serif",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                },
                            }}
                        >
                            Open
                        </Button>
                    </Stack>
                </Card>
            </Grid.Col>
        )
    }

    const smallScreen = globals.isSmallScreen
    return (
        <Box
            style={{
                padding: smallScreen ? "14px" : "18px",
                borderRadius: 20,
                background: "rgba(14, 15, 18, 0.66)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.24)",
            }}
        >
            <Grid w={"100%"} m={0} gutter="lg">
                {openLoresheet ? (
                    <OpenedLoresheet
                        loresheet={openLoresheet}
                        getMeritOrFlawLine={getMeritOrFlawLine}
                        setOpenLoresheetTitle={setOpenLoresheetTitle}
                    />
                ) : (
                    loresheets.map(getLoresheetCol)
                )}
            </Grid>
        </Box>
    )
}

const OpenedLoresheet = ({
    loresheet,
    getMeritOrFlawLine,
    setOpenLoresheetTitle,
}: {
    loresheet: Loresheet
    getMeritOrFlawLine: (meritOrFlaw: MeritOrFlaw, type: "flaw" | "merit") => JSX.Element
    setOpenLoresheetTitle: (t: string) => void
}) => {
    const smallScreen = globals.isSmallScreen

    return (
        <Grid.Col span={12}>
            <Stack gap="md" p={smallScreen ? "xs" : "md"}>
                <div>
                    <Group justify="flex-start" mb="sm">
                        <Button
                            variant="subtle"
                            color="yellow"
                            px={8}
                            aria-label="Back"
                            onClick={() => setOpenLoresheetTitle("")}
                            styles={{
                                root: {
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                    minWidth: 0,
                                    height: 34,
                                },
                                inner: {
                                    justifyContent: "center",
                                },
                            }}
                        >
                            <IconChevronLeft size={16} stroke={2.2} />
                        </Button>
                    </Group>
                    <Text
                        ta={"center"}
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: smallScreen ? "1.45rem" : "1.75rem",
                            color: "rgba(244, 236, 232, 0.95)",
                        }}
                    >
                        {loresheet.title}
                    </Text>
                    <Text
                        ta="center"
                        mt={8}
                        style={{
                            fontFamily: "Crimson Text, Georgia, serif",
                            fontSize: "1.02rem",
                            color: rgba(RAW_GREY, 0.82),
                        }}
                    >
                        {loresheet.summary}
                    </Text>
                </div>

                {loresheet.merits.map((merit) => {
                    return getMeritOrFlawLine(merit, "merit")
                })}

                <Group justify="center" mt="sm">
                    <Button
                        variant="outline"
                        color="yellow"
                        onClick={() => setOpenLoresheetTitle("")}
                        styles={{
                            label: {
                                fontFamily: "Cinzel, Georgia, serif",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            },
                        }}
                    >
                        Back
                    </Button>
                </Group>
            </Stack>
        </Grid.Col>
    )
}
