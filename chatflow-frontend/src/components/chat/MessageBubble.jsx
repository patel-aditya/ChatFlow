import { useState } from "react"
import Avatar from "../common/Avatar"

export default function MessageBubble({ message, isMine, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [editContent, setEditContent] = useState(message.content || "")

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setEditing(false)
  }

  return (
    <div
      className={`msg-enter flex items-end gap-2 group ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar — only for others */}
      {!isMine && (
        <Avatar name={`User ${message.sender_id}`} size="sm" />
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>

        {/* Bubble */}
        {editing ? (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEdit(); if (e.key === "Escape") setEditing(false) }}
              className="bg-[#1a1a25] text-zinc-200 text-sm px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 min-w-[150px]"
            />
            <button onClick={handleEdit} className="text-xs text-violet-400 hover:text-violet-300">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
              ${isMine
                ? "bg-violet-600 text-white rounded-br-sm"
                : "bg-[#1a1a25] text-zinc-200 rounded-bl-sm"
              }`}
          >
            {/* Media */}
            {message.message_type === "image" && message.file_url && (
              <img src={message.file_url} alt="img" className="max-w-[240px] rounded-lg mb-2" />
            )}
            {message.message_type === "document" && message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs underline opacity-80"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View document
              </a>
            )}
            {message.content && <span>{message.content}</span>}
          </div>
        )}

        {/* Meta */}
        <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] text-zinc-600">{time}</span>
          {message.is_read && isMine && (
            <span className="text-[11px] text-violet-400">✓✓</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isMine && showActions && !editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.message_type === "text" && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg bg-[#1a1a25] text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(message.id)}
            className="p-1.5 rounded-lg bg-[#1a1a25] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
