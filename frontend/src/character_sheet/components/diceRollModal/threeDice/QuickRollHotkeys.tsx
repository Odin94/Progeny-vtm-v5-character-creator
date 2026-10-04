import { Paper, Text, TextInput } from "@mantine/core"
import { useEffect, useState } from "react"
import { useDiceRollModalStore } from "../../../stores/diceRollModalStore"
import { parseQuickRoll } from "./settings"

export default function QuickRollHotkeys() {
    const [command, setCommand] = useState<string | null>(null)
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target instanceof Element ? event.target : null
            if (
                event.defaultPrevented ||
                event.repeat ||
                event.isComposing ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                target?.closest(
                    "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']"
                ) ||
                document.querySelector("[role='dialog']")
            )
                return
            if (
                event.key.toLowerCase() === "r" &&
                !useDiceRollModalStore.getState().dice.some((die) => die.isRolling)
            ) {
                event.preventDefault()
                setCommand("")
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])
    if (command === null) return null
    const count = parseQuickRoll(command)
    return (
        <Paper
            withBorder
            shadow="lg"
            p="sm"
            style={{
                position: "fixed",
                top: 70,
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(340px, 90vw)",
                zIndex: 3100
            }}
        >
            <TextInput
                autoFocus
                label="Quick roll"
                placeholder="4"
                value={command}
                onChange={(event) => setCommand(event.currentTarget.value)}
                leftSection={<Text fw={700}>r</Text>}
                aria-label="Quick roll dice count"
                onBlur={() => setCommand(null)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault()
                        setCommand(null)
                    }
                    if (event.key === "Enter" && count !== null) {
                        event.preventDefault()
                        if (!useDiceRollModalStore.getState().dice.some((die) => die.isRolling)) {
                            useDiceRollModalStore.getState().requestQuickRoll(count)
                        }
                        setCommand(null)
                        event.currentTarget.blur()
                    }
                }}
            />
            <Text size="xs" c="dimmed" mt={6}>
                Enter to roll, Escape to cancel
            </Text>
        </Paper>
    )
}
