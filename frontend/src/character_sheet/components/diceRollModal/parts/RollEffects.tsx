import { createPortal } from "react-dom"
import type { RollOutcomeKind } from "../rollOutcome"
import classes from "../diceRoller.module.css"

/** Blood splash for a messy critical. */
const Splash = () => (
    <svg className={`${classes.effect} ${classes.splash}`} viewBox="0 0 190 170" aria-hidden="true">
        <path
            fill="currentColor"
            d="M112 22c9 3 8 17 18 19 11 2 17-12 27-6 9 6-3 18 4 26 7 9 23 2 26 13 3 10-13 13-13 23 0 11 15 18 8 27-8 9-19-3-28 3-9 7-3 24-15 27-12 2-14-15-24-17-10-1-16 15-27 11-10-4-2-19-9-26-8-8-25-4-27-15-2-11 15-13 17-23 2-11-12-20-4-29 7-8 19 1 27-6 9-7 7-25 20-27Z"
        />
        <g className={classes.splashDrops} fill="currentColor">
            <circle cx="40" cy="44" r="6" />
            <circle cx="24" cy="78" r="3.5" />
            <circle cx="58" cy="138" r="5" />
            <circle cx="96" cy="160" r="3" />
            <circle cx="176" cy="150" r="4" />
            <path d="M150 128c3 0 4 3 4 7 0 9-1 20-4 20s-4-11-4-20c0-4 1-7 4-7Z" />
            <path d="M84 132c2 0 3 2 3 5 0 7-1 15-3 15s-3-8-3-15c0-3 1-5 3-5Z" />
        </g>
    </svg>
)

/** Three raking claw marks for a bestial failure. */
const Claws = ({ faint = false }: { faint?: boolean }) => (
    <svg
        className={`${classes.effect} ${classes.claws}`}
        data-faint={faint || undefined}
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <g fill="currentColor" transform="translate(-70 0)">
            <path
                className={classes.claw}
                d="M150 8c40 30 120 110 190 176-4 2-8 2-11 0C262 128 190 60 150 8Z"
            />
            <path
                className={classes.claw}
                d="M185 4c40 30 118 106 196 172-4 2-8 2-11 0C302 118 226 56 185 4Z"
            />
            <path
                className={classes.claw}
                d="M222 6c38 28 106 92 170 150-3 2-7 2-10 0C326 106 260 52 222 6Z"
            />
        </g>
    </svg>
)

export const RollEffect = ({ kind }: { kind: RollOutcomeKind }) => {
    if (kind === "messy") return <Splash />
    if (kind === "bestial") return <Claws />
    if (kind === "bestial-risk") return <Claws faint />
    if (kind === "critical") return <div className={`${classes.effect} ${classes.candle}`} />
    return null
}

/** A brief blood vignette around the whole page; skipped entirely under reduced motion. */
export const RollVignette = ({ kind }: { kind: RollOutcomeKind }) => {
    if (kind !== "messy" && kind !== "bestial") return null
    if (typeof document === "undefined") return null
    return createPortal(<div className={classes.vignette} aria-hidden="true" />, document.body)
}
