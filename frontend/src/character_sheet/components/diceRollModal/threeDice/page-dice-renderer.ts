import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { PageDicePhysics, pageBounds, initDicePhysics, type DiceData } from "./page-dice-physics"
import { createLiquidRenderer } from "./liquid-renderer.js"
import regular from "./regular.json"
import hunger from "./hunger.json"
import type { DieResult } from "../parts/DiceContainer"
import {
    dieOutcome,
    VAMPIRE_DICE_MODELS,
    type VampireDiceStyle,
    type VampireThrowSettings
} from "./settings"
import type { ScreenRectangle } from "./page-dice-physics"
import { swapCrystalColors } from "./crystal-colors"
import { layoutDieTargets } from "./overlay-layout"
import { sortedSlots } from "./sorted-layout"

const downloads = new Map<string, Promise<ArrayBuffer>>()
const loadBytes = (name: string) => {
    if (!downloads.has(name)) {
        downloads.set(
            name,
            fetch(`${import.meta.env.BASE_URL}dice/vampire/${name}_d10.glb`)
                .then((response) => {
                    if (!response.ok)
                        throw new Error(`Could not load vampire dice (${response.status})`)
                    return response.arrayBuffer()
                })
                .catch((error) => {
                    downloads.delete(name)
                    throw error
                })
        )
    }
    return downloads.get(name)!
}

/** The physics and crystal refraction pass come from the Dice Atelier kit.
 * React owns controls/results; this renderer owns only page dice and selection.
 */
export class PageDiceRenderer {
    private renderer: THREE.WebGLRenderer
    private scene = new THREE.Scene()
    private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    private environment: THREE.WebGLRenderTarget
    private liquid
    private physics?: PageDicePhysics
    private templates = new Map<string, THREE.Object3D>()
    private meshes: THREE.Object3D[] = []
    private buttons: HTMLButtonElement[] = []
    private dice: DieResult[] = []
    private style?: VampireDiceStyle
    private frameId = 0
    private last = 0
    private generation = 0
    private disposed = false
    private finished = false
    private done?: (dice: DieResult[]) => void
    private observer: ResizeObserver
    private dieSize = 1
    private selected = new Set<number>()
    private canSelect = false
    private materials = new Set<THREE.Material>()
    private geometries = new Set<THREE.BufferGeometry>()
    private controlsBounds?: ScreenRectangle
    private gridSized = false
    private preparing = false
    private pendingSort = false

