import { Dots as DotTrack } from "~/components/ui"

/** Five-dot rating used throughout the dossier. */
const Dots = ({ n, max = 5, color }: { n: number; max?: number; color?: string }) => (
    <DotTrack filled={n} total={max} emptyTone="quiet" color={color} label={`${n} of ${max}`} />
)

export default Dots
