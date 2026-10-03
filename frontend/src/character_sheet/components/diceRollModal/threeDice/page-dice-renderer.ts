import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { PageDicePhysics, pageBounds, initDicePhysics, type DiceData } from "./page-dice-physics"
import { createLiquidRenderer } from "./liquid-renderer.js"
import regular from "./regular.json"
import hunger from "./hunger.json"
import type { DieResult } from "../parts/DiceContainer"
import type { VampireDiceStyle, VampireThrowSettings } from "./settings"

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

    constructor(
        private host: HTMLElement,
        private onDieClick: (id: number, isBloodDie: boolean) => void
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
        await initDicePhysics()
        if (this.disposed || generation !== this.generation) return
        const names = style === "vtm" ? ["vtmblack", "vtmred"] : ["vtmruby", "vtmviolet"]
        // Load each role once; every die uses a clone of its role's template.
        const templates = await Promise.all(names.map((name) => this.template(name)))
        if (this.disposed || generation !== this.generation) return
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
                    transform: "translate(-50%, -50%)",
                    width: "66px",
                    height: "76px",
                    borderRadius: "14px",
                    background: "transparent",
                    border: "2px solid transparent",
                    color: "white",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "end",
                    justifyContent: "center",
                    textShadow: "0 1px 4px black"
                })
                button.addEventListener("click", () => this.onDieClick(die.id, die.isBloodDie))
                this.host.append(button)
                return button
            })
            this.liquid.setRoots(this.meshes)
        }
        this.style = style
        this.dice = dice
        this.dieSize = this.host.clientWidth < 600 ? 0.6 : 1.1
        if (!samePool) {
            this.physics?.dispose()
            this.physics = new PageDicePhysics(
                pageBounds(this.host.clientWidth, this.host.clientHeight, dice.length, this.dieSize)
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
        this.invalidate()
    }
    private resize = () => {
        if (!this.dice.length || this.disposed) return
        const width = Math.max(1, this.host.clientWidth),
            height = Math.max(1, this.host.clientHeight)
        this.dieSize = width < 600 ? 0.6 : 1.1
        const bounds = pageBounds(width, height, this.dice.length, this.dieSize)
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
        if (this.physics.settled && !this.finished) {
            this.finished = true
            // Only moving dice acquire new values. Hunger and unselected dice
            // preserve their result during a willpower reroll.
            this.dice = this.dice.map((die, index) =>
                die.isRolling
                    ? { ...die, value: this.physics!.results()[index].value, isRolling: false }
                    : die
            )
            this.updateButtons()
            this.done?.(this.dice)
        }
        if (!this.physics.settled) this.invalidate()
    }
    private updateButtons() {
        this.buttons.forEach((button, index) => {
            const die = this.dice[index]
            const settled = !!this.physics?.settled
            const point = this.meshes[index].position.clone().project(this.camera)
            button.hidden = !settled
            button.style.left = `${Math.max(33, Math.min(this.host.clientWidth - 33, ((point.x + 1) * this.host.clientWidth) / 2))}px`
            button.style.top = `${Math.max(38, Math.min(this.host.clientHeight - 38, ((1 - point.y) * this.host.clientHeight) / 2 + 8))}px`
            button.textContent = `${die.isBloodDie ? "Hunger" : "Regular"} · ${die.value}`
            button.setAttribute(
                "aria-label",
                `${die.isBloodDie ? "Hunger" : "Regular"} die ${index + 1} showing ${die.value}`
            )
            button.disabled = die.isBloodDie || !this.canSelect || !settled
            // Disabled hunger dice still intercept taps, keeping the sheet
            // beneath them from treating a reroll attempt as a stat edit.
            button.style.pointerEvents = settled ? "auto" : "none"
            button.style.whiteSpace = "nowrap"
            button.style.cursor = button.disabled ? "default" : "pointer"
            button.style.borderColor = this.selected.has(die.id) ? "#eacb7c" : "transparent"
            button.setAttribute("aria-pressed", String(this.selected.has(die.id)))
        })
    }
    select(ids: Set<number>, canSelect: boolean) {
        this.selected = ids
        this.canSelect = canSelect
        this.updateButtons()
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
