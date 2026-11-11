import type { ReactNode } from "react"
import OrnamentalDivider from "~/components/OrnamentalDivider"
import classes from "../sheet.module.css"

type SheetSectionProps = {
    /** Ornamental heading. Omit to render the body without a heading. */
    title?: string
    children: ReactNode
    id?: string
}

/** A titled band of the character sheet: clan-colored ornamental rule + body. */
const SheetSection = ({ title, children, id }: SheetSectionProps) => (
    <section className={classes.section} id={id} aria-label={title}>
        {title ? (
            <div className={classes.sectionHead}>
                <OrnamentalDivider
                    label={title}
                    color="var(--mantine-primary-color-4)"
                    size="large"
                />
            </div>
        ) : null}
        {children}
    </section>
)

export default SheetSection
