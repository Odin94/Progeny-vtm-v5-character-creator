import { Button, Divider, Grid, Group, Text, Tooltip } from "@mantine/core"
import { RAW_GOLD, RAW_RED, RAW_GRAPE, rgba } from "~/theme/colors"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { AttributesKey, attributeDescriptions, attributesKeySchema } from "../../data/Attributes"
import { Character } from "../../data/Character"
import { globals } from "../../globals"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { GeneratorPhasePrompt, GeneratorSectionDivider } from "./sharedGeneratorUi"

type AttributePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type AttributeSetting = {
    strongest: AttributesKey | null
    weakest: AttributesKey | null
    medium: AttributesKey[]
}

const AttributePicker = ({ character, setCharacter, nextStep }: AttributePickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Attribute Picker" })
    }, [])

    const [pickedAttributes, setPickedAttributes] = useState<AttributeSetting>({
        strongest: null,
        weakest: null,
        medium: []
    })

    const createButton = (attribute: AttributesKey, i: number) => {
        const alreadyPicked = [
            pickedAttributes.strongest,
            pickedAttributes.weakest,
            ...pickedAttributes.medium
        ].includes(attribute)
        const assignedLevel = (() => {
            if (attribute === pickedAttributes.strongest) return 4
            if (attribute === pickedAttributes.weakest) return 1
            if (pickedAttributes.medium.includes(attribute)) return 3
            return null
        })()

        let onClick: () => void
        if (alreadyPicked) {
            onClick = () => {
                setPickedAttributes({
                    strongest:
                        pickedAttributes.strongest === attribute
                            ? null
                            : pickedAttributes.strongest,
                    medium: pickedAttributes.medium.filter((it) => it !== attribute),
                    weakest:
                        pickedAttributes.weakest === attribute ? null : pickedAttributes.weakest
                })
            }
        } else if (!pickedAttributes.strongest) {
            onClick = () => {
                setPickedAttributes({ ...pickedAttributes, strongest: attribute })
            }
        } else if (!pickedAttributes.weakest) {
            onClick = () => {
                setPickedAttributes({ ...pickedAttributes, weakest: attribute })
            }
        } else if (pickedAttributes.medium.length < 2) {
            onClick = () => {
                setPickedAttributes({
                    ...pickedAttributes,
                    medium: [...pickedAttributes.medium, attribute]
                })
            }
        } else {
            onClick = () => {
                const finalPick = {
                    ...pickedAttributes,
                    medium: [...pickedAttributes.medium, attribute]
                }
                const attributes = {
                    strength: 2,
                    charisma: 2,
                    intelligence: 2,
                    dexterity: 2,
                    manipulation: 2,
                    wits: 2,
                    stamina: 2,
                    composure: 2,
                    resolve: 2
                }
                attributes[finalPick.strongest!] = 4
                attributes[finalPick.weakest!] = 1
                finalPick.medium.forEach((medium) => (attributes[medium] = 3))

                updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                setCharacter({ ...character, attributes })
                nextStep()
            }
        }

        const trackClick = () => {
            trackEvent({
                action: "attribute clicked",
                category: "attributes",
                label: attribute
            })
        }

        return (
            <Grid.Col key={attribute} span={4}>
                <Tooltip
                    disabled={alreadyPicked}
                    label={attributeDescriptions[attribute]}
                    transitionProps={{ transition: "slide-up", duration: 200 }}
                    events={globals.tooltipTriggerEvents}
                >
                    <Button
                        data-testid={`attribute-${attribute}-button`}
                        p={phoneScreen ? 0 : "default"}
                        variant={alreadyPicked ? "outline" : "filled"}
                        color="grape"
                        fullWidth={false}
                        style={{
                            width: "88%",
                            marginLeft: "auto",
                            marginRight: "auto",
                            minHeight: phoneScreen ? 36 : 40
                        }}
                        styles={{
                            inner: {
                                alignItems: "center",
                                justifyContent: phoneScreen ? "center" : "space-between",
                                paddingTop: 2,
                                paddingBottom: 3
                            },
                            label: {
                                lineHeight: 1.3,
                                overflow: "visible",
                                flex: 1
                            },
                            section: {
                                overflow: "visible"
                            },
                            root: {
                                justifyContent: "space-between",
                                background:
                                    assignedLevel === 4
                                        ? rgba(RAW_RED, 0.2)
                                        : assignedLevel === 3
                                          ? "rgba(204, 166, 51, 0.4)"
                                          : assignedLevel === 1
                                            ? "rgba(43, 43, 43, 0.5)"
                                            : rgba(RAW_GRAPE, 0.8),
                                borderColor:
                                    assignedLevel === 4
                                        ? rgba(RAW_RED, 0.95)
                                        : assignedLevel === 3
                                          ? rgba(RAW_GOLD, 0.9)
                                          : assignedLevel === 1
                                            ? "rgba(180, 180, 180, 0.42)"
                                            : undefined,
                                color: alreadyPicked ? "rgba(244, 236, 232, 0.95)" : undefined
                            }
                        }}
                        rightSection={
                            !phoneScreen && assignedLevel ? (
                                <Group gap={4} wrap="nowrap">
                                    {Array.from({ length: 5 }).map((_, dotIndex) => (
                                        <div
                                            key={`${attribute}-dot-${dotIndex}`}
                                            style={{
                                                width: phoneScreen ? 5 : 6,
                                                height: phoneScreen ? 5 : 6,
                                                borderRadius: "999px",
                                                background:
                                                    dotIndex < assignedLevel
                                                        ? assignedLevel === 4
                                                            ? rgba(RAW_RED, 1)
                                                            : assignedLevel === 3
                                                              ? "rgba(232, 204, 92, 0.98)"
                                                              : "rgba(210, 210, 210, 0.85)"
                                                        : "rgba(255, 255, 255, 0.14)",
                                                boxShadow:
                                                    dotIndex < assignedLevel && assignedLevel === 4
                                                        ? `0 0 6px ${rgba(RAW_RED, 0.38)}`
                                                        : "none"
                                            }}
                                        />
                                    ))}
                                </Group>
                            ) : undefined
                        }
                        onClick={() => {
                            trackClick()
                            onClick()
                        }}
                    >
                        <Text
                            fz={phoneScreen ? 12 : "inherit"}
                            lh={1.3}
                            ta={phoneScreen ? "center" : "left"}
                            style={{ width: "100%" }}
                        >
                            {upcase(attribute)}
                        </Text>
                    </Button>
                </Tooltip>

                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const toPick = (() => {
        if (!pickedAttributes.strongest) return "strongest"
        if (!pickedAttributes.weakest) return "weakest"
        return "medium"
    })()

    const phases = [
        {
            key: "strongest",
            prompt: "Pick your",
            bold: "strongest",
            suffix: "attribute",
            level: 4,
            done: !!pickedAttributes.strongest
        },
        {
            key: "weakest",
            prompt: "Pick your",
            bold: "weakest",
            suffix: "attribute",
            level: 1,
            done: !!pickedAttributes.weakest
        },
        {
            key: "medium",
            prompt: `Pick ${3 - pickedAttributes.medium.length}`,
            bold: "medium",
            suffix: `attribute${pickedAttributes.medium.length < 2 ? "s" : ""}`,
            level: 3,
            done: pickedAttributes.medium.length === 2
        }
    ]

    return (
        <div>
            <GeneratorPhasePrompt
                lines={phases}
                activeKey={toPick}
                phoneScreen={phoneScreen}
                footerText="Remaining attributes will be lvl 2"
            />

            <GeneratorSectionDivider label="Attributes" />

            <Group>
                <Grid grow>
                    <Grid.Col span={4}>
                        <Text fs="italic" fw={700} ta="center">
                            Physical
                        </Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Text fs="italic" fw={700} ta="center">
                            Social
                        </Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Text fs="italic" fw={700} ta="center">
                            Mental
                        </Text>
                    </Grid.Col>
                    {[
                        "strength",
                        "charisma",
                        "intelligence",
                        "dexterity",
                        "manipulation",
                        "wits",
                        "stamina",
                        "composure",
                        "resolve"
                    ]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((clan, i) => createButton(clan, i))}
                </Grid>
            </Group>
        </div>
    )
}

export default AttributePicker
