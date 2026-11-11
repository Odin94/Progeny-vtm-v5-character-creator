/** 1 → "1st", 12 → "12th", 23 → "23rd". */
export const getOrdinal = (value: number): string => {
    const mod100 = value % 100
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`
    switch (value % 10) {
        case 1:
            return `${value}st`
        case 2:
            return `${value}nd`
        case 3:
            return `${value}rd`
        default:
            return `${value}th`
    }
}
