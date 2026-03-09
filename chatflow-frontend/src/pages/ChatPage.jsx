import { useState, useEffect } from "react"
import { getConversations } from "../api"
import { WSProvider } from "../context/WebSocketContext"
import Sidebar from "../components/sidebar/Sidebar"
import ChatWindow from "../components/chat/ChatWindow"

export default function ChatPage() {
  const [conversations, setConversations] = useState([])
  const [activeConv,    setActiveConv]    = useState(null)

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(console.error)
  }, [])

  const handleNewConversation = (conv) => {
    setConversations((prev) => {
      // avoid duplicates
      if (prev.find((c) => c.id === conv.id)) return prev
      return [conv, ...prev]
    })
  }

  return (
    <WSProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeConv={activeConv}
          onSelect={setActiveConv}
          onNewConversation={handleNewConversation}
        />

        {/* Main area */}
        <main className="flex-1">
          {activeConv ? (
            <ChatWindow conversation={activeConv} />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </WSProvider>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-700 bg-[#09090f]">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-violet-600/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-violet-600/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-zinc-400 mb-1">No conversation selected</h2>
      <p className="text-sm text-zinc-600 text-center max-w-xs">
        Search for a user in the sidebar or select an existing conversation to start chatting.
      </p>
    </div>
  )
}
