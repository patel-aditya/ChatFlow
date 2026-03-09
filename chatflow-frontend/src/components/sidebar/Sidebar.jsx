import { useState } from "react"
import Avatar from "../common/Avatar"
import ConversationList from "./ConversationList"
import UserSearch from "./UserSearch"
import { useAuth } from "../../context/AuthContext"

export default function Sidebar({ conversations, activeConv, onSelect, onNewConversation }) {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleConversationCreated = (conv) => {
    onNewConversation(conv)
    onSelect(conv)
  }

  return (
    <aside className="w-72 h-screen bg-[#111118] border-r border-white/5 flex flex-col shrink-0">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l4.94-1.37A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">ChatFlow</span>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition"
            >
              <Avatar name={user?.username || "?"} src={user?.avatar} size="sm" online />
              <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#1a1a25] border border-white/5 rounded-xl shadow-2xl w-44 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{user?.username}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); logout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <UserSearch onConversationCreated={handleConversationCreated} />
      </div>

      {/* Conversations label */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">
          Messages
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto pb-4">
        <ConversationList
          conversations={conversations}
          activeId={activeConv?.id}
          onSelect={onSelect}
          currentUser={user}
        />
      </div>
    </aside>
  )
}
