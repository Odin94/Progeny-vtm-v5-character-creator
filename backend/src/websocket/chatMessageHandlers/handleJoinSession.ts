import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../../db/index.js"
import { trackEvent } from "../../utils/tracker.js"
import {
  type Session,
  type JoinSessionMessage,
  type Participant,
  type SessionJoinedMessage,
  type UserJoinedMessage,
} from "../sessionChatTypes.js"
import { temporarySessions, coterieSessions } from "../sessionChat.js"
import { sendErrorAndTrack, broadcastToSession } from "../sessionChatUtils.js"

export async function handleJoinSession(
  data: JoinSessionMessage,
  socket: any,
  fastify: FastifyInstance,
  userId: string,
  userName: string,
  currentSession: Session | null
): Promise<Session | null> {
  const { sessionId, coterieId, characterName } = data

  if (coterieId) {
    const coterie = await db.query.coteries.findFirst({
      where: eq(schema.coteries.id, coterieId),
    })

    if (!coterie) {
      sendErrorAndTrack(
        socket,
        fastify,
        userId,
        "Coterie not found",
        "coterie_not_found",
        { coterie_id: coterieId }
      )
      return currentSession
    }

    const isOwner = coterie.ownerId === userId
    const members = await db.select().from(schema.coterieMembers).where(eq(schema.coterieMembers.coterieId, coterieId))
    const userCharacters = await db.select().from(schema.characters).where(eq(schema.characters.userId, userId))
    const userCharacterIds = new Set(userCharacters.map((c) => c.id))
    const hasAccess = isOwner || members.some((m) => userCharacterIds.has(m.characterId))

    if (!hasAccess) {
      const sharedCharacters = await db
        .select()
        .from(schema.characterShares)
        .where(and(eq(schema.characterShares.sharedWithUserId, userId), eq(schema.characterShares.characterId, members[0]?.characterId || "")))
      if (sharedCharacters.length === 0) {
        sendErrorAndTrack(
          socket,
          fastify,
          userId,
          "Forbidden: No access to coterie",
          "coterie_access_denied",
          { coterie_id: coterieId }
        )
        return currentSession
      }
    }

    const isNewCoterieSession = !coterieSessions.has(coterieId)
    if (isNewCoterieSession) {
      coterieSessions.set(coterieId, {
        id: coterieId,
        type: "coterie",
        coterieId,
        participants: new Map(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
      })
    }

    currentSession = coterieSessions.get(coterieId)!

    if (isNewCoterieSession) {
      trackEvent("chat-session-created", {
        session_type: "coterie",
        session_id: coterieId,
      }, userId)
    }
  } else if (sessionId) {
    const isNewTemporarySession = !temporarySessions.has(sessionId)
    if (isNewTemporarySession) {
      temporarySessions.set(sessionId, {
        id: sessionId,
        type: "temporary",
        participants: new Map(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
      })
    }

    currentSession = temporarySessions.get(sessionId)!

    if (isNewTemporarySession) {
      trackEvent("chat-session-created", {
        session_type: "temporary",
        session_id: sessionId,
      }, userId)
    }
  } else {
    const newSessionId = nanoid(8)
    const newSession: Session = {
      id: newSessionId,
      type: "temporary",
      participants: new Map(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }
    temporarySessions.set(newSessionId, newSession)
    currentSession = newSession

    trackEvent("chat-session-created", {
      session_type: "temporary",
      session_id: newSessionId,
    }, userId)
  }

  if (currentSession) {
    const wasExistingSession = currentSession.participants.size > 0
    const participant: Participant = {
      userId,
      userName,
      characterName,
      socket: socket,
    }

    currentSession.participants.set(userId, participant)
    currentSession.lastActivity = Date.now()

    const participants = Array.from(currentSession.participants.values()).map((p) => ({
      userId: p.userId,
      userName: p.userName,
      characterName: p.characterName,
    }))

    if (wasExistingSession) {
      trackEvent("chat-session-joined", {
        session_type: currentSession.type,
        session_id: currentSession.id,
        participant_count: participants.length,
      }, userId)
    }

    socket.send(
      JSON.stringify({
        type: "session_joined",
        sessionId: currentSession.id,
        sessionType: currentSession.type,
        participants,
      } as SessionJoinedMessage)
    )

    broadcastToSession(
      currentSession,
      {
        type: "user_joined",
        userId,
        userName,
        characterName: participant.characterName,
      } as UserJoinedMessage,
      userId
    )
  }

  return currentSession
}
