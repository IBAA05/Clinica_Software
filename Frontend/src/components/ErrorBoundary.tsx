import React from "react"
import { AlertOctagon, RotateCw } from "lucide-react"

interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFB] p-6">
          <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertOctagon className="h-7 w-7" />
            </div>
            <h1 className="font-heading text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-ink-secondary">{this.state.message ?? "An unexpected error occurred."}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto mt-6 inline-flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" /> Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
