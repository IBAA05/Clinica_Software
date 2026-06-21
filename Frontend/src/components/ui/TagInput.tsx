import { useState } from "react"
import { X } from "lucide-react"

export function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  function add() {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft("")
  }

  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag))
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-brand-400 dark:border-gray-700">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="text-brand-500 hover:text-brand-800">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
            if (e.key === "Backspace" && !draft && value.length) remove(value[value.length - 1])
          }}
          placeholder={placeholder}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  )
}
