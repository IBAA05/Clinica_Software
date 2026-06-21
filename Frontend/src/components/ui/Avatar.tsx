import { initials, cn } from "@/lib/utils"

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string
  src?: string | null
  size?: number
  className?: string
}) {
  const dim = { width: size, height: size }
  const textStyle = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (src) {
    return (
      <img src={src} alt={name} className={cn("rounded-full object-cover", className)} style={dim} />
    )
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white",
        className
      )}
      style={textStyle}
    >
      {initials(name)}
    </div>
  )
}
