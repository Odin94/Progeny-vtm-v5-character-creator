import { Accordion, Badge, Grid, Group, Stack, Text } from "@mantine/core"
import type { ReactNode } from "react"
import { Panel } from "~/components/ui"
import { attributesKeySchema } from "~/data/Attributes"
import type { Character as CharacterType } from "~/data/Character"
import type { DisciplineName } from "~/data/NameSchemas"
import { skillsKeySchema } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import { getPowerDisciplineIdentity, getPowerIdentity } from "~/utils/homebrewOptions"
import { ClanSigil } from "./ClanSigil"
import { clanColorVars, getCharacterIdentity } from "./characterIdentity"
import classes from "./me.module.css"

const ATTRIBUTE_GROUPS = [
    ["Physical", ["strength", "dexterity", "stamina"]],
    ["Social", ["charisma", "manipulation", "composure"]],
    ["Mental", ["intelligence", "wits", "resolve"]]
] as const

const SKILL_GROUPS = [
    [
        "Physical",
        [
            "athletics",
            "brawl",
            "craft",
            "drive",
            "firearms",
            "melee",
            "larceny",
            "stealth",
            "survival"
        ]
    ],
    [
        "Social",
        [
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance",
            "persuasion",
            "streetwise",
            "subterfuge"
        ]
    ],
    [
        "Mental",
        [
            "academics",
            "awareness",
            "finance",
            "investigation",
            "medicine",
            "occult",
            "politics",
            "science",
            "technology"
        ]
    ]
] as const

const Pips = ({ level }: { level: number }) => (
    <span className={classes.pips} role="img" aria-label={`${level} of 5`}>
        {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={classes.pip} data-filled={index < level || undefined} />
        ))}
    </span>
)

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
    <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm" c="dimmed" fw={500}>
            {label}
        </Text>
        <Text size="sm" ta="right">
            {value}
        </Text>
    </Group>
)

type CharacterSummaryContentProps = {
    character: CharacterType
    characterName: string
}

