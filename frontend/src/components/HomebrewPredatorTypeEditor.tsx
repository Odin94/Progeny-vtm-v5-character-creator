import { meritsAndFlaws } from "~/data/MeritsAndFlaws"
import {
    Button,
    Checkbox,
    MultiSelect,
    NumberInput,
    Select,
    TagsInput,
    Textarea,
    TextInput
} from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import type {
    HomebrewDisciplineReference,
    HomebrewItem,
    HomebrewPredatorType
} from "~/data/Homebrew"
import { allSkills } from "~/data/Skills"
import { EditorSection, belowInput } from "./HomebrewEditorFrame"
import { homebrewDropdownClassNames } from "./homebrewFormControlProps"
import { DeleteIconButton, DisabledReason } from "./ui/IconButtons"

type Grant = HomebrewPredatorType["meritsAndFlaws"][number]
type Props = {
    draft: HomebrewPredatorType
    update: (values: Partial<HomebrewItem>) => void
    errors: Partial<Record<string, string>>
    disciplineOptions: Array<{ value: string; label: string }>
    encodeDisciplineReference: (reference: HomebrewDisciplineReference) => string
    decodeDisciplineReference: (value: string) => HomebrewDisciplineReference
}
const blankGrant = (): Grant => ({ name: "", summary: "", level: 1, type: "merit", excludes: [] })
const skillOptions = allSkills.map((skill) => ({
    value: skill,
    label: skill.replace(/\b\w/g, (c) => c.toUpperCase())
}))

const catalogGrants = [
    ...new Map(
        meritsAndFlaws.flatMap((category) =>
            (["merit", "flaw"] as const).flatMap((type) =>
                category[type === "merit" ? "merits" : "flaws"].map(
                    (entry) => [`${type}:${entry.name}`, { ...entry, type }] as const
                )
            )
        )
    ).entries()
]

const AddButton = ({
    children,
    onClick,
    disabled,
    limit
}: {
    children: string
    onClick: () => void
    disabled?: boolean
    /** Explains the limit when the button is disabled. */
    limit: string
}) => (
    <DisabledReason reason={disabled ? limit : undefined}>
        <Button
            variant="default"
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={onClick}
            disabled={disabled}
            className="hb-add-button"
        >
            {children}
        </Button>
    </DisabledReason>
)

const FieldError = ({ children }: { children?: string }) =>
    children ? <p className="hb-field-error">{children}</p> : null

const GrantFields = ({
    grant,
    update,
    remove,
    prefix,
    errors,
    choice = false,
    index
}: {
    grant: Grant
    update: (values: Partial<Grant>) => void
    remove: () => void
    prefix: string
    errors: Props["errors"]
    choice?: boolean
    index: number
}) => (
    <div className="hb-subform" data-hb-field={prefix}>
        <div className="hb-subform__header">
            <span className="hb-subform__title">
                {choice ? "Option" : "Grant"} {index + 1}
            </span>
            <DeleteIconButton
                size="sm"
                label={`Remove ${choice ? "option" : "grant"} ${index + 1}`}
                onClick={remove}
            />
        </div>
        <Select
            label="Existing Merit or Flaw"
            description="Choose an existing rule to fill its details, or enter your own below."
            inputWrapperOrder={belowInput}
            placeholder="Search existing Merits & Flaws"
            searchable
            clearable
            data={catalogGrants.map(([value, entry]) => ({
                value,
                label: `${entry.name} (${entry.type === "merit" ? "Merit" : "Flaw"})`
            }))}
            value={null}
            onChange={(value) => {
                const entry = catalogGrants.find(([key]) => key === value)?.[1]
                if (entry)
                    update({
                        name: entry.name,
                        summary: entry.summary,
                        excludes: [...entry.excludes],
                        type: entry.type,
                        level: Math.max(...entry.cost)
                    })
            }}
            classNames={homebrewDropdownClassNames}
        />
        <div className="hb-form-grid" data-cols="grant">
            <TextInput
                label="Merit or Flaw name"
                value={grant.name}
                onChange={(e) => update({ name: e.currentTarget.value })}
                error={errors[`${prefix}.name`]}
                required
                data-hb-field={`${prefix}.name`}
            />
            <Select
                label="Type"
                data={[
                    { value: "merit", label: "Merit" },
                    { value: "flaw", label: "Flaw" }
                ]}
                value={grant.type}
                onChange={(value) => update({ type: value as Grant["type"] })}
                classNames={homebrewDropdownClassNames}
            />
            <NumberInput
                label={choice ? "Maximum dots" : "Dots"}
                min={choice ? 1 : 0}
                max={5}
                allowDecimal={false}
                value={grant.level}
                onChange={(value) => update({ level: Number(value) })}
                error={errors[`${prefix}.${choice ? "maxLevel" : "level"}`]}
                data-hb-field={`${prefix}.${choice ? "maxLevel" : "level"}`}
            />
        </div>
        <Textarea
            label="Benefit description"
            value={grant.summary}
            onChange={(e) => update({ summary: e.currentTarget.value })}
            error={errors[`${prefix}.summary`]}
            autosize
            data-hb-field={`${prefix}.summary`}
        />
        <TagsInput
            label="Excludes"
            value={grant.excludes}
            onChange={(excludes) => update({ excludes })}
            error={errors[`${prefix}.excludes`]}
            classNames={homebrewDropdownClassNames}
            data-hb-field={`${prefix}.excludes`}
        />
    </div>
)

