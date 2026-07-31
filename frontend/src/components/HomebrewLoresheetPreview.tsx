import { Stack, Text } from "@mantine/core"
import ornamentalDivider from "~/assets/ornamental-divider.svg"
import type { HomebrewLoresheet } from "~/data/Homebrew"
import "./HomebrewItemEditor.css"

const HomebrewLoresheetPreview = ({ item }: { item: HomebrewLoresheet }) => (
    <div className="homebrew-loresheet__shell">
        <article className="homebrew-loresheet__sheet">
            <header className="homebrew-loresheet__header">
                <Text className="homebrew-loresheet__title">
                    {item.name || "Untitled loresheet"}
                </Text>
                <Text size="xs" className="homebrew-loresheet__eyebrow">
                    {item.source || "Homebrew"}
                </Text>
            </header>

            <section className="homebrew-loresheet__intro">
                <div className="homebrew-loresheet__intro-copy">
                    <Text>{item.summary || item.description || "No description provided."}</Text>
                    {item.description && item.description !== item.summary ? (
                        <Text mt="md">{item.description}</Text>
                    ) : null}
                </div>
                <Stack gap="xs" className="homebrew-loresheet__details">
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Requirements
                    </Text>
                    <Text>{item.requirements || "None"}</Text>
                </Stack>
            </section>

            <div className="homebrew-loresheet__divider" aria-label="Lore">
                <img src={ornamentalDivider} alt="" />
                <Text>Lore</Text>
                <img src={ornamentalDivider} alt="" />
            </div>

            <section className="homebrew-loresheet__tiers" aria-label="Loresheet levels">
                {item.tiers.map((tier) => (
                    <div className="homebrew-loresheet__tier" key={tier.level}>
                        <Text
                            className="homebrew-loresheet__dots"
                            aria-label={`Level ${tier.level}`}
                        >
                            {"●".repeat(tier.level)}
                        </Text>
                        <Text className="homebrew-loresheet__tier-title">
                            {tier.name || `Level ${tier.level}`}
                        </Text>
                        <Text className="homebrew-loresheet__tier-text">
                            {tier.summary || "No benefit description provided."}
                        </Text>
                    </div>
                ))}
            </section>
        </article>
    </div>
)

export default HomebrewLoresheetPreview
