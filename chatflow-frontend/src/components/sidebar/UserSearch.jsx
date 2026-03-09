import { useState, useEffect } from "react"
import { searchUsers, createConversation } from "../../api"
import Avatar from "../common/Avatar"

export default function UserSearch({ onConversationCreated }) {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const users = await searchUsers(query)
        setResults(users)
      } catch (_) {}
      finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  const startChat = async (user) => {
    try {
      const conv = await createConversation({
        is_group: false,
        member_ids: [user.id],
      })
      onConversationCreated(conv)
      setQuery("")
      setResults([])
    } catch (_) {}
  }

  return (
    <div className="relative px-3 pb-2">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-[#1a1a25] text-zinc-200 placeholder-zinc-500 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-violet-500 transition"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-[#1a1a25] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => startChat(u)}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 transition text-left"
            >
              <Avatar name={u.username} src={u.avatar} size="sm" online={u.is_online} />
              <div>
                <p className="text-sm font-medium text-zinc-200">{u.username}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs text-zinc-500 mt-2 px-1">Searching...</p>
      )}
    </div>
  )
}
