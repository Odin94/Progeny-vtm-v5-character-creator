import { Box } from "@mantine/core"
import { ReactNode } from "react"

type FocusBorderWrapperProps = {
    children: ReactNode
    colorValue: string
    style?: React.CSSProperties
}

const FocusBorderWrapper = ({ children, colorValue, style }: FocusBorderWrapperProps) => {
    return (
        <Box
            style={style}
            onFocusCapture={(e) => {
                const input = e.currentTarget.querySelector("input, textarea") as HTMLElement | null
                if (input) {
                    input.style.setProperty("--input-bd", colorValue)
                }
            }}
            onBlurCapture={(e) => {
                const input = e.currentTarget.querySelector("input, textarea") as HTMLElement | null
                if (input) {
                    input.style.setProperty("--input-bd", "transparent")
                }
            }}
        >
            {children}
        </Box>
    )
}

export default FocusBorderWrapper

