import { Button } from "@mantine/core"
import { memo, useState } from "react"
import { SheetOptions } from "../CharacterSheet"
import TouchstoneModal from "../components/TouchstoneModal"
import { Touchstone } from "~/data/Character"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { DeleteIconButton, IconButton, useContextMenu } from "~/components/ui"
import classes from "../sheet.module.css"

type TouchstonesProps = {
    options: SheetOptions
}

const Touchstones = ({ options }: TouchstonesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [modalOpened, setModalOpened] = useState(false)
    const [initialTouchstone, setInitialTouchstone] = useState<Touchstone | null>(null)
    const [initialIndex, setInitialIndex] = useState<number | null>(null)
    const [touchstoneToDelete, setTouchstoneToDelete] = useState<Touchstone | null>(null)
    const contextMenu = useContextMenu()
    const isFreeMode = mode === "free"

    if (character.touchstones.length === 0 && !isFreeMode) {
        return null
    }

    const handleDeleteTouchstone = (touchstone: Touchstone) => {
        setTouchstoneToDelete(touchstone)
    }

    const confirmDelete = () => {
        if (!touchstoneToDelete) return

        setCharacter((current) => ({
            ...current,
            touchstones: current.touchstones.filter(
                (t) =>
                    !(
                        t.name === touchstoneToDelete.name &&
                        t.description === touchstoneToDelete.description &&
                        t.conviction === touchstoneToDelete.conviction
                    )
            )
        }))

        setTouchstoneToDelete(null)
    }

    return (
        <>
            <div className={classes.touchstoneGrid}>
                {character.touchstones.map((touchstone, index) => {
                    const editTouchstone = () => {
                        setInitialTouchstone(touchstone)
                        setInitialIndex(index)
                        setModalOpened(true)
                    }
                    return (
                        <div
                            key={index}
                            className={`${classes.card} ${classes.touchstone}`}
                            data-actionable={isFreeMode || undefined}
                            onContextMenu={
                                isFreeMode
                                    ? (event) =>
                                          contextMenu.open(event, [
                                              {
                                                  key: "edit",
                                                  label: "Edit touchstone",
                                                  icon: <IconPencil size={14} />,
                                                  onClick: editTouchstone
                                              },
                                              { type: "divider", key: "divider" },
                                              {
                                                  key: "delete",
                                                  label: "Delete touchstone…",
                                                  color: "red",
                                                  icon: <IconTrash size={14} />,
                                                  onClick: () => handleDeleteTouchstone(touchstone)
                                              }
                                          ])
                                    : undefined
                            }
                        >
                            <div className={classes.cardHead}>
                                <p className={classes.cardTitle} data-display>
                                    {touchstone.name}
                                </p>
                                {isFreeMode ? (
                                    <div className={classes.cardActions}>
                                        <IconButton
                                            size="sm"
                                            label={`Edit ${touchstone.name || "touchstone"}`}
                                            icon={<IconPencil size={15} />}
                                            onClick={editTouchstone}
                                        />
                                        <DeleteIconButton
                                            size="sm"
                                            label={`Delete ${touchstone.name || "touchstone"}`}
                                            onClick={() => handleDeleteTouchstone(touchstone)}
                                        />
                                    </div>
                                ) : null}
                            </div>
                            {touchstone.description ? (
                                <p className={classes.cardLore}>{touchstone.description}</p>
                            ) : null}
                            {touchstone.conviction ? (
                                <div className={classes.conviction}>
                                    <span className={classes.label}>Conviction</span>
                                    <p className={classes.convictionText}>
                                        {touchstone.conviction}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )
                })}
                {isFreeMode ? (
                    <div className={classes.addTile}>
                        <Button
                            size="sm"
                            variant="light"
                            color={primaryColor}
                            leftSection={<IconPlus size={16} />}
                            onClick={() => {
                                setInitialTouchstone(null)
                                setInitialIndex(null)
                                setModalOpened(true)
                            }}
                        >
                            Add touchstone
                        </Button>
                    </div>
                ) : null}
            </div>
            {modalOpened ? (
                <TouchstoneModal
                    opened
                    onClose={() => {
                        setModalOpened(false)
                        setInitialTouchstone(null)
                        setInitialIndex(null)
                    }}
                    options={options}
                    initialTouchstone={initialTouchstone}
                    initialIndex={initialIndex}
                />
            ) : null}
            {touchstoneToDelete ? (
                <ConfirmActionModal
                    opened={!!touchstoneToDelete}
                    onClose={() => setTouchstoneToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Delete Touchstone"
                    body={<>Delete touchstone &quot;{touchstoneToDelete.name}&quot;?</>}
                    confirmLabel="Delete"
                />
            ) : null}
            {contextMenu.menu}
        </>
    )
}

export default memo(Touchstones, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.touchstones === n.character.touchstones
    )
})
