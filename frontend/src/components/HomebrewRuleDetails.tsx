import { Code, Stack, Text } from "@mantine/core"
import type { HomebrewItem } from "~/data/Homebrew"

const formatRuleValue = (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value, null, 2)

const HomebrewRuleDetails = ({ item }: { item: HomebrewItem }) => (
    <Stack gap={6} mt="xs">
        {Object.entries(item)
            .filter(
                ([key, value]) =>
                    !["id", "kind", "name"].includes(key) && value !== "" && value !== undefined
            )
            .map(([key, value]) => (
                <div key={key}>
                    <Text size="xs" fw={600} tt="capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                    </Text>
                    <Code block>{formatRuleValue(value)}</Code>
                </div>
            ))}
    </Stack>
)

export default HomebrewRuleDetails
