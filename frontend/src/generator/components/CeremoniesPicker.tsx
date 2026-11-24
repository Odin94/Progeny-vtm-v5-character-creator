import { Button, ScrollArea } from "@mantine/core"
import {
    IconArrowRight,
    IconClock,
    IconDroplet,
    IconHexagons,
    IconSkull
} from "@tabler/icons-react"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import {
    Ceremony,
    Ceremonies,
    canAccessOblivionCeremonies,
    characterHasCeremonyPrerequisite,
    getCeremonyPrerequisiteLabel
} from "../../data/Ceremonies"
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
import { getRitualIdentity, homebrewPowerToCeremony } from "~/utils/homebrewOptions"
import { GrimoireEntry } from "./generatorCardParts"
import classes from "./generatorCards.module.css"

type CeremoniesPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const factIconProps = { size: 11, stroke: 1.8 } as const

const CeremoniesPicker = ({ character, setCharacter, nextStep }: CeremoniesPickerProps) => {
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    if (!canAccessOblivionCeremonies(character)) {
        return <></>
    }

    const phoneScreen = globals.isPhoneScreen
    const officialLevelOneCeremonies = Ceremonies.filter((ceremony) => ceremony.level === 1)
    const homebrewLevelOneCeremonies = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewPower & { id: string } =>
                    item.kind === "ceremony" && item.level === 1
            )
            .map((item) => homebrewPowerToCeremony(item, collection))
    )
    const levelOneCeremonies = [...officialLevelOneCeremonies, ...homebrewLevelOneCeremonies]
    const canTakeAnyCeremony = levelOneCeremonies.some((ceremony) =>
        characterHasCeremonyPrerequisite(character, ceremony)
    )
    const chosenIdentities = new Set(character.ceremonies.map(getRitualIdentity))

    const handleTake = (ceremony: Ceremony) => {
        trackEvent({
            action: "ceremony clicked",
            category: "ceremonies",
            label: ceremony.name
        })
        setCharacter({ ...character, ceremonies: [ceremony] })
        nextStep()
    }

    const handleContinueWithoutCeremony = () => {
        trackEvent({
            action: "ceremony skipped",
            category: "ceremonies",
            label: "no valid prerequisite"
        })
        setCharacter({ ...character, ceremonies: [] })
        nextStep()
    }

    const renderCeremony = (ceremony: Ceremony) => {
        const canTake = characterHasCeremonyPrerequisite(character, ceremony)
        const prerequisiteLabel = getCeremonyPrerequisiteLabel(ceremony)

        return (
            <GrimoireEntry
                key={getRitualIdentity(ceremony)}
                name={ceremony.name}
                level={ceremony.level}
                summary={upcase(ceremony.summary)}
                homebrewSource={ceremony.homebrewSource}
                selected={chosenIdentities.has(getRitualIdentity(ceremony))}
                lockedReason={canTake ? undefined : `Requires the ${prerequisiteLabel} power`}
                lockedNote={
                    canTake ? null : (
                        <p className={classes.reason}>Requires &apos;{prerequisiteLabel}&apos;</p>
                    )
                }
                facts={[
                    {
                        label: "Dice Pool",
                        value: ceremony.dicePool,
                        icon: <IconHexagons {...factIconProps} />
                    },
                    {
                        label: "Time",
                        value: ceremony.requiredTime,
                        icon: <IconClock {...factIconProps} />
                    },
                    {
                        label: "Requires",
                        value: prerequisiteLabel,
                        icon: <IconSkull {...factIconProps} />
                    },
                    {
                        label: "Rouse Checks",
                        value: String(ceremony.rouseChecks),
                        icon: <IconDroplet {...factIconProps} />
                    }
                ]}
                onTake={() => handleTake(ceremony)}
            />
        )
    }

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
                        accentText="Ceremony"
                        description="You begin with one free Level 1 ceremony when you know its prerequisite Oblivion power"
                        marginBottom={phoneScreen ? 18 : 26}
                    />

                    <div className={classes.stepBody}>
                        {!canTakeAnyCeremony ? (
                            <div className={`${classes.notice} ${classes.noticeTop}`}>
                                <p className={classes.noticeText}>
                                    None of these ceremonies match your chosen Oblivion powers.
                                </p>
                                <Button
                                    variant="default"
                                    rightSection={<IconArrowRight size={16} stroke={1.8} />}
                                    onClick={handleContinueWithoutCeremony}
                                >
                                    Continue without a ceremony
                                </Button>
                            </div>
                        ) : null}

                        <GeneratorSectionDivider
                            label="Level 1 Ceremonies"
                            lineHeight={1}
                            accentAlpha={0.38}
                            titleSize="0.88rem"
                            marginY="sm"
                        />

                        <div className={classes.grimoire}>
                            {officialLevelOneCeremonies.map(renderCeremony)}
                        </div>

                        {homebrewLevelOneCeremonies.length > 0 ? (
                            <>
                                <GeneratorSectionDivider
                                    label="Homebrew"
                                    lineHeight={1}
                                    accentAlpha={0.38}
                                    titleSize="0.88rem"
                                    marginY="sm"
                                />
                                <div className={classes.grimoire}>
                                    {homebrewLevelOneCeremonies.map(renderCeremony)}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

export default CeremoniesPicker
