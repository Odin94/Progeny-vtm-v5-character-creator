import { downloadFile } from "~/utils/fileDownload"
import { useState } from "react"
import { Button, Card, Stack, Text, Title } from "@mantine/core"
import { useCharacterRecoverySaves } from "~/hooks/useBrokenCharacter"

export default function CharacterRecoveryDownloads() {
    const [error, setError] = useState("")
    const [saves] = useCharacterRecoverySaves()
    if (!saves.length) return null

    const download = (data: string, savedAt: string) => {
        setError("")
        void downloadFile(
            {
                filename: `character_recovery_${savedAt.replaceAll(":", "-")}.json`,
                format: "recovery-json",
                source: "recovery"
            },
            () => new Blob([data], { type: "application/json" })
        ).catch(() => {
            setError(
                "Could not prepare your recovery copy. It is still kept in this browser. Please retry."
            )
        })
    }

    return (
        <Card p="xl" withBorder>
            <Title order={3}>Character recovery copies</Title>
            <Text size="sm" mb="sm">
                These copies were preserved when you reset a character that could not be loaded.
                Download them before clearing this browser’s storage. Support can help recover them.
            </Text>
            {error && (
                <Text c="red" role="alert">
                    {error}
                </Text>
            )}
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
