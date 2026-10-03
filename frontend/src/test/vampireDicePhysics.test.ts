import { beforeAll, describe, expect, it } from "vitest"
import { Quaternion, Vector3 } from "three"
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
