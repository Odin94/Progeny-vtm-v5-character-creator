import {
    Alert,
    Button,
    Group,
    Modal,
    NumberInput,
    SimpleGrid,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea
} from "@mantine/core"
import { useEffect, useState } from "react"
import type {
    HomebrewClan,
    HomebrewItem,
    HomebrewLoresheet,
    HomebrewMeritFlaw,
    HomebrewPower
} from "~/data/Homebrew"
import { homebrewKindLabel } from "~/data/Homebrew"

type Props = {
    opened: boolean
    item: HomebrewItem
    onClose: () => void
    onSave: (item: HomebrewItem) => void
}

const HomebrewItemEditor = ({ opened, item, onClose, onSave }: Props) => {
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
        onSave(draft)
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
            {"summary" in draft ? (
                <TextInput
                    label="Short summary"
                    description="Shown in pickers and library previews."
                    value={draft.summary}
                    maxLength={500}
                    onChange={(event) => update({ summary: event.currentTarget.value })}
                />
            ) : null}
            {"description" in draft ? (
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
                          <TextInput
                              label="Discipline"
                              description="Official or Homebrew Discipline name."
                              value={power.discipline}
                              onChange={(event) =>
                                  update({ discipline: event.currentTarget.value })
                              }
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
                  </>
              )
          })()
        : null

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
                {draft.kind === "clan" ? <ClanFields draft={draft} update={update} /> : null}
                {draft.kind === "loresheet" ? (
                    <LoresheetFields draft={draft} update={update} />
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
    update
}: {
    draft: HomebrewClan
    update: (values: Partial<HomebrewItem>) => void
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
        <TagsInput
            label="Native Disciplines"
            description="Official and Homebrew Disciplines are both supported."
            value={draft.nativeDisciplines}
            onChange={(nativeDisciplines) => update({ nativeDisciplines })}
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

const LoresheetFields = ({
    draft,
    update
}: {
    draft: HomebrewLoresheet
    update: (values: Partial<HomebrewItem>) => void
}) => (
    <>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
                label="Source label"
                value={draft.source}
                onChange={(event) => update({ source: event.currentTarget.value })}
            />
            <TextInput
                label="Requirements"
                description="Displayed as guidance; not automatically enforced."
                value={draft.requirements}
                onChange={(event) => update({ requirements: event.currentTarget.value })}
            />
        </SimpleGrid>
        <Text fw={600}>Loresheet levels</Text>
        {draft.tiers.map((tier, index) => (
            <SimpleGrid key={tier.level} cols={{ base: 1, sm: 2 }}>
                <TextInput
                    label={`Level ${tier.level} name`}
                    value={tier.name}
                    onChange={(event) => {
                        const tiers = [...draft.tiers]
                        tiers[index] = { ...tier, name: event.currentTarget.value }
                        update({ tiers })
                    }}
                />
                <Textarea
                    label={`Level ${tier.level} summary`}
                    value={tier.summary}
                    onChange={(event) => {
                        const tiers = [...draft.tiers]
                        tiers[index] = { ...tier, summary: event.currentTarget.value }
                        update({ tiers })
                    }}
                />
            </SimpleGrid>
        ))}
    </>
)

export default HomebrewItemEditor
