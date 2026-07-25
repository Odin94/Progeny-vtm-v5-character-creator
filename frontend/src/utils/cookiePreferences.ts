export const COOKIE_PREFERENCES_REQUEST_EVENT = "progeny:open-cookie-preferences"

export const openCookiePreferences = () => {
    window.dispatchEvent(new Event(COOKIE_PREFERENCES_REQUEST_EVENT))
}
