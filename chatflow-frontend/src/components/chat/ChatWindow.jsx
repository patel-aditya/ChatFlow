import { useEffect, useRef, useState, useCallback } from "react"
import { getMessages, deleteMessage, editMessage } from "../../api"
import { useWS } from "../../context/WebSocketContext"
import { useAuth } from "../../context/AuthContext"
import MessageBubble from "./MessageBubble"
import MessageInput from "./MessageInput"
import TypingIndicator from "./TypingIndicator"

export default function ChatWindow({ conversation }) {
  const { user }          = useAuth()
  const { subscribe, send } = useWS()
  const [messages, setMessages]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [typingUsers, setTypingUsers] = useState([])
  const bottomRef                 = useRef(null)
  const typingTimersRef           = useRef({})

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // load message history when conversation changes
  useEffect(() => {
    if (!conversation) return
    setLoading(true)
    setMessages([])
    getMessages(conversation.id)
      .then((msgs) => { setMessages(msgs); setTimeout(scrollToBottom, 100) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversation?.id])

  // listen for real-time events
  useEffect(() => {
    const unsub = subscribe((payload) => {

      // new message
      if (payload.type === "message" && payload.conversation_id === conversation?.id) {
        setMessages((prev) => {
          // avoid duplicates
          if (prev.find((m) => m.id === payload.id)) return prev
          return [...prev, payload]
        })
        setTimeout(scrollToBottom, 50)

        // send read receipt
        send({ type: "read", conversation_id: conversation.id })
      }

      // typing indicator
      if (payload.type === "typing" && payload.conversation_id === conversation?.id && payload.user_id !== user?.id) {
        if (payload.is_typing) {
          setTypingUsers((prev) => prev.includes(payload.user_id) ? prev : [...prev, payload.user_id])
          // auto-clear after 3s
          clearTimeout(typingTimersRef.current[payload.user_id])
          typingTimersRef.current[payload.user_id] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== payload.user_id))
          }, 3000)
        } else {
          clearTimeout(typingTimersRef.current[payload.user_id])
          setTypingUsers((prev) => prev.filter((id) => id !== payload.user_id))
        }
      }

      // read receipt
      if (payload.type === "read" && payload.conversation_id === conversation?.id) {
        setMessages((prev) =>
          prev.map((m) => m.sender_id === user?.id ? { ...m, is_read: true } : m)
        )
      }
    })

    return unsub
  }, [conversation?.id, subscribe, user?.id])

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (e) { console.error(e) }
  }

  const handleEdit = async (messageId, content) => {
    try {
      const updated = await editMessage(messageId, content)
      setMessages((prev) => prev.map((m) => m.id === messageId ? updated : m))
    } catch (e) { console.error(e) }
  }

  const convName = conversation?.is_group
    ? (conversation.name || "Group Chat")
    : "Private Chat"

  return (
    <div className="flex flex-col h-screen flex-1 bg-[#09090f]">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#111118] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-600/30 flex items-center justify-center">
          {conversation?.is_group ? (
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-semibold text-zinc-100 text-sm">{convName}</p>
          <p className="text-xs text-zinc-500">
            {typingUsers.length > 0 ? "typing..." : conversation?.is_group ? "Group chat" : "Private message"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {!loading && messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === user?.id}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}

        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation?.id}
        onSend={scrollToBottom}
      />
    </div>
  )
}
