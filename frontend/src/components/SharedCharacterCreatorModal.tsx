import { Button, Modal } from "@mantine/core"
import { IconLock, IconNotebook, IconPlus } from "@tabler/icons-react"
import { Ornament } from "./ui/Ornament"
import { ConfirmationModalStyle } from "./ConfirmActionModal"
import classes from "./AppModals.module.css"

type SharedCharacterCreatorModalProps = {
    opened: boolean
    characterName: string
    playerName: string
    onGoToSheet: () => void
    onCreateNewCharacter: () => void
}

export const getSharedCharacterLabel = (characterName: string, playerName: string) => {
    const name = characterName.trim() || "Unnamed character"
    const player = playerName.trim()

    return player ? `${name} | ${player}` : name
}

const SharedCharacterCreatorModal = ({
    opened,
    characterName,
    playerName,
    onGoToSheet,
    onCreateNewCharacter
}: SharedCharacterCreatorModalProps) => {
    const characterLabel = getSharedCharacterLabel(characterName, playerName)

    return (
        <Modal
            opened={opened}
            onClose={onGoToSheet}
            title=""
            centered
            size="lg"
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            styles={ConfirmationModalStyle(false)}
        >
            <div className={classes.body}>
                <div className={classes.intro}>
                    <h2 className={classes.heading}>
                        <IconLock size={18} stroke={1.6} className={classes.headingIcon} />
                        Shared Character Checked Out
                    </h2>
                    <Ornament className={classes.ornament} />
                    <p className={classes.lede}>
                        You have {characterLabel} checked out. It&apos;s a shared character, so you
                        can&apos;t edit it in the character creator.
                    </p>
                </div>

                <hr className={classes.rule} />

                <div className={classes.actions}>
                    <Button
                        variant="default"
                        leftSection={<IconNotebook size={16} />}
                        onClick={onGoToSheet}
                        data-autofocus
                    >
                        Go to Sheet
                    </Button>
                    <Button
                        color="red"
                        leftSection={<IconPlus size={16} />}
                        onClick={onCreateNewCharacter}
                    >
                        Create New Character
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default SharedCharacterCreatorModal
