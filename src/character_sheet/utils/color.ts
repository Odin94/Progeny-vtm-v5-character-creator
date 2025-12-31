const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
}

const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${[r, g, b]
        .map((x) => {
            const hex = Math.round(x).toString(16)
            return hex.length === 1 ? `0${hex}` : hex
        })
        .join("")}`
}

export const blendWithGrey = (color: string, greyHex: string, ratio: number): string => {
    const colorRgb = hexToRgb(color)
    const greyRgb = hexToRgb(greyHex)

    if (!colorRgb || !greyRgb) return color

    const [r1, g1, b1] = colorRgb
    const [r2, g2, b2] = greyRgb

    const r = r1 * (1 - ratio) + r2 * ratio
    const g = g1 * (1 - ratio) + g2 * ratio
    const b = b1 * (1 - ratio) + b2 * ratio

    return rgbToHex(r, g, b)
}
