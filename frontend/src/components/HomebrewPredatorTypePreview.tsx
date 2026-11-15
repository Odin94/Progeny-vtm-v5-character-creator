import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core"
import type { HomebrewPredatorType } from "~/data/Homebrew"
import OrnamentalDivider from "./OrnamentalDivider"
import "./HomebrewItemEditor.css"
const signed = (value: number) => (value > 0 ? `+${value}` : String(value))
const HomebrewPredatorTypePreview = ({ item }: { item: HomebrewPredatorType }) => (
    <div className="homebrew-loresheet__shell homebrew-loresheet__preview">
        <article className="homebrew-loresheet__sheet">
            <header className="homebrew-loresheet__header">
                <Text className="homebrew-loresheet__title">
                    {item.name || "Untitled predator type"}
                </Text>
                <Text size="xs" className="homebrew-loresheet__eyebrow">
                    Homebrew Predator Type
                </Text>
            </header>
            <Text className="homebrew-loresheet__intro-copy">{item.summary}</Text>
            {item.description && (
                <Text mt="sm" className="homebrew-loresheet__intro-copy">
                    {item.description}
                </Text>
            )}
            <OrnamentalDivider label="The Hunt" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <Stack gap="xs">
                    <Text className="homebrew-loresheet__tier-title">Specialty choices</Text>
                    {item.specialtyOptions.map((s, i) => (
                        <Text key={i} tt="capitalize">
                            {s.skill}: {s.name}
                            {s.customInput ? ` (${s.customInput})` : ""}
                        </Text>
                    ))}
                </Stack>
                <Stack gap="xs">
                    <Text className="homebrew-loresheet__tier-title">Bonus Discipline</Text>
                    <Group gap="xs">
                        {item.disciplineOptions.map((d, i) => (
                            <Badge key={i} variant="outline" color="grape">
                                {d.name}
                            </Badge>
                        ))}
                    </Group>
                </Stack>
            </SimpleGrid>
            <OrnamentalDivider label="Gifts & Costs" />
            <Stack gap="sm">
                <Group>
                    <Badge color="red" variant="light">
                        Humanity {signed(item.humanityChange)}
                    </Badge>
                    <Badge color="grape" variant="light">
                        Blood Potency {signed(item.bloodPotencyChange)}
                    </Badge>
                </Group>
                {item.skillBonuses.map((g) => (
                    <Text key={g.skill} tt="capitalize">
                        +{g.dots} {g.skill}
                    </Text>
                ))}
                {item.meritsAndFlaws.map((g, i) => (
                    <Text key={i}>
                        {g.name} {"●".repeat(g.level)} · {g.type}
                        {g.summary ? ` — ${g.summary}` : ""}
                        {g.excludes.length ? ` (Excludes: ${g.excludes.join(", ")})` : ""}
                    </Text>
                ))}
                {item.selectableMeritsAndFlaws.map((g, i) => (
                    <div key={i}>
                        <Text fw={700}>
                            {g.exclusive ? "Choose one" : "Distribute"} · {g.totalPoints} dots
                        </Text>
                        {g.options.map((o, j) => (
                            <Text key={j}>
                                {o.name} · up to {o.maxLevel} dots · {o.type}
                                {o.summary ? ` — ${o.summary}` : ""}
                                {o.excludes.length ? ` (Excludes: ${o.excludes.join(", ")})` : ""}
                            </Text>
                        ))}
                    </div>
                ))}
            </Stack>
        </article>
    </div>
)
export default HomebrewPredatorTypePreview
