import type { SVGProps } from "react"

type VampireFangsIconProps = SVGProps<SVGSVGElement> & {
    size?: number | string
}

/** An original, teeth-only vampire-fangs mark for compact UI surfaces. */
export default function VampireFangsIcon({
    size = 18,
    "aria-hidden": ariaHidden = true,
    ...props
}: VampireFangsIconProps) {
    return (
        <svg
            aria-hidden={ariaHidden}
            fill="currentColor"
            focusable="false"
            height={size}
            viewBox="0 0 32 32"
            width={size}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M3.25 9.45c0-2.1 1.33-3.82 3.13-4.06 1.42-.2 2.64.76 2.73 2.16l.37 5.71-3.42 5.63-1.83-6.06a11.1 11.1 0 0 1-.98-3.38Z" />
            <path d="M8.7 6.44C8.7 4.55 9.95 3 11.5 3h.28c1.55 0 2.8 1.55 2.8 3.44v5.32c0 1.2-.92 2.16-2.06 2.16h-1.76c-1.14 0-2.06-.96-2.06-2.16V6.44Z" />
            <path d="M13.45 5.24c0-1.84 1.14-3.33 2.55-3.33s2.55 1.49 2.55 3.33v6.52c0 1.2-.81 2.16-1.8 2.16h-1.5c-.99 0-1.8-.96-1.8-2.16V5.24Z" />
            <path d="M23.3 6.44C23.3 4.55 22.05 3 20.5 3h-.28c-1.55 0-2.8 1.55-2.8 3.44v5.32c0 1.2.92 2.16 2.06 2.16h1.76c1.14 0 2.06-.96 2.06-2.16V6.44Z" />
            <path d="M28.75 9.45c0-2.1-1.33-3.82-3.13-4.06-1.42-.2-2.64.76-2.73 2.16l-.37 5.71 3.42 5.63 1.83-6.06c.55-1.05.98-2.31.98-3.38Z" />
            <path d="M6.2 23.55c0 1.9 1.25 3.45 2.8 3.45h.28c1.55 0 2.8-1.55 2.8-3.45v-3.1l-2.86.52-1.82-2.87a8.12 8.12 0 0 0-1.2 5.45Z" />
            <path d="M11.5 23.65c0 1.88.92 3.4 2.06 3.4h1.76c1.14 0 2.06-1.52 2.06-3.4v-4.2c0-1.08-.76-1.95-1.7-1.95h-2.47c-.95 0-1.71.87-1.71 1.95v4.2Z" />
            <path d="M25.8 23.55c0 1.9-1.25 3.45-2.8 3.45h-.28c-1.55 0-2.8-1.55-2.8-3.45v-3.1l2.86.52 1.82-2.87a8.12 8.12 0 0 1 1.2 5.45Z" />
        </svg>
    )
}
