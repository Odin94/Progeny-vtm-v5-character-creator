import { Button, Text, Tooltip } from "@mantine/core"
import { IconRotate2 } from "@tabler/icons-react"
import { useRef } from "react"
import { trackEvent } from "../../utils/analytics"
import { AttributesKey, attributeDescriptions, attributesKeySchema } from "../../data/Attributes"
import { Character, getEmptyCharacter } from "../../data/Character"
import { globals } from "../../globals"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import {
    GeneratorConfirmButton,
    GeneratorPhasePrompt,
    GeneratorSectionDivider,
    GeneratorStepFooter
} from "./sharedGeneratorUi"
import { AttributeSetting, emptyAttributeSetting } from "../creatorDrafts"
import { PickColumnHeader, PickGrid, PickTile, type PickTone } from "./PickTile"

const toneForLevel: Record<number, PickTone> = { 4: "blood", 3: "gold", 1: "ash" }

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
    const excessMediumAttributes = Math.max(0, pickedAttributes.medium.length - 3)
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

    const nextLevel = attributeAllocationIsFull
        ? null
        : !pickedAttributes.strongest
          ? 4
          : !pickedAttributes.weakest
            ? 1
            : 3

    const createButton = (attribute: AttributesKey) => {
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
            <Tooltip
                key={attribute}
                disabled={alreadyPicked}
                label={attributeDescriptions[attribute]}
                multiline
                maw={280}
                events={globals.tooltipTriggerEvents}
            >
                <PickTile
                    data-testid={`attribute-${attribute}-button`}
                    label={upcase(attribute)}
                    level={assignedLevel}
                    tone={assignedLevel ? toneForLevel[assignedLevel] : undefined}
                    previewLevel={nextLevel ?? undefined}
                    previewTone={nextLevel ? toneForLevel[nextLevel] : undefined}
                    nudge={nothingPickedYet && !alreadyPicked}
                    onMouseEnter={() => {
                        if (!alreadyPicked) trackTooltipHover(attribute)
                    }}
                    onFocus={() => {
                        if (!alreadyPicked) trackTooltipHover(attribute)
                    }}
                    disabled={!alreadyPicked && attributeAllocationIsFull}
                    onClick={() => {
                        trackClick()
                        onClick()
                    }}
                />
            </Tooltip>
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
            prompt:
                excessMediumAttributes > 0
                    ? `Remove ${excessMediumAttributes}`
                    : `Pick ${Math.max(0, 3 - pickedAttributes.medium.length)}`,
            bold: "medium",
            suffix:
                excessMediumAttributes > 0
                    ? `attribute${excessMediumAttributes === 1 ? "" : "s"}`
                    : `attribute${pickedAttributes.medium.length < 2 ? "s" : ""}`,
            level: 3,
            done: pickedAttributes.medium.length === 3
        }
    ]

    const confirmDisabledReason =
        excessMediumAttributes > 0
            ? "Remove the extra medium attributes first"
            : !isComplete
              ? "Assign your strongest, weakest and three medium attributes first"
              : undefined

    return (
        <div style={{ width: "100%", maxWidth: 820 }}>
            <GeneratorPhasePrompt
                lines={phases}
                activeKey={toPick}
                phoneScreen={phoneScreen}
                footerText="Remaining attributes will be lvl 2"
            />

            <GeneratorSectionDivider label="Attributes" marginY={phoneScreen ? "sm" : "md"} />

            {excessMediumAttributes > 0 ? (
                <Text role="status" ta="center" mb="sm" c="gold.4" fz="sm">
                    Your saved character has more than three level-3 attributes. Click a gold
                    attribute to remove its selection, or reset attributes to start again.
                </Text>
            ) : null}

            <Text
                ta="center"
                mb="sm"
                className="notranslate"
                translate="no"
                fz="sm"
                style={{
                    color: "var(--pg-gold-dim)",
                    letterSpacing: "0.04em",
                    visibility: nothingPickedYet ? "visible" : "hidden"
                }}
                aria-hidden={!nothingPickedYet}
            >
                {phoneScreen ? "Tap" : "Click"} an attribute below to assign it
            </Text>

            <PickGrid>
                <PickColumnHeader>Physical</PickColumnHeader>
                <PickColumnHeader>Social</PickColumnHeader>
                <PickColumnHeader>Mental</PickColumnHeader>
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
                    .map((attribute) => createButton(attribute))}
            </PickGrid>

            {hasConfirmedAttributes ? (
                <GeneratorStepFooter>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="md"
                        leftSection={<IconRotate2 size={16} />}
                        onClick={resetAttributes}
                    >
                        Reset attributes
                    </Button>
                    <GeneratorConfirmButton
                        data-testid="attributes-confirm-button"
                        disabledReason={confirmDisabledReason}
                        onClick={() => commitAttributes(pickedAttributes, true)}
                    />
                </GeneratorStepFooter>
            ) : null}
        </div>
    )
}

export default AttributePicker
