import { create } from "zustand"

type Theme = "light" | "dark"

const THEME_KEY = "clinica_theme"

function apply(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
}

const initial = (localStorage.getItem(THEME_KEY) as Theme) || "light"
apply(initial)

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,
  toggle: () => {
    const next = get().theme === "light" ? "dark" : "light"
    localStorage.setItem(THEME_KEY, next)
    apply(next)
    set({ theme: next })
  },
  setTheme: (t) => {
    localStorage.setItem(THEME_KEY, t)
    apply(t)
    set({ theme: t })
  },
}))
