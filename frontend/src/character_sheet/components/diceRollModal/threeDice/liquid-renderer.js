import {
    WebGLRenderTarget,
    HalfFloatType,
    LinearMipmapLinearFilter,
    Vector2,
    ShaderChunk,
    NoToneMapping
} from "three"

/** Render transparent pigments before refracting them through their clear shells.
 * Compatible with the kit's pinned Three.js 0.186.0. Call setRoots after loading dice.
 */
export function createLiquidRenderer(renderer, scene, camera) {
    const size = new Vector2()
    const target = new WebGLRenderTarget(1, 1, {
        type: HalfFloatType,
        minFilter: LinearMipmapLinearFilter,
        generateMipmaps: true,
        depthBuffer: true
    })
    let shells = [],
        contents = [],
        bindings = [],
        pigmentStates = []
    const map = { value: target.texture },
        dimensions = { value: new Vector2(1, 1) }
    function restore() {
        for (const [object, original, order] of pigmentStates) {
            object.material.dispose()
            object.material = original
            object.renderOrder = order
        }
        pigmentStates = []
        for (const [object, material] of bindings) {
            object.material.dispose()
            object.material = material
        }
        bindings = []
        shells = []
        contents = []
    }
    return {
        setRoots(roots) {
            restore()
            for (const root of roots)
                root.traverse((object) => {
                    if (!object.isMesh) return
                    // Smoke slices blend through one another; they must not mask the defined cores.
                    if (object.userData.component === "smokeVolume") {
                        pigmentStates.push([object, object.material, object.renderOrder])
                        object.material = object.material.clone()
                        object.material.onBeforeCompile = pigmentStates.at(-1)[1].onBeforeCompile
                        object.material.customProgramCacheKey =
                            pigmentStates.at(-1)[1].customProgramCacheKey
                        object.material.depthWrite = false
                        object.renderOrder = 1
                    }
                    if (
                        object.userData.component === "vaporCore" ||
                        (object.name.startsWith("blood_") && object.name.includes("_suspended_"))
                    ) {
                        pigmentStates.push([object, object.material, object.renderOrder])
                        object.material = object.material.clone()
                        object.material.onBeforeCompile = pigmentStates.at(-1)[1].onBeforeCompile
                        object.material.customProgramCacheKey =
                            pigmentStates.at(-1)[1].customProgramCacheKey
                        object.material.depthWrite = false
                        object.renderOrder = 2
                    }
                    if (object.userData.role === "shell") {
                        const original = object.material
                        object.material = original.clone()
                        bindings.push([object, original])
                        shells.push(object)
                        object.material.onBeforeCompile = (shader) => {
                            original.onBeforeCompile(shader, renderer)
                            shader.uniforms.liquidInteriorMap = map
                            shader.uniforms.liquidInteriorSize = dimensions
                            shader.fragmentShader = shader.fragmentShader.replace(
                                "#include <transmission_pars_fragment>",
                                ShaderChunk.transmission_pars_fragment
                                    .replaceAll("transmissionSamplerMap", "liquidInteriorMap")
                                    .replaceAll("transmissionSamplerSize", "liquidInteriorSize")
                            )
                        }
                        object.material.customProgramCacheKey = () =>
                            `dice-liquid-interior-v1:${original.customProgramCacheKey()}`
                        object.material.needsUpdate = true
                    } else if (
                        object.userData.role === "inclusion" ||
                        object.userData.role === "goldFlakes"
                    )
                        contents.push(object)
                })
        },
        /** mainRender usually calls composer.render() or renderer.render(scene,camera). */
        render(mainRender) {
            if (!shells.length) {
                mainRender()
                return
            }
            renderer.getDrawingBufferSize(size)
            if (target.width !== size.x || target.height !== size.y) {
                target.setSize(size.x, size.y)
                dimensions.value.copy(size)
            }
            const shellVisibility = shells.map((o) => o.visible),
                contentVisibility = contents.map((o) => o.visible)
            const previousTarget = renderer.getRenderTarget(),
                toneMapping = renderer.toneMapping
            try {
                for (const object of shells) object.visible = false
                renderer.toneMapping = NoToneMapping
                renderer.setRenderTarget(target)
                renderer.clear()
                renderer.render(scene, camera)
                renderer.setRenderTarget(previousTarget)
                renderer.toneMapping = toneMapping
                shells.forEach((o, i) => (o.visible = shellVisibility[i]))
                for (const object of contents) object.visible = false
                mainRender()
            } finally {
                renderer.setRenderTarget(previousTarget)
                renderer.toneMapping = toneMapping
                shells.forEach((o, i) => (o.visible = shellVisibility[i]))
                contents.forEach((o, i) => (o.visible = contentVisibility[i]))
            }
        },
        dispose() {
            restore()
            target.dispose()
        }
    }
}
