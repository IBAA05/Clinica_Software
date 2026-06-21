import { Link } from "react-router-dom"
import { Stethoscope, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFB] p-6 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-100 text-brand-600">
          <Stethoscope className="h-12 w-12" />
        </div>
        <span className="absolute -right-3 -top-3 font-heading text-5xl font-bold text-brand-200">?</span>
      </div>
      <h1 className="font-heading text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-lg font-medium text-gray-700">Page not found</p>
      <p className="mt-1 max-w-sm text-sm text-ink-secondary">
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6 inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  )
}
