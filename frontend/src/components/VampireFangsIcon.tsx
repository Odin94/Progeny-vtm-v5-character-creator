import type { SVGProps } from "react"

type VampireFangsIconProps = SVGProps<SVGSVGElement> & {
    size?: number | string
}

/** An original vampire-fangs mark for use on dark or colored UI surfaces. */
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
            viewBox="0 0 24 24"
            width={size}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M3.1 4.85c1.13-.96 2.87-.8 3.7.35.73 1 .9 2.25.49 3.4L6.3 11.42l-2.24-1.5a3.36 3.36 0 0 1-.96-5.07Zm17.8 0c-1.13-.96-2.87-.8-3.7.35-.73 1-.9 2.25-.49 3.4l.99 2.82 2.24-1.5a3.36 3.36 0 0 0 .96-5.07Z" />
            <path d="M7.12 5.11c.93-.52 2.1-.18 2.6.75l.46.87.46-.87a2.06 2.06 0 0 1 3.72 0l.46.87.46-.87a1.94 1.94 0 0 1 2.6-.75c.96.53 1.3 1.75.77 2.71l-3.52 6.34L12 18.2l-2.93-4.04-3.52-6.34a1.94 1.94 0 0 1 .77-2.71Z" />
        </svg>
    )
}
