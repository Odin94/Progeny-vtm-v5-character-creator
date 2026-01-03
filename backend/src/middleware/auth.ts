import { FastifyRequest, FastifyReply } from "fastify"
import { workos } from "../config/workos.js"

export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string
        email: string
        firstName?: string
        lastName?: string
    }
}

export async function authenticateUser(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.code(401).send({ error: "Unauthorized: Missing or invalid authorization header" })
        return
    }

    const token = authHeader.substring(7)

    try {
        // For WorkOS, decode the JWT token to get user ID, then fetch user
        // WorkOS tokens are JWTs that contain the user_id in the payload
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
        const userId = payload.sub || payload.user_id

        if (!userId) {
            reply.code(401).send({ error: "Unauthorized: Invalid token format" })
            return
        }

        const user = await workos.userManagement.getUser(userId)

        request.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
        }
    } catch (_error) {
        reply.code(401).send({ error: "Unauthorized: Invalid token" })
        return
    }
}
