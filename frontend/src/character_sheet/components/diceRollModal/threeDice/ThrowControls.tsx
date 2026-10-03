import { Accordion, Group, NumberInput, SegmentedControl, Slider, Stack, Text } from "@mantine/core"
import type { VampireDiceStyle, VampireThrowSettings } from "./settings"

type Props = {
    style: VampireDiceStyle
    onStyleChange: (style: VampireDiceStyle) => void
    settings: VampireThrowSettings
    onSettingsChange: (settings: VampireThrowSettings) => void
    disabled: boolean
}
export default function ThrowControls({
    style,
    onStyleChange,
    settings,
    onSettingsChange,
    disabled
}: Props) {
    const set = (key: keyof VampireThrowSettings, value: string | number) => {
        if (typeof value === "number" && Number.isFinite(value))
            onSettingsChange({ ...settings, [key]: value })
    }
    return (
        <Stack gap="xs">
            <SegmentedControl
                aria-label="Vampire dice style"
                fullWidth
                disabled={disabled}
                value={style}
                onChange={(value) => onStyleChange(value as VampireDiceStyle)}
                data={[
                    { label: "VtM", value: "vtm" },
                    { label: "Crystal VtM", value: "crystal-vtm" }
                ]}
            />
            <Accordion variant="default">
                <Accordion.Item value="throw">
                    <Accordion.Control>Throw settings</Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="sm">
                            <Text size="sm">Intensity · {settings.intensity.toFixed(1)}×</Text>
                            <Slider
                                aria-label="Throw intensity"
                                disabled={disabled}
                                min={0}
                                max={10}
                                step={0.1}
                                value={settings.intensity}
                                onChange={(value) => set("intensity", value)}
                            />
                            <Group grow>
                                <NumberInput
                                    label="Drop height"
                                    disabled={disabled}
                                    min={0.6}
                                    max={30}
                                    step={0.5}
                                    value={settings.dropHeight}
                                    onChange={(value) => set("dropHeight", value)}
                                />
                                <NumberInput
                                    label="Direction (°)"
                                    disabled={disabled}
                                    min={0}
                                    max={359}
                                    value={settings.direction}
                                    onChange={(value) => set("direction", value)}
                                />
                            </Group>
                            <Group grow>
                                <NumberInput
                                    label="Spread (°)"
                                    disabled={disabled}
                                    min={0}
                                    max={180}
                                    value={settings.spread}
                                    onChange={(value) => set("spread", value)}
                                />
                                <NumberInput
                                    label="Start position (%)"
                                    disabled={disabled}
                                    min={-150}
                                    max={150}
                                    value={settings.startX}
                                    onChange={(value) => set("startX", value)}
                                />
                            </Group>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Stack>
    )
}
