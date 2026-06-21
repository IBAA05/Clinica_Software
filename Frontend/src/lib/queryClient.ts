import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
})

export const STALE = {
  dashboard: 60 * 1000,
  today: 30 * 1000,
  patients: 2 * 60 * 1000,
  reports: 5 * 60 * 1000,
}
