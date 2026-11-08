import HomebrewValidationSummary from "./HomebrewValidationSummary"
import {
    Button,
    Checkbox,
    Group,
    MultiSelect,
    NumberInput,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    TagsInput,
    Text,
    Textarea,
    TextInput
} from "@mantine/core"
import type {
    HomebrewDisciplineReference,
    HomebrewItem,
    HomebrewPredatorType
} from "~/data/Homebrew"
import { allSkills } from "~/data/Skills"
import OrnamentalDivider from "./OrnamentalDivider"
import { homebrewDropdownClassNames } from "./homebrewFormControlProps"

type Grant = HomebrewPredatorType["meritsAndFlaws"][number]
type Props = {
    isNew: boolean
    draft: HomebrewPredatorType
    update: (values: Partial<HomebrewItem>) => void
    errors: Partial<Record<string, string>>
    disciplineOptions: Array<{ value: string; label: string }>
    encodeDisciplineReference: (reference: HomebrewDisciplineReference) => string
    decodeDisciplineReference: (value: string) => HomebrewDisciplineReference
    onClose: () => void
    onSave: () => void
}
const blankGrant = (): Grant => ({ name: "", summary: "", level: 1, type: "merit", excludes: [] })
const skillOptions = allSkills.map((skill) => ({
    value: skill,
    label: skill.replace(/\b\w/g, (c) => c.toUpperCase())
}))

const GrantFields = ({
    grant,
    update,
    remove,
    prefix,
    errors,
    choice = false
}: {
    grant: Grant
    update: (values: Partial<Grant>) => void
    remove: () => void
    prefix: string
    errors: Props["errors"]
    choice?: boolean
}) => (
    <Paper withBorder p="sm" bg="rgba(0,0,0,.15)">
        <Stack gap="xs">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <TextInput
                    label="Merit or Flaw name"
                    value={grant.name}
                    onChange={(e) => update({ name: e.currentTarget.value })}
                    error={errors[`${prefix}.name`]}
                    required
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
                />
            </SimpleGrid>
            <Textarea
                label="Benefit description"
                value={grant.summary}
                onChange={(e) => update({ summary: e.currentTarget.value })}
                error={errors[`${prefix}.summary`]}
                autosize
            />
            <TagsInput
                label="Excludes"
                value={grant.excludes}
                onChange={(excludes) => update({ excludes })}
                error={errors[`${prefix}.excludes`]}
                classNames={homebrewDropdownClassNames}
            />
            <Button variant="subtle" color="red" size="xs" onClick={remove}>
                Remove {choice ? "option" : "grant"}
            </Button>
        </Stack>
    </Paper>
)

