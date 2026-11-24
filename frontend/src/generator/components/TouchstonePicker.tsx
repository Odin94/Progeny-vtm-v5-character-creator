import { ScrollArea, TextInput, Textarea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconPlus, IconUserHeart } from "@tabler/icons-react"
import { useState } from "react"
import { Character, Touchstone } from "../../data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { trackEvent } from "../../utils/analytics"
import { globals } from "../../globals"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { DeleteIconButton } from "~/components/ui"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import {
    GeneratorConfirmButton,
    GeneratorSectionDivider,
    GeneratorStepFooter,
    GeneratorStepHero,
    getGeneratorFieldStyles
} from "./sharedGeneratorUi"
import classes from "./generatorCards.module.css"

type TouchstonePickerProps = {
    character: Character
    setCharacter: SetCharacter
    nextStep: () => void
}
type TouchstonePlaceholder = {
    name: string
    conviction: string
    description: string
}
const touchstonePlaceholderOptions: TouchstonePlaceholder[] = [
    {
        name: "Max Mustermann",
        conviction: "Never betray your friends",
        description:
            "Your childhood friend to whom you made a promise to always be there for each other"
    },
    {
        name: "Elena Fischer",
        conviction: "Protect the people who depend on you",
        description:
            "Your older sister, still holding the family together while believing you can one night come home for good"
    },
    {
        name: "Jonah Reyes",
        conviction: "Power means nothing without mercy",
        description:
            "A burned-out paramedic who patched you up more than once and still sees the person you used to be"
    },
    {
        name: "Mira Voss",
        conviction: "Always tell the truth when it matters most",
        description:
            "An investigative journalist and former lover whose faith in honesty still cuts through your excuses"
    }
]
const getRandomTouchstonePlaceholder = (): TouchstonePlaceholder =>
    touchstonePlaceholderOptions[Math.floor(Math.random() * touchstonePlaceholderOptions.length)]
