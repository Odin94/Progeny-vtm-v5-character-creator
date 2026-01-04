export const isBackendDisabled = (): boolean => {
    return !!import.meta.env.VITE_BACKEND_DISABLED_FLAG
}
