export type VampireDiceStyle = "vtm" | "crystal-vtm"
export type VampireThrowSettings = {
    intensity: number
    dropHeight: number
    direction: number
    spread: number
    startX: number
}
export const DEFAULT_VAMPIRE_THROW: VampireThrowSettings = {
    intensity: 1.6,
    dropHeight: 6,
    direction: 200,
    spread: 55,
    startX: 80
}

export const readThrowSettings = (raw: string | undefined) => {
    try {
        const input = JSON.parse(raw ?? "null")
        const finite = (key: keyof VampireThrowSettings, min: number, max: number) =>
            typeof input?.[key] === "number" && Number.isFinite(input[key])
                ? Math.max(min, Math.min(max, input[key]))
                : DEFAULT_VAMPIRE_THROW[key]
        return {
            intensity: finite("intensity", 0, 10),
            dropHeight: finite("dropHeight", 0.6, 30),
            direction: finite("direction", 0, 359),
            spread: finite("spread", 0, 180),
            startX: finite("startX", -150, 150)
        }
    } catch {
        return DEFAULT_VAMPIRE_THROW
    }
}

export const parseQuickRoll = (input: string) => {
    const match = input.trim().match(/^(?:r\s*)?(\d+)(?:\s*d\s*10)?$/i)
    if (!match) return null
    const count = Number(match[1])
    return Number.isSafeInteger(count) && count >= 1 && count <= 100 ? count : null
}