const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
]
const toRoman = (value: number): string => {
    if (value > 39) return String(value)
    let remaining = value
    let result = ""
    for (const [amount, numeral] of romanNumerals) {
        while (remaining >= amount) {
            result += numeral
            remaining -= amount
        }
    }
    return result
}
const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
const TouchstonePicker = ({ character, setCharacter, nextStep }: TouchstonePickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const smallScreen = globals.isSmallScreen
    const initial =
        character.touchstones.length > 0
            ? character.touchstones
            : [{ name: "", description: "", conviction: "" }]
    const [touchstones, setTouchstones] = useState<Touchstone[]>(initial)
    const [touchstonePlaceholders, setTouchstonePlaceholders] = useState<TouchstonePlaceholder[]>(
        () => initial.map(() => getRandomTouchstonePlaceholder())
    )
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
        useDisclosure(false)
    const [touchstoneToDelete, setTouchstoneToDelete] = useState<number | null>(null)
    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const touchstoneFieldStyles = getGeneratorFieldStyles("gold")
    // Use the functional updater form so we merge into the latest character rather than the
    // `character` prop snapshot captured at render. A plain spread would clobber concurrent
    // updates written elsewhere (e.g. the `version` bump from useAutosaveCharacter), feeding the
    // debounced save a stale version.
    const persistTouchstones = (updatedTouchstones: Touchstone[]) => {
        setCharacter((current) => ({ ...current, touchstones: updatedTouchstones }))
    }
    // Commit on every keystroke rather than on blur. Blur never fires if the step unmounts while
    // an input is still focused (e.g. the user clicks Confirm on a different element or navigates
    // away), which silently dropped whatever they had just typed.
    const updateTouchstone = (
        i: number,
        updatedTouchstone: { name?: string; description?: string; conviction?: string }
    ) => {
        const newTouchstones = [...touchstones]
        newTouchstones[i] = { ...touchstones[i], ...updatedTouchstone }
        setTouchstones(newTouchstones)
        persistTouchstones(newTouchstones)
    }
    const isBlankTouchstone = (touchstone: Touchstone) =>
        touchstone.name.trim() === "" &&
        touchstone.description.trim() === "" &&
        touchstone.conviction.trim() === ""
    const removeTouchstoneAt = (index: number) => {
        const newTouchstones = [...touchstones]
        const newPlaceholders = [...touchstonePlaceholders]
        newTouchstones.splice(index, 1)
        newPlaceholders.splice(index, 1)
        setTouchstones(newTouchstones)
        setTouchstonePlaceholders(newPlaceholders)
        persistTouchstones(newTouchstones)
    }
    const addTouchstone = () => {
        const newTouchstones = [...touchstones, { name: "", description: "", conviction: "" }]
        const newPlaceholders = [...touchstonePlaceholders, getRandomTouchstonePlaceholder()]
        setTouchstones(newTouchstones)
        setTouchstonePlaceholders(newPlaceholders)
        persistTouchstones(newTouchstones)
        setFocusIndex(newTouchstones.length - 1)
    }
    const pendingDelete = touchstoneToDelete !== null ? touchstones[touchstoneToDelete] : undefined

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={smallScreen ? 12 : 20}
                pt={4}
                pb={8}
                scrollbarSize={nightfallScrollbarSize}
                type="always"
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    <GeneratorStepHero
                        leadText="Pick your"
                        accentText="Touchstones & Convictions"
                        description="Touchstones are humans in your life that tie you to your humanity"
                        secondaryDescription="Connect a conviction to each relationship"
                        marginBottom={phoneScreen ? 18 : 26}
                    />
                    <div className={classes.touchstones}>
                        <GeneratorSectionDivider label="Touchstones" lineHeight={1} marginY="xs" />
                        {touchstones.map((touchstone, i) => {
                            const ordinal = `Touchstone ${toRoman(i + 1)}`
                            const initials = getInitials(touchstone.name)
                            const deleteButton = (
                                <DeleteIconButton
                                    className={phoneScreen ? undefined : classes.touchstoneDelete}
                                    label={
                                        touchstone.name.trim()
                                            ? `Remove ${touchstone.name.trim()}`
                                            : `Remove ${ordinal.toLowerCase()}`
                                    }
                                    onClick={() => {
                                        if (isBlankTouchstone(touchstone)) {
                                            removeTouchstoneAt(i)
                                        } else {
                                            setTouchstoneToDelete(i)
                                            openDeleteModal()
                                        }
                                    }}
                                />
                            )
                            return (
                                <section
                                    key={i}
                                    className={`${classes.touchstone} ${classes.enter}`}
                                    aria-label={ordinal}
                                >
                                    <div className={classes.medallionColumn}>
                                        <div className={classes.touchstoneMobileHead}>
                                            <span
                                                className={classes.medallion}
                                                data-empty={initials ? undefined : true}
                                                aria-hidden="true"
                                            >
                                                {initials || (
                                                    <IconUserHeart size={26} stroke={1.4} />
                                                )}
                                            </span>
                                            {phoneScreen ? (
                                                <span className={classes.touchstoneOrdinal}>
                                                    {ordinal}
                                                </span>
                                            ) : null}
                                        </div>
                                        {phoneScreen ? (
                                            deleteButton
                                        ) : (
                                            <span className={classes.touchstoneOrdinal}>
                                                {toRoman(i + 1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={classes.touchstoneFields}>
                                        <TextInput
                                            data-testid={`touchstone-${i}-name-input`}
                                            value={touchstone.name}
                                            onChange={(event) =>
                                                updateTouchstone(i, {
                                                    name: event.currentTarget.value
                                                })
                                            }
                                            placeholder={
                                                touchstonePlaceholders[i]?.name ??
                                                touchstonePlaceholderOptions[0].name
                                            }
                                            label="Touchstone Name"
                                            styles={touchstoneFieldStyles}
                                            autoFocus={focusIndex === i}
                                        />
                                        <TextInput
                                            data-testid={`touchstone-${i}-conviction-input`}
                                            value={touchstone.conviction}
                                            onChange={(event) =>
                                                updateTouchstone(i, {
                                                    conviction: event.currentTarget.value
                                                })
                                            }
                                            placeholder={
                                                touchstonePlaceholders[i]?.conviction ??
                                                touchstonePlaceholderOptions[0].conviction
                                            }
                                            label="Conviction"
                                            styles={touchstoneFieldStyles}
                                        />
                                        <Textarea
                                            data-testid={`touchstone-${i}-description-input`}
                                            value={touchstone.description}
                                            onChange={(event) =>
                                                updateTouchstone(i, {
                                                    description: event.currentTarget.value
                                                })
                                            }
                                            placeholder={
                                                touchstonePlaceholders[i]?.description ??
                                                touchstonePlaceholderOptions[0].description
                                            }
                                            label="Description"
                                            autosize
                                            minRows={3}
                                            styles={touchstoneFieldStyles}
                                        />
                                    </div>
                                    {phoneScreen ? null : deleteButton}
                                </section>
                            )
                        })}
                        <button type="button" className={classes.addSlot} onClick={addTouchstone}>
                            <span className={classes.addSlotIcon} aria-hidden="true">
                                <IconPlus size={14} stroke={2} />
                            </span>
                            Add Touchstone
                        </button>
                    </div>
                </div>
            </ScrollArea>
            <GeneratorStepFooter>
                <GeneratorConfirmButton
                    data-testid="touchstones-confirm-button"
                    onClick={() => {
                        // Drop rows the user never filled in so a skipped step doesn't persist
                        // a placeholder touchstone onto the finished sheet. Rows with any
                        // content (including a blank name but a filled description/conviction)
                        // are kept so nothing typed is lost.
                        const cleanedTouchstones = touchstones.filter(
                            (touchstone) => !isBlankTouchstone(touchstone)
                        )
                        persistTouchstones(cleanedTouchstones)
                        trackEvent({
                            action: "touchstone confirm clicked",
                            category: "touchstones",
                            label: `${cleanedTouchstones.length}`
                        })
                        nextStep()
                    }}
                >
                    Confirm
                </GeneratorConfirmButton>
            </GeneratorStepFooter>
            <ConfirmActionModal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                onConfirm={() => {
                    if (touchstoneToDelete !== null) {
                        removeTouchstoneAt(touchstoneToDelete)
                    }
                    setTouchstoneToDelete(null)
                    closeDeleteModal()
                }}
                title="Delete Touchstone?"
                body={
                    pendingDelete?.name.trim()
                        ? `“${pendingDelete.name.trim()}” and their conviction will be removed from the character.`
                        : "This will remove the touchstone and its conviction from the character."
                }
                confirmLabel="Delete"
            />
        </div>
    )
}
export default TouchstonePicker