const HomebrewPredatorTypeEditor = ({
    isNew,
    draft,
    update,
    errors,
    disciplineOptions,
    encodeDisciplineReference,
    decodeDisciplineReference,
    onClose,
    onSave
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
        <div className="homebrew-loresheet__shell">
            <article className="homebrew-loresheet__sheet homebrew-predator__editor">
                <header className="homebrew-loresheet__header">
                    <TextInput
                        aria-label="Predator type name"
                        placeholder="Untitled predator type"
                        maxLength={100}
                        value={draft.name}
                        onChange={(e) => update({ name: e.currentTarget.value })}
                        error={errors.name}
                        classNames={{ input: "homebrew-loresheet__title-input" }}
                    />
                    <Text size="xs" className="homebrew-loresheet__eyebrow">
                        {isNew ? "New" : "Edit"} Homebrew Predator Type
                    </Text>
                </header>
                <section className="homebrew-loresheet__intro">
                    <Stack gap="sm">
                        <Textarea
                            label="Short summary"
                            description="Describe how this predator feeds."
                            value={draft.summary}
                            maxLength={500}
                            onChange={(e) => update({ summary: e.currentTarget.value })}
                            error={errors.summary}
                            autosize
                            minRows={2}
                        />
                        <Textarea
                            label="Full description"
                            value={draft.description}
                            onChange={(e) => update({ description: e.currentTarget.value })}
                            error={errors.description}
                            autosize
                            minRows={4}
                        />
                    </Stack>
                    <Stack gap="sm" className="homebrew-loresheet__details">
                        <Text className="homebrew-loresheet__tier-title">Blood & Humanity</Text>
                        <NumberInput
                            label="Humanity change"
                            description="Added to starting Humanity (7)."
                            min={-10}
                            max={10}
                            allowDecimal={false}
                            value={draft.humanityChange}
                            onChange={(value) => update({ humanityChange: Number(value) })}
                            error={errors.humanityChange}
                        />
                        <NumberInput
                            label="Blood Potency change"
                            description="Added to the generation's starting potency."
                            min={-10}
                            max={10}
                            allowDecimal={false}
                            value={draft.bloodPotencyChange}
                            onChange={(value) => update({ bloodPotencyChange: Number(value) })}
                            error={errors.bloodPotencyChange}
                        />
                    </Stack>
                </section>
                <OrnamentalDivider label="The Hunt" />
                <Stack gap="lg">
                    <section>
                        <Text className="homebrew-loresheet__tier-title" mb="sm">
                            Specialty choices
                        </Text>
                        <Text size="sm" c="dimmed" mb="sm">
                            The player chooses one specialty. Add at least one option.
                        </Text>
                        <Stack gap="sm">
                            {specialties.map((specialty, index) => (
                                <Paper key={index} withBorder p="sm" bg="rgba(0,0,0,.15)">
                                    <Stack gap="xs">
                                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                            <Select
                                                label={`Specialty ${index + 1} skill`}
                                                data={skillOptions}
                                                searchable
                                                value={specialty.skill}
                                                onChange={(value) =>
                                                    update({
                                                        specialtyOptions: specialties.map((s, i) =>
                                                            i === index
                                                                ? {
                                                                      ...s,
                                                                      skill: value as typeof s.skill
                                                                  }
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
                                            />
                                        </SimpleGrid>
                                        <TextInput
                                            label="Custom specialty prompt"
                                            description="Optional: let the player enter their own specialty text."
                                            value={specialty.customInput ?? ""}
                                            onChange={(e) => {
                                                const customInput =
                                                    e.currentTarget.value || undefined
                                                update({
                                                    specialtyOptions: specialties.map((s, i) =>
                                                        i === index ? { ...s, customInput } : s
                                                    )
                                                })
                                            }}
                                            error={errors[`specialtyOptions.${index}.customInput`]}
                                        />
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="red"
                                            onClick={() =>
                                                update({
                                                    specialtyOptions: specialties.filter(
                                                        (_, i) => i !== index
                                                    )
                                                })
                                            }
                                        >
                                            Remove specialty
                                        </Button>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                        <Text c="red" size="sm">
                            {errors.specialtyOptions}
                        </Text>
                        <Button
                            mt="sm"
                            variant="light"
                            color="grape"
                            onClick={() =>
                                update({
                                    specialtyOptions: [
                                        ...specialties,
                                        { skill: "stealth", name: "" }
                                    ]
                                })
                            }
                            disabled={specialties.length >= 10}
                        >
                            Add specialty choice
                        </Button>
                    </section>
                    <MultiSelect
                        label="Bonus Discipline choices"
                        description="The player gains one power in one of these Disciplines."
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
                    />
                    <section>
                        <Text className="homebrew-loresheet__tier-title" mb="sm">
                            Skill dots
                        </Text>
                        <Text size="sm" c="dimmed" mb="sm">
                            Optional extra dots, capped at a skill rating of five.
                        </Text>
                        <Stack gap="sm">
                            {draft.skillBonuses.map((grant, index) => (
                                <Group key={index} align="flex-end" wrap="wrap">
                                    <Select
                                        label={`Skill grant ${index + 1}`}
                                        data={skillOptions.filter(
                                            (option) =>
                                                option.value === grant.skill ||
                                                !draft.skillBonuses.some(
                                                    (g) => g.skill === option.value
                                                )
                                        )}
                                        searchable
                                        value={grant.skill}
                                        onChange={(value) =>
                                            update({
                                                skillBonuses: draft.skillBonuses.map((g, i) =>
                                                    i === index
                                                        ? { ...g, skill: value as typeof g.skill }
                                                        : g
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
                                    />
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        onClick={() =>
                                            update({
                                                skillBonuses: draft.skillBonuses.filter(
                                                    (_, i) => i !== index
                                                )
                                            })
                                        }
                                    >
                                        Remove skill
                                    </Button>
                                </Group>
                            ))}
                        </Stack>
                        <Button
                            mt="sm"
                            variant="light"
                            color="grape"
                            disabled={draft.skillBonuses.length >= allSkills.length}
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
                        </Button>
                    </section>
                </Stack>
                <OrnamentalDivider label="Gifts & Costs" />
                <Stack gap="lg">
                    <section>
                        <Text className="homebrew-loresheet__tier-title" mb="sm">
                            Granted Merits & Flaws
                        </Text>
                        <Stack gap="sm">
                            {draft.meritsAndFlaws.map((grant, index) => (
                                <GrantFields
                                    key={index}
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
                                            meritsAndFlaws: draft.meritsAndFlaws.filter(
                                                (_, i) => i !== index
                                            )
                                        })
                                    }
                                />
                            ))}
                        </Stack>
                        <Button
                            mt="sm"
                            variant="light"
                            color="grape"
                            disabled={draft.meritsAndFlaws.length >= 20}
                            onClick={() =>
                                update({ meritsAndFlaws: [...draft.meritsAndFlaws, blankGrant()] })
                            }
                        >
                            Add Merit or Flaw grant
                        </Button>
                    </section>
                    <section>
                        <Text className="homebrew-loresheet__tier-title" mb="sm">
                            Merit & Flaw choices
                        </Text>
                        <Text size="sm" c="dimmed" mb="sm">
                            Create point budgets for the player to distribute, or an exclusive
                            choice.
                        </Text>
                        <Stack gap="md">
                            {groups.map((group, index) => (
                                <Paper key={index} withBorder p="md" bg="rgba(0,0,0,.15)">
                                    <Stack gap="sm">
                                        <Text fw={700}>Choice group {index + 1}</Text>
                                        <NumberInput
                                            label="Point budget"
                                            min={1}
                                            max={20}
                                            allowDecimal={false}
                                            value={group.totalPoints}
                                            onChange={(value) =>
                                                updateGroup(index, { totalPoints: Number(value) })
                                            }
                                            error={
                                                errors[
                                                    `selectableMeritsAndFlaws.${index}.totalPoints`
                                                ]
                                            }
                                        />
                                        <Checkbox
                                            label="Choose only one option"
                                            checked={group.exclusive ?? false}
                                            onChange={(e) =>
                                                updateGroup(index, {
                                                    exclusive: e.currentTarget.checked
                                                })
                                            }
                                        />
                                        {group.options.map((option, optionIndex) => (
                                            <GrantFields
                                                key={optionIndex}
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
                                                        options: group.options.filter(
                                                            (_, i) => i !== optionIndex
                                                        )
                                                    })
                                                }
                                            />
                                        ))}
                                        <Text c="red" size="sm">
                                            {errors[`selectableMeritsAndFlaws.${index}`] ??
                                                errors[`selectableMeritsAndFlaws.${index}.options`]}
                                        </Text>
                                        <Group justify="space-between">
                                            <Button
                                                variant="light"
                                                color="grape"
                                                disabled={group.options.length >= 20}
                                                onClick={() => {
                                                    const { level, ...grant } = blankGrant()
                                                    updateGroup(index, {
                                                        options: [
                                                            ...group.options,
                                                            { ...grant, maxLevel: level }
                                                        ]
                                                    })
                                                }}
                                            >
                                                Add choice option
                                            </Button>
                                            <Button
                                                variant="subtle"
                                                color="red"
                                                onClick={() =>
                                                    update({
                                                        selectableMeritsAndFlaws: groups.filter(
                                                            (_, i) => i !== index
                                                        )
                                                    })
                                                }
                                            >
                                                Remove group
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                        <Button
                            mt="sm"
                            variant="light"
                            color="grape"
                            disabled={groups.length >= 10}
                            onClick={() =>
                                update({
                                    selectableMeritsAndFlaws: [
                                        ...groups,
                                        { options: [], totalPoints: 1 }
                                    ]
                                })
                            }
                        >
                            Add choice group
                        </Button>
                    </section>
                </Stack>
                <HomebrewValidationSummary errors={errors} />
                <footer className="homebrew-loresheet__footer">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="red" variant="outline" onClick={onSave}>
                        Save predator type
                    </Button>
                </footer>
            </article>
        </div>
    )
}
export default HomebrewPredatorTypeEditor
