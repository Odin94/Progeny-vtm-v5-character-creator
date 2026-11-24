import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core"
import { useMemo, type CSSProperties } from "react"
import NameTag from "~/components/NameTag"
import { attributesKeySchema } from "~/data/Attributes"
import type { Character as CharacterType } from "~/data/Character"
import type { DisciplineName } from "~/data/NameSchemas"
import { skillsKeySchema } from "~/data/Skills"
import { parseCharacterData } from "~/utils/characterData"
import { getCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import { ClanSigil } from "./ClanSigil"
import { clanColorVars, getCharacterIdentity } from "./characterIdentity"
import classes from "./me.module.css"

type Focus = "physical" | "social" | "mental"

const FOCUS_COLOR: Record<Focus, string> = {
    physical: "var(--mantine-color-red-5)",
    social: "var(--mantine-color-grape-5)",
    mental: "var(--mantine-color-blue-5)"
}

const PHYSICAL_DISCIPLINES: DisciplineName[] = ["celerity", "potence", "fortitude", "protean"]
const SOCIAL_DISCIPLINES: DisciplineName[] = ["presence", "dominate", "obfuscate", "animalism"]
const MENTAL_DISCIPLINES: DisciplineName[] = [
    "auspex",
    "blood sorcery",
    "oblivion",
    "thin-blood alchemy"
]

const getDisciplineCategory = (disciplineName: DisciplineName): Focus => {
    if (PHYSICAL_DISCIPLINES.includes(disciplineName)) return "physical"
    if (SOCIAL_DISCIPLINES.includes(disciplineName)) return "social"
    if (MENTAL_DISCIPLINES.includes(disciplineName)) return "mental"
    return "physical"
}

const ATTRIBUTES = {
    physical: ["strength", "dexterity", "stamina"],
    social: ["charisma", "manipulation", "composure"],
    mental: ["intelligence", "wits", "resolve"]
} as const

const SKILLS = {
    physical: [
        "athletics",
        "brawl",
        "craft",
        "drive",
        "firearms",
        "melee",
        "larceny",
        "stealth",
        "survival"
    ],
    social: [
        "animal ken",
        "etiquette",
        "insight",
        "intimidation",
        "leadership",
        "performance",
        "persuasion",
        "streetwise",
        "subterfuge"
    ],
    mental: [
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
} as const

const calculateCharacterStrength = (character: CharacterType) => {
    const score: Record<Focus, number> = { physical: 0, social: 0, mental: 0 }

    for (const focus of ["physical", "social", "mental"] as const) {
        ATTRIBUTES[focus].forEach((attr) => {
            score[focus] += character.attributes[attributesKeySchema.parse(attr)] ?? 0
        })
        SKILLS[focus].forEach((skill) => {
            score[focus] += character.skills[skillsKeySchema.parse(skill)] ?? 0
        })
    }

    character.disciplines.forEach((power) => {
        score[getDisciplineCategory(power.discipline)] += power.level * 2
    })

    const dominant: Focus =
        score.physical > score.social && score.physical > score.mental
            ? "physical"
            : score.social > score.mental
              ? "social"
              : "mental"

    return { ...score, dominant }
}

type CoterieSummaryContentProps = {
    members: Array<{
        characterId: string
        playerNickname?: string | null
        showPlayerNameTag?: boolean
        character?: { data?: unknown }
    }>
    vitalsByCharacterId: Record<string, CharacterVitals>
}

export const CoterieSummaryContent = ({
    members,
    vitalsByCharacterId
}: CoterieSummaryContentProps) => {
    const memberSummaries = useMemo(
        () =>
            members.flatMap((member) => {
                const character = parseCharacterData(member.character?.data)
                if (!character) return []

                return {
                    member,
                    character,
                    strength: calculateCharacterStrength(character),
                    identity: getCharacterIdentity(character),
                    vitals: vitalsByCharacterId[member.characterId] ?? getCharacterVitals(character)
                }
            }),
        [members, vitalsByCharacterId]
    )

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {memberSummaries.map(({ member, character, strength, identity, vitals }) => {
                const playerName =
                    member.playerNickname?.trim() || character.player?.trim() || "Unknown player"

                return (
                    <div
                        key={member.characterId}
                        className={classes.summaryCard}
                        style={
                            {
                                ...clanColorVars(identity.color),
                                "--focus-color": FOCUS_COLOR[strength.dominant]
                            } as CSSProperties
                        }
                    >
                        <ClanSigil logo={identity.logo} size={52} framed />
                        <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                            <span className={classes.focus}>{strength.dominant}</span>
                            <Text fw={600} size="lg" ff="var(--pg-font-display)" truncate="end">
                                {character.name}
                            </Text>
                            <Group gap="xs" wrap="nowrap">
                                <Text size="sm" c="dimmed">
                                    Player:
                                </Text>
                                {member.showPlayerNameTag ? (
                                    <NameTag name={playerName} size="xs" />
                                ) : (
                                    <Text size="sm" c="dimmed" truncate="end">
                                        {playerName}
                                    </Text>
                                )}
                            </Group>
                            <Group gap={6} mt={4}>
                                <Badge size="sm" color="red" variant="light">
                                    Hunger {vitals.hunger}/5
                                </Badge>
                                <Badge size="sm" color="grape" variant="light">
                                    Willpower {vitals.currentWillpower}/{vitals.willpower}
                                </Badge>
                                <Badge size="sm" color="blue" variant="light">
                                    Humanity {vitals.humanity}/10
                                    {vitals.humanityStains > 0
                                        ? ` · ${vitals.humanityStains} stains`
                                        : ""}
                                </Badge>
                            </Group>
                        </Stack>
                    </div>
                )
            })}
        </SimpleGrid>
    )
}
