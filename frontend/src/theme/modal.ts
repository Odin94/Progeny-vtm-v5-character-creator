import { Modal } from "@mantine/core"
import classes from "./modal.module.css"

/**
 * The shared visual shell for ordinary application modals. Purpose-built modals
 * can still supply their own class names or styles when their content needs a
 * distinct presentation (for example, the character-sheet menu).
 */
export const modalTheme = {
    Modal: Modal.extend({
        defaultProps: {
            centered: true,
            overlayProps: { backgroundOpacity: 0.72, blur: 8 }
        },
        classNames: { body: classes.body, header: classes.header, title: classes.title },
        styles: {
            content: {
                border: "1px solid rgba(125, 91, 72, 0.38)",
                background:
                    "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
                boxShadow:
                    "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
            },
            header: {
                justifyContent: "center"
            },
            title: {
                fontFamily: "Cinzel, Georgia, serif",

                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(244, 236, 232, 0.95)"
            }
        }
    })
}
