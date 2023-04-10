
export const upcase = (str: string) => str[0].toUpperCase() + str.slice(1);

export const intersection = <T>(arr1: T[], arr2: T[]) => arr1.filter(value => arr2.includes(value))