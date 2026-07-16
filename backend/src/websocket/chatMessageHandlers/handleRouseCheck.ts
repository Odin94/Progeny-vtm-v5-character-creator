import { FastifyInstance } from "fastify"
import {
    type Session,
    type RouseCheckMessage,
    type RouseCheckReceived
} from "../sessionChatTypes.js"
import {
    appendSessionHistory,
    recordSessionMessage,
    trackChatMessageSent
} from "../sessionChatLifecycle.js"
import { sendErrorAndTrack, broadcastToSession } from "../sessionChatUtils.js"

export async function handleRouseCheck(
    data: RouseCheckMessage,
    socket: any,
    fastify: FastifyInstance,
    userId: string,
    currentSession: Session | null
): Promise<Session | null> {
    if (!currentSession) {
        sendErrorAndTrack(socket, fastify, userId, "Not in a session", "not_in_session", {
            message_type: "rouse_check"
        })
        return currentSession
    }

    const participant = currentSession.participants.get(userId)
    if (!participant) {
        sendErrorAndTrack(socket, fastify, userId, "Not a participant", "not_a_participant", {
            message_type: "rouse_check",
            session_id: currentSession.id
        })
        return currentSession
    }

    const timestamp = recordSessionMessage(currentSession, "rouse_check", userId)

    const message: RouseCheckReceived = {
        type: "rouse_check",
        userId,
        userName: participant.userName,
        showNameTag: participant.showNameTag,
        characterName: data.characterName ?? participant.characterName,
        roll: data.roll,
        success: data.success,
        newHunger: data.newHunger,
        timestamp
    }

    appendSessionHistory(currentSession, message)
    trackChatMessageSent(currentSession, userId, "rouse_check", {
        success: data.success,
        new_hunger: data.newHunger
    })
    broadcastToSession(currentSession, message, userId)
    socket.send(JSON.stringify(message))
    return currentSession
}
