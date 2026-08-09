import { Button, Divider, Grid, Group, Text, Tooltip } from "@mantine/core"
import { RAW_GOLD, RAW_RED, RAW_GRAPE, rgba } from "~/theme/colors"
import { useRef, useState } from "react"
import { trackEvent } from "../../utils/analytics"
import { AttributesKey, attributeDescriptions, attributesKeySchema } from "../../data/Attributes"
import { Character, getEmptyCharacter } from "../../data/Character"
import { globals } from "../../globals"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { GeneratorPhasePrompt, GeneratorSectionDivider } from "./sharedGeneratorUi"
import { AttributeSetting, emptyAttributeSetting } from "../creatorDrafts"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"

type AttributePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
    pickedAttributes: AttributeSetting
    setPickedAttributes: (attributes: AttributeSetting) => void
}

const AttributePicker = ({
    character,
    setCharacter,
    nextStep,
    pickedAttributes,
    setPickedAttributes
}: AttributePickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const hasConfirmedAttributes = Object.values(character.attributes).some((value) => value !== 1)
    const isComplete =
        pickedAttributes.strongest !== null &&
        pickedAttributes.weakest !== null &&
        pickedAttributes.medium.length === 3
    const attributeAllocationIsFull =
        pickedAttributes.strongest !== null &&
        pickedAttributes.weakest !== null &&
        pickedAttributes.medium.length >= 3

    const commitAttributes = (selection: AttributeSetting, advance: boolean) => {
        if (!selection.strongest || !selection.weakest || selection.medium.length !== 3) return

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
        attributes[selection.strongest] = 4
        attributes[selection.weakest] = 1
        selection.medium.forEach((medium) => (attributes[medium] = 3))

        const updatedCharacter = { ...character, attributes }
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        setCharacter(updatedCharacter)
        if (advance) nextStep()
    }

    const resetAttributes = () => {
        setPickedAttributes(emptyAttributeSetting)

        const updatedCharacter = {
            ...character,
            attributes: getEmptyCharacter().attributes
        }
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
        setCharacter(updatedCharacter)
    }

    // Nothing assigned yet: this is the state the drop-off signals describe (users read the
    // prompt, explore the tooltips, and leave without a first click). We use it to surface the
    // "tap to assign" hint and the button pulse only while the first pick is still outstanding.
    const nothingPickedYet =
        !pickedAttributes.strongest &&
        !pickedAttributes.weakest &&
        pickedAttributes.medium.length === 0

    // Track the first tooltip open per attribute (per mount) so "explored the tooltips but never
    // selected" becomes a metric instead of something only visible in session replay. A Set keeps
    // us from spamming an event on every mouse re-entry.
    const trackedTooltipHovers = useRef<Set<AttributesKey>>(new Set())
    const trackTooltipHover = (attribute: AttributesKey) => {
        if (trackedTooltipHovers.current.has(attribute)) return
        trackedTooltipHovers.current.add(attribute)
        trackEvent({
            action: "attribute tooltip hovered",
            category: "attributes",
            label: attribute
        })
    }

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
        } else if (pickedAttributes.medium.length < 3) {
            onClick = () => {
                const finalPick = {
                    ...pickedAttributes,
                    medium: [...pickedAttributes.medium, attribute]
                }
                setPickedAttributes(finalPick)
                if (finalPick.medium.length === 3 && !hasConfirmedAttributes) {
                    commitAttributes(finalPick, true)
                }
            }
        } else {
            onClick = () => {}
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
                        className={
                            nothingPickedYet && !alreadyPicked ? "attribute-pick-pulse" : undefined
                        }
                        onMouseEnter={() => {
                            if (!alreadyPicked) trackTooltipHover(attribute)
                        }}
                        onFocus={() => {
                            if (!alreadyPicked) trackTooltipHover(attribute)
                        }}
                        p={phoneScreen ? "xs" : "default"}
                        variant={alreadyPicked ? "outline" : "filled"}
                        disabled={!alreadyPicked && attributeAllocationIsFull}
                        color="grape"
                        fullWidth={false}
                        style={{
                            width: "88%",
                            marginLeft: "auto",
                            marginRight: "auto",
                            display: "flex",
                            minHeight: phoneScreen ? 36 : 40
                        }}
                        styles={{
                            inner: {
                                alignItems: "center",
                                justifyContent: phoneScreen ? "flex-start" : "space-between",
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
                            ta="left"
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
            prompt: `Pick ${Math.max(0, 3 - pickedAttributes.medium.length)}`,
            bold: "medium",
            suffix: `attribute${pickedAttributes.medium.length < 2 ? "s" : ""}`,
            level: 3,
            done: pickedAttributes.medium.length >= 3
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

            {nothingPickedYet ? (
                <Text
                    ta="center"
                    mb="sm"
                    className="notranslate"
                    translate="no"
                    style={{
                        fontFamily: "Inter, Segoe UI, sans-serif",
                        fontSize: "0.82rem",
                        letterSpacing: "0.06em",
                        color: rgba(RAW_GOLD, 0.78)
                    }}
                >
                    {phoneScreen ? "Tap" : "Click"} an attribute below to assign it
                </Text>
            ) : null}

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

            {hasConfirmedAttributes ? (
                <Group justify="center" mt="xl">
                    <Button
                        variant="outline"
                        color="red"
                        onClick={resetAttributes}
                    >
                        Reset attributes
                    </Button>
                    <Button
                        data-testid="attributes-confirm-button"
                        color="grape"
                        disabled={!isComplete}
                        styles={generatorConfirmButtonStyles}
                        onClick={() => commitAttributes(pickedAttributes, true)}
                    >
                        Confirm
                    </Button>
                </Group>
            ) : null}
        </div>
    )
}

export default AttributePicker
