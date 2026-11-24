import { Box, type MantineLoaderComponent } from "@mantine/core"
import { forwardRef } from "react"
import classes from "./SigilLoader.module.css"

/**
 * Progeny's default Mantine loader: a hairline ring with a sweeping blood arc around a
 * small pulsing diamond. Registered as `type="sigil"` (the theme default) so every
 * `<Loader />` and `<Button loading />` uses it. Color follows `--loader-color`.
 */
export const SigilLoader: MantineLoaderComponent = forwardRef<HTMLSpanElement>(
    ({ className, ...others }: React.HTMLAttributes<HTMLSpanElement>, ref) => (
        <Box
            component="span"
            className={[classes.sigil, className].filter(Boolean).join(" ")}
            {...others}
            ref={ref}
        >
            <span className={classes.ring} />
            <span className={classes.core} />
        </Box>
    )
)

SigilLoader.displayName = "SigilLoader"
