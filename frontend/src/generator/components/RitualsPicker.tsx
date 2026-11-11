import { ScrollArea } from "@mantine/core"
import { IconClock, IconDroplet, IconFlask2, IconHexagons } from "@tabler/icons-react"
import { trackEvent } from "../../utils/analytics"
import { Character, containsBloodSorcery } from "../../data/Character"
import { Ritual } from "../../data/Disciplines"
import { Rituals } from "../../data/Rituals"
import { upcase } from "../utils"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { globals } from "../../globals"
import { GeneratorSectionDivider, GeneratorStepHero } from "./sharedGeneratorUi"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewPower } from "~/data/Homebrew"
import { getRitualIdentity, homebrewPowerToRitual } from "~/utils/homebrewOptions"
import { GrimoireEntry } from "./generatorCardParts"
import classes from "./generatorCards.module.css"

type RitualsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const factIconProps = { size: 11, stroke: 1.8 } as const

const RitualsPicker = ({ character, setCharacter, nextStep }: RitualsPickerProps) => {
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewRituals = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewPower & { id: string } =>
                    item.kind === "ritual" && item.level === 1
            )
            .map((item) => homebrewPowerToRitual(item, collection))
    )
    if (!containsBloodSorcery(character.disciplines)) {
        return <></>
    }

    const phoneScreen = globals.isPhoneScreen
    const chosenIdentities = new Set(character.rituals.map(getRitualIdentity))

    const handleTake = (ritual: Ritual) => {
        trackEvent({ action: "ritual clicked", category: "rituals", label: ritual.name })
        setCharacter({ ...character, rituals: [ritual] })
        nextStep()
    }

    const renderRitual = (ritual: Ritual) => (
        <GrimoireEntry
            key={getRitualIdentity(ritual)}
            name={ritual.name}
            level={ritual.level}
            summary={upcase(ritual.summary)}
            homebrewSource={ritual.homebrewSource}
            selected={chosenIdentities.has(getRitualIdentity(ritual))}
            facts={[
                {
                    label: "Dice Pool",
                    value: ritual.dicePool,
                    icon: <IconHexagons {...factIconProps} />
                },
                {
                    label: "Time",
                    value: ritual.requiredTime,
                    icon: <IconClock {...factIconProps} />
                },
                {
                    label: "Ingredients",
                    value: ritual.ingredients,
                    icon: <IconFlask2 {...factIconProps} />
                },
                {
                    label: "Rouse Checks",
                    value: String(ritual.rouseChecks),
                    icon: <IconDroplet {...factIconProps} />
                }
            ]}
            onTake={() => handleTake(ritual)}
        />
    )

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={phoneScreen ? 12 : 20}
                pt={4}
                pb={8}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    <GeneratorStepHero
                        leadText="Pick your free"
                        accentText="Ritual"
                        description="Blood Sorcerers begin with one free Level 1 ritual"
                        marginBottom={phoneScreen ? 18 : 26}
                    />

                    <div className={classes.stepBody}>
                        <GeneratorSectionDivider
                            label="Level 1 Rituals"
                            lineHeight={1}
                            accentAlpha={0.38}
                            titleSize="0.88rem"
                            marginY="sm"
                        />

                        <div className={classes.grimoire}>{Rituals.map(renderRitual)}</div>

                        {homebrewRituals.length > 0 ? (
                            <>
                                <GeneratorSectionDivider
                                    label="Homebrew"
                                    lineHeight={1}
                                    accentAlpha={0.38}
                                    titleSize="0.88rem"
                                    marginY="sm"
                                />
                                <div className={classes.grimoire}>
                                    {homebrewRituals.map(renderRitual)}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

export default RitualsPicker
