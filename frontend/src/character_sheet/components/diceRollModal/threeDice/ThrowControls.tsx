import {
    Accordion,
    Button,
    Group,
    NumberInput,
    SegmentedControl,
    Slider,
    Stack,
    Text
} from "@mantine/core"
import { IconRestore, IconWind } from "@tabler/icons-react"
import classes from "../diceRoller.module.css"
import { DEFAULT_VAMPIRE_THROW, type VampireDiceStyle, type VampireThrowSettings } from "./settings"

type Props = {
    allowCrystalDice?: boolean
    style: VampireDiceStyle
    onStyleChange: (style: VampireDiceStyle) => void
    settings: VampireThrowSettings
    onSettingsChange: (settings: VampireThrowSettings) => void
    disabled: boolean
}
export default function ThrowControls({
    allowCrystalDice = false,
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
    const isDefault = (Object.keys(DEFAULT_VAMPIRE_THROW) as (keyof VampireThrowSettings)[]).every(
        (key) => settings[key] === DEFAULT_VAMPIRE_THROW[key]
    )
    return (
        <Stack gap="xs">
            {allowCrystalDice ? (
                <SegmentedControl
                    aria-label="Vampire dice style"
                    fullWidth
                    size="xs"
                    disabled={disabled}
                    value={style}
                    onChange={(value) => onStyleChange(value as VampireDiceStyle)}
                    data={[
                        { label: "Default", value: "default" },
                        { label: "Crystal", value: "crystal" }
                    ]}
                />
            ) : null}
            <Accordion
                variant="default"
                classNames={{
                    item: classes.settingsItem,
                    control: classes.settingsControl,
                    label: classes.settingsLabel,
                    content: classes.settingsContent,
                    chevron: classes.settingsChevron
                }}
            >
                <Accordion.Item value="throw">
                    <Accordion.Control icon={<IconWind size={14} />}>
                        Throw settings
                    </Accordion.Control>
                    <Accordion.Panel keepMounted={false}>
                        <Stack gap="sm">
                            <Text size="xs" fw={600} c="dimmed">
                                Intensity · {settings.intensity.toFixed(1)}×
                            </Text>
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
                                    size="xs"
                                    label="Drop height"
                                    disabled={disabled}
                                    min={0.6}
                                    max={30}
                                    step={0.5}
                                    value={settings.dropHeight}
                                    onChange={(value) => set("dropHeight", value)}
                                />
                                <NumberInput
                                    size="xs"
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
                                    size="xs"
                                    label="Spread (°)"
                                    disabled={disabled}
                                    min={0}
                                    max={180}
                                    value={settings.spread}
                                    onChange={(value) => set("spread", value)}
                                />
                                <NumberInput
                                    size="xs"
                                    label="Start position (%)"
                                    disabled={disabled}
                                    min={-150}
                                    max={150}
                                    value={settings.startX}
                                    onChange={(value) => set("startX", value)}
                                />
                            </Group>
                            <Group justify="flex-end">
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    size="xs"
                                    leftSection={<IconRestore size={14} />}
                                    disabled={disabled || isDefault}
                                    onClick={() => onSettingsChange(DEFAULT_VAMPIRE_THROW)}
                                >
                                    Reset to default
                                </Button>
                            </Group>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Stack>
    )
}
