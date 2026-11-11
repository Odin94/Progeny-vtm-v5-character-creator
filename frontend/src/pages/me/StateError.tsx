import { IconAlertTriangle } from "@tabler/icons-react"
import type { ReactNode } from "react"
import classes from "./me.module.css"

type StateErrorProps = {
    title: ReactNode
    children?: ReactNode
    actions?: ReactNode
}

/** Per-request failure panel: says what failed, keeps the rest of the page usable. */
export const StateError = ({ title, children, actions }: StateErrorProps) => (
    <div className={classes.errorPanel} role="alert">
        <IconAlertTriangle className={classes.errorIcon} size={22} stroke={1.6} />
        <div className={classes.errorBody}>
            <p className={classes.errorTitle}>{title}</p>
            {children ? <div className={classes.errorText}>{children}</div> : null}
            {actions ? <div className={classes.errorActions}>{actions}</div> : null}
        </div>
    </div>
)
