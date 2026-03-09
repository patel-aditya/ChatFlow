export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex items-center gap-1 bg-[#1a1a25] px-3 py-2 rounded-2xl rounded-bl-sm">
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse2" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse2" style={{ animationDelay: "200ms" }} />
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse2" style={{ animationDelay: "400ms" }} />
      </div>
      <span className="text-xs text-zinc-500">typing...</span>
    </div>
  )
}
