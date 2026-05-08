import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import {
    authenticateUser,
    requireSuperadmin,
    type AuthenticatedRequest,
    type AuthenticatedUser
} from "../middleware/auth.js"
import {
    clearImpersonationCookie,
    endImpersonationSession,
    setImpersonationCookie,
    startImpersonationSession
} from "../middleware/impersonation.js"
import { getUserActivity } from "../middleware/userActivity.js"
import {
    adminUserParamsSchema,
    adminUsersQuerySchema,
    startImpersonationSchema,
    updateSuperadminSchema,
    type AdminUserParams,
    type AdminUsersQuery,
    type StartImpersonationInput,
    type UpdateSuperadminInput
} from "../schemas/admin.js"
import { zodToFastifySchema } from "../utils/schema.js"

const serializeAdminUser = (user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    nickname: string | null
    isSuperadmin: boolean
}) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname,
    isSuperadmin: user.isSuperadmin,
    ...getUserActivity(user.id)
})

const serializeImpersonationUser = (user: AuthenticatedUser) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname ?? null,
    isSuperadmin: user.isSuperadmin
})

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: AdminUsersQuery }>(
        "/admin/users",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: {
                querystring: zodToFastifySchema(adminUsersQuerySchema)
            }
        },
        async (request, reply) => {
            const query = (request.query.query ?? "").trim().toLowerCase()
            const users = await db.query.users.findMany({
                limit: 200
            })

            const filtered = query
                ? users.filter((user) =>
                      [user.email, user.firstName, user.lastName, user.nickname]
                          .filter(Boolean)
                          .some((value) => value!.toLowerCase().includes(query))
                  )
                : users

            reply.send({
                users: filtered.map(serializeAdminUser)
            })
        }
    )

    fastify.patch<{
        Params: AdminUserParams
        Body: UpdateSuperadminInput
    }>(
        "/admin/users/:id/superadmin",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: {
                params: zodToFastifySchema(adminUserParamsSchema),
                body: zodToFastifySchema(updateSuperadminSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id } = request.params as AdminUserParams
            const { isSuperadmin } = request.body as UpdateSuperadminInput

            if (request.actorUser!.id === id) {
                reply.code(400).send({
                    error: "Invalid request",
                    message: "You cannot change your own superadmin status"
                })
                return
            }

            const [updated] = await db
                .update(schema.users)
                .set({
                    isSuperadmin,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.id, id))
                .returning()

            if (!updated) {
                reply.code(404).send({ error: "User not found" })
                return
            }

            reply.send(serializeAdminUser(updated))
        }
    )

    fastify.post<{ Body: StartImpersonationInput }>(
        "/admin/impersonation",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: {
                body: zodToFastifySchema(startImpersonationSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { userId } = request.body as StartImpersonationInput
            const actorUser = request.actorUser!

            if (actorUser.id === userId) {
                reply.code(400).send({
                    error: "Invalid request",
                    message: "You cannot impersonate yourself"
                })
                return
            }

            const targetUser = await db.query.users.findFirst({
                where: eq(schema.users.id, userId)
            })

            if (!targetUser) {
                reply.code(404).send({ error: "User not found" })
                return
            }

            if (targetUser.isSuperadmin) {
                reply.code(400).send({
                    error: "Invalid request",
                    message: "Superadmins cannot impersonate other superadmins"
                })
                return
            }

            const session = await startImpersonationSession({
                superadminUserId: actorUser.id,
                impersonatedUserId: targetUser.id
            })

            setImpersonationCookie(reply, session.id)

            reply.code(201).send({
                sessionId: session.id,
                expiresAt: new Date(session.expiresAt).toISOString(),
                actorUser: serializeImpersonationUser(actorUser),
                impersonatedUser: serializeAdminUser(targetUser)
            })
        }
    )

    fastify.post(
        "/admin/impersonation/stop",
        {
            preHandler: authenticateUser
        },
        async (request: AuthenticatedRequest, reply) => {
            if (request.impersonation?.active) {
                await endImpersonationSession(request.impersonation.sessionId, "stopped")
            }

            clearImpersonationCookie(reply)
            reply.send({ stopped: !!request.impersonation?.active })
        }
    )
}
