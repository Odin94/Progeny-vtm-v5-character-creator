import { writeFileSync } from "node:fs"
import { it } from "vitest"
import { characterSchema, getEmptyCharacter } from "~/data/Character"
import { disciplines } from "~/data/Disciplines"
import { getVisibleGeneratorSteps } from "~/generator/steps"
it("generates disposable browser data when requested", () => {
    if (!process.env.PERF_FIXTURE_OUTPUT) return
    const character = getEmptyCharacter()
    character.name = "Performance Fixture"
    character.clan = "Tremere"
    character.generation = 12
    character.attributes.strength = 3
    character.skills.athletics = 2
    character.disciplineLevels = { "official:blood sorcery": 1, "official:oblivion": 1 }
    character.disciplines = [
        disciplines["blood sorcery"].powers[0]!,
        disciplines.oblivion.powers[0]!
    ]
    characterSchema.parse(character)
    writeFileSync(
        process.env.PERF_FIXTURE_OUTPUT,
        JSON.stringify({ character, steps: getVisibleGeneratorSteps(character).map((s) => s.id) })
    )
})