export const CharacterSummaryContent = ({
    character,
    characterName
}: CharacterSummaryContentProps) => {
    const identity = getCharacterIdentity(character)

    const disciplineGroups = character.disciplines.reduce(
        (acc, power) => {
            const key = getPowerDisciplineIdentity(power)
            if (!acc[key]) {
                acc[key] = { disciplineName: power.discipline, powers: [] }
            }
            acc[key].powers.push(power)
            return acc
        },
        {} as Record<
            string,
            { disciplineName: DisciplineName; powers: typeof character.disciplines }
        >
    )

    return (
        <Accordion variant="separated" radius="md" chevronPosition="left" defaultValue="identity">
            <Accordion.Item value="identity">
                <Accordion.Control>
                    <Group gap="sm" align="center" style={clanColorVars(identity.color)}>
                        <ClanSigil logo={identity.logo} size={30} />
                        <Text ff="var(--pg-font-display)" fw={600} size="lg">
                            {characterName || "Unnamed Character"}
                        </Text>
                    </Group>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    <Fact label="Clan" value={identity.clanName || "—"} />
                                    <Fact
                                        label="Predator Type"
                                        value={character.predatorType.name || "—"}
                                    />
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    <Fact label="Ambition" value={character.ambition || "—"} />
                                    <Fact label="Desire" value={character.desire || "—"} />
                                    {character.player ? (
                                        <Fact label="Player" value={character.player} />
                                    ) : null}
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    {character.generation ? (
                                        <Fact label="Generation" value={character.generation} />
                                    ) : null}
                                    {character.sire ? (
                                        <Fact label="Sire" value={character.sire} />
                                    ) : null}
                                </Stack>
                            </Grid.Col>
                        </Grid>
                        {character.description ? (
                            <Panel tone="inset">
                                <div className={classes.statGroupLabel}>Description</div>
                                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                    {character.description}
                                </Text>
                            </Panel>
                        ) : null}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="attributes">
                <Accordion.Control>
                    <Text fw={600}>Attributes</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        {ATTRIBUTE_GROUPS.map(([group, attributes]) => (
                            <Grid.Col key={group} span={{ base: 12, md: 4 }}>
                                <div className={classes.statGroupLabel}>{group}</div>
                                <Stack gap={6}>
                                    {attributes.map((attr) => {
                                        const key = attributesKeySchema.parse(attr)
                                        return (
                                            <div key={attr} className={classes.statRow}>
                                                <span>{attr}</span>
                                                <Pips level={character.attributes[key]} />
                                            </div>
                                        )
                                    })}
                                </Stack>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="skills">
                <Accordion.Control>
                    <Text fw={600}>Skills</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        {SKILL_GROUPS.map(([group, skills]) => (
                            <Grid.Col key={group} span={{ base: 12, md: 4 }}>
                                <div className={classes.statGroupLabel}>{group}</div>
                                <Stack gap={6}>
                                    {skills.map((skill) => {
                                        const key = skillsKeySchema.parse(skill)
                                        const level = character.skills[key]
                                        if (level === 0) return null
                                        const specialties = character.skillSpecialties.filter(
                                            (s) => s.skill === skill
                                        )
                                        return (
                                            <div key={skill}>
                                                <div className={classes.statRow}>
                                                    <span>{skill}</span>
                                                    <Pips level={level} />
                                                </div>
                                                {specialties.length > 0 ? (
                                                    <Text size="xs" c="dimmed" ml="md">
                                                        Specialties:{" "}
                                                        {specialties.map((s) => s.name).join(", ")}
                                                    </Text>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </Stack>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="disciplines">
                <Accordion.Control>
                    <Text fw={600}>Disciplines & Powers</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="md">
                        {Object.entries(disciplineGroups).map(
                            ([key, { disciplineName, powers }]) => {
                                const sortedPowers = [...powers].sort((a, b) => a.level - b.level)
                                return (
                                    <Panel key={key} tone="raised">
                                        <Group gap="xs" mb="sm">
                                            <Text fw={600} ff="var(--pg-font-display)">
                                                {upcase(disciplineName)}
                                            </Text>
                                            <Badge size="sm" color="red" variant="light">
                                                Level{" "}
                                                {Math.max(...sortedPowers.map((p) => p.level))}
                                            </Badge>
                                        </Group>
                                        <Stack gap="xs">
                                            {sortedPowers.map((power) => (
                                                <div key={getPowerIdentity(power)}>
                                                    <Group justify="space-between" mb={2}>
                                                        <Text fw={500} size="sm">
                                                            {power.name}
                                                        </Text>
                                                        <Badge
                                                            size="xs"
                                                            color="red"
                                                            variant="outline"
                                                        >
                                                            Level {power.level}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="xs" c="dimmed" ml="md">
                                                        {power.summary}
                                                    </Text>
                                                </div>
                                            ))}
                                        </Stack>
                                    </Panel>
                                )
                            }
                        )}
                        {character.rituals.length > 0 ? (
                            <Panel tone="raised">
                                <Text fw={600} ff="var(--pg-font-display)" mb="sm">
                                    Rituals
                                </Text>
                                <Stack gap="xs">
                                    {character.rituals.map((ritual) => (
                                        <div key={ritual.name}>
                                            <Group justify="space-between" mb={2}>
                                                <Text fw={500} size="sm">
                                                    {ritual.name}
                                                </Text>
                                                <Badge size="xs" color="red" variant="outline">
                                                    Level {ritual.level}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed" ml="md">
                                                {ritual.summary}
                                            </Text>
                                        </div>
                                    ))}
                                </Stack>
                            </Panel>
                        ) : null}
                        {character.disciplines.length === 0 && character.rituals.length === 0 ? (
                            <Text size="sm" c="dimmed" fs="italic">
                                No disciplines yet
                            </Text>
                        ) : null}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="merits-flaws">
                <Accordion.Control>
                    <Text fw={600}>Merits & Flaws</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        {(
                            [
                                ["Merits", character.merits, "green", "No merits"],
                                ["Flaws", character.flaws, "red", "No flaws"]
                            ] as const
                        ).map(([label, entries, color, emptyLabel]) => (
                            <Grid.Col key={label} span={{ base: 12, md: 6 }}>
                                <div className={classes.statGroupLabel}>{label}</div>
                                <Stack gap="xs">
                                    {entries.length > 0 ? (
                                        entries.map((entry, idx) => (
                                            <Panel key={idx} tone="inset" p="xs">
                                                <Group justify="space-between" mb={2}>
                                                    <Text fw={500} size="sm">
                                                        {entry.name}
                                                    </Text>
                                                    <Badge size="xs" color={color} variant="light">
                                                        {entry.level}
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed">
                                                    {entry.summary}
                                                </Text>
                                            </Panel>
                                        ))
                                    ) : (
                                        <Text size="sm" c="dimmed" fs="italic">
                                            {emptyLabel}
                                        </Text>
                                    )}
                                </Stack>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    )
}
