import type { Bounds } from "./page-dice-physics"

/** A centered reading grid in the largest clear rectangle, outside the roller. */
export function sortedSlots(bounds: Bounds, count: number): [number, number][] {
    if (!count) return []
    const perspective = 1 - 2.04 / bounds.cameraHeight
    const left = -bounds.halfX * perspective + 1.3
    const right = bounds.halfX * perspective - 1.3
    const top = -bounds.halfZ * perspective + 1.3
    const bottom = (bounds.halfZ - bounds.bottomInset) * perspective - 1.4
    const blocked = bounds.blocked
    const regions = blocked
        ? [
              [left, Math.min(right, blocked.minX * perspective - 1.3), top, bottom],
              [Math.max(left, blocked.maxX * perspective + 1.3), right, top, bottom],
              [left, right, top, Math.min(bottom, blocked.minZ * perspective - 1.4)],
              [left, right, Math.max(top, blocked.maxZ * perspective + 1.3), bottom]
          ]
        : [[left, right, top, bottom]]
    regions.sort(
        (a, b) =>
            Math.max(0, b[1] - b[0]) * Math.max(0, b[3] - b[2]) -
            Math.max(0, a[1] - a[0]) * Math.max(0, a[3] - a[2])
    )
    for (const [minX, maxX, minZ, maxZ] of regions) {
        if (maxX < minX || maxZ < minZ) continue
        const maxCols = Math.floor((maxX - minX) / 2.6) + 1
        const maxRows = Math.floor((maxZ - minZ) / 2.8) + 1
        if (maxCols * maxRows < count) continue
        const cols = Math.min(
            maxCols,
            Math.max(
                Math.ceil(count / maxRows),
                Math.ceil(Math.sqrt(count * Math.max(1, (maxX - minX) / (maxZ - minZ || 1))))
            )
        )
        const rows = Math.ceil(count / cols)
        return Array.from({ length: count }, (_, index) => {
            const row = Math.floor(index / cols)
            const rowCount = Math.min(cols, count - row * cols)
            return [
                (minX + maxX) / 2 + ((index % cols) - (rowCount - 1) / 2) * 2.6,
                (minZ + maxZ) / 2 + (row - (rows - 1) / 2) * 2.8
            ]
        })
    }
    return []
}
