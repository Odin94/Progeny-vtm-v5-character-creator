import { List, Stack, Text } from "@mantine/core"

const labels: Record<string, string> = {
    name: "Name",
    summary: "Short summary",
    description: "Full description",
    logo: "Logo URL",
    specialtyOptions: "Specialty choices",
    disciplineOptions: "Bonus Discipline choices",
    selectableMeritsAndFlaws: "Merit & Flaw choices",
    meritsAndFlaws: "Granted Merits & Flaws",
    skillBonuses: "Skill grants",
    nativeDisciplines: "Native Disciplines",
    nativeDisciplineRefs: "Native Disciplines",
    totalPoints: "Point budget",
    maxLevel: "Maximum dots",
    customInput: "Custom specialty prompt",
    costs: "Dot costs",
    tiers: "Loresheet levels"
}
const fieldLabel = (path: string) =>
    path
        .split(".")
        .map((part) =>
            /^\d+$/.test(part)
                ? String(Number(part) + 1)
                : (labels[part] ??
                  part.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()))
        )
        .join(" · ")

const HomebrewValidationSummary = ({ errors }: { errors: Partial<Record<string, string>> }) => {
    const entries = Object.entries(errors).filter((entry): entry is [string, string] => !!entry[1])
    if (!entries.length) return null
    return (
        <Stack role="alert" gap="xs" mt="md" c="red">
            <Text fw={700}>Invalid values:</Text>
            <List size="sm" c="red">
                {entries.map(([field, message]) => (
                    <List.Item key={field}>
                        {fieldLabel(field)}: {message}
                    </List.Item>
                ))}
            </List>
        </Stack>
    )
}
export default HomebrewValidationSummary
