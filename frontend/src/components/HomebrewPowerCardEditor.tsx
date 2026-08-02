import {
    Alert,
    Button,
    Group,
    Modal,
    NumberInput,
    Select,
    TextInput,
    Textarea
} from "@mantine/core"
import { IconDropletFilled } from "@tabler/icons-react"
import OrnamentalDivider from "~/components/OrnamentalDivider"
import type { HomebrewItem, HomebrewPower } from "~/data/Homebrew"
import "./HomebrewPowerCardEditor.css"

type Props = {
    opened: boolean
    power: HomebrewPower
    disciplineOptions: Array<{ value: string; label: string }>
    disciplineValue: string
    onDisciplineChange: (value: string) => void
    update: (values: Partial<HomebrewItem>) => void
    error: string
    onClose: () => void
    onSave: () => void
}

const parseAmalgamPrerequisites = (value: string) =>
    value
        .split(",")
        .map((part) => part.trim().match(/^(.*)\s+([1-5])$/))
        .filter((match): match is RegExpMatchArray => !!match)
        .map((match) => ({ discipline: match[1].trim(), level: Number(match[2]) }))

const HomebrewPowerCardEditor = ({
    opened,
    power,
    disciplineOptions,
    disciplineValue,
    onDisciplineChange,
    update,
    error,
    onClose,
    onSave
}: Props) => (
    <Modal
        opened={opened}
        onClose={onClose}
        centered
        size="xl"
        withCloseButton={false}
        classNames={{
            content: "homebrew-power-card__modal",
            body: "homebrew-power-card__modal-body"
        }}
    >
        <article className="homebrew-power-card">
            <header className="homebrew-power-card__header">
                <div className="homebrew-power-card__discipline-level">
                    <Select
                        label="Discipline"
                        data={disciplineOptions}
                        searchable
                        value={disciplineValue}
                        onChange={(value) => {
                            if (value) onDisciplineChange(value)
                        }}
                        required
                    />
                    <NumberInput
                        label="Level"
                        min={1}
                        max={5}
                        value={power.level}
                        onChange={(value) => update({ level: Number(value) || 1 })}
                    />
                </div>
                <div aria-hidden="true" />
                <NumberInput
                    label="Rouse checks"
                    min={0}
                    max={5}
                    value={power.rouseChecks}
                    rightSection={<IconDropletFilled size={18} color="#c74650" />}
                    rightSectionPointerEvents="none"
                    onChange={(value) => update({ rouseChecks: Number(value) || 0 })}
                />
            </header>

            <section className="homebrew-power-card__identity">
                <TextInput
                    aria-label="Power name"
                    placeholder="Untitled power"
                    value={power.name}
                    maxLength={100}
                    onChange={(event) => update({ name: event.currentTarget.value })}
                    classNames={{ input: "homebrew-power-card__name-input" }}
                    required
                />
                <TextInput
                    label="Amalgam prerequisite"
                    description="Optional. For example: Celerity 2, Potence 1."
                    value={power.amalgamPrerequisites
                        .map(({ discipline, level }) => `${discipline} ${level}`)
                        .join(", ")}
                    onChange={(event) =>
                        update({
                            amalgamPrerequisites: parseAmalgamPrerequisites(
                                event.currentTarget.value
                            )
                        })
                    }
                    classNames={{
                        root: "homebrew-power-card__amalgam",
                        input: "homebrew-power-card__amalgam-input"
                    }}
                />
            </section>

            <Textarea
                label="Summary"
                description="Shown in pickers and library previews."
                minRows={2}
                autosize
                maxRows={5}
                value={power.summary}
                onChange={(event) => update({ summary: event.currentTarget.value })}
            />

            <OrnamentalDivider label="Dice pool" />

            <Textarea
                aria-label="Dice pool"
                placeholder="Resolve + Auspex"
                minRows={2}
                autosize
                maxRows={4}
                value={power.dicePool}
                onChange={(event) => update({ dicePool: event.currentTarget.value })}
                classNames={{ input: "homebrew-power-card__dice-pool-input" }}
            />

            <OrnamentalDivider label="Full description" />

            <Textarea
                aria-label="Full description"
                placeholder="Describe how this power works."
                minRows={7}
                autosize
                maxRows={16}
                value={power.description}
                onChange={(event) => update({ description: event.currentTarget.value })}
                classNames={{ input: "homebrew-power-card__description-input" }}
            />

            {error ? <Alert color="red">{error}</Alert> : null}
            <Group justify="flex-end" className="homebrew-power-card__footer">
                <Button variant="subtle" color="gray" onClick={onClose}>
                    Cancel
                </Button>
                <Button color="grape" onClick={onSave}>
                    Save power
                </Button>
            </Group>
        </article>
    </Modal>
)

export default HomebrewPowerCardEditor
