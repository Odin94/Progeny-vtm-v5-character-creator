import {
    Alert,
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
import ornamentalDivider from "~/assets/ornamental-divider.svg"
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

const HomebrewItemEditor = ({ opened, item, collectionItems, onClose, onSave }: Props) => {
    const [draft, setDraft] = useState(item)
    const [error, setError] = useState("")

    useEffect(() => {
        if (opened) {
            setDraft(item)
            setError("")
        }
    }, [item, opened])

    const update = (values: Partial<HomebrewItem>) =>
        setDraft((current) => ({ ...current, ...values }) as HomebrewItem)

    const homebrewDisciplines = collectionItems.filter(
        (candidate): candidate is HomebrewDiscipline & { id: string } =>
            candidate.kind === "discipline" && !!candidate.id
    )
    const disciplineOptions = [
        ...Object.keys(disciplines).map((name) => ({
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

    const save = () => {
        if (!draft.name.trim()) {
            setError("Name is required.")
            return
        }
        if (draft.kind === "clan" && (!draft.bane.trim() || !draft.compulsion.trim())) {
            setError("A Clan needs both a bane and a compulsion.")
            return
        }
        if (draft.kind === "loresheet" && draft.tiers.some((tier) => !tier.name.trim())) {
            setError("Each loresheet level needs a name.")
            return
        }
        if (["power", "ritual", "ceremony", "formula"].includes(draft.kind)) {
            const power = draft as HomebrewPower
            if (!power.discipline.trim()) {
                setError("Choose the official or homebrew Discipline this belongs to.")
                return
            }
        }
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
                />
            ) : "summary" in draft ? (
                <TextInput
                    label="Short summary"
                    description="Shown in pickers and library previews."
                    value={draft.summary}
                    maxLength={500}
                    onChange={(event) => update({ summary: event.currentTarget.value })}
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
                />
            ) : null}
        </>
    )

    const powerFields = ["power", "ritual", "ceremony", "formula"].includes(draft.kind)
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
                              required
                          />
                          <NumberInput
                              label="Level"
                              min={1}
                              max={5}
                              value={power.level}
                              onChange={(value) => update({ level: Number(value) || 1 })}
                          />
                          <TextInput
                              label="Dice pool"
                              placeholder="Resolve + Auspex"
                              value={power.dicePool}
                              onChange={(event) => update({ dicePool: event.currentTarget.value })}
                          />
                          <NumberInput
                              label="Rouse checks"
                              min={0}
                              max={5}
                              value={power.rouseChecks}
                              onChange={(value) => update({ rouseChecks: Number(value) || 0 })}
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
                      />
                      {power.kind !== "power" ? (
                          <SimpleGrid cols={{ base: 1, sm: 2 }}>
                              <TextInput
                                  label="Required time"
                                  value={power.requiredTime ?? ""}
                                  onChange={(event) =>
                                      update({ requiredTime: event.currentTarget.value })
                                  }
                              />
                              <Textarea
                                  label="Ingredients"
                                  value={power.ingredients ?? ""}
                                  onChange={(event) =>
                                      update({ ingredients: event.currentTarget.value })
                                  }
                              />
                          </SimpleGrid>
                      ) : null}
                      {power.kind === "ceremony" ? (
                          <TagsInput
                              label="Prerequisite Powers"
                              description="The character must know at least one of these Oblivion Powers. Leave empty for none."
                              value={power.prerequisitePowers ?? []}
                              onChange={(prerequisitePowers) => update({ prerequisitePowers })}
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
                    error={error}
                    onClose={onClose}
                    onSave={save}
                />
            </Modal>
        )
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`${item.id ? "Edit" : "Add"} ${homebrewKindLabel(item.kind)}`}
            size="lg"
        >
            <Stack gap="md">
                {commonFields}
                {"logo" in draft ? (
                    <TextInput
                        label="Logo URL"
                        description="Optional HTTPS image URL. A standard icon is used when empty."
                        value={draft.logo}
                        onChange={(event) => update({ logo: event.currentTarget.value })}
                    />
                ) : null}
                {powerFields}
                {draft.kind === "merit" || draft.kind === "flaw" ? (
                    <MeritFlawFields draft={draft} update={update} />
                ) : null}
                {draft.kind === "clan" ? (
                    <ClanFields
                        draft={draft}
                        update={update}
                        disciplineOptions={disciplineOptions}
                        encodeDisciplineReference={encodeDisciplineReference}
                        decodeDisciplineReference={decodeDisciplineReference}
                    />
                ) : null}
                {error ? <Alert color="red">{error}</Alert> : null}
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
    update
}: {
    draft: HomebrewMeritFlaw
    update: (values: Partial<HomebrewItem>) => void
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
        />
        <TagsInput
            label="Excludes"
            description="Merits or Flaws that cannot be combined with this item."
            value={draft.excludes}
            onChange={(excludes) => update({ excludes })}
        />
    </SimpleGrid>
)

const ClanFields = ({
    draft,
    update,
    disciplineOptions,
    encodeDisciplineReference,
    decodeDisciplineReference
}: {
    draft: HomebrewClan
    update: (values: Partial<HomebrewItem>) => void
    disciplineOptions: Array<{ value: string; label: string }>
    encodeDisciplineReference: (reference: HomebrewDisciplineReference) => string
    decodeDisciplineReference: (value: string) => HomebrewDisciplineReference
}) => (
    <>
        <Textarea
            label="Bane"
            minRows={2}
            value={draft.bane}
            onChange={(event) => update({ bane: event.currentTarget.value })}
            required
        />
        <Textarea
            label="Compulsion"
            minRows={2}
            value={draft.compulsion}
            onChange={(event) => update({ compulsion: event.currentTarget.value })}
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
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TagsInput
                label="Excluded predator types"
                value={draft.excludedPredatorTypes}
                onChange={(excludedPredatorTypes) => update({ excludedPredatorTypes })}
            />
            <TagsInput
                label="Excluded Merits & Flaws"
                value={draft.excludedMeritsAndFlaws}
                onChange={(excludedMeritsAndFlaws) => update({ excludedMeritsAndFlaws })}
            />
        </SimpleGrid>
    </>
)

const LoresheetEditor = ({
    draft,
    update,
    error,
    onClose,
    onSave
}: {
    draft: HomebrewLoresheet
    update: (values: Partial<HomebrewItem>) => void
    error: string
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
                        />
                        <Textarea
                            label="Full description"
                            minRows={5}
                            autosize
                            maxRows={12}
                            value={draft.description}
                            onChange={(event) => update({ description: event.currentTarget.value })}
                        />
                    </Stack>
                    <Stack gap="sm" className="homebrew-loresheet__details">
                        <TextInput
                            label="Source label"
                            value={draft.source}
                            onChange={(event) => update({ source: event.currentTarget.value })}
                        />
                        <Textarea
                            label="Requirements"
                            description="Displayed as guidance; not automatically enforced."
                            minRows={4}
                            value={draft.requirements}
                            onChange={(event) =>
                                update({ requirements: event.currentTarget.value })
                            }
                        />
                    </Stack>
                </section>

                <div className="homebrew-loresheet__divider" aria-label="Lore">
                    <img src={ornamentalDivider} alt="" />
                    <Text>Lore</Text>
                    <img src={ornamentalDivider} alt="" />
                </div>

                <section className="homebrew-loresheet__tiers" aria-label="Loresheet levels">
                    {draft.tiers.map((tier, index) => (
                        <div className="homebrew-loresheet__tier" key={tier.level}>
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
                            />
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
                            />
                        </div>
                    ))}
                </section>

                {error ? <Alert color="red">{error}</Alert> : null}
                <footer className="homebrew-loresheet__footer">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="grape" onClick={onSave}>
                        Save loresheet
                    </Button>
                </footer>
            </article>
        </div>
    )
}

export default HomebrewItemEditor
