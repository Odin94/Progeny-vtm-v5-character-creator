import { Badge, Box, Divider, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core"
import { attributesKeySchema } from "~/data/Attributes"
import { type Character } from "~/data/Character"
import { clans } from "~/data/Clans"
import { disciplines } from "~/data/Disciplines"
import { getMeritFlawDisplayName } from "~/data/meritsAndFlawsResolution"
import type { DisciplineName } from "~/data/NameSchemas"
import { skillsKeySchema } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import { RAW_GOLD, RAW_GRAPE, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { parseCharacterData } from "~/utils/characterData"
import type { CoterieMemberResponse } from "~/utils/api"
import { getCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import type { ReactNode } from "react"

type CoterieCharacterSummaryGridProps = {
    members: CoterieMemberResponse[]
    vitalsByCharacterId: Record<string, CharacterVitals>
}

const attributeGroups = [
    {
        label: "Physical",
        items: ["strength", "dexterity", "stamina"] as const
    },
    {
        label: "Social",
        items: ["charisma", "manipulation", "composure"] as const
    },
    {
        label: "Mental",
        items: ["intelligence", "wits", "resolve"] as const
    }
]

const skillGroups = [
    {
        label: "Physical",
        items: [
            "athletics",
            "brawl",
            "craft",
            "drive",
            "firearms",
            "melee",
            "larceny",
            "stealth",
            "survival"
        ] as const
    },
    {
        label: "Social",
        items: [
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance",
            "persuasion",
            "streetwise",
            "subterfuge"
        ] as const
    },
    {
        label: "Mental",
        items: [
            "academics",
            "awareness",
            "finance",
            "investigation",
            "medicine",
            "occult",
            "politics",
            "science",
            "technology"
        ] as const
    }
]

const renderPips = (level: number, max = 5) => "●".repeat(level) + "○".repeat(max - level)

const SectionTitle = ({ children }: { children: ReactNode }) => (
    <Text
        size="xs"
        style={{
            fontFamily: "Cinzel, Georgia, serif",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: rgba(RAW_GOLD, 0.76)
        }}
    >
        {children}
    </Text>
)

const RatingRow = ({ label, value }: { label: string; value: number }) => (
    <Group justify="space-between" gap="sm" wrap="nowrap">
        <Text size="xs" c="dimmed" truncate="end">
            {upcase(label)}
        </Text>
        <Text
            size="xs"
            style={{
                color: rgba(RAW_RED, 0.9),
                fontFamily: "Courier New, monospace",
                whiteSpace: "nowrap"
            }}
        >
            {renderPips(value)}
        </Text>
    </Group>
)

const HungerMeter = ({ hunger }: { hunger: number }) => (
    <Group gap={4} wrap="nowrap" aria-label={`Hunger ${hunger}`}>
        {Array.from({ length: 5 }, (_, index) => (
            <Box
                key={index}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor:
                        index < hunger ? rgba(RAW_RED, 0.96) : "rgba(255, 255, 255, 0.1)",
                    border: `1px solid ${
                        index < hunger ? rgba(RAW_RED, 0.88) : "rgba(255, 255, 255, 0.16)"
                    }`,
                    boxShadow: index < hunger ? `0 0 10px ${rgba(RAW_RED, 0.32)}` : undefined
                }}
            />
        ))}
    </Group>
)

const StatusLabel = ({ children, color }: { children: ReactNode; color: string }) => (
    <Text
        size="xs"
        style={{
            fontFamily: "Cinzel, Georgia, serif",
            fontSize: "var(--mantine-font-size-xs)",
            letterSpacing: "0.16em",
            lineHeight: 1.2,
            textTransform: "uppercase",
            color
        }}
    >
        {children}
    </Text>
)

const StatusMeterRow = ({ children }: { children: ReactNode }) => (
    <Box
        style={{
            alignItems: "center",
            columnGap: "var(--mantine-spacing-xs)",
            display: "grid",
            gridTemplateColumns: "8.75rem minmax(0, 1fr)"
        }}
    >
        {children}
    </Box>
)

const DamageMeter = ({
    label,
    maximum,
    superficialDamage,
    aggravatedDamage
}: {
    label: string
    maximum: number
    superficialDamage: number
    aggravatedDamage: number
}) => (
    <Group
        gap={4}
        wrap="nowrap"
        aria-label={`${label} damage: ${superficialDamage} superficial, ${aggravatedDamage} aggravated`}
    >
        {Array.from({ length: maximum }, (_, index) => {
            const pipNumber = index + 1
            const isAggravated = pipNumber <= aggravatedDamage
            const isSuperficial = pipNumber <= superficialDamage

            return (
                <Box
                    key={index}
                    style={{
                        width: 10,
                        height: 10,
                        flex: "0 0 10px",
                        border: `1px solid ${rgba(RAW_GRAPE, 0.9)}`,
                        borderRadius: 2,
                        position: "relative",
                        marginRight: (index + 1) % 5 === 0 && index < maximum - 1 ? 8 : undefined
                    }}
                >
                    {isSuperficial || isAggravated ? (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={rgba(RAW_GRAPE, 0.96)}
                            strokeWidth="3"
                            strokeLinecap="round"
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%"
                            }}
                        >
                            <line x1="22" y1="2" x2="2" y2="22" />
                            {isAggravated ? <line x1="2" y1="2" x2="22" y2="22" /> : null}
                        </svg>
                    ) : null}
                </Box>
            )
        })}
    </Group>
)

