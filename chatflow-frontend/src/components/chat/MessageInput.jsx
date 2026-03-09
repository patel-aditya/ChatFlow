import { useState, useRef, useEffect } from "react"
import { useWS } from "../../context/WebSocketContext"

export default function MessageInput({ conversationId, onSend }) {
  const { send }     = useWS()
  const [text, setText]           = useState("")
  const typingTimerRef            = useRef(null)
  const isTypingRef               = useRef(false)
  const fileRef                   = useRef(null)

  const sendTyping = (state) => {
    send({ type: "typing", conversation_id: conversationId, is_typing: state })
  }

  const handleChange = (e) => {
    setText(e.target.value)

    // send typing = true
    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTyping(true)
    }

    // reset timer — send typing = false after 2s of inactivity
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      sendTyping(false)
    }, 2000)
  }

  const handleSend = () => {
    if (!text.trim()) return

    // send via WebSocket
    send({
      type: "message",
      conversation_id: conversationId,
      content: text.trim(),
      message_type: "text",
    })

    // stop typing indicator
    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    sendTyping(false)

    onSend()    // optional callback (e.g., scroll to bottom)
    setText("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // cleanup on unmount
  useEffect(() => () => clearTimeout(typingTimerRef.current), [])

  return (
    <div className="px-4 py-3 border-t border-white/5 bg-[#111118]">
      <div className="flex items-end gap-2 bg-[#1a1a25] rounded-2xl px-4 py-2">

        {/* File attach button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-1.5 text-zinc-500 hover:text-violet-400 transition shrink-0 mb-0.5"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileRef} type="file" className="hidden" />

        {/* Text area */}
        <textarea
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 text-sm resize-none outline-none py-1 max-h-32 leading-relaxed"
          style={{ scrollbarWidth: "none" }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0 mb-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
