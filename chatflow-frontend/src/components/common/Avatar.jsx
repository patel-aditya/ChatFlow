export default function Avatar({ name = "?", src, size = "md", online = false }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // generate a consistent color from the name
  const colors = [
    "bg-violet-600", "bg-indigo-600", "bg-pink-600",
    "bg-teal-600",   "bg-orange-600", "bg-cyan-600",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/5`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/5`}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#09090f]" />
      )}
    </div>
  )
}
