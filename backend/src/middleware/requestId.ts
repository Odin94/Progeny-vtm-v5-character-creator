import { FastifyRequest, FastifyReply } from "fastify"
import { nanoid } from "nanoid"

const REQUEST_ID_HEADER = "x-request-id"

export function generateRequestId(): string {
    return nanoid(16)
}

export function getRequestId(request: FastifyRequest): string {
    return (request as any).requestId || ""
}

export function setRequestId(request: FastifyRequest, reply: FastifyReply, requestId: string): void {
    ;(request as any).requestId = requestId
    reply.header(REQUEST_ID_HEADER, requestId)
}
