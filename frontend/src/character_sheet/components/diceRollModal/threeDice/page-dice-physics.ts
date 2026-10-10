import RAPIER from "@dimforge/rapier3d-compat"
import { Quaternion, Vector3 } from "three"
import { sortedSlots } from "./sorted-layout"

export type Triple = [number, number, number]
export interface DiceData {
    name: string
    vertices: Triple[]
    readMode: string
    faceValues: {
        value: number
        normal: Triple
        center: Triple
        labelUp?: Triple
        label?: string
    }[]
    vertexValues?: { value: number; direction: Triple }[]
}
export interface ThrowSettings {
    /** Height of the die center in nominal die diameters. */
    dropHeight: number
    /** Screen-space clockwise degrees: 0 right, 90 down, 270 up. */
    direction: number
    /** Each die gets an independent deviation within +/- spread degrees. */
    spread: number
    intensity: number
    /** Horizontal pool position: 0 is center, +/-100 at the edges, +/-150 offscreen. */
    startX: number
}
export const DEFAULT_THROW: Readonly<ThrowSettings> = {
    dropHeight: 2.5,
    direction: 315,
    spread: 55,
    intensity: 1,
    startX: 0
}
export function normalizeThrow(options: Partial<ThrowSettings> = {}): ThrowSettings {
    const finite = (key: keyof ThrowSettings) =>
        Number.isFinite(options[key]) ? options[key]! : DEFAULT_THROW[key]
    return {
        dropHeight: Math.max(0.6, Math.min(30, finite("dropHeight"))),
        direction: ((finite("direction") % 360) + 360) % 360,
        spread: Math.max(0, Math.min(180, finite("spread"))),
        intensity: Math.max(0, Math.min(10, finite("intensity"))),
        startX: Math.max(-150, Math.min(150, finite("startX")))
    }
}
export interface Result {
    value: number
    shownValue: number
    alignment: number
    margin: number
    label?: string
    recovered: boolean
    cocked: boolean
    /** The leading face was leveled in place after a cocked landing. */
    corrected: boolean
}
export interface Bounds {
    halfX: number
    halfZ: number
    cameraHeight: number
    bottomInset: number
    blocked?: { minX: number; maxX: number; minZ: number; maxZ: number }
}
export interface ScreenRectangle {
    left: number
    top: number
    right: number
    bottom: number
}
export interface Die {
    data: DiceData
    body: RAPIER.RigidBody
    collider: RAPIER.Collider
    recovered: boolean
    corrected: boolean
    entered: boolean
    highEntry: boolean
}
let ready: Promise<void> | undefined
export function initDicePhysics() {
    return (ready ??= RAPIER.init())
}
const up = new Vector3(0, 1, 0),
    clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export function readTop(
    data: DiceData,
    rotation: { x: number; y: number; z: number; w: number }
): Result {
    const q = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    const options =
        data.readMode === "highestVertex"
            ? data.vertexValues!.map((f) => ({
                  ...f,
                  normal: f.direction,
                  label: undefined
              }))
            : data.faceValues
    const scored = options
        .map((f) => ({
            ...f,
            score: new Vector3(...f.normal).applyQuaternion(q).y
        }))
        .sort((a, b) => b.score - a.score)
    return {
        value: scored[0].value === 0 ? 10 : scored[0].value,
        shownValue: scored[0].value,
        alignment: scored[0].score,
        margin: scored[0].score - scored[1].score,
        label: scored[0].label,
        recovered: false,
        corrected: false,
        cocked: scored[0].score < 0.985 || scored[0].score - scored[1].score < 0.08
    }
}
/** Uniform SO(3) orientation (Shoemake), using three independent uniforms. */
export function randomRotation(random = Math.random) {
    const u = random(),
        a = 2 * Math.PI * random(),
        b = 2 * Math.PI * random()
    return new Quaternion(
        Math.sqrt(1 - u) * Math.sin(a),
        Math.sqrt(1 - u) * Math.cos(a),
        Math.sqrt(u) * Math.sin(b),
        Math.sqrt(u) * Math.cos(b)
    )
}
export function flatRotation(
    data: DiceData,
    rotation: { x: number; y: number; z: number; w: number }
) {
    const q = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
        result = readTop(data, rotation)
    const local =
        data.readMode === "highestVertex"
            ? data.vertexValues!.find((f) => f.value === result.shownValue)!.direction
            : data.faceValues.find((f) => f.value === result.shownValue)!.normal
    return new Quaternion()
        .setFromUnitVectors(new Vector3(...local).applyQuaternion(q).normalize(), up)
        .multiply(q)
        .normalize()
}
export function supportHeight(data: DiceData, q: Quaternion) {
    return -Math.min(...data.vertices.map((v) => new Vector3(...v).applyQuaternion(q).y)) + 0.006
}
/** World extents at page plane. Enlarge the world for dense pools instead of shrinking margins. */
export function pageBounds(
    width: number,
    height: number,
    count: number,
    dieSize = 1,
    controls?: ScreenRectangle
): Bounds {
    const footerPixels = Math.min(110, height * 0.18)
    // Change apparent size through the camera; keep colliders and mass consistent.
    const size = Number.isFinite(dieSize) ? clamp(dieSize, 0.6, 1.4) : 1
    let ppu = Math.min(49, width / 8, height / 9) * size
    const bounds = (): Bounds => ({
        halfX: width / ppu / 2,
        halfZ: height / ppu / 2,
        cameraHeight: 40,
        bottomInset: footerPixels / ppu,
        blocked: controls
            ? {
                  minX: controls.left / ppu - width / ppu / 2,
                  maxX: controls.right / ppu - width / ppu / 2,
                  minZ: controls.top / ppu - height / ppu / 2,
                  maxZ: controls.bottom / ppu - height / ppu / 2
              }
            : undefined
    })
    while (landingSlots(bounds()).length < count) ppu *= 0.94
    return bounds()
}

