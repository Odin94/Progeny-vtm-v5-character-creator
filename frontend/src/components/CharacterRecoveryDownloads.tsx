import { Button, Card, Stack, Text, Title } from "@mantine/core"
import { useCharacterRecoverySaves } from "~/hooks/useBrokenCharacter"

export default function CharacterRecoveryDownloads() {
    const [saves] = useCharacterRecoverySaves()
    if (!saves.length) return null

    const download = (data: string, savedAt: string) => {
        const url = URL.createObjectURL(new Blob([data], { type: "application/json" }))
        const link = document.createElement("a")
        link.href = url
        link.download = `character_recovery_${savedAt.replaceAll(":", "-")}.json`
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 100)
    }

    return (
        <Card p="xl" withBorder>
            <Title order={3}>Character recovery copies</Title>
            <Text size="sm" mb="sm">
                These copies were preserved when you reset a character that could not be loaded.
                Download them before clearing this browser’s storage. Support can help recover them.
            </Text>
            <Stack gap="xs">
                {saves.map((save, index) => (
                    <Button
                        key={index}
                        variant="light"
                        onClick={() => download(save.data, save.savedAt)}
                    >
                        Download recovery copy — {new Date(save.savedAt).toLocaleString()}
                    </Button>
                ))}
            </Stack>
        </Card>
    )
}
