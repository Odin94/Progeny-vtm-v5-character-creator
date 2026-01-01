export const bgAlpha = 0.9

export const inputAlpha = 0.7

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
}

export const hexToRgba = (hex: string, alpha: number): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
