import type { ReactNode } from "react"
import classes from "../sheet.module.css"

type SheetSectionProps = {
    /** Omit to render the body without a heading. */
    title?: string
    children: ReactNode
    id?: string
}

const SheetSection = ({ title, children, id }: SheetSectionProps) => (
    <section className={classes.section} id={id} aria-label={title}>
        {title ? <h2 className={classes.sectionHead}>{title}</h2> : null}
        {children}
    </section>
)

export default SheetSection
