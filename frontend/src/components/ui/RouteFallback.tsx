import { Loader } from "@mantine/core"
import classes from "./ui.module.css"

/**
 * Full-height loading state for lazy routes and page-level queries. Fades in after a short
 * delay so fast loads never flash a spinner.
 *
 * ```tsx
 * <Suspense fallback={<RouteFallback />}>…</Suspense>
 * ```
 */
export const RouteFallback = ({ label }: { label?: string }) => (
    <div className={classes.routeFallback} role="status" aria-live="polite">
        <Loader size="lg" color="red" />
        {label ? <span className={classes.routeFallbackLabel}>{label}</span> : null}
        {label ? null : <span className="pg-visually-hidden">Loading</span>}
    </div>
)
