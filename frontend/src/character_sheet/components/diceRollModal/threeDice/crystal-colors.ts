import { Color, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Object3D } from "three"

const palettes = {
    ruby: { surface: "#faaab9", attenuation: [0.94, 0.18, 0.3], sparkle: [0.55, 0.05, 0.14] },
    violet: { surface: "#d7b4ff", attenuation: [0.46, 0.2, 0.82], sparkle: [0.32, 0.09, 0.75] }
} as const

// Retint the pigment, keeping each role's original face textures (skull/fangs vs stars).
export const swapCrystalColors = (root: Object3D, source: "ruby" | "violet") => {
    const from = palettes[source]
    const to = palettes[source === "ruby" ? "violet" : "ruby"]
    root.traverse((object) => {
        if (!(object instanceof Mesh)) return
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
            if (material instanceof MeshPhysicalMaterial && object.userData.role === "shell") {
                material.attenuationColor.setRGB(
                    to.attenuation[0],
                    to.attenuation[1],
                    to.attenuation[2]
                )
                material.onBeforeCompile = (shader) => {
                    shader.uniforms.crystalSourceColor = { value: new Color(from.surface) }
                    shader.uniforms.crystalTargetColor = { value: new Color(to.surface) }
                    shader.fragmentShader = `uniform vec3 crystalSourceColor;
uniform vec3 crystalTargetColor;
${shader.fragmentShader}`.replace(
                        "#include <map_fragment>",
                        `#include <map_fragment>
float crystalPigment = 1.0 - smoothstep(0.03, 0.2, distance(diffuseColor.rgb, crystalSourceColor));
diffuseColor.rgb = mix(diffuseColor.rgb, crystalTargetColor, crystalPigment);`
                    )
                }
                material.customProgramCacheKey = () => "crystal-palette-swap"
            } else if (
                material instanceof MeshStandardMaterial &&
                material.name.includes("sparkles_1")
            ) {
                material.color.setRGB(to.sparkle[0], to.sparkle[1], to.sparkle[2])
            }
        }
    })
}
