import { Button, Card, Grid, ScrollArea, Text } from "@mantine/core"
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
                    mb={20}
                    h={350}
                    style={{ backgroundColor: "rgba(26, 27, 30, 0.90)", borderColor: sheetPicked ? "green" : "black" }}
                    withBorder={sheetPicked}
                >
                    <Text mb={10} ta={"center"} fz={smallScreen ? "lg" : "xl"} weight={500}>
                        {loresheet.title}
                    </Text>
                    <Text fz={"sm"}>{loresheet.summary}</Text>

                    <div style={{ position: "absolute", bottom: "0", width: "100%", padding: "inherit", left: 0 }}>
                        <Button variant="light" color="blue" fullWidth radius="md" onClick={() => setOpenLoresheetTitle(loresheet.title)}>
                            Open
                        </Button>
                    </div>
                </Card>
            </Grid.Col>
        )
    }

    const smallScreen = globals.isSmallScreen
    const height = globals.viewportHeightPx
    return (
        <ScrollArea h={height - 330} w={"100%"} p={20}>
            <Grid w={"100%"}>
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
        </ScrollArea>
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
    return (
        <div style={{ padding: "20px" }}>
            <Text ta={"center"} fz={globals.largeFontSize}>
                {loresheet.title}
            </Text>
            <Text mb={20}>{loresheet.summary}</Text>

            {loresheet.merits.map((merit) => {
                return getMeritOrFlawLine(merit, "merit")
            })}

            <Button variant="outline" color="yellow" mt={35} onClick={() => setOpenLoresheetTitle("")}>
                Back
            </Button>
        </div>
    )
}
