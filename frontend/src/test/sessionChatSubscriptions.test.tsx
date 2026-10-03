import { act, renderHook } from "@testing-library/react"
import { expect, it } from "vitest"
import { useSessionChat } from "~/hooks/useSessionChat"
import { useSessionChatStore } from "~/character_sheet/stores/sessionChatStore"

it("keeps narrow controls stable on incoming messages while updating chat and connections", () => {
    const initialState = useSessionChatStore.getState()
    let controlRenders = 0
    let chatRenders = 0
    const control = renderHook(() => {
        controlRenders += 1
        return useSessionChat((state) => ({
            connectionStatus: state.connectionStatus,
            sessionId: state.sessionId,
            sendDiceRoll: state.sendDiceRoll
        }))
    })
    const chat = renderHook(() => {
        chatRenders += 1
        return useSessionChat()
    })
    const controlsBeforeMessage = controlRenders
    const chatBeforeMessage = chatRenders
    act(() => {
        useSessionChatStore.setState({
            messages: [
                {
                    type: "chat_message",
                    message: "An incoming message",
                    timestamp: 1,
                    userId: "reader",
                    userName: "Reader",
                    showNameTag: false
                }
            ]
        })
    })
    expect(controlRenders).toBe(controlsBeforeMessage)
    expect(chatRenders).toBeGreaterThan(chatBeforeMessage)
    expect(chat.result.current.messages).toHaveLength(1)
    act(() =>
        useSessionChatStore.setState({ connectionStatus: "connected", sessionId: "new-session" })
    )
    expect(control.result.current).toMatchObject({
        connectionStatus: "connected",
        sessionId: "new-session"
    })
    act(() => useSessionChatStore.setState(initialState))
    control.unmount()
    chat.unmount()
})
