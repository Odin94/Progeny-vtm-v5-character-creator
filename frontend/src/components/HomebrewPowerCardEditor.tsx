import {
    ActionIcon,
    Button,
    Group,
    Modal,
    NumberInput,
    Select,
    TextInput,
    Textarea
} from "@mantine/core"
import { IconDropletFilled, IconX } from "@tabler/icons-react"
import { useState } from "react"
import OrnamentalDivider from "~/components/OrnamentalDivider"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import type { HomebrewItem, HomebrewPower } from "~/data/Homebrew"
import "./HomebrewPowerCardEditor.css"

type Props = {
    opened: boolean
    power: HomebrewPower
    disciplineOptions: Array<{ value: string; label: string }>
    disciplineValue: string
    onDisciplineChange: (value: string) => void
    update: (values: Partial<HomebrewItem>) => void
    errors: Partial<Record<string, string>>
    onClose: () => void
    onSave: () => void
}

const disciplineNameFromOption = (label: string) => label.replace(/\s+\((Official|Homebrew)\)$/, "")

const HomebrewPowerCardEditor = ({
    opened,
    power,
    disciplineOptions,
    disciplineValue,
    onDisciplineChange,
    update,
    errors,
    onClose,
    onSave
}: Props) => {
    const [amalgamPickerOpened, setAmalgamPickerOpened] = useState(false)

    const addAmalgamPrerequisite = (value: string | null) => {
        if (!value) return
        const option = disciplineOptions.find((candidate) => candidate.value === value)
        if (!option) return

        const discipline = disciplineNameFromOption(option.label)
        if (power.amalgamPrerequisites.some((prerequisite) => prerequisite.discipline === discipline)) {
            return
        }
        update({
            amalgamPrerequisites: [...power.amalgamPrerequisites, { discipline, level: 1 }]
        })
    }

    return (
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
        <article className="homebrew-power-card homebrew-form-controls">
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
                        classNames={homebrewDropdownClassNames}
                        error={errors.discipline}
                        required
                    />
                    <NumberInput
                        label="Level"
                        min={1}
                        max={5}
                        value={power.level}
                        onChange={(value) => update({ level: Number(value) || 1 })}
                        error={errors.level}
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
                    error={errors.rouseChecks}
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
                    error={errors.name}
                    required
                />
                <div className="homebrew-power-card__amalgam">
                    <button
                        type="button"
                        className={`homebrew-power-card__amalgam-trigger${
                            amalgamPickerOpened ? " homebrew-power-card__amalgam-trigger--open" : ""
                        }`}
                        aria-expanded={amalgamPickerOpened}
                        onClick={() => setAmalgamPickerOpened((current) => !current)}
                    >
                        Amalgam prerequisite
                    </button>
                    {amalgamPickerOpened ? (
                        <div className="homebrew-power-card__amalgam-picker">
                            <Select
                                aria-label="Add amalgam prerequisite"
                                placeholder="Add a discipline"
                                data={disciplineOptions.filter(
                                    (option) =>
                                        !power.amalgamPrerequisites.some(
                                            (prerequisite) =>
                                                prerequisite.discipline ===
                                                disciplineNameFromOption(option.label)
                                        )
                                )}
                                searchable
                                value={null}
                                onChange={addAmalgamPrerequisite}
                                classNames={{
                                    ...homebrewDropdownClassNames,
                                    input: "homebrew-power-card__amalgam-input"
                                }}
                                error={errors.amalgamPrerequisites}
                            />
                            {power.amalgamPrerequisites.length ? (
                                <div className="homebrew-power-card__amalgam-list">
                                    {power.amalgamPrerequisites.map((prerequisite, index) => (
                                        <div
                                            className="homebrew-power-card__amalgam-row"
                                            key={`${prerequisite.discipline}-${index}`}
                                        >
                                            <span>{prerequisite.discipline}</span>
                                            <NumberInput
                                                aria-label={`${prerequisite.discipline} amalgam level`}
                                                min={1}
                                                max={5}
                                                value={prerequisite.level}
                                                onChange={(value) =>
                                                    update({
                                                        amalgamPrerequisites:
                                                            power.amalgamPrerequisites.map(
                                                                (candidate, candidateIndex) =>
                                                                    candidateIndex === index
                                                                        ? {
                                                                              ...candidate,
                                                                              level:
                                                                                  Number(value) || 1
                                                                          }
                                                                        : candidate
                                                            )
                                                    })
                                                }
                                                error={errors[`amalgamPrerequisites.${index}.level`]}
                                            />
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                aria-label={`Remove ${prerequisite.discipline} prerequisite`}
                                                onClick={() =>
                                                    update({
                                                        amalgamPrerequisites:
                                                            power.amalgamPrerequisites.filter(
                                                                (_, candidateIndex) =>
                                                                    candidateIndex !== index
                                                            )
                                                    })
                                                }
                                            >
                                                <IconX size={15} />
                                            </ActionIcon>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </section>

            <Textarea
                label="Summary"
                description="Shown in pickers and library previews."
                minRows={2}
                autosize
                maxRows={5}
                value={power.summary}
                onChange={(event) => update({ summary: event.currentTarget.value })}
                classNames={{ input: "homebrew-power-card__summary-input" }}
                error={errors.summary}
            />

            <OrnamentalDivider label="Dice pool" compact />

            <Textarea
                aria-label="Dice pool"
                placeholder="Resolve + Auspex"
                minRows={1}
                autosize
                maxRows={3}
                value={power.dicePool}
                onChange={(event) => update({ dicePool: event.currentTarget.value })}
                classNames={{ input: "homebrew-power-card__dice-pool-input" }}
                error={errors.dicePool}
            />

            <OrnamentalDivider label="Full description" compact />

            <Textarea
                aria-label="Full description"
                placeholder="Describe how this power works."
                minRows={5}
                autosize
                maxRows={12}
                value={power.description}
                onChange={(event) => update({ description: event.currentTarget.value })}
                classNames={{ input: "homebrew-power-card__description-input" }}
                error={errors.description}
            />

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
}

export default HomebrewPowerCardEditor
