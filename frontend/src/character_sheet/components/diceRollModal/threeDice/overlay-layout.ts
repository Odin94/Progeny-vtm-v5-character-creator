export type DieScreenBox = { left: number; top: number; width: number; height: number }

// Captions never determine the hit area. Keep neighbouring dice's targets separate,
// even when perspective or a dense pool makes their projected hull boxes overlap.
export const layoutDieTargets = (boxes: DieScreenBox[]): DieScreenBox[] => {
    const targets = boxes.map((box) => ({ ...box }))
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            const a = targets[i],
                b = targets[j]
            const ax = a.left + a.width / 2,
                ay = a.top + a.height / 2
            const bx = b.left + b.width / 2,
                by = b.top + b.height / 2
            const dx = Math.abs(ax - bx),
                dy = Math.abs(ay - by)
            if (dx >= (a.width + b.width) / 2 || dy >= (a.height + b.height) / 2) continue
            if (dx / (a.width + b.width) >= dy / (a.height + b.height)) {
                a.width = Math.min(a.width, dx)
                b.width = Math.min(b.width, dx)
                a.left = ax - a.width / 2
                b.left = bx - b.width / 2
            } else {
                a.height = Math.min(a.height, dy)
                b.height = Math.min(b.height, dy)
                a.top = ay - a.height / 2
                b.top = by - b.height / 2
            }
        }
    }
    return targets
}
