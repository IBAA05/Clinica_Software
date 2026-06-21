import { useEffect, useState } from "react"
import { animate } from "framer-motion"

export function CountUp({
  value,
  format,
  duration = 1,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, duration])
  return <span className="tabular">{format ? format(display) : Math.round(display).toLocaleString()}</span>
}