    constructor(
        private host: HTMLElement,
        private onDieClick: (id: number, isBloodDie: boolean) => void,
        private onDieContextMenu?: (id: number, position: { x: number; y: number }) => void
    ) {
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            premultipliedAlpha: true
        })
        this.renderer.setClearColor(0, 0)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 0.9
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFShadowMap
        Object.assign(this.renderer.domElement.style, {
            width: "100%",
            height: "100%",
            position: "absolute",
            pointerEvents: "none"
        })
        this.renderer.domElement.setAttribute("role", "img")
        this.renderer.domElement.setAttribute("aria-label", "Vampire dice rolling on the page")
        host.append(this.renderer.domElement)
        const pmrem = new THREE.PMREMGenerator(this.renderer)
        const room = new RoomEnvironment()
        this.environment = pmrem.fromScene(room, 0.04)
        room.dispose()
        pmrem.dispose()
        this.scene.environment = this.environment.texture
        this.scene.environmentIntensity = 0.65
        this.scene.environmentRotation.set(0.85, 0.35, 0.2)
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7bc, 0.4))
        const light = new THREE.DirectionalLight(0xfff3e5, 1.6)
        light.position.set(-8, 18, 10)
        light.castShadow = true
        light.shadow.mapSize.set(1024, 1024)
        Object.assign(light.shadow.camera, {
            left: -40,
            right: 40,
            top: 40,
            bottom: -40,
            near: 0.1,
            far: 70
        })
        light.shadow.normalBias = 0.02
        light.shadow.bias = -0.00005
        this.scene.add(light)
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.ShadowMaterial({ opacity: 0.3 })
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.y = -0.004
        floor.receiveShadow = true
        this.scene.add(floor)
        this.trackResources(floor)
        this.camera.position.set(0, 40, 0)
        this.camera.up.set(0, 0, -1)
        this.camera.lookAt(0, 0, 0)
        this.liquid = createLiquidRenderer(this.renderer, this.scene, this.camera)
        this.observer = new ResizeObserver(this.resize)
        this.observer.observe(host)
        document.addEventListener("visibilitychange", this.onVisibility)
        this.renderer.domElement.addEventListener("webglcontextlost", this.onContextLost)
    }

    private trackResources(root: THREE.Object3D) {
        root.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            this.geometries.add(object.geometry)
            for (const material of Array.isArray(object.material)
                ? object.material
                : [object.material])
                this.materials.add(material)
        })
    }
    private async template(name: string) {
        if (!this.templates.has(name)) {
            const bytes = await loadBytes(name)
            if (this.disposed) throw new Error("Dice roller closed")
            const model = await new GLTFLoader().parseAsync(bytes, "")
            if (name === "vtmruby" || name === "vtmviolet")
                swapCrystalColors(model.scene, name === "vtmruby" ? "ruby" : "violet")
            this.trackResources(model.scene)
            if (this.disposed) {
                this.disposeResources()
                throw new Error("Dice roller closed")
            }
            this.templates.set(name, model.scene)
        }
        return this.templates.get(name)!
    }
    async roll(
        dice: DieResult[],
        style: VampireDiceStyle,
        settings: VampireThrowSettings,
        done: (dice: DieResult[]) => void
    ) {
        const generation = ++this.generation
        this.preparing = true
        await initDicePhysics()
        if (this.disposed || generation !== this.generation) return
        const names = VAMPIRE_DICE_MODELS[style]
        // Load each role once; every die uses a clone of its role's template.
        const templates = await Promise.all(names.map((name) => this.template(name)))
        if (this.disposed || generation !== this.generation) return
        this.preparing = false
        const samePool =
            dice.length === this.dice.length &&
            dice.every((die, index) => die.id === this.dice[index].id)
        if (!samePool || style !== this.style) {
            this.liquid.setRoots([])
            for (const mesh of this.meshes) this.scene.remove(mesh)
            for (const button of this.buttons) button.remove()
            this.meshes = dice.map((die) => {
                const mesh = templates[die.isBloodDie ? 1 : 0].clone(true)
                mesh.position.set(0, 0, 0)
                mesh.quaternion.identity()
                mesh.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.castShadow = true
                        object.receiveShadow = true
                    }
                })
                this.scene.add(mesh)
                return mesh
            })
            this.buttons = dice.map((die) => {
                const button = document.createElement("button")
                Object.assign(button.style, {
                    position: "absolute",
                    padding: "0",
                    boxSizing: "border-box",
                    background: "transparent",
                    border: "0",
                    color: "white",
                    textShadow: "0 1px 4px black"
                })
                const caption = document.createElement("span")
                caption.setAttribute("aria-hidden", "true")
                Object.assign(caption.style, {
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    pointerEvents: "none",
                    textAlign: "center",
                    lineHeight: "1.1",
                    whiteSpace: "normal"
                })
                button.append(caption)
                button.addEventListener("click", () => {
                    if (this.canSelect && !die.isBloodDie && this.physics?.settled)
                        this.onDieClick(die.id, die.isBloodDie)
                })
                button.addEventListener("contextmenu", (event) => {
                    event.preventDefault()
                    const rect = button.getBoundingClientRect()
                    this.onDieContextMenu?.(die.id, {
                        x: event.clientX || rect.left + rect.width / 2,
                        y: event.clientY || rect.top + rect.height / 2
                    })
                })
                this.host.append(button)
                return button
            })
            this.liquid.setRoots(this.meshes)
        }
        if (!samePool) this.gridSized = false
        this.style = style
        this.dice = dice
        this.dieSize = this.host.clientWidth < 600 ? 0.6 : 1.1
        if (!samePool) {
            this.physics?.dispose()
            this.physics = new PageDicePhysics(
                pageBounds(
                    this.host.clientWidth,
                    this.host.clientHeight,
                    dice.length,
                    this.dieSize,
                    this.controlsBounds
                )
            )
            dice.forEach((die) =>
                this.physics!.add((die.isBloodDie ? hunger : regular) as unknown as DiceData)
            )
            if (dice.some((die) => !die.isRolling))
                this.physics.showValues(dice.map((die) => (die.isRolling ? 1 : die.value)))
        }
        this.resize()
        const rolling = new Set(dice.flatMap((die, index) => (die.isRolling ? [index] : [])))
        if (rolling.size) {
            this.done = done
            this.finished = false
            this.physics!.launch(Math.random, settings, [...rolling])
            if (matchMedia("(prefers-reduced-motion: reduce)").matches)
                this.physics!.settleImmediately()
        }
        if (!rolling.size && !samePool) {
            this.physics!.showValues(dice.map((die) => die.value))
            this.finished = true
        }
        this.last = performance.now()
        if (this.pendingSort) {
            this.pendingSort = false
            this.sort()
        }
        this.invalidate()
    }
    setControlsBounds(bounds?: ScreenRectangle) {
        this.controlsBounds = bounds
        this.resize()
    }
    private resize = () => {
        if (!this.dice.length || this.disposed) return
        const width = Math.max(1, this.host.clientWidth),
            height = Math.max(1, this.host.clientHeight)
        this.dieSize = width < 600 ? 0.6 : 1.1
        const bounds = pageBounds(
            width,
            height,
            this.dice.length,
            this.dieSize,
            this.controlsBounds
        )
        if (this.gridSized) {
            // Dense pools must fit one readable grid, rather than scattered free slots.
            for (
                let attempt = 0;
                attempt < 48 &&
                this.dice.length &&
                sortedSlots(bounds, this.dice.length).length < this.dice.length;
                attempt++
            ) {
                bounds.halfX *= 1.08
                bounds.halfZ *= 1.08
                bounds.bottomInset *= 1.08
                if (bounds.blocked)
                    for (const key of ["minX", "maxX", "minZ", "maxZ"] as const)
                        bounds.blocked[key] *= 1.08
            }
        }
        this.renderer.setSize(width, height, false)
        this.camera.aspect = width / height
        this.camera.fov = THREE.MathUtils.radToDeg(
            2 * Math.atan(bounds.halfZ / bounds.cameraHeight)
        )
        this.camera.updateProjectionMatrix()
        this.physics?.resize(bounds)
        this.invalidate()
    }
    private onVisibility = () => {
        if (document.hidden) {
            cancelAnimationFrame(this.frameId)
            this.frameId = 0
        } else {
            this.last = performance.now()
            this.invalidate()
        }
    }
    private onContextLost = (event: Event) => {
        event.preventDefault()
        this.host.dispatchEvent(new Event("dice-renderer-unavailable"))
    }
    private invalidate() {
        if (!this.frameId && this.physics && !this.disposed && !document.hidden)
            this.frameId = requestAnimationFrame(this.frame)
    }
    private frame = (now: number) => {
        this.frameId = 0
        if (!this.physics || this.disposed) return
        this.physics.step(Math.min((now - this.last) / 1000, 0.05))
        this.last = now
        this.meshes.forEach((mesh, index) => {
            mesh.position.copy(this.physics!.dice[index].body.translation())
            mesh.quaternion.copy(this.physics!.dice[index].body.rotation())
        })
        this.liquid.render(() => this.renderer.render(this.scene, this.camera))
        this.updateButtons()
        this.finishRoll()
        if (!this.physics.settled) this.invalidate()
    }
    private finishRoll() {
        if (!this.physics?.settled || this.finished) return
        this.finished = true
        const results = this.physics.results()
        // Only moving dice acquire new values. Hunger and unselected dice
        // preserve their result during a willpower reroll.
        this.dice = this.dice.map((die, index) =>
            die.isRolling ? { ...die, value: results[index].value, isRolling: false } : die
        )
        this.updateButtons()
        this.done?.(this.dice)
    }
    private updateButtons() {
        if (!this.physics) return
        const width = this.host.clientWidth,
            height = this.host.clientHeight
        const boxes = this.physics.dice.map((die) => {
            const rotation = new THREE.Quaternion().copy(die.body.rotation())
            const position = die.body.translation()
            const points = die.data.vertices.map((vertex) => {
                const point = new THREE.Vector3(...vertex)
                    .applyQuaternion(rotation)
                    .add(position)
                    .project(this.camera)
                return { x: ((point.x + 1) * width) / 2, y: ((1 - point.y) * height) / 2 }
            })
            const left = Math.max(0, Math.min(...points.map((point) => point.x)))
            const top = Math.max(0, Math.min(...points.map((point) => point.y)))
            return {
                left,
                top,
                width: Math.max(
                    0,
                    Math.min(width, Math.max(...points.map((point) => point.x))) - left
                ),
                height: Math.max(
                    0,
                    Math.min(height, Math.max(...points.map((point) => point.y))) - top
                )
            }
        })
        const targets = layoutDieTargets(boxes)
        this.buttons.forEach((button, index) => {
            const die = this.dice[index]
            const settled = !!this.physics?.settled
            button.hidden = false
            const target = targets[index]
            button.style.left = `${target.left}px`
            button.style.top = `${target.top}px`
            button.style.width = `${target.width}px`
            button.style.height = `${target.height}px`
            const outcome = dieOutcome(die.value, die.isBloodDie)
            const caption = button.firstElementChild as HTMLSpanElement
            caption.textContent = die.isRolling ? "" : outcome
            caption.style.width = `${boxes[index].width}px`
            caption.style.fontSize = `${Math.min(11, boxes[index].width / 7)}px`
            button.setAttribute(
                "aria-label",
                `${die.isRolling ? "Rolling" : outcome}, ${die.isBloodDie ? "hunger" : "regular"} die ${index + 1}`
            )
            const selectionDisabled = die.isBloodDie || !this.canSelect || !settled
            // Keep the context menu available for hunger dice and exhausted willpower.
            button.setAttribute("aria-disabled", String(selectionDisabled))
            button.style.pointerEvents = "auto"
            button.style.cursor = selectionDisabled ? "default" : "pointer"
            const selected = this.selected.has(die.id) && !die.isBloodDie
            button.style.borderRadius = "12px"
            button.style.boxShadow = selected
                ? "0 0 12px 3px rgba(207, 34, 59, 0.65), inset 0 0 12px rgba(207, 34, 59, 0.25)"
                : "none"
            caption.style.color = selected ? "#f2b7c0" : "white"
            button.setAttribute("aria-pressed", String(this.selected.has(die.id)))
        })
    }
    select(ids: Set<number>, canSelect: boolean) {
        this.selected = ids
        this.canSelect = canSelect
        this.updateButtons()
        this.invalidate()
    }
    private disposeResources() {
        for (const geometry of this.geometries) geometry.dispose()
        const textures = new Set<THREE.Texture>()
        for (const material of this.materials) {
            for (const value of Object.values(material))
                if (value instanceof THREE.Texture) textures.add(value)
            material.dispose()
        }
        textures.forEach((texture) => {
            texture.dispose()
            if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap)
                texture.image.close()
        })
        this.geometries.clear()
        this.materials.clear()
    }
    sort() {
        if (this.disposed) return
        if (this.preparing) {
            this.pendingSort = true
            return
        }
        if (!this.physics || !this.dice.length) return
        // Capture the current top faces before resize can start recovery.
        const results = this.physics.results()
        const values = this.dice.map((die, index) =>
            die.isRolling ? results[index].value : die.value
        )
        this.gridSized = true
        this.resize()
        if (!this.physics.sort(values, true)) return
        this.finishRoll()
        this.updateButtons()
        this.invalidate()
    }
    clear() {
        this.preparing = false
        this.pendingSort = false
        this.gridSized = false
        this.generation++
        cancelAnimationFrame(this.frameId)
        this.frameId = 0
        this.done = undefined
        this.liquid.setRoots([])
        for (const mesh of this.meshes) this.scene.remove(mesh)
        this.buttons.forEach((button) => button.remove())
        this.buttons = []
        this.meshes = []
        this.dice = []
        this.selected = new Set()
        this.physics?.dispose()
        this.physics = undefined
        this.renderer.clear()
    }
    dispose() {
        this.disposed = true
        this.generation++
        cancelAnimationFrame(this.frameId)
        this.observer.disconnect()
        document.removeEventListener("visibilitychange", this.onVisibility)
        this.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost)
        this.physics?.dispose()
        this.liquid.dispose()
        this.environment.dispose()
        this.disposeResources()
        this.scene.traverse((object) => {
            if (object instanceof THREE.DirectionalLight) object.shadow.dispose()
        })
        this.renderer.dispose()
        this.renderer.domElement.remove()
        this.buttons.forEach((button) => button.remove())
    }
}
