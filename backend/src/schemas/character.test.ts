import Fastify from "fastify"
import { describe, expect, it } from "vitest"
import { createCharacterSchema, updateCharacterSchema } from "./character.js"
import { zodToFastifySchema } from "../utils/schema.js"

describe("zero-dot character flaw request validation", () => {
    it.each(["POST", "PUT"] as const)(
        "preserves a zero-dot flaw through Fastify %s validation",
        async (method) => {
            const app = Fastify()
            app.route({
                method,
                url: "/characters",
                schema: {
                    body: zodToFastifySchema(
                        method === "POST" ? createCharacterSchema : updateCharacterSchema
                    )
                },
                handler: (request) => request.body
            })
            const flaw = {
                name: "Ingrained Discipline",
                level: 0,
                type: "flaw",
                summary: "Drawback",
                excludes: []
            }
            try {
                const response = await app.inject({
                    method,
                    url: "/characters",
                    payload: { name: "Test", data: { flaws: [flaw] } }
                })
                expect(response.statusCode).toBe(200)
                expect(response.json().data.flaws).toEqual([flaw])
                for (const level of [-1, 0.5]) {
                    const invalid = await app.inject({
                        method,
                        url: "/characters",
                        payload: { name: "Test", data: { flaws: [{ ...flaw, level }] } }
                    })
                    expect(invalid.statusCode).toBe(400)
                }
            } finally {
                await app.close()
            }
        }
    )
})
