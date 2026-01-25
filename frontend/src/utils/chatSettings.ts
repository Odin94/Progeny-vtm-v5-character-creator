const AUTO_SHARE_DICE_ROLLS_KEY = "chat_auto_share_dice_rolls"
const DEFAULT_AUTO_SHARE = true

export const getAutoShareDiceRolls = (): boolean => {
  if (typeof window === "undefined") return DEFAULT_AUTO_SHARE
  const stored = localStorage.getItem(AUTO_SHARE_DICE_ROLLS_KEY)
  if (stored === null) {
    localStorage.setItem(AUTO_SHARE_DICE_ROLLS_KEY, DEFAULT_AUTO_SHARE.toString())
    return DEFAULT_AUTO_SHARE
  }
  return stored === "true"
}

export const setAutoShareDiceRolls = (value: boolean): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTO_SHARE_DICE_ROLLS_KEY, value.toString())
}
