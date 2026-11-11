import { Tooltip } from "@mantine/core"
import { IconCheck } from "@tabler/icons-react"
import type { CSSProperties } from "react"
import { type UserPreferences, ALLOWED_COLORS, BACKGROUND_IMAGES } from "../utils/preferences"
import classes from "../sheet.module.css"

type PreferencesContentProps = {
    preferences: UserPreferences
    onUpdate: (partial: Partial<UserPreferences>) => void
    primaryColor: string
}

const PreferencesContent = ({ preferences, onUpdate }: PreferencesContentProps) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--pg-space-8)" }}>
        <div className={classes.prefGroup}>
            <h3 className={classes.prefTitle}>Color theme</h3>
            <p className={classes.prefHint}>
                Accent color for the sheet. Default follows your character&apos;s clan.
            </p>
            <div className={classes.swatches}>
                <Tooltip label="Default (clan)" withArrow>
                    <button
                        type="button"
                        className={classes.swatch}
                        data-auto
                        data-selected={preferences.colorTheme === null || undefined}
                        aria-label="Default (clan)"
                        aria-pressed={preferences.colorTheme === null}
                        onClick={() => onUpdate({ colorTheme: null })}
                    >
                        {preferences.colorTheme === null ? <IconCheck size={15} /> : null}
                    </button>
                </Tooltip>
                {ALLOWED_COLORS.map(({ value, label }) => {
                    const isSelected = preferences.colorTheme === value
                    return (
                        <Tooltip key={value} label={label} withArrow>
                            <button
                                type="button"
                                className={classes.swatch}
                                data-selected={isSelected || undefined}
                                aria-label={label}
                                aria-pressed={isSelected}
                                style={
                                    {
                                        "--swatch": `var(--mantine-color-${value}-6)`
                                    } as CSSProperties
                                }
                                onClick={() => onUpdate({ colorTheme: value })}
                            >
                                {isSelected ? <IconCheck size={15} /> : null}
                            </button>
                        </Tooltip>
                    )
                })}
            </div>
        </div>

        <div className={classes.prefGroup}>
            <h3 className={classes.prefTitle}>Background image</h3>
            <p className={classes.prefHint}>The photograph behind the character sheet.</p>

            {BACKGROUND_IMAGES.length === 1 ? (
                <p className={classes.prefHint}>No other backgrounds are available yet.</p>
            ) : (
                <div className={classes.backgrounds}>
                    <button
                        type="button"
                        className={classes.backgroundOption}
                        data-selected={preferences.backgroundImage === null || undefined}
                        aria-pressed={preferences.backgroundImage === null}
                        onClick={() => onUpdate({ backgroundImage: null })}
                    >
                        Default
                        {preferences.backgroundImage === null ? (
                            <span className={classes.backgroundCheck}>
                                <IconCheck size={20} />
                            </span>
                        ) : null}
                    </button>

                    {BACKGROUND_IMAGES.filter((bg) => bg.id !== "default").map((bg) => {
                        const isSelected = preferences.backgroundImage === bg.id
                        return (
                            <Tooltip key={bg.id} label={bg.label} withArrow>
                                <button
                                    type="button"
                                    className={classes.backgroundOption}
                                    data-selected={isSelected || undefined}
                                    aria-label={bg.label}
                                    aria-pressed={isSelected}
                                    onClick={() => onUpdate({ backgroundImage: bg.id })}
                                >
                                    <img src={bg.src} alt="" loading="lazy" />
                                    {isSelected ? (
                                        <span className={classes.backgroundCheck}>
                                            <IconCheck size={20} />
                                        </span>
                                    ) : null}
                                </button>
                            </Tooltip>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
)

export default PreferencesContent
