import {
    Button,
    Group,
    Modal,
    MultiSelect,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea
} from "@mantine/core"
import { useEffect, useState } from "react"
import HomebrewPowerCardEditor from "~/components/HomebrewPowerCardEditor"
import OrnamentalDivider from "~/components/OrnamentalDivider"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import type {
    HomebrewClan,
    HomebrewDiscipline,
    HomebrewDisciplineReference,
    HomebrewItem,
    HomebrewLoresheet,
    HomebrewMeritFlaw,
    HomebrewPower
} from "~/data/Homebrew"
import { homebrewKindLabel } from "~/data/Homebrew"
import { disciplines } from "~/data/Disciplines"
import "./HomebrewItemEditor.css"

type Props = {
    opened: boolean
    item: HomebrewItem
    collectionItems: HomebrewItem[]
    onClose: () => void
    onSave: (item: HomebrewItem) => void
}

type FieldErrors = Partial<Record<string, string>>

const HomebrewItemEditor = ({ opened, item, collectionItems, onClose, onSave }: Props) => {
    const [draft, setDraft] = useState(item)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    useEffect(() => {
        if (opened) {
            setDraft(item)
            setFieldErrors({})
        }
    }, [item, opened])

    const update = (values: Partial<HomebrewItem>) =>
        setDraft((current) => ({ ...current, ...values }) as HomebrewItem)

    const homebrewDisciplines = collectionItems.filter(
        (candidate): candidate is HomebrewDiscipline & { id: string } =>
            candidate.kind === "discipline" && !!candidate.id
    )
    const disciplineOptions = [
        ...Object.keys(disciplines)
            .filter(Boolean)
            .map((name) => ({
                value: `official:${name}`,
                label: `${name} (Official)`
            })),
        ...homebrewDisciplines.map((discipline) => ({
            value: `homebrew:${discipline.id}`,
            label: `${discipline.name} (Homebrew)`
        }))
    ]

    const decodeDisciplineReference = (value: string): HomebrewDisciplineReference => {
        const [type, identifier] = value.split(":", 2)
        if (type === "homebrew") {
            const discipline = homebrewDisciplines.find((candidate) => candidate.id === identifier)
            return { type, itemId: identifier, name: discipline?.name ?? "" }
        }
        return { type: "official", name: identifier ?? "" }
    }

    const encodeDisciplineReference = (reference: HomebrewDisciplineReference) =>
        reference.type === "homebrew"
            ? `homebrew:${reference.itemId ?? ""}`
            : `official:${reference.name}`

    const validate = (): FieldErrors => {
        const errors: FieldErrors = {}
        const addError = (field: string, message: string) => {
            if (!errors[field]) errors[field] = message
        }
        const validateLength = (field: string, value: string, maximum: number) => {
            if (value.trim().length > maximum) addError(field, `Use ${maximum} characters or fewer.`)
        }
        const validLogo = (value: string) => {
            if (!value.trim()) return true
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        }

        if (!draft.name.trim()) addError("name", "Name is required.")
        validateLength("name", draft.name, 100)

        if ("summary" in draft) validateLength("summary", draft.summary, 500)
        if ("description" in draft) validateLength("description", draft.description, 20_000)
        if ("logo" in draft && !validLogo(draft.logo)) addError("logo", "Enter a valid URL or leave this empty.")
        if ("logo" in draft) validateLength("logo", draft.logo, 2_000)

        if (["power", "ritual", "ceremony", "formula"].includes(draft.kind)) {
            const power = draft as HomebrewPower
            if (!power.discipline.trim()) addError("discipline", "Choose a Discipline.")
            validateLength("discipline", power.discipline, 100)
            if (!Number.isInteger(power.level) || power.level < 1 || power.level > 5) {
                addError("level", "Choose a level from 1 to 5.")
            }
            if (!Number.isInteger(power.rouseChecks) || power.rouseChecks < 0 || power.rouseChecks > 5) {
                addError("rouseChecks", "Use a value from 0 to 5.")
            }
            validateLength("dicePool", power.dicePool, 250)
            if (power.amalgamPrerequisites.length > 5) {
                addError("amalgamPrerequisites", "Choose at most five amalgam prerequisites.")
            }
            power.amalgamPrerequisites.forEach((prerequisite, index) => {
                if (!prerequisite.discipline.trim()) {
                    addError(`amalgamPrerequisites.${index}.discipline`, "Choose a Discipline.")
                }
                if (!Number.isInteger(prerequisite.level) || prerequisite.level < 1 || prerequisite.level > 5) {
                    addError(`amalgamPrerequisites.${index}.level`, "Use a level from 1 to 5.")
                }
            })
            if (power.disciplineRef?.type === "homebrew") {
                const isAvailable = homebrewDisciplines.some(
                    (discipline) => discipline.id === power.disciplineRef?.itemId
                )
                if (!isAvailable) {
                    addError(
                        "discipline",
                        "This Homebrew Discipline must target an item in this collection."
                    )
                }
            }
            if (power.kind !== "power") {
                validateLength("requiredTime", power.requiredTime ?? "", 500)
                validateLength("ingredients", power.ingredients ?? "", 2_000)
            }
            if (power.kind === "ceremony" && (power.prerequisitePowers?.length ?? 0) > 10) {
                addError("prerequisitePowers", "Choose at most ten prerequisite powers.")
            }
        }

        if (draft.kind === "merit" || draft.kind === "flaw") {
            if (!draft.costs.length) addError("costs", "Add at least one dot cost.")
            if (draft.costs.length > 5 || draft.costs.some((cost) => !Number.isInteger(cost) || cost < 1 || cost > 5)) {
                addError("costs", "Use up to five whole-number costs from 1 to 5.")
            }
            if (draft.excludes.length > 20 || draft.excludes.some((value) => !value.trim() || value.trim().length > 100)) {
                addError("excludes", "Use up to twenty names of 100 characters or fewer.")
            }
        }

        if (draft.kind === "loresheet") {
            validateLength("source", draft.source, 200)
            validateLength("requirements", draft.requirements, 2_000)
            if (draft.tiers.length !== 5 || new Set(draft.tiers.map((tier) => tier.level)).size !== 5) {
                addError("tiers", "Add one unique tier for each level from 1 to 5.")
            }
            draft.tiers.forEach((tier, index) => {
                if (!tier.name.trim()) addError(`tiers.${index}.name`, "A level name is required.")
                validateLength(`tiers.${index}.name`, tier.name, 100)
                if (!tier.summary.trim()) addError(`tiers.${index}.summary`, "Describe this benefit.")
                validateLength(`tiers.${index}.summary`, tier.summary, 2_000)
            })
        }

        if (draft.kind === "clan") {
            if (!draft.bane.trim()) addError("bane", "A bane is required.")
            if (!draft.compulsion.trim()) addError("compulsion", "A compulsion is required.")
            validateLength("bane", draft.bane, 5_000)
            validateLength("compulsion", draft.compulsion, 5_000)
            if (!draft.nativeDisciplines.length) addError("nativeDisciplines", "Choose at least one native Discipline.")
            if (draft.nativeDisciplines.length > 5) addError("nativeDisciplines", "Choose at most five native Disciplines.")
            if (draft.nativeDisciplineRefs?.some(
                (reference) =>
                    reference.type === "homebrew" &&
                    !homebrewDisciplines.some((discipline) => discipline.id === reference.itemId)
            )) {
                addError(
                    "nativeDisciplines",
                    "Each Homebrew Discipline must target an item in this collection."
                )
            }
            if (draft.excludedPredatorTypes.length > 30) {
                addError("excludedPredatorTypes", "Choose at most thirty predator types.")
            }
            if (draft.excludedMeritsAndFlaws.length > 50) {
                addError("excludedMeritsAndFlaws", "Choose at most fifty merits and flaws.")
            }
        }

        return errors
    }

    const save = () => {
        const errors = validate()
        setFieldErrors(errors)
        if (Object.keys(errors).length) return

        const normalizedDraft =
            draft.kind === "ritual"
                ? {
                      ...draft,
                      discipline: "blood sorcery",
                      disciplineRef: { type: "official" as const, name: "blood sorcery" }
                  }
                : draft.kind === "ceremony"
                  ? {
                        ...draft,
                        discipline: "oblivion",
                        disciplineRef: { type: "official" as const, name: "oblivion" }
                    }
                  : draft
        onSave(normalizedDraft)
    }

    const commonFields = (
        <>
            <TextInput
                label="Name"
                value={draft.name}
                maxLength={100}
                onChange={(event) => update({ name: event.currentTarget.value })}
                error={fieldErrors.name}
                required
            />
            {draft.kind === "merit" || draft.kind === "flaw" ? (
                <Textarea
                    label="Description"
                    description="Shown on the character sheet and in pickers."
                    minRows={3}
                    autosize
                    maxRows={10}
                    value={draft.summary}
                    onChange={(event) => update({ summary: event.currentTarget.value })}
                    error={fieldErrors.summary}
                />
            ) : "summary" in draft ? (
                <TextInput
                    label="Short summary"
                    description="Shown in pickers and library previews."
                    value={draft.summary}
                    maxLength={500}
                    onChange={(event) => update({ summary: event.currentTarget.value })}
                    error={fieldErrors.summary}
                />
            ) : null}
            {"description" in draft && draft.kind !== "merit" && draft.kind !== "flaw" ? (
                <Textarea
                    label="Full description"
                    minRows={3}
                    autosize
                    maxRows={10}
                    value={draft.description}
                    onChange={(event) => update({ description: event.currentTarget.value })}
                    error={fieldErrors.description}
                />
            ) : null}
        </>
    )

    const powerFields = ["ritual", "ceremony", "formula"].includes(draft.kind)
        ? (() => {
              const power = draft as HomebrewPower
              return (
                  <>
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                          <Select
                              label="Discipline"
                              description={
                                  power.kind === "ritual"
                                      ? "Rituals belong to Blood Sorcery."
                                      : power.kind === "ceremony"
                                        ? "Ceremonies belong to Oblivion."
                                        : "Official or Homebrew Discipline name."
                              }
                              data={disciplineOptions}
                              searchable
                              value={encodeDisciplineReference(
                                  power.disciplineRef ?? {
                                      type: "official",
                                      name: power.discipline
                                  }
                              )}
                              disabled={power.kind === "ritual" || power.kind === "ceremony"}
                              onChange={(value) => {
                                  if (!value) return
                                  const disciplineRef = decodeDisciplineReference(value)
                                  update({ discipline: disciplineRef.name, disciplineRef })
                              }}
                              classNames={homebrewDropdownClassNames}
                              error={fieldErrors.discipline}
                              required
                          />
                          <NumberInput
                              label="Level"
                              min={1}
                              max={5}
                              value={power.level}
                              onChange={(value) => update({ level: Number(value) || 1 })}
                              error={fieldErrors.level}
                          />
                          <TextInput
                              label="Dice pool"
                              placeholder="Resolve + Auspex"
                              value={power.dicePool}
                              onChange={(event) => update({ dicePool: event.currentTarget.value })}
                              error={fieldErrors.dicePool}
                          />
                          <NumberInput
                              label="Rouse checks"
                              min={0}
                              max={5}
                              value={power.rouseChecks}
                              onChange={(value) => update({ rouseChecks: Number(value) || 0 })}
                              error={fieldErrors.rouseChecks}
                          />
                      </SimpleGrid>
                      <TextInput
                          label="Amalgam prerequisites"
                          description="Comma-separated, for example: Celerity 2, Potence 1."
                          value={power.amalgamPrerequisites
                              .map(
                                  (prerequisite) =>
                                      `${prerequisite.discipline} ${prerequisite.level}`
                              )
                              .join(", ")}
                          onChange={(event) =>
                              update({
                                  amalgamPrerequisites: event.currentTarget.value
                                      .split(",")
                                      .map((part) => part.trim().match(/^(.*)\s+([1-5])$/))
                                      .filter((match): match is RegExpMatchArray => !!match)
                                      .map((match) => ({
                                          discipline: match[1].trim(),
                                          level: Number(match[2])
                                      }))
                              })
                          }
                          error={fieldErrors.amalgamPrerequisites}
                      />
                      {power.kind !== "power" ? (
                          <SimpleGrid cols={{ base: 1, sm: 2 }}>
                              <TextInput
                                  label="Required time"
                                  value={power.requiredTime ?? ""}
                                  onChange={(event) =>
                                      update({ requiredTime: event.currentTarget.value })
                                  }
                                  error={fieldErrors.requiredTime}
                              />
                              <Textarea
                                  label="Ingredients"
                                  value={power.ingredients ?? ""}
                                  onChange={(event) =>
                                      update({ ingredients: event.currentTarget.value })
                                  }
                                  error={fieldErrors.ingredients}
                              />
                          </SimpleGrid>
                      ) : null}
                      {power.kind === "ceremony" ? (
                          <TagsInput
                              label="Prerequisite Powers"
                              description="The character must know at least one of these Oblivion Powers. Leave empty for none."
                              value={power.prerequisitePowers ?? []}
                              onChange={(prerequisitePowers) => update({ prerequisitePowers })}
                              classNames={homebrewDropdownClassNames}
                              error={fieldErrors.prerequisitePowers}
                          />
                      ) : null}
                  </>
              )
          })()
        : null

    if (draft.kind === "loresheet") {
        return (
            <Modal
                opened={opened}
                onClose={onClose}
                centered
                size="xl"
                withCloseButton={false}
                classNames={{
                    content: "homebrew-loresheet__modal",
                    body: "homebrew-loresheet__modal-body"
                }}
            >
                <LoresheetEditor
                    draft={draft}
                    update={update}
                    errors={fieldErrors}
                    onClose={onClose}
                    onSave={save}
                />
            </Modal>
        )
    }

    if (draft.kind === "power") {
        const power = draft as HomebrewPower
        return (
            <HomebrewPowerCardEditor
                opened={opened}
                power={power}
                disciplineOptions={disciplineOptions}
                disciplineValue={encodeDisciplineReference(
                    power.disciplineRef ?? {
                        type: "official",
                        name: power.discipline
                    }
                )}
                onDisciplineChange={(value) => {
                    const disciplineRef = decodeDisciplineReference(value)
                    update({ discipline: disciplineRef.name, disciplineRef })
                }}
                update={update}
                errors={fieldErrors}
                onClose={onClose}
                onSave={save}
            />
        )
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`${item.id ? "Edit" : "Add"} ${homebrewKindLabel(item.kind)}`}
            size="lg"
            classNames={{
                content: "homebrew-rule-modal",
                header: "homebrew-rule-modal__header",
                body: "homebrew-rule-modal__body"
            }}
        >
            <Stack gap="md" className="homebrew-form-controls">
                {commonFields}
                {"logo" in draft ? (
                    <TextInput
                        label="Logo URL"
                        description="Optional HTTPS image URL. A standard icon is used when empty."
                        value={draft.logo}
                        onChange={(event) => update({ logo: event.currentTarget.value })}
                        error={fieldErrors.logo}
                    />
                ) : null}
                {powerFields}
                {draft.kind === "merit" || draft.kind === "flaw" ? (
                    <MeritFlawFields draft={draft} update={update} errors={fieldErrors} />
                ) : null}
                {draft.kind === "clan" ? (
                    <ClanFields
                        draft={draft}
                        update={update}
                        disciplineOptions={disciplineOptions}
                        encodeDisciplineReference={encodeDisciplineReference}
                        decodeDisciplineReference={decodeDisciplineReference}
                        errors={fieldErrors}
                    />
                ) : null}
                <Group justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="grape" onClick={save}>
                        Save item
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

const MeritFlawFields = ({
    draft,
    update,
    errors
}: {
    draft: HomebrewMeritFlaw
    update: (values: Partial<HomebrewItem>) => void
    errors: FieldErrors
}) => (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TagsInput
            label="Dot costs"
            description="One or more values from 1 to 5."
            value={draft.costs.map(String)}
            onChange={(values) =>
                update({
                    costs: [
                        ...new Set(values.map(Number).filter((value) => value >= 1 && value <= 5))
                    ]
                })
            }
            classNames={homebrewDropdownClassNames}
            error={errors.costs}
        />
        <TagsInput
            label="Excludes"
            description="Merits or Flaws that cannot be combined with this item."
            value={draft.excludes}
            onChange={(excludes) => update({ excludes })}
            classNames={homebrewDropdownClassNames}
            error={errors.excludes}
        />
    </SimpleGrid>
)

const ClanFields = ({
    draft,
    update,
    disciplineOptions,
    encodeDisciplineReference,
    decodeDisciplineReference,
    errors
}: {
    draft: HomebrewClan
    update: (values: Partial<HomebrewItem>) => void
    disciplineOptions: Array<{ value: string; label: string }>
    encodeDisciplineReference: (reference: HomebrewDisciplineReference) => string
    decodeDisciplineReference: (value: string) => HomebrewDisciplineReference
    errors: FieldErrors
}) => (
    <>
        <Textarea
            label="Bane"
            minRows={2}
            value={draft.bane}
            onChange={(event) => update({ bane: event.currentTarget.value })}
            error={errors.bane}
            required
        />
        <Textarea
            label="Compulsion"
            minRows={2}
            value={draft.compulsion}
            onChange={(event) => update({ compulsion: event.currentTarget.value })}
            error={errors.compulsion}
            required
        />
        <MultiSelect
            label="Native Disciplines"
            description="Official and Homebrew Disciplines are both supported."
            data={disciplineOptions}
            searchable
            value={(
                draft.nativeDisciplineRefs ??
                draft.nativeDisciplines.map((name) => ({ type: "official" as const, name }))
            ).map(encodeDisciplineReference)}
            onChange={(values) => {
                const nativeDisciplineRefs = values.map(decodeDisciplineReference)
                update({
                    nativeDisciplineRefs,
                    nativeDisciplines: nativeDisciplineRefs.map((reference) => reference.name)
                })
            }}
            classNames={homebrewDropdownClassNames}
            error={errors.nativeDisciplines}
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TagsInput
                label="Excluded predator types"
                value={draft.excludedPredatorTypes}
                onChange={(excludedPredatorTypes) => update({ excludedPredatorTypes })}
                classNames={homebrewDropdownClassNames}
                error={errors.excludedPredatorTypes}
            />
            <TagsInput
                label="Excluded Merits & Flaws"
                value={draft.excludedMeritsAndFlaws}
                onChange={(excludedMeritsAndFlaws) => update({ excludedMeritsAndFlaws })}
                classNames={homebrewDropdownClassNames}
                error={errors.excludedMeritsAndFlaws}
            />
        </SimpleGrid>
    </>
)

const LoresheetEditor = ({
    draft,
    update,
    errors,
    onClose,
    onSave
}: {
    draft: HomebrewLoresheet
    update: (values: Partial<HomebrewItem>) => void
    errors: FieldErrors
    onClose: () => void
    onSave: () => void
}) => {
    const updateTier = (index: number, values: Partial<HomebrewLoresheet["tiers"][number]>) => {
        const tiers = [...draft.tiers]
        tiers[index] = { ...tiers[index], ...values }
        update({ tiers })
    }

    return (
        <div className="homebrew-loresheet__shell">
            <article className="homebrew-loresheet__sheet">
                <header className="homebrew-loresheet__header">
                    <TextInput
                        aria-label="Loresheet name"
                        placeholder="Untitled loresheet"
                        value={draft.name}
                        maxLength={100}
                        onChange={(event) => update({ name: event.currentTarget.value })}
                        classNames={{ input: "homebrew-loresheet__title-input" }}
                        error={errors.name}
                    />
                    <Text size="xs" className="homebrew-loresheet__eyebrow">
                        {draft.id ? "Edit Homebrew Loresheet" : "New Homebrew Loresheet"}
                    </Text>
                </header>

                <section className="homebrew-loresheet__intro">
                    <Stack gap="sm">
                        <Textarea
                            label="Short summary"
                            description="Shown in pickers and library previews."
                            minRows={2}
                            autosize
                            maxRows={5}
                            value={draft.summary}
                            onChange={(event) => update({ summary: event.currentTarget.value })}
                            error={errors.summary}
                        />
                        <Textarea
                            label="Full description"
                            minRows={5}
                            autosize
                            maxRows={12}
                            value={draft.description}
                            onChange={(event) => update({ description: event.currentTarget.value })}
                            error={errors.description}
                        />
                    </Stack>
                    <Stack gap="sm" className="homebrew-loresheet__details">
                        <TextInput
                            label="Source label"
                            value={draft.source}
                            onChange={(event) => update({ source: event.currentTarget.value })}
                            error={errors.source}
                        />
                        <Textarea
                            label="Requirements"
                            description="Displayed as guidance; not automatically enforced."
                            minRows={4}
                            value={draft.requirements}
                            onChange={(event) =>
                                update({ requirements: event.currentTarget.value })
                            }
                            error={errors.requirements}
                        />
                    </Stack>
                </section>

                <OrnamentalDivider label="Lore" />

                <section className="homebrew-loresheet__tiers" aria-label="Loresheet levels">
                    {draft.tiers.map((tier, index) => (
                        <div className="homebrew-loresheet__tier" key={tier.level}>
                            <div className="homebrew-loresheet__tier-heading">
                                <Text
                                    className="homebrew-loresheet__dots"
                                    aria-label={`Level ${tier.level}`}
                                >
                                    {"●".repeat(tier.level)}
                                </Text>
                                <TextInput
                                    aria-label={`Level ${tier.level} name`}
                                    placeholder={`Level ${tier.level} name`}
                                    value={tier.name}
                                    onChange={(event) =>
                                        updateTier(index, { name: event.currentTarget.value })
                                    }
                                    classNames={{ input: "homebrew-loresheet__tier-name" }}
                                    error={errors[`tiers.${index}.name`]}
                                />
                            </div>
                            <Textarea
                                aria-label={`Level ${tier.level} summary`}
                                placeholder="Describe this benefit"
                                minRows={5}
                                autosize
                                value={tier.summary}
                                onChange={(event) =>
                                    updateTier(index, { summary: event.currentTarget.value })
                                }
                                classNames={{ input: "homebrew-loresheet__tier-summary" }}
                                error={errors[`tiers.${index}.summary`]}
                            />
                        </div>
                    ))}
                </section>

                {errors.tiers ? <Text c="red" size="sm">{errors.tiers}</Text> : null}
                <footer className="homebrew-loresheet__footer">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="red" variant="outline" onClick={onSave}>
                        Save loresheet
                    </Button>
                </footer>
            </article>
        </div>
    )
}

export default HomebrewItemEditor
