import { Badge, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import type { HomebrewItem, HomebrewPower } from "~/data/Homebrew"
import { homebrewKindLabel } from "~/data/Homebrew"
import HomebrewLoresheetPreview from "~/components/HomebrewLoresheetPreview"

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Stack gap={2}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {label}
        </Text>
        <Text>{children}</Text>
    </Stack>
)

const TagList = ({ values, empty = "None" }: { values: string[]; empty?: string }) =>
    values.length ? (
        <Group gap={6}>
            {values.map((value) => (
                <Badge key={value} variant="outline" color="gray">
                    {value}
                </Badge>
            ))}
        </Group>
    ) : (
        <Text c="dimmed">{empty}</Text>
    )

const PowerDetails = ({ item }: { item: HomebrewPower }) => (
    <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <Detail label="Discipline">{item.discipline}</Detail>
            <Detail label="Level">{"●".repeat(item.level)}</Detail>
            <Detail label="Dice pool">{item.dicePool || "Not specified"}</Detail>
            <Detail label="Rouse checks">{item.rouseChecks || "None"}</Detail>
        </SimpleGrid>
        {item.amalgamPrerequisites.length ? (
            <Detail label="Amalgam prerequisites">
                {item.amalgamPrerequisites
                    .map(({ discipline, level }) => `${discipline} ${level}`)
                    .join(", ")}
            </Detail>
        ) : null}
        {item.requiredTime || item.ingredients ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {item.requiredTime ? (
                    <Detail label="Required time">{item.requiredTime}</Detail>
                ) : null}
                {item.ingredients ? <Detail label="Ingredients">{item.ingredients}</Detail> : null}
            </SimpleGrid>
        ) : null}
        {item.prerequisitePowers?.length ? (
            <Detail label="Prerequisite powers">
                <TagList values={item.prerequisitePowers} />
            </Detail>
        ) : null}
    </Stack>
)

const HomebrewItemPreview = ({ item }: { item: HomebrewItem }) => {
    if (item.kind === "loresheet") {
        return <HomebrewLoresheetPreview item={item} />
    }

    return (
        <Paper withBorder p="lg" bg="rgba(0,0,0,.2)">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={3}>{item.name || "Untitled rule"}</Title>
                        <Text c="dimmed" mt={4}>
                            {item.summary || item.description || "No description provided."}
                        </Text>
                    </div>
                    <Badge color="grape" variant="light">
                        {homebrewKindLabel(item.kind)}
                    </Badge>
                </Group>

                {"description" in item && item.description && item.description !== item.summary ? (
                    <Text style={{ whiteSpace: "pre-wrap" }}>{item.description}</Text>
                ) : null}

                {item.kind === "power" ||
                item.kind === "ritual" ||
                item.kind === "ceremony" ||
                item.kind === "formula" ? (
                    <>
                        <Divider />
                        <PowerDetails item={item} />
                    </>
                ) : null}

                {item.kind === "merit" || item.kind === "flaw" ? (
                    <>
                        <Divider />
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Detail label="Dot costs">
                                {item.costs.length
                                    ? item.costs.map((cost) => "●".repeat(cost)).join(" · ")
                                    : "Not specified"}
                            </Detail>
                            <Detail label="Excludes">
                                <TagList values={item.excludes} />
                            </Detail>
                        </SimpleGrid>
                    </>
                ) : null}

                {item.kind === "clan" ? (
                    <>
                        <Divider />
                        <Stack gap="md">
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <Detail label="Bane">{item.bane}</Detail>
                                <Detail label="Compulsion">{item.compulsion}</Detail>
                            </SimpleGrid>
                            <Detail label="Native Disciplines">
                                <TagList values={item.nativeDisciplines} />
                            </Detail>
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <Detail label="Excluded predator types">
                                    <TagList values={item.excludedPredatorTypes} />
                                </Detail>
                                <Detail label="Excluded merits & flaws">
                                    <TagList values={item.excludedMeritsAndFlaws} />
                                </Detail>
                            </SimpleGrid>
                        </Stack>
                    </>
                ) : null}
            </Stack>
        </Paper>
    )
}

export default HomebrewItemPreview
