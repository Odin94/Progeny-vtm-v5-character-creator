import { beforeAll, describe, expect, it } from "vitest"
import { PerspectiveCamera, Quaternion, Vector3 } from "three"
import { layoutDieTargets } from "~/character_sheet/components/diceRollModal/threeDice/overlay-layout"
import regular from "~/character_sheet/components/diceRollModal/threeDice/regular.json"
import hunger from "~/character_sheet/components/diceRollModal/threeDice/hunger.json"
import {
    initDicePhysics,
    PageDicePhysics,
    pageBounds,
    readTop,
    type DiceData
} from "~/character_sheet/components/diceRollModal/threeDice/page-dice-physics"

const regularData = regular as unknown as DiceData
const hungerData = hunger as unknown as DiceData
const finish = (physics: PageDicePhysics) => {
    for (let frame = 0; frame < 1100 && !physics.settled; frame++) physics.step(1 / 120)
    expect(physics.settled).toBe(true)
}
describe("imported vampire dice physics", () => {
    beforeAll(() => initDicePhysics())
    it.each([
        [374, 374, 16, 0.6],
        [1264, 784, 100, 1.1]
    ])(
        "keeps projected die click targets separate in a %ix%i arena with %i dice",
        (width, height, count, size) => {
            const bounds = pageBounds(width, height, count, size)
            const physics = new PageDicePhysics(bounds)
            try {
                for (let i = 0; i < count; i++) physics.add(regularData)
                physics.showValues(Array(count).fill(6))
                const camera = new PerspectiveCamera(
                    (2 * Math.atan(bounds.halfZ / 40) * 180) / Math.PI,
                    width / height,
                    0.1,
                    100
                )
                camera.position.set(0, 40, 0)
                camera.up.set(0, 0, -1)
                camera.lookAt(0, 0, 0)
                camera.updateMatrixWorld()
                const boxes = physics.dice.map((die) => {
                    const points = die.data.vertices.map((vertex) => {
                        const point = new Vector3(...vertex)
                            .applyQuaternion(die.body.rotation())
                            .add(die.body.translation())
                            .project(camera)
                        return { x: ((point.x + 1) * width) / 2, y: ((1 - point.y) * height) / 2 }
                    })
                    const left = Math.min(...points.map((p) => p.x)),
                        top = Math.min(...points.map((p) => p.y))
                    return {
                        left,
                        top,
                        width: Math.max(...points.map((p) => p.x)) - left,
                        height: Math.max(...points.map((p) => p.y)) - top
                    }
                })
                const targets = layoutDieTargets(boxes)
                for (let i = 0; i < targets.length; i++) {
                    const a = targets[i]
                    expect(a.width).toBeGreaterThan(0)
                    expect(a.height).toBeGreaterThan(0)
                    for (const b of targets.slice(i + 1)) {
                        const overlapX =
                            Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
                        const overlapY =
                            Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
                        expect(overlapX > 1e-6 && overlapY > 1e-6).toBe(false)
                    }
                }
            } finally {
                physics.dispose()
            }
        }
    )
    it.each([16, 100])(
        "settles %i dice around the controls, using the space above them",
        (count) => {
            const physics = new PageDicePhysics(
                pageBounds(1264, 784, count, 1.1, {
                    left: 840,
                    top: 240,
                    right: 1260,
                    bottom: 784
                })
            )
            try {
                for (let index = 0; index < count; index++)
                    physics.add(index < 5 ? hungerData : regularData)
                physics.showValues(Array(count).fill(6))
                if (count === 100) {
                    expect(
                        physics.dice.some((die) => {
                            const p = die.body.translation()
                            return (
                                p.x > physics.bounds.blocked!.minX &&
                                p.z < physics.bounds.blocked!.minZ
                            )
                        })
                    ).toBe(true)
                }
                for (const die of physics.dice) expect(physics.isFullyVisible(die)).toBe(true)
                physics.launch(() => 0.43, {
                    intensity: 10,
                    dropHeight: 30,
                    startX: 150,
                    direction: 200
                })
                finish(physics)
                for (const die of physics.dice) expect(physics.isFullyVisible(die)).toBe(true)
            } finally {
                physics.dispose()
            }
        }
    )

    it("recovers a die covered by expanded controls without changing its face or a clear neighbour", () => {
        const physics = new PageDicePhysics(pageBounds(1264, 784, 2))
        try {
            physics.add(regularData)
            physics.add(hungerData)
            physics.showValues([10, 1])
            const clear = physics.dice[0]
            const hidden = physics.dice[1]
            clear.body.setTranslation({ x: 6, y: clear.body.translation().y, z: -6 }, false)
            hidden.body.setTranslation({ x: 6, y: hidden.body.translation().y, z: 4 }, false)
            const position = { ...clear.body.translation() }
            physics.resize(
                pageBounds(1264, 784, 2, 1, { left: 800, top: 200, right: 1264, bottom: 784 })
            )
            finish(physics)
            expect(clear.body.translation()).toEqual(position)
            expect(physics.isFullyVisible(clear)).toBe(true)
            expect(physics.results().map((result) => result.value)).toEqual([10, 1])
            expect(physics.isFullyVisible(hidden)).toBe(true)
        } finally {
            physics.dispose()
        }
    })
    it.each([
        [1280, 800, 1.1],
        [390, 420, 0.6],
        [320, 220, 0.6],
        [844, 200, 0.6]
    ])("settles clear, visible d10s in a %dx%d arena", (width, height, size) => {
        for (const intensity of [0, 1.6, 10]) {
            const physics = new PageDicePhysics(pageBounds(width, height, 16, size))
            try {
                for (let index = 0; index < 16; index++)
                    physics.add(index < 5 ? hungerData : regularData)
                physics.launch(Math.random, {
                    intensity,
                    dropHeight: 30,
                    startX: -150,
                    direction: 20
                })
                finish(physics)
                for (const die of physics.dice) expect(physics.isFullyVisible(die)).toBe(true)
                for (const result of physics.results()) {
                    expect(result.cocked).toBe(false)
                    expect(result.value).toBeGreaterThanOrEqual(1)
                    expect(result.value).toBeLessThanOrEqual(10)
                }
            } finally {
                physics.dispose()
            }
        }
    })
    it.each([false, true])(
        "keeps unselected bodies and values fixed during a reroll (reduced motion: %s)",
        (reduced) => {
            const physics = new PageDicePhysics(pageBounds(900, 700, 4))
            try {
                for (let index = 0; index < 4; index++)
                    physics.add(index === 0 ? hungerData : regularData)
                physics.showValues([1, 6, 8, 10])
                const snapshot = physics.dice.map((die) => ({
                    position: { ...die.body.translation() },
                    rotation: { ...die.body.rotation() },
                    value: readTop(die.data, die.body.rotation()).value
                }))
                expect(physics.reroll([1, 2], Math.random, { intensity: 4 })).toBe(true)
                if (reduced) physics.settleImmediately()
                finish(physics)
                for (const index of [0, 3]) {
                    expect(physics.dice[index].body.translation()).toEqual(snapshot[index].position)
                    expect(physics.dice[index].body.rotation()).toEqual(snapshot[index].rotation)
                    expect(physics.results()[index].value).toBe(snapshot[index].value)
                }
            } finally {
                physics.dispose()
            }
        }
    )
    it("levels a cocked die in place and relocates only a clipped die, preserving leading values", () => {
        const physics = new PageDicePhysics(pageBounds(900, 700, 3))
        try {
            for (let index = 0; index < 3; index++) physics.add(regularData)
            physics.showValues([6, 8, 10])
            const untouched = { ...physics.dice[0].body.translation() }
            const cocked = physics.dice[1]
            const rotation = new Quaternion()
                .setFromAxisAngle(new Vector3(1, 0, 0), 0.3)
                .multiply(new Quaternion().copy(cocked.body.rotation()))
            cocked.body.setRotation(rotation, false)
            const cockedPosition = { ...cocked.body.translation() }
            const leadingValue = readTop(cocked.data, rotation).value
            physics.dice[2].body.setTranslation({ x: 100, y: 1, z: 100 }, false)
            physics.recover()
            finish(physics)
            expect(physics.dice[0].body.translation()).toEqual(untouched)
            expect(cocked.body.translation().x).toBe(cockedPosition.x)
            expect(cocked.body.translation().z).toBe(cockedPosition.z)
            expect(physics.results()[1]).toMatchObject({
                value: leadingValue,
                cocked: false,
                corrected: true
            })
            expect(physics.results()[2]).toMatchObject({
                value: 10,
                cocked: false,
                recovered: true
            })
            expect(physics.isFullyVisible(physics.dice[2])).toBe(true)
        } finally {
            physics.dispose()
        }
    })
})
