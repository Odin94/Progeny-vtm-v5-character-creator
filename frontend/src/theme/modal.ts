import { Modal } from "@mantine/core"
import shared from "./components.module.css"
import classes from "./modal.module.css"
import { modalTransitionProps } from "./transitions"

/**
 * The shared visual shell for ordinary application modals: candlelit gradient surface,
 * gold hairline border, Cinzel title, blurred scrim, and a scale-in (.96 → 1, ease-out)
 * / scale-out (ease-in) transition. Purpose-built modals can still supply their own
 * class names or styles when their content needs a distinct presentation (for example,
 * the character-sheet menu).
 */
export const modalTheme = {
    Modal: Modal.extend({
        defaultProps: {
            centered: true,
            overlayProps: { blur: 6 },
            transitionProps: modalTransitionProps,
            radius: "lg"
        },
        classNames: {
            content: shared.modalContent,
            header: `${shared.modalHeader} ${classes.header}`,
            title: `${shared.modalTitle} ${classes.title}`,
            body: classes.body,
            close: `${shared.closeButton} ${classes.close}`,
            overlay: shared.overlay
        },
        styles: {
            header: {
                justifyContent: "center"
            }
        }
    })
}
