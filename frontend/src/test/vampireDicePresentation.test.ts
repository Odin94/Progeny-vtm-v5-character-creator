import { describe, expect, it } from "vitest"
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Texture } from "three"
import {
    dieOutcome,
    readDiceStyle
} from "~/character_sheet/components/diceRollModal/threeDice/settings"
import { swapCrystalColors } from "~/character_sheet/components/diceRollModal/threeDice/crystal-colors"

describe("vampire dice presentation", () => {
    it.each([
        [1, false, "Failure"],
        [5, false, "Failure"],
        [6, false, "Success"],
        [9, false, "Success"],
        [10, false, "Critical"],
        [1, true, "Bestial failure"],
        [5, true, "Failure"],
        [6, true, "Success"],
        [9, true, "Success"],
        [10, true, "Messy"]
    ] as const)("labels face %i (hunger: %s) as %s", (value, blood, expected) => {
        expect(dieOutcome(value, blood)).toBe(expected)
    })

    it.each([
        [undefined, "default"],
        ['"vtm"', "default"],
        ['"default"', "default"],
        ['"crystal-vtm"', "crystal"],
        ['"crystal"', "crystal"],
        ['"unknown"', "default"]
    ] as const)("restores or migrates saved style %s to %s", (raw, expected) => {
        expect(readDiceStyle(raw)).toBe(expected)
    })

    it.each(["ruby", "violet"] as const)(
        "swaps %s pigment without replacing the face texture",
        (source) => {
            const root = new Object3D()
            const shellMaterial = new MeshPhysicalMaterial({ map: new Texture() })
            const faceTexture = shellMaterial.map
            const shell = new Mesh(undefined, shellMaterial)
            shell.userData.role = "shell"
            shell.userData.physics = { role: source === "ruby" ? "regular" : "hunger" }
            const sparkle = new MeshStandardMaterial()
            sparkle.name = `${source}_sparkles_1`
            root.add(shell, new Mesh(undefined, sparkle))
            swapCrystalColors(root, source)
            expect(shellMaterial.map).toBe(faceTexture)
            expect(shell.userData.physics.role).toBe(source === "ruby" ? "regular" : "hunger")
            expect(shellMaterial.attenuationColor.toArray()).toEqual(
                source === "ruby" ? [0.46, 0.2, 0.82] : [0.94, 0.18, 0.3]
            )
            expect(sparkle.color.toArray()).toEqual(
                source === "ruby" ? [0.32, 0.09, 0.75] : [0.55, 0.05, 0.14]
            )
            shell.geometry.dispose()
            shellMaterial.dispose()
            faceTexture?.dispose()
            sparkle.dispose()
        }
    )
})
