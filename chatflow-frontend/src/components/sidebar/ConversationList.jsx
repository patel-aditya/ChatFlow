import Avatar from "../common/Avatar"

export default function ConversationList({ conversations, activeId, onSelect, currentUser }) {
  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-zinc-600 text-sm px-4 text-center">
        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        No conversations yet. Search for a user to start chatting!
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId
        // for private chats use "Chat" as name placeholder (backend can be enhanced to return other user's name)
        const name = conv.is_group ? (conv.name || "Group Chat") : "Private Chat"

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all text-left group
              ${isActive
                ? "bg-violet-600/20 ring-1 ring-violet-500/30"
                : "hover:bg-white/5"
              }`}
          >
            <Avatar
              name={name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${isActive ? "text-violet-300" : "text-zinc-200"}`}>
                  {name}
                </p>
                {conv.is_group && (
                  <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-md shrink-0">
                    Group
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 truncate">
                {conv.is_group ? "Group conversation" : "Private message"}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
