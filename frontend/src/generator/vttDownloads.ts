import { notifications } from "@mantine/notifications"
import type { Character } from "~/data/Character"
import type { DownloadSource } from "~/utils/downloadAnalytics"
import { downloadFile } from "~/utils/fileDownload"
import { createWoD5EVttJson } from "./foundryWoDJsonCreator"
import { createInconnuCommandExport } from "./inconnuCommandCreator"
import { createInconnuJson } from "./inconnuJsonCreator"

export type VttDownloadFormat = "foundry-json" | "inconnu-json" | "inconnu-commands"

export const downloadVttCharacter = async (
    character: Character,
    format: VttDownloadFormat,
    source: DownloadSource
) => {
    if (format === "foundry-json") {
        let validationErrors: string[] = []
        await downloadFile(
            { filename: `foundry_wod5e_${character.name}.json`, format, source },
            () => {
                const result = createWoD5EVttJson(character)
                validationErrors = result.validationErrors
                return new Blob([JSON.stringify(result.json, null, 2)], {
                    type: "application/json"
                })
            }
        )
        if (validationErrors.length) {
            const [firstError] = validationErrors
            const message =
                validationErrors.length === 1
                    ? `Validation error: ${firstError}`
                    : `${validationErrors.length} validation errors found. First error: ${firstError}`
            notifications.show({
                title: "Validation Warning",
                message: `The exported JSON may not be fully compatible with Foundry VTT. ${message}`,
                color: "orange",
                autoClose: 10000
            })
        }
        return
    }

    const commands = format === "inconnu-commands"
    const filename = commands
        ? `inconnu_${character.name}_discord_commands_progeny.txt`
        : `inconnu_${character.name}.json`
    await downloadFile({ filename, format, source }, () => {
        const data = createInconnuJson(character)
        return commands
            ? new Blob([createInconnuCommandExport(data)], { type: "text/plain" })
            : new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    })
}
