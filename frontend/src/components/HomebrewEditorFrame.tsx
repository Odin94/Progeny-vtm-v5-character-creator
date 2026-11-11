import { Button, Modal, SegmentedControl } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useEffect, useState, type ReactNode } from "react"
import { HomebrewKindIcon } from "~/components/HomebrewCodex"
import HomebrewValidationSummary from "~/components/HomebrewValidationSummary"
import type { HomebrewItemKind } from "~/data/Homebrew"
import { homebrewKindLabel } from "~/data/Homebrew"
import "./HomebrewItemEditor.css"

type Props = {
    opened: boolean
    onClose: () => void
    kind: HomebrewItemKind
    isNew: boolean
    /** The live, read-only preview of the draft (same component the library uses). */
    preview: ReactNode
    errors: Partial<Record<string, string>>
    saveLabel: string
    onSave: () => void
    "aria-label"?: string
    children: ReactNode
}

/**
 * Shared shell for every homebrew item editor: themed modal, form on the left and a sticky live
 * preview on the right (desktop) or an Edit / Preview switch (phone), the validation summary with
 * "go to field" links, and a sticky Cancel / Save footer.
 */
const HomebrewEditorFrame = ({
    opened,
    onClose,
    kind,
    isNew,
    preview,
    errors,
    saveLabel,
    onSave,
    children,
    "aria-label": ariaLabel
}: Props) => {
    const phone = useMediaQuery("(max-width: 48em)") ?? false
    const [view, setView] = useState<"edit" | "preview">("edit")
    const showForm = !phone || view === "edit"
    const errorSignature = Object.keys(errors).join("|")

    // A failed save on a phone jumps back to the form so the summary is visible.
    useEffect(() => {
        if (errorSignature) setView("edit")
    }, [errorSignature])

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="76rem"
            fullScreen={phone}
            aria-label={ariaLabel}
            title={
                <span className="hb-editor__title">
                    <span className="hb-editor__title-glyph" aria-hidden="true">
                        <HomebrewKindIcon kind={kind} size={15} />
                    </span>
                    {isNew ? "New" : "Edit"} {homebrewKindLabel(kind)}
                </span>
            }
            classNames={{
                content: "hb-editor-modal",
                header: "hb-editor-modal__header",
                body: "hb-editor-modal__body"
            }}
        >
            <div className="hb-editor" data-homebrew-editor data-view={phone ? view : "split"}>
                {phone ? (
                    <SegmentedControl
                        className="hb-editor__switch"
                        fullWidth
                        value={view}
                        onChange={(value) => setView(value as "edit" | "preview")}
                        data={[
                            { value: "edit", label: "Edit" },
                            { value: "preview", label: "Preview" }
                        ]}
                    />
                ) : null}
                <div className="hb-editor__form" hidden={!showForm}>
                    <HomebrewValidationSummary errors={errors} />
                    {children}
                </div>
                {!phone || view === "preview" ? (
                    <aside className="hb-editor__preview" aria-label="Live preview">
                        <div className="hb-editor__preview-inner">
                            <span className="pg-eyebrow hb-editor__preview-label">
                                Live preview
                            </span>
                            {preview}
                        </div>
                    </aside>
                ) : null}
            </div>
            <footer className="hb-editor__footer">
                <Button variant="subtle" color="gray" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={onSave}>{saveLabel}</Button>
            </footer>
        </Modal>
    )
}

export default HomebrewEditorFrame

/** Put helper text under the input so inputs in a row line up regardless of descriptions. */
export const belowInput: Array<"label" | "input" | "description" | "error"> = [
    "label",
    "input",
    "description",
    "error"
]

/** A titled group of fields inside an editor form. */
export const EditorSection = ({
    title,
    description,
    children
}: {
    title: string
    description?: ReactNode
    children: ReactNode
}) => (
    <section className="hb-form-section">
        <header className="hb-form-section__header">
            <h3 className="hb-form-section__title">{title}</h3>
            <span className="hb-form-section__rule" aria-hidden="true" />
        </header>
        {description ? <p className="hb-form-section__description">{description}</p> : null}
        <div className="hb-form-section__body">{children}</div>
    </section>
)
