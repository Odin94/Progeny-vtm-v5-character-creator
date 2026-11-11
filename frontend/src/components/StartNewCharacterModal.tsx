import { Badge, Button, Modal, TextInput } from "@mantine/core"
import { IconDeviceFloppy, IconPencil } from "@tabler/icons-react"
import classes from "./AppModals.module.css"

type StartNewCharacterModalProps = {
    opened: boolean
    characterName: string
    setCharacterName: (value: string) => void
    isCharacterNameEditable: boolean
    isSaving: boolean
    onClose: () => void
    onContinueCurrent: () => void
    onSaveAndStartNew: () => void
}

const StartNewCharacterModal = ({
    opened,
    characterName,
    setCharacterName,
    isCharacterNameEditable,
    isSaving,
    onClose,
    onContinueCurrent,
    onSaveAndStartNew
}: StartNewCharacterModalProps) => {
    return (
        <Modal opened={opened} onClose={onClose} centered title="Start a new character?" size="lg">
            <div className={classes.body}>
                <div className={classes.status}>
                    <p className={classes.lede}>You already have a character in progress.</p>
                    <Badge color="green" variant="light" ml="auto">
                        Signed in
                    </Badge>
                </div>

                <p className={classes.lede}>
                    Keep editing the current character, or save it to your account before starting
                    over.
                </p>

                {isCharacterNameEditable ? (
                    <TextInput
                        data-autofocus
                        value={characterName}
                        onChange={(event) => setCharacterName(event.currentTarget.value)}
                        label="Current character name"
                        placeholder="Name your character before saving"
                        color="red"
                    />
                ) : (
                    <div className={classes.field}>
                        <span className={classes.fieldLabel}>Current character name</span>
                        <span className={classes.fieldValue}>{characterName}</span>
                    </div>
                )}

                <hr className={classes.rule} />

                <div className={classes.actions}>
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconPencil size={16} />}
                        onClick={onContinueCurrent}
                        disabled={isSaving}
                    >
                        Keep editing
                    </Button>

                    <Button
                        color="red"
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={onSaveAndStartNew}
                        loading={isSaving}
                    >
                        Save and start new
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default StartNewCharacterModal
