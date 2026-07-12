const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
        headers: {
            "Content-Type": "application/json",
            ...(init.headers instanceof Headers
                ? Object.fromEntries(init.headers.entries())
                : init.headers)
        },
        ...init
    })

describe("coterie invite API", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("posts invite tokens to the body-token accept route", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                jsonResponse(
                    { status: "ok" },
                    {
                        headers: {
                            "X-CSRF-Token": "csrf-token"
                        }
                    }
                )
            )
            .mockResolvedValueOnce(
                jsonResponse({
                    coterie: {
                        id: "coterie-1",
                        name: "Baltimore by Night"
                    }
                })
            )

        vi.stubGlobal("fetch", fetchMock)

        const { api } = await import("~/utils/api")
        const response = await api.acceptCoterieInvite("legacy_token-1234567890")

        expect(response.coterie.id).toBe("coterie-1")
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "/api/coterie-invites/accept",
            expect.objectContaining({
                body: JSON.stringify({ token: "legacy_token-1234567890" }),
                method: "POST"
            })
        )
    })

    it("surfaces unavailable invite responses", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                jsonResponse(
                    { status: "ok" },
                    {
                        headers: {
                            "X-CSRF-Token": "csrf-token"
                        }
                    }
                )
            )
            .mockResolvedValueOnce(
                jsonResponse({ error: "Invite link is invalid or expired" }, { status: 404 })
            )

        vi.stubGlobal("fetch", fetchMock)

        const { api } = await import("~/utils/api")

        await expect(api.acceptCoterieInvite("missing-token-1234567890")).rejects.toThrow(
            "Invite link is invalid or expired"
        )
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})