const getTouchstoneText = (touchstone: Character["touchstones"][number]) => {
    const name = touchstone.name.trim()
    const conviction = touchstone.conviction.trim()
    const description = touchstone.description.trim()

    if (name && conviction) {
        return `${name}: ${conviction}`
    }

    return name || conviction || description
}

const getDisciplineGroups = (character: Character) =>
    character.disciplines.reduce(
        (groups, power) => {
            if (!groups[power.discipline]) {
                groups[power.discipline] = []
            }
            groups[power.discipline].push(power)
            return groups
        },
        {} as Record<DisciplineName, Character["disciplines"]>
    )

const getDisciplineLogo = (character: Character, disciplineName: DisciplineName) =>
    character.customDisciplines?.[disciplineName]?.logo ||
    disciplines[disciplineName as keyof typeof disciplines]?.logo ||
    ""

const CoterieCharacterSummaryGrid = ({
    members,
    vitalsByCharacterId
}: CoterieCharacterSummaryGridProps) => {
    const parsedMembers = members
        .map((member) => ({
            member,
            character: parseCharacterData(member.character?.data)
        }))
        .filter(
            (entry): entry is { member: CoterieMemberResponse; character: Character } =>
                !!entry.character
        )

    if (parsedMembers.length === 0) {
        return (
            <Paper
                p="xl"
                withBorder
                style={{
                    background: "rgba(10, 8, 10, 0.72)",
                    borderColor: rgba(RAW_GOLD, 0.18)
                }}
            >
                <Text c="dimmed" ta="center">
                    No character summaries available yet.
                </Text>
            </Paper>
        )
    }

    return (
        <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
            {parsedMembers.map(({ member, character }) => {
                const clan = character.clan ? clans[character.clan] : null
                const playerName =
                    member.playerNickname?.trim() || character.player?.trim() || "Unknown player"
                const disciplineGroups = getDisciplineGroups(character)
                const meritsAndFlaws = [...character.merits, ...character.flaws]
                const vitals =
                    vitalsByCharacterId[member.characterId] ?? getCharacterVitals(character)
                const maxHealth = Math.max(0, Math.min(10, vitals.maxHealth))
                const superficialDamage = Math.max(0, Math.min(maxHealth, vitals.superficialDamage))
                const aggravatedDamage = Math.max(0, Math.min(maxHealth, vitals.aggravatedDamage))
                const hunger = Math.max(0, Math.min(5, vitals.hunger))
                const willpower = Math.max(0, vitals.willpower)
                const superficialWillpowerDamage = Math.max(
                    0,
                    Math.min(willpower, vitals.superficialWillpowerDamage)
                )
                const aggravatedWillpowerDamage = Math.max(
                    0,
                    Math.min(willpower, vitals.aggravatedWillpowerDamage)
                )
                const humanity = Math.max(0, Math.min(10, vitals.humanity))
                const touchstones = character.touchstones
                    .map((touchstone) => ({
                        touchstone,
                        text: getTouchstoneText(touchstone)
                    }))
                    .filter(({ text }) => text.length > 0)

                return (
                    <Paper
                        key={member.characterId}
                        p="lg"
                        withBorder
                        style={{
                            height: "100%",
                            overflow: "hidden",
                            position: "relative",
                            borderColor: rgba(RAW_GOLD, 0.24),
                            background:
                                "linear-gradient(145deg, rgba(24, 17, 20, 0.95) 0%, rgba(8, 7, 9, 0.96) 72%)",
                            boxShadow:
                                "0 18px 45px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
                        }}
                    >
                        {clan?.logo ? (
                            <Box
                                style={{
                                    position: "absolute",
                                    right: 18,
                                    top: 18,
                                    width: 78,
                                    height: 78,
                                    backgroundColor: rgba(RAW_RED, 0.24),
                                    maskImage: `url(${clan.logo})`,
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                    maskPosition: "center",
                                    WebkitMaskImage: `url(${clan.logo})`,
                                    WebkitMaskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center"
                                }}
                            />
                        ) : null}

                        <Stack gap="md" style={{ position: "relative" }}>
                            <Stack gap={8} pr={86}>
                                <Group gap="xs" align="baseline" style={{ minWidth: 0 }}>
                                    <Text
                                        style={{
                                            fontFamily: "Cinzel, Georgia, serif",
                                            fontSize: "1.2rem",
                                            lineHeight: 1.14,
                                            color: "rgba(244, 236, 232, 0.96)",
                                            minWidth: 0
                                        }}
                                    >
                                        {character.name}
                                    </Text>
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        truncate="end"
                                        style={{ minWidth: 0 }}
                                    >
                                        {playerName}
                                    </Text>
                                </Group>
                                <Stack gap={6}>
                                    <StatusMeterRow>
                                        <StatusLabel color={rgba(RAW_RED, 0.82)}>
                                            Hunger
                                        </StatusLabel>
                                        <HungerMeter hunger={hunger} />
                                    </StatusMeterRow>
                                    <StatusMeterRow>
                                        <StatusLabel color={rgba(RAW_GRAPE, 0.9)}>
                                            Health
                                        </StatusLabel>
                                        <DamageMeter
                                            label="Health"
                                            maximum={maxHealth}
                                            superficialDamage={superficialDamage}
                                            aggravatedDamage={aggravatedDamage}
                                        />
                                    </StatusMeterRow>
                                    <StatusMeterRow>
                                        <StatusLabel color={rgba(RAW_GRAPE, 0.9)}>
                                            Willpower
                                        </StatusLabel>
                                        <DamageMeter
                                            label="Willpower"
                                            maximum={willpower}
                                            superficialDamage={superficialWillpowerDamage}
                                            aggravatedDamage={aggravatedWillpowerDamage}
                                        />
                                    </StatusMeterRow>
                                </Stack>
                                <Group gap="xs">
                                    <Badge color="red" variant="light">
                                        {clan?.name || upcase(character.clan)}
                                    </Badge>
                                    <Badge color="yellow" variant="outline">
                                        {character.predatorType.name}
                                    </Badge>
                                    {character.generation ? (
                                        <Badge color="gray" variant="light">
                                            Gen {character.generation}
                                        </Badge>
                                    ) : null}
                                </Group>
                            </Stack>

                            {character.description ? (
                                <Text size="sm" style={{ color: rgba(RAW_GREY, 0.7) }}>
                                    {character.description}
                                </Text>
                            ) : null}

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                <Stack gap="xs">
                                    <SectionTitle>Identity</SectionTitle>
                                    <Stack gap={4}>
                                        <Text size="sm">
                                            <Text span c="dimmed">
                                                Ambition:{" "}
                                            </Text>
                                            {character.ambition}
                                        </Text>
                                        <Text size="sm">
                                            <Text span c="dimmed">
                                                Desire:{" "}
                                            </Text>
                                            {character.desire}
                                        </Text>
                                        {character.sire ? (
                                            <Text size="sm">
                                                <Text span c="dimmed">
                                                    Sire:{" "}
                                                </Text>
                                                {character.sire}
                                            </Text>
                                        ) : null}
                                        <Text size="sm">
                                            <Text span c="dimmed">
                                                Humanity:{" "}
                                            </Text>
                                            <Text span c={rgba(RAW_GOLD, 0.95)}>
                                                {humanity} / 10
                                                {vitals.humanityStains > 0
                                                    ? ` · ${vitals.humanityStains} stains`
                                                    : ""}
                                            </Text>
                                        </Text>
                                    </Stack>
                                </Stack>

                                <Stack gap="xs">
                                    <SectionTitle>Touchstones</SectionTitle>
                                    {touchstones.length > 0 ? (
                                        touchstones.map(({ touchstone, text }, index) => (
                                            <Text
                                                key={`${touchstone.name}-${touchstone.conviction}-${index}`}
                                                size="sm"
                                            >
                                                {text}
                                            </Text>
                                        ))
                                    ) : (
                                        <Text size="sm" c="dimmed">
                                            None recorded
                                        </Text>
                                    )}
                                </Stack>
                            </SimpleGrid>

                            <Divider color={rgba(RAW_GOLD, 0.14)} />

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                {attributeGroups.map((group) => (
                                    <Stack key={group.label} gap={6}>
                                        <SectionTitle>{group.label} Attributes</SectionTitle>
                                        {group.items.map((attr) => (
                                            <RatingRow
                                                key={attr}
                                                label={attr}
                                                value={
                                                    character.attributes[
                                                        attributesKeySchema.parse(attr)
                                                    ] ?? 0
                                                }
                                            />
                                        ))}
                                    </Stack>
                                ))}
                            </SimpleGrid>

                            <Divider color={rgba(RAW_GOLD, 0.14)} />

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                {skillGroups.map((group) => {
                                    const nonZeroSkills = group.items.filter(
                                        (skill) =>
                                            (character.skills[skillsKeySchema.parse(skill)] ?? 0) >
                                            0
                                    )

                                    return (
                                        <Stack key={group.label} gap={6}>
                                            <SectionTitle>{group.label} Skills</SectionTitle>
                                            {nonZeroSkills.length > 0 ? (
                                                nonZeroSkills.map((skill) => {
                                                    const specialties =
                                                        character.skillSpecialties.filter(
                                                            (specialty) => specialty.skill === skill
                                                        )

                                                    return (
                                                        <Box key={skill}>
                                                            <RatingRow
                                                                label={skill}
                                                                value={
                                                                    character.skills[
                                                                        skillsKeySchema.parse(skill)
                                                                    ] ?? 0
                                                                }
                                                            />
                                                            {specialties.length > 0 ? (
                                                                <Text size="xs" c="dimmed" ml="xs">
                                                                    {specialties
                                                                        .map(
                                                                            (specialty) =>
                                                                                specialty.name
                                                                        )
                                                                        .join(", ")}
                                                                </Text>
                                                            ) : null}
                                                        </Box>
                                                    )
                                                })
                                            ) : (
                                                <Text size="sm" c="dimmed">
                                                    None
                                                </Text>
                                            )}
                                        </Stack>
                                    )
                                })}
                            </SimpleGrid>

                            <Divider color={rgba(RAW_GOLD, 0.14)} />

                            <Stack gap="sm">
                                <SectionTitle>Disciplines & Powers</SectionTitle>
                                {Object.entries(disciplineGroups).length > 0 ? (
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                        {Object.entries(disciplineGroups).map(
                                            ([disciplineName, powers]) => {
                                                const sortedPowers = [...powers].sort(
                                                    (a, b) => a.level - b.level
                                                )
                                                const logo = getDisciplineLogo(
                                                    character,
                                                    disciplineName
                                                )

                                                return (
                                                    <Box key={disciplineName}>
                                                        <Group gap="xs" mb={4}>
                                                            {logo ? (
                                                                <Box
                                                                    component="img"
                                                                    src={logo}
                                                                    alt=""
                                                                    style={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        objectFit: "contain",
                                                                        filter: "drop-shadow(0 0 6px rgba(224, 49, 49, 0.35))"
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <Text fw={700} size="sm">
                                                                {upcase(disciplineName)}
                                                            </Text>
                                                        </Group>
                                                        <Stack gap={5}>
                                                            {sortedPowers.map((power) => (
                                                                <Box key={power.name}>
                                                                    <Group
                                                                        justify="space-between"
                                                                        gap="xs"
                                                                        wrap="nowrap"
                                                                    >
                                                                        <Text size="sm">
                                                                            {power.name}
                                                                        </Text>
                                                                        <Badge
                                                                            size="xs"
                                                                            color="red"
                                                                            variant="outline"
                                                                        >
                                                                            {power.level}
                                                                        </Badge>
                                                                    </Group>
                                                                    {power.summary ? (
                                                                        <Text
                                                                            size="xs"
                                                                            c="dimmed"
                                                                            lineClamp={2}
                                                                        >
                                                                            {power.summary}
                                                                        </Text>
                                                                    ) : null}
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )
                                            }
                                        )}
                                    </SimpleGrid>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        No disciplines recorded
                                    </Text>
                                )}
                            </Stack>

                            {character.rituals.length > 0 || character.ceremonies.length > 0 ? (
                                <>
                                    <Divider color={rgba(RAW_GOLD, 0.14)} />
                                    <Stack gap="sm">
                                        <SectionTitle>Rituals & Ceremonies</SectionTitle>
                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                            {[...character.rituals, ...character.ceremonies].map(
                                                (rite) => (
                                                    <Box key={rite.name}>
                                                        <Group
                                                            justify="space-between"
                                                            gap="xs"
                                                            wrap="nowrap"
                                                        >
                                                            <Text size="sm">{rite.name}</Text>
                                                            <Badge
                                                                size="xs"
                                                                color="yellow"
                                                                variant="outline"
                                                            >
                                                                {rite.level}
                                                            </Badge>
                                                        </Group>
                                                        {rite.summary ? (
                                                            <Text
                                                                size="xs"
                                                                c="dimmed"
                                                                lineClamp={2}
                                                            >
                                                                {rite.summary}
                                                            </Text>
                                                        ) : null}
                                                    </Box>
                                                )
                                            )}
                                        </SimpleGrid>
                                    </Stack>
                                </>
                            ) : null}

                            {meritsAndFlaws.length > 0 ? (
                                <>
                                    <Divider color={rgba(RAW_GOLD, 0.14)} />
                                    <Stack gap="sm">
                                        <SectionTitle>Merits & Flaws</SectionTitle>
                                        <Group gap="xs">
                                            {meritsAndFlaws.map((item, index) => (
                                                <Badge
                                                    key={`${item.type}-${item.name}-${index}`}
                                                    color={item.type === "merit" ? "green" : "red"}
                                                    variant="light"
                                                >
                                                    {getMeritFlawDisplayName(item)} {item.level}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Stack>
                                </>
                            ) : null}
                        </Stack>
                    </Paper>
                )
            })}
        </SimpleGrid>
    )
}

export default CoterieCharacterSummaryGrid