/** Form fields for a predator type. Rendered inside `HomebrewEditorFrame`. */
const HomebrewPredatorTypeEditor = ({
    draft,
    update,
    errors,
    disciplineOptions,
    encodeDisciplineReference,
    decodeDisciplineReference
}: Props) => {
    const specialties = draft.specialtyOptions
    const groups = draft.selectableMeritsAndFlaws
    const updateGroup = (index: number, values: Partial<(typeof groups)[number]>) =>
        update({
            selectableMeritsAndFlaws: groups.map((group, i) =>
                i === index ? { ...group, ...values } : group
            )
        })
    return (
        <>
            <EditorSection title="Text">
                <TextInput
                    label="Name"
                    aria-label="Predator type name"
                    placeholder="Untitled predator type"
                    maxLength={100}
                    value={draft.name}
                    onChange={(e) => update({ name: e.currentTarget.value })}
                    error={errors.name}
                    required
                    data-autofocus
                    data-hb-field="name"
                />
                <Textarea
                    label="Short summary"
                    description="Describe how this predator feeds."
                    inputWrapperOrder={belowInput}
                    value={draft.summary}
                    maxLength={500}
                    onChange={(e) => update({ summary: e.currentTarget.value })}
                    error={errors.summary}
                    autosize
                    minRows={2}
                    data-hb-field="summary"
                />
                <Textarea
                    label="Full description"
                    value={draft.description}
                    onChange={(e) => update({ description: e.currentTarget.value })}
                    error={errors.description}
                    autosize
                    minRows={3}
                    data-hb-field="description"
                />
            </EditorSection>

            <EditorSection title="Blood & Humanity">
                <div className="hb-form-grid" data-cols="2">
                    <NumberInput
                        label="Humanity change"
                        description="Added to starting Humanity (7)."
                        inputWrapperOrder={belowInput}
                        min={-10}
                        max={10}
                        allowDecimal={false}
                        value={draft.humanityChange}
                        onChange={(value) => update({ humanityChange: Number(value) })}
                        error={errors.humanityChange}
                        data-hb-field="humanityChange"
                    />
                    <NumberInput
                        label="Blood Potency change"
                        description="Added to the generation's starting potency."
                        inputWrapperOrder={belowInput}
                        min={-10}
                        max={10}
                        allowDecimal={false}
                        value={draft.bloodPotencyChange}
                        onChange={(value) => update({ bloodPotencyChange: Number(value) })}
                        error={errors.bloodPotencyChange}
                        data-hb-field="bloodPotencyChange"
                    />
                </div>
            </EditorSection>

            <EditorSection
                title="Specialty choices"
                description="Optional. Add choices if this predator type grants a specialty."
            >
                {specialties.map((specialty, index) => (
                    <div
                        key={index}
                        className="hb-subform"
                        data-hb-field={`specialtyOptions.${index}`}
                    >
                        <div className="hb-subform__header">
                            <span className="hb-subform__title">Specialty {index + 1}</span>
                            <DeleteIconButton
                                size="sm"
                                label={`Remove specialty ${index + 1}`}
                                onClick={() =>
                                    update({
                                        specialtyOptions: specialties.filter((_, i) => i !== index)
                                    })
                                }
                            />
                        </div>
                        <div className="hb-form-grid" data-cols="2">
                            <Select
                                label={`Specialty ${index + 1} skill`}
                                data={skillOptions}
                                searchable
                                value={specialty.skill}
                                onChange={(value) =>
                                    update({
                                        specialtyOptions: specialties.map((s, i) =>
                                            i === index
                                                ? { ...s, skill: value as typeof s.skill }
                                                : s
                                        )
                                    })
                                }
                                classNames={homebrewDropdownClassNames}
                            />
                            <TextInput
                                label={`Specialty ${index + 1} name`}
                                value={specialty.name}
                                onChange={(e) => {
                                    const name = e.currentTarget.value
                                    update({
                                        specialtyOptions: specialties.map((s, i) =>
                                            i === index ? { ...s, name } : s
                                        )
                                    })
                                }}
                                error={errors[`specialtyOptions.${index}.name`]}
                                required
                                data-hb-field={`specialtyOptions.${index}.name`}
                            />
                        </div>
                        <TextInput
                            label="Custom specialty prompt"
                            description="Optional: let the player enter their own specialty text."
                            inputWrapperOrder={belowInput}
                            value={specialty.customInput ?? ""}
                            onChange={(e) => {
                                const customInput = e.currentTarget.value || undefined
                                update({
                                    specialtyOptions: specialties.map((s, i) =>
                                        i === index ? { ...s, customInput } : s
                                    )
                                })
                            }}
                            error={errors[`specialtyOptions.${index}.customInput`]}
                            data-hb-field={`specialtyOptions.${index}.customInput`}
                        />
                    </div>
                ))}
                <FieldError>{errors.specialtyOptions}</FieldError>
                <AddButton
                    onClick={() =>
                        update({
                            specialtyOptions: [...specialties, { skill: "stealth", name: "" }]
                        })
                    }
                    disabled={specialties.length >= 10}
                    limit="A predator type can offer up to ten specialty choices."
                >
                    Add specialty choice
                </AddButton>
            </EditorSection>

            <EditorSection title="Bonus Discipline">
                <MultiSelect
                    label="Bonus Discipline choices"
                    description="The player gains one power in one of these Disciplines."
                    inputWrapperOrder={belowInput}
                    data={disciplineOptions}
                    searchable
                    value={draft.disciplineOptions.map((option) =>
                        encodeDisciplineReference({
                            ...option,
                            type: option.type ?? "official"
                        })
                    )}
                    onChange={(values) =>
                        update({ disciplineOptions: values.map(decodeDisciplineReference) })
                    }
                    error={errors.disciplineOptions}
                    classNames={homebrewDropdownClassNames}
                    data-hb-field="disciplineOptions"
                />
            </EditorSection>

            <EditorSection
                title="Skill dots"
                description="Optional extra dots, capped at a skill rating of five."
            >
                {draft.skillBonuses.map((grant, index) => (
                    <div key={index} className="hb-inline-row">
                        <Select
                            label={`Skill grant ${index + 1}`}
                            data={skillOptions.filter(
                                (option) =>
                                    option.value === grant.skill ||
                                    !draft.skillBonuses.some((g) => g.skill === option.value)
                            )}
                            searchable
                            value={grant.skill}
                            onChange={(value) =>
                                update({
                                    skillBonuses: draft.skillBonuses.map((g, i) =>
                                        i === index ? { ...g, skill: value as typeof g.skill } : g
                                    )
                                })
                            }
                            classNames={homebrewDropdownClassNames}
                        />
                        <NumberInput
                            label={`Skill dots ${index + 1}`}
                            min={1}
                            max={5}
                            allowDecimal={false}
                            value={grant.dots}
                            onChange={(value) =>
                                update({
                                    skillBonuses: draft.skillBonuses.map((g, i) =>
                                        i === index ? { ...g, dots: Number(value) } : g
                                    )
                                })
                            }
                            error={errors[`skillBonuses.${index}.dots`]}
                            data-hb-field={`skillBonuses.${index}.dots`}
                        />
                        <DeleteIconButton
                            className="hb-inline-row__remove"
                            label={`Remove skill grant ${index + 1}`}
                            onClick={() =>
                                update({
                                    skillBonuses: draft.skillBonuses.filter((_, i) => i !== index)
                                })
                            }
                        />
                    </div>
                ))}
                <AddButton
                    disabled={draft.skillBonuses.length >= allSkills.length}
                    limit="Every skill already has a grant."
                    onClick={() => {
                        const skill = allSkills.find(
                            (skill) => !draft.skillBonuses.some((g) => g.skill === skill)
                        )
                        if (skill)
                            update({
                                skillBonuses: [...draft.skillBonuses, { skill, dots: 1 }]
                            })
                    }}
                >
                    Add skill grant
                </AddButton>
            </EditorSection>

            <EditorSection title="Granted Merits & Flaws">
                {draft.meritsAndFlaws.map((grant, index) => (
                    <GrantFields
                        key={index}
                        index={index}
                        grant={grant}
                        prefix={`meritsAndFlaws.${index}`}
                        errors={errors}
                        update={(values) =>
                            update({
                                meritsAndFlaws: draft.meritsAndFlaws.map((g, i) =>
                                    i === index ? { ...g, ...values } : g
                                )
                            })
                        }
                        remove={() =>
                            update({
                                meritsAndFlaws: draft.meritsAndFlaws.filter((_, i) => i !== index)
                            })
                        }
                    />
                ))}
                <AddButton
                    disabled={draft.meritsAndFlaws.length >= 20}
                    limit="A predator type can grant up to twenty Merits and Flaws."
                    onClick={() =>
                        update({ meritsAndFlaws: [...draft.meritsAndFlaws, blankGrant()] })
                    }
                >
                    Add Merit or Flaw grant
                </AddButton>
            </EditorSection>

            <EditorSection
                title="Merit & Flaw choices"
                description="Create point budgets for the player to distribute, or an exclusive choice."
            >
                {groups.map((group, index) => (
                    <div
                        key={index}
                        className="hb-subform hb-subform--group"
                        data-hb-field={`selectableMeritsAndFlaws.${index}`}
                    >
                        <div className="hb-subform__header">
                            <span className="hb-subform__title">Choice group {index + 1}</span>
                            <DeleteIconButton
                                size="sm"
                                label={`Remove choice group ${index + 1}`}
                                onClick={() =>
                                    update({
                                        selectableMeritsAndFlaws: groups.filter(
                                            (_, i) => i !== index
                                        )
                                    })
                                }
                            />
                        </div>
                        <div className="hb-inline-row hb-inline-row--budget">
                            <NumberInput
                                label="Point budget"
                                min={1}
                                max={20}
                                allowDecimal={false}
                                value={group.totalPoints}
                                onChange={(value) =>
                                    updateGroup(index, { totalPoints: Number(value) })
                                }
                                error={errors[`selectableMeritsAndFlaws.${index}.totalPoints`]}
                                data-hb-field={`selectableMeritsAndFlaws.${index}.totalPoints`}
                            />
                            <Checkbox
                                label="Choose only one option"
                                checked={group.exclusive ?? false}
                                onChange={(e) =>
                                    updateGroup(index, { exclusive: e.currentTarget.checked })
                                }
                            />
                        </div>
                        {group.options.map((option, optionIndex) => (
                            <GrantFields
                                key={optionIndex}
                                index={optionIndex}
                                choice
                                grant={{ ...option, level: option.maxLevel }}
                                prefix={`selectableMeritsAndFlaws.${index}.options.${optionIndex}`}
                                errors={errors}
                                update={({ level, ...values }) =>
                                    updateGroup(index, {
                                        options: group.options.map((o, i) =>
                                            i === optionIndex
                                                ? {
                                                      ...o,
                                                      ...values,
                                                      ...(level !== undefined
                                                          ? { maxLevel: level }
                                                          : {})
                                                  }
                                                : o
                                        )
                                    })
                                }
                                remove={() =>
                                    updateGroup(index, {
                                        options: group.options.filter((_, i) => i !== optionIndex)
                                    })
                                }
                            />
                        ))}
                        <FieldError>
                            {errors[`selectableMeritsAndFlaws.${index}`] ??
                                errors[`selectableMeritsAndFlaws.${index}.options`]}
                        </FieldError>
                        <AddButton
                            disabled={group.options.length >= 20}
                            limit="A choice group can hold up to twenty options."
                            onClick={() => {
                                const { level, ...grant } = blankGrant()
                                updateGroup(index, {
                                    options: [...group.options, { ...grant, maxLevel: level }]
                                })
                            }}
                        >
                            Add choice option
                        </AddButton>
                    </div>
                ))}
                <AddButton
                    disabled={groups.length >= 10}
                    limit="A predator type can have up to ten choice groups."
                    onClick={() =>
                        update({
                            selectableMeritsAndFlaws: [...groups, { options: [], totalPoints: 1 }]
                        })
                    }
                >
                    Add choice group
                </AddButton>
            </EditorSection>
        </>
    )
}
export default HomebrewPredatorTypeEditor