const landingSlots = (bounds: Bounds): [number, number][] => {
    const { halfX: x, halfZ: z, blocked } = bounds
    const cols = Math.max(1, Math.floor((2 * x - 3) / 2.35) + 1)
    const rows = Math.max(1, Math.floor((2 * z - bounds.bottomInset - 3) / 2.35) + 1)
    const points: [number, number][] = []
    // Reserve the projected bounding sphere at resting height, not just the center.
    const perspective = 1 - 2.04 / bounds.cameraHeight
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const px = (col - (cols - 1) / 2) * 2.35
            const pz = (row - (rows - 1) / 2) * 2.35 - bounds.bottomInset / 2
            if (
                blocked &&
                px + 1.12 > blocked.minX * perspective &&
                px - 1.12 < blocked.maxX * perspective &&
                pz + 1.12 > blocked.minZ * perspective &&
                pz - 1.12 < blocked.maxZ * perspective
            )
                continue
            points.push([px, pz])
        }
    }
    return points.sort((a, b) => Math.hypot(...a) - Math.hypot(...b))
}
export class PageDicePhysics {
    world: RAPIER.World
    dice: Die[] = []
    bounds: Bounds
    elapsed = 0
    settled = false
    recoveries = 0
    collisions = 0
    private queue = new RAPIER.EventQueue(true)
    private walls: RAPIER.Collider[] = []
    private acc = 0
    private held = new Set<Die>()
    private recovery?: {
        time: number
        targets: {
            die: Die
            from: Vector3
            to: Vector3
            q0: Quaternion
            q1: Quaternion
            reposition: boolean
        }[]
    }
    constructor(bounds: Bounds) {
        this.bounds = bounds
        this.world = new RAPIER.World({ x: 0, y: -28, z: 0 })
        this.world.timestep = 1 / 120
        this.world.integrationParameters.numSolverIterations = 8
        this.world.createCollider(
            RAPIER.ColliderDesc.cuboid(1000, 0.25, 1000)
                .setTranslation(0, -0.25, 0)
                .setFriction(0.65)
                .setRestitution(0.28)
        )
        this.makeWalls()
    }
    private makeWalls() {
        for (const wall of this.walls) this.world.removeCollider(wall, true)
        this.walls = []
        const { halfX: x, halfZ: z } = this.bounds
        for (const [hx, hz, px, pz] of [
            [0.3, z + 1, -x - 0.3, 0],
            [0.3, z + 1, x + 0.3, 0],
            [x + 1, 0.3, 0, -z - 0.3],
            [x + 1, 0.3, 0, z - this.bounds.bottomInset + 0.3]
        ])
            this.walls.push(
                this.world.createCollider(
                    RAPIER.ColliderDesc.cuboid(hx, 12, hz)
                        .setTranslation(px, 11, pz)
                        .setCollisionGroups(0x00020001)
                        .setRestitution(0.32)
                        .setFriction(0.3)
                )
            )
        const blocked = this.bounds.blocked
        if (blocked) {
            this.walls.push(
                this.world.createCollider(
                    RAPIER.ColliderDesc.cuboid(
                        (blocked.maxX - blocked.minX) / 2,
                        12,
                        (blocked.maxZ - blocked.minZ) / 2
                    )
                        .setTranslation(
                            (blocked.minX + blocked.maxX) / 2,
                            11,
                            (blocked.minZ + blocked.maxZ) / 2
                        )
                        .setCollisionGroups(0x00020001)
                        .setRestitution(0.32)
                        .setFriction(0.3)
                )
            )
        }
    }
    add(data: DiceData) {
        const body = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setCcdEnabled(true)
                .setLinearDamping(0.22)
                .setAngularDamping(0.32)
                .setCanSleep(true)
                .setAdditionalSolverIterations(4)
        )
        const desc = RAPIER.ColliderDesc.convexHull(new Float32Array(data.vertices.flat()))
        if (!desc) throw new Error("Invalid convex dice hull")
        const collider = this.world.createCollider(
            desc
                .setMass(1)
                .setFriction(0.62)
                .setRestitution(0.3)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
            body
        )
        const die = {
            data,
            body,
            collider,
            recovered: false,
            corrected: false,
            entered: true,
            highEntry: false
        }
        this.dice.push(die)
        return die
    }
    reroll(indices: readonly number[], random = Math.random, options: Partial<ThrowSettings> = {}) {
        if (
            !this.settled ||
            !indices.length ||
            indices.some((i) => !Number.isInteger(i) || !this.dice[i])
        )
            return false
        this.launch(random, options, indices)
        return true
    }
    launch(
        random = Math.random,
        options: Partial<ThrowSettings> = {},
        indices: readonly number[] = this.dice.map((_, i) => i)
    ) {
        const settings = normalizeThrow(options)
        this.elapsed = 0
        this.settled = false
        this.recovery = undefined
        this.acc = 0
        this.held = new Set(this.dice.filter((_, i) => !indices.includes(i)))
        const points = this.slots()
        const poolHalfWidth = Math.max(
            ...points.slice(0, this.dice.length).map(([x]) => Math.abs(x) * 0.7),
            0
        )
        const startOffset = (settings.startX / 100) * (this.bounds.halfX + poolHalfWidth + 1)
        this.dice.forEach((d, i) => {
            if (this.held.has(d)) {
                d.body.setLinvel({ x: 0, y: 0, z: 0 }, false)
                d.body.setAngvel({ x: 0, y: 0, z: 0 }, false)
                d.body.setBodyType(RAPIER.RigidBodyType.Fixed, false)
                d.collider.setEnabled(true)
                return
            }
            d.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
            d.collider.setEnabled(true)
            d.recovered = false
            d.corrected = false
            d.entered = settings.startX === 0
            d.highEntry = settings.dropHeight > 4
            d.collider.setCollisionGroups(d.entered ? 0x00010003 : 0x00010001)
            const [x, z] = points[i]
            const q = randomRotation(random)
            d.body.setRotation(q, true)
            d.body.setTranslation(
                {
                    x: x * 0.7 + startOffset,
                    y: settings.dropHeight * 2 + (random() - 0.5) * 0.4,
                    z: z * 0.7
                },
                true
            )
            const angle =
                ((settings.direction + (random() * 2 - 1) * settings.spread) * Math.PI) / 180
            // Vary travel independently of spin and fall: short throws should still
            // tumble and hit firmly, while stronger throws can cross the page.
            const speed = 12 * settings.intensity * (0.3 + random() * 0.95)
            d.body.setLinvel(
                {
                    x: Math.cos(angle) * speed,
                    y: -(1 + random()) * settings.intensity,
                    z: Math.sin(angle) * speed
                },
                true
            )
            d.body.setAngvel(
                {
                    x: (random() - 0.5) * 20 * settings.intensity,
                    y: (random() - 0.5) * 18 * settings.intensity,
                    z: (random() - 0.5) * 20 * settings.intensity
                },
                true
            )
            this.contain(d)
        })
    }
    private slots(): [number, number][] {
        return landingSlots(this.bounds)
    }
    private contain(d: Die) {
        const p = d.body.translation(),
            v = d.body.linvel(),
            { halfX, halfZ, cameraHeight } = this.bounds
        if (p.y <= 8.5) d.highEntry = false
        const y = d.highEntry ? Math.max(p.y, -0.1) : clamp(p.y, -0.1, 8.5),
            // High drops may start behind the camera. Use the landing envelope
            // while they approach; never clamp their actual height.
            perspective = 1 - (Math.min(y, 8.5) + 1.02) / cameraHeight
        // Bounding sphere, including its nearest-to-camera point, stays within the frustum.
        const xLimit = Math.max(0.1, halfX * perspective - 1.12),
            zLimit = Math.max(0.1, halfZ * perspective - 1.12)
        // Side throws cross the boundary naturally before the walls engage.
        if (!d.entered && Math.abs(p.x) <= xLimit) {
            d.entered = true
            d.collider.setCollisionGroups(0x00010003)
        }
        let x = d.entered ? clamp(p.x, -xLimit, xLimit) : p.x,
            z = clamp(
                p.z,
                -zLimit,
                Math.max(0.1, (halfZ - this.bounds.bottomInset) * perspective - 1.12)
            )
        const blocked = this.bounds.blocked
        if (blocked) {
            const left = blocked.minX * perspective - 1.12
            const right = blocked.maxX * perspective + 1.12
            const top = blocked.minZ * perspective - 1.12
            const bottom = blocked.maxZ * perspective + 1.12
            if (x > left && x < right && z > top && z < bottom) {
                const moves = [
                    { x: left, z },
                    { x: right, z },
                    { x, z: top },
                    { x, z: bottom }
                ].filter(
                    (point) =>
                        Math.abs(point.x) <= xLimit &&
                        point.z >= -zLimit &&
                        point.z <= (halfZ - this.bounds.bottomInset) * perspective - 1.12
                )
                moves.sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))
                if (moves[0]) ({ x, z } = moves[0])
            }
        }
        if (x !== p.x || z !== p.z || y !== p.y) {
            d.body.setTranslation({ x, y, z }, false)
            d.body.setLinvel(
                {
                    x: x !== p.x ? Math.sign(x - p.x) * Math.abs(v.x) * 0.65 : v.x,
                    y: y !== p.y ? Math.min(0, v.y) : v.y,
                    z: z !== p.z ? Math.sign(z - p.z) * Math.abs(v.z) * 0.65 : v.z
                },
                false
            )
        }
    }
    /** Test the rotated hull against the actual viewport, not a larger sphere
     * or the optional HUD margin. Fully visible settled dice must stay untouched.
     */
    isFullyVisible(d: Die) {
        const p = d.body.translation(),
            q = new Quaternion().copy(d.body.rotation())
        const { halfX, halfZ, cameraHeight } = this.bounds
        const projected = d.data.vertices.map((v) => {
            const world = new Vector3(...v).applyQuaternion(q).add(p)
            const scale = (cameraHeight - world.y) / cameraHeight
            return { x: world.x / scale, z: world.z / scale, scale }
        })
        if (
            !projected.every(
                (v) => v.scale > 0 && Math.abs(v.x) <= halfX + 1e-6 && Math.abs(v.z) <= halfZ + 1e-6
            )
        )
            return false
        const blocked = this.bounds.blocked
        return (
            !blocked ||
            Math.max(...projected.map((v) => v.x)) <= blocked.minX ||
            Math.min(...projected.map((v) => v.x)) >= blocked.maxX ||
            Math.max(...projected.map((v) => v.z)) <= blocked.minZ ||
            Math.min(...projected.map((v) => v.z)) >= blocked.maxZ
        )
    }
    resize(bounds: Bounds) {
        if (
            bounds.halfX === this.bounds.halfX &&
            bounds.halfZ === this.bounds.halfZ &&
            bounds.cameraHeight === this.bounds.cameraHeight &&
            bounds.bottomInset === this.bounds.bottomInset &&
            JSON.stringify(bounds.blocked) === JSON.stringify(this.bounds.blocked)
        )
            return
        this.bounds = bounds
        this.makeWalls()
        this.held.clear()
        if (this.recovery || this.settled) {
            this.recovery = undefined
            this.recover()
        } else {
            for (const d of this.dice) this.contain(d)
        }
    }
    /** Relocate clipped dice; level only cocked dice in place. */
    recover() {
        if (this.recovery) return
        const clipped = this.dice.filter((d) => !this.held.has(d) && !this.isFullyVisible(d))
        const cocked = this.dice.filter(
            (d) =>
                !this.held.has(d) &&
                !clipped.includes(d) &&
                readTop(d.data, d.body.rotation()).cocked
        )
        this.recoverDice(clipped, cocked)
    }
    /** Before the first paint, reduced-motion rolls can be laid out without tumbling. */
    settleImmediately() {
        this.recoverDice(this.dice.filter((d) => !this.held.has(d)))
        for (let i = 0; i < 90 && !this.settled; i++) this.step(1 / 120)
    }
    /** Restore already-resolved results without giving them a new roll. */
    showValues(values: number[]) {
        const points = this.slots()
        this.dice.forEach((die, index) => {
            const face = die.data.faceValues.find((face) => face.value === values[index])!
            const q = new Quaternion().setFromUnitVectors(new Vector3(...face.normal), up)
            die.body.setRotation(q, false)
            die.body.setTranslation(
                { x: points[index][0], y: supportHeight(die.data, q), z: points[index][1] },
                false
            )
            die.body.setBodyType(RAPIER.RigidBodyType.Fixed, false)
        })
        this.settled = true
    }
    /** Presentation only: preserve each die's value and identity while arranging high to low. */
    sort(values: number[], finishRoll = false) {
        if ((!this.settled && !finishRoll) || values.length !== this.dice.length) return false
        const points = sortedSlots(this.bounds, this.dice.length)
        if (points.length !== this.dice.length) return false
        this.recovery = undefined
        this.settled = true
        this.held.clear()
        const order = values
            .map((value, index) => ({ value, index }))
            .sort((a, b) => b.value - a.value || a.index - b.index)
        order.forEach(({ value, index }, slot) => {
            const die = this.dice[index]
            const face = die.data.faceValues.find(
                (face) => (face.value === 0 ? 10 : face.value) === value
            )!
            const q = new Quaternion().setFromUnitVectors(
                new Vector3(...face.normal).normalize(),
                up
            )
            if (face.labelUp) {
                const direction = new Vector3(...face.labelUp).applyQuaternion(q)
                q.premultiply(
                    new Quaternion().setFromAxisAngle(up, Math.atan2(direction.x, -direction.z))
                )
            }
            die.body.setBodyType(RAPIER.RigidBodyType.Fixed, false)
            die.body.setLinvel({ x: 0, y: 0, z: 0 }, false)
            die.body.setAngvel({ x: 0, y: 0, z: 0 }, false)
            die.body.setRotation(q, false)
            die.body.setTranslation(
                { x: points[slot][0], y: supportHeight(die.data, q), z: points[slot][1] },
                false
            )
            die.collider.setEnabled(true)
        })
        return true
    }
    private recoverDice(clipped: Die[], cocked: Die[] = []) {
        const moving = [...clipped, ...cocked]
        // Every clear visible neighbour keeps its exact translation and rotation.
        const fixed = this.dice.filter((d) => !moving.includes(d))
        for (const d of fixed) {
            d.body.setBodyType(RAPIER.RigidBodyType.Fixed, false)
            d.collider.setEnabled(true)
        }
        if (!moving.length) {
            this.settled = true
            return
        }
        this.recoveries++
        this.settled = false
        const occupied = [...fixed, ...cocked].map((d) => d.body.translation())
        const available = this.slots()
        const targets = moving.map((d) => {
            const p = d.body.translation(),
                from = new Vector3(p.x, p.y, p.z),
                q0 = new Quaternion().copy(d.body.rotation()),
                q1 = flatRotation(d.data, q0)
            const reposition = clipped.includes(d)
            d.corrected ||= readTop(d.data, q0).cocked
            let to: Vector3
            if (!reposition) {
                // Keep x/z and the supporting surface height. A stacked die stays
                // stacked; a floor die lowers only enough to rest on its leveled face.
                const surface = Math.max(0, p.y - supportHeight(d.data, q0))
                to = new Vector3(p.x, surface + supportHeight(d.data, q1), p.z)
            } else {
                // Prefer a nearby vacant slot. Visible neighbours are never moved to make room.
                const ranked = available
                    .map(([x, z], index) => ({
                        x,
                        z,
                        index,
                        clearance: Math.min(
                            ...occupied.map((o) => Math.hypot(x - o.x, z - o.z)),
                            Infinity
                        ),
                        distance: Math.hypot(x - p.x, z - p.z)
                    }))
                    .sort(
                        (a, b) =>
                            Number(b.clearance >= 2.1) - Number(a.clearance >= 2.1) ||
                            (a.clearance < 2.1 && b.clearance < 2.1
                                ? b.clearance - a.clearance
                                : a.distance - b.distance)
                    )
                const best = ranked[0]
                const [x, z] = available.splice(best.index, 1)[0]
                to = new Vector3(x, supportHeight(d.data, q1), z)
                occupied.push(to)
                d.recovered = true
            }
            d.entered = true
            d.highEntry = false
            d.collider.setCollisionGroups(0x00010003)
            d.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
            d.collider.setEnabled(false)
            return { die: d, from, to, q0, q1, reposition }
        })
        this.recovery = { time: 0, targets }
    }
    step(dt: number) {
        if (this.settled) return
        this.acc += Math.min(Math.max(dt, 0), 0.1)
        while (this.acc >= 1 / 120) {
            this.acc -= 1 / 120
            this.elapsed += 1 / 120
            if (this.recovery) {
                const r = this.recovery
                r.time += 1 / 120
                r.targets.forEach((target) => {
                    const t = clamp(r.time / (target.reposition ? 0.65 : 0.3), 0, 1),
                        ease = t * t * (3 - 2 * t)
                    const d = target.die,
                        p = target.from.clone().lerp(target.to, ease)
                    if (target.reposition) p.y += Math.sin(Math.PI * t) * 0.18
                    d.body.setTranslation(p, false)
                    d.body.setRotation(target.q0.clone().slerp(target.q1, ease), false)
                    if (target.reposition) this.contain(d)
                })
                if (r.targets.every((target) => r.time >= (target.reposition ? 0.65 : 0.3))) {
                    this.dice.forEach((d) => {
                        d.body.setBodyType(RAPIER.RigidBodyType.Fixed, false)
                        d.collider.setEnabled(true)
                    })
                    this.recovery = undefined
                    this.settled = true
                    return
                }
                continue
            }
            this.world.step(this.queue)
            const handles = new Set(this.dice.map((d) => d.collider.handle))
            this.queue.drainCollisionEvents((a, b, started) => {
                if (started && handles.has(a) && handles.has(b)) this.collisions++
            })
            this.dice.forEach((d) => {
                if (!this.held.has(d)) this.contain(d)
            })
            if (
                this.elapsed > 0.65 &&
                this.dice.every((d) => this.held.has(d) || d.body.isSleeping())
            ) {
                if (
                    this.dice.some(
                        (d) =>
                            !d.entered ||
                            readTop(d.data, d.body.rotation()).alignment < 0.985 ||
                            readTop(d.data, d.body.rotation()).margin < 0.08 ||
                            d.body.translation().y > 1.12
                    )
                )
                    this.recover()
                else this.settled = true
            } else if (this.elapsed > 7) this.recover()
        }
    }
    results() {
        return this.dice.map((d) => ({
            ...readTop(d.data, d.body.rotation()),
            recovered: d.recovered,
            corrected: d.corrected
        }))
    }
    dispose() {
        this.queue.free()
        this.world.free()
    }
}
