import { UnstyledButton } from "@mantine/core"
import { IconAlertTriangle, IconArrowRight } from "@tabler/icons-react"
import { useEffect, useRef, type MouseEvent } from "react"

const labels: Record<string, string> = {
    name: "Name",
    summary: "Short summary",
    description: "Full description",
    logo: "Logo URL",
    specialtyOptions: "Specialty choices",
    disciplineOptions: "Bonus Discipline choices",
    selectableMeritsAndFlaws: "Merit & Flaw choices",
    meritsAndFlaws: "Granted Merits & Flaws",
    skillBonuses: "Skill grants",
    nativeDisciplines: "Native Disciplines",
    nativeDisciplineRefs: "Native Disciplines",
    totalPoints: "Point budget",
    maxLevel: "Maximum dots",
    customInput: "Custom specialty prompt",
    costs: "Dot costs",
    tiers: "Loresheet levels"
}
const fieldLabel = (path: string) =>
    path
        .split(".")
        .map((part) =>
            /^\d+$/.test(part)
                ? String(Number(part) + 1)
                : (labels[part] ??
                  part.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()))
        )
        .join(" · ")

/** Inputs opt in to "go to field" with `data-hb-field="<error path>"`. */
const focusField = (event: MouseEvent<HTMLButtonElement>, path: string) => {
    const root = event.currentTarget.closest("[data-homebrew-editor]") ?? document
    const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(path) : path
    // Fall back to the closest parent path ("tiers.2.name" → "tiers.2" → "tiers"), then to
    // the first invalid input.
    const parts = path.split(".")
    let target: HTMLElement | null = root.querySelector(`[data-hb-field="${escaped}"]`)
    while (!target && parts.length > 1) {
        parts.pop()
        target = root.querySelector(`[data-hb-field="${parts.join(".")}"]`)
    }
    target ??= root.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!target) return
    target.scrollIntoView?.({ behavior: "smooth", block: "center" })
    target.focus({ preventScroll: true })
}

const HomebrewValidationSummary = ({ errors }: { errors: Partial<Record<string, string>> }) => {
    const entries = Object.entries(errors).filter((entry): entry is [string, string] => !!entry[1])
    const ref = useRef<HTMLDivElement>(null)
    const signature = entries.map(([field]) => field).join("|")

    // Bring the summary into view whenever a save attempt produces (new) errors.
    useEffect(() => {
        if (signature) ref.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" })
    }, [signature])

    if (!entries.length) return null
    return (
        <div ref={ref} role="alert" className="hb-validation">
            <p className="hb-validation__title">
                <IconAlertTriangle size={16} aria-hidden="true" />
                <span>Invalid values:</span>
                <span className="hb-validation__count">
                    {entries.length} {entries.length === 1 ? "field" : "fields"} to fix
                </span>
            </p>
            <ul className="hb-validation__list">
                {entries.map(([field, message]) => (
                    <li key={field}>
                        <UnstyledButton
                            className="hb-validation__item"
                            onClick={(event) => focusField(event, field)}
                        >
                            <span className="hb-validation__text">
                                <strong>{fieldLabel(field)}</strong>: {message}
                            </span>
                            <span className="hb-validation__go" aria-hidden="true">
                                <IconArrowRight size={14} />
                            </span>
                        </UnstyledButton>
                    </li>
                ))}
            </ul>
        </div>
    )
}
export default HomebrewValidationSummary
