import { NumberInput, Select, TextInput, Textarea } from "@mantine/core"
import { IconDropletFilled, IconX } from "@tabler/icons-react"
import { EditorSection, belowInput } from "~/components/HomebrewEditorFrame"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import { IconButton } from "~/components/ui/IconButtons"
import type { HomebrewItem, HomebrewPower } from "~/data/Homebrew"
import "./HomebrewPowerCardEditor.css"

type Props = {
    power: HomebrewPower
    disciplineOptions: Array<{ value: string; label: string }>
    disciplineValue: string
    onDisciplineChange: (value: string) => void
    update: (values: Partial<HomebrewItem>) => void
    errors: Partial<Record<string, string>>
}

const disciplineNameFromOption = (label: string) => label.replace(/\s+\((Official|Homebrew)\)$/, "")

/** Form fields for a Discipline power. Rendered inside `HomebrewEditorFrame`. */
const HomebrewPowerCardEditor = ({
    power,
    disciplineOptions,
    disciplineValue,
    onDisciplineChange,
    update,
    errors
}: Props) => {
    const addAmalgamPrerequisite = (value: string | null) => {
        if (!value) return
        const option = disciplineOptions.find((candidate) => candidate.value === value)
        if (!option) return

        const discipline = disciplineNameFromOption(option.label)
        if (
            power.amalgamPrerequisites.some(
                (prerequisite) => prerequisite.discipline === discipline
            )
        ) {
            return
        }
        update({
            amalgamPrerequisites: [...power.amalgamPrerequisites, { discipline, level: 1 }]
        })
    }

    return (
        <>
            <EditorSection title="Text">
                <TextInput
                    label="Name"
                    aria-label="Power name"
                    placeholder="Untitled power"
                    value={power.name}
                    maxLength={100}
                    onChange={(event) => update({ name: event.currentTarget.value })}
                    error={errors.name}
                    required
                    data-autofocus
                    data-hb-field="name"
                />
                <Textarea
                    label="Summary"
                    description="Shown in pickers and library previews."
                    inputWrapperOrder={belowInput}
                    minRows={2}
                    autosize
                    maxRows={5}
                    value={power.summary}
                    onChange={(event) => update({ summary: event.currentTarget.value })}
                    error={errors.summary}
                    data-hb-field="summary"
                />
                <Textarea
                    label="Full description"
                    placeholder="Describe how this power works."
                    minRows={4}
                    autosize
                    maxRows={12}
                    value={power.description}
                    onChange={(event) => update({ description: event.currentTarget.value })}
                    error={errors.description}
                    data-hb-field="description"
                />
            </EditorSection>

            <EditorSection title="Rules">
                <div className="hb-form-grid" data-cols="power">
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
                        data-hb-field="discipline"
                    />
                    <NumberInput
                        label="Level"
                        min={1}
                        max={5}
                        value={power.level}
                        onChange={(value) => update({ level: Number(value) || 1 })}
                        error={errors.level}
                        data-hb-field="level"
                    />
                    <NumberInput
                        label="Rouse checks"
                        min={0}
                        max={5}
                        value={power.rouseChecks}
                        leftSection={<IconDropletFilled size={15} className="hb-power__drop" />}
                        leftSectionPointerEvents="none"
                        onChange={(value) => update({ rouseChecks: Number(value) || 0 })}
                        error={errors.rouseChecks}
                        data-hb-field="rouseChecks"
                    />
                </div>
                <TextInput
                    label="Dice pool"
                    placeholder="Resolve + Auspex"
                    value={power.dicePool}
                    onChange={(event) => update({ dicePool: event.currentTarget.value })}
                    error={errors.dicePool}
                    data-hb-field="dicePool"
                />
                <div className="hb-power__amalgam" data-hb-field="amalgamPrerequisites">
                    <Select
                        label="Amalgam prerequisites"
                        aria-label="Add amalgam prerequisite"
                        description="Other Disciplines the character needs for this power."
                        inputWrapperOrder={belowInput}
                        placeholder="Add a Discipline"
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
                        classNames={homebrewDropdownClassNames}
                        error={errors.amalgamPrerequisites}
                    />
                    {power.amalgamPrerequisites.length ? (
                        <ul className="hb-power__amalgam-list">
                            {power.amalgamPrerequisites.map((prerequisite, index) => (
                                <li
                                    className="hb-power__amalgam-row"
                                    key={`${prerequisite.discipline}-${index}`}
                                >
                                    <span className="hb-power__amalgam-name">
                                        {prerequisite.discipline}
                                    </span>
                                    <NumberInput
                                        aria-label={`${prerequisite.discipline} amalgam level`}
                                        min={1}
                                        max={5}
                                        w={88}
                                        value={prerequisite.level}
                                        onChange={(value) =>
                                            update({
                                                amalgamPrerequisites:
                                                    power.amalgamPrerequisites.map(
                                                        (candidate, candidateIndex) =>
                                                            candidateIndex === index
                                                                ? {
                                                                      ...candidate,
                                                                      level: Number(value) || 1
                                                                  }
                                                                : candidate
                                                    )
                                            })
                                        }
                                        error={errors[`amalgamPrerequisites.${index}.level`]}
                                        data-hb-field={`amalgamPrerequisites.${index}.level`}
                                    />
                                    <IconButton
                                        label={`Remove ${prerequisite.discipline} prerequisite`}
                                        icon={<IconX size={15} />}
                                        onClick={() =>
                                            update({
                                                amalgamPrerequisites:
                                                    power.amalgamPrerequisites.filter(
                                                        (_, candidateIndex) =>
                                                            candidateIndex !== index
                                                    )
                                            })
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </EditorSection>
        </>
    )
}

export default HomebrewPowerCardEditor
