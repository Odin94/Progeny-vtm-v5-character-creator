import { Button, Modal, TextInput } from "@mantine/core"
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react"
import { DisabledReason } from "./ui/IconButtons"
import { Ornament } from "./ui/Ornament"
import { ConfirmationModalStyle } from "./ConfirmActionModal"
import classes from "./AppModals.module.css"

type NameCharacterBeforeSwitchModalProps = {
    opened: boolean
    pendingActionLabel: string
    nameValue: string
    setNameValue: (value: string) => void
    onClose: () => void
    onSaveAndContinue: () => void
    onDiscardAndContinue: () => void
    isSaving: boolean
}

const NameCharacterBeforeSwitchModal = ({
    opened,
    pendingActionLabel,
    nameValue,
    setNameValue,
    onClose,
    onSaveAndContinue,
    onDiscardAndContinue,
    isSaving
}: NameCharacterBeforeSwitchModalProps) => {
    const hasEnteredName = nameValue.trim().length > 0

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            closeOnClickOutside={!isSaving}
            closeOnEscape={!isSaving}
            title=""
            centered
            size="lg"
            withCloseButton={false}
            styles={ConfirmationModalStyle(false)}
        >
            <div className={classes.body}>
                <div className={classes.intro}>
                    <h2 className={classes.heading}>Name Current Character?</h2>
                    <Ornament className={classes.ornament} />
                    <p className={classes.lede}>
                        Before you {pendingActionLabel}, either give this character a name and save
                        it, or discard it and continue.
                    </p>
                </div>
                <TextInput
                    data-autofocus
                    disabled={isSaving}
                    value={nameValue}
                    onChange={(event) => setNameValue(event.currentTarget.value)}
                    label="Character Name"
                    placeholder="Name your character"
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && hasEnteredName && !isSaving) {
                            event.preventDefault()
                            onSaveAndContinue()
                        }
                    }}
                />

                <hr className={classes.rule} />

                <div className={classes.actions}>
                    <DisabledReason
                        reason={
                            hasEnteredName && !isSaving
                                ? "Clear the name to delete this character instead"
                                : undefined
                        }
                    >
                        <Button
                            color="red"
                            variant="light"
                            leftSection={<IconTrash size={16} />}
                            onClick={onDiscardAndContinue}
                            disabled={isSaving || hasEnteredName}
                        >
                            Delete Current
                        </Button>
                    </DisabledReason>
                    <Button
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={onSaveAndContinue}
                        loading={isSaving}
                    >
                        Save and continue
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default NameCharacterBeforeSwitchModal
