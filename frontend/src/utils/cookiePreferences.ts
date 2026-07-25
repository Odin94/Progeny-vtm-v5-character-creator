export const COOKIE_PREFERENCES_REQUEST_EVENT = "progeny:open-cookie-preferences"
export const COOKIE_PREFERENCES_CHANGED_EVENT = "progeny:cookie-preferences-changed"

export const openCookiePreferences = () => {
    window.dispatchEvent(new Event(COOKIE_PREFERENCES_REQUEST_EVENT))
}

export const notifyCookiePreferencesChanged = () => {
    window.dispatchEvent(new Event(COOKIE_PREFERENCES_CHANGED_EVENT))
}
