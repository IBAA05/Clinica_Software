import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useThemeStore } from "@/stores/themeStore"
import { RequireAuth, RequireRole } from "@/components/guards/guards"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { MainLayout } from "@/components/layout/MainLayout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Patients from "@/pages/Patients"
import PatientProfile from "@/pages/PatientProfile"
import Appointments from "@/pages/Appointments"
import Visits from "@/pages/Visits"
import VisitDetail from "@/pages/VisitDetail"
import Billing from "@/pages/Billing"
import Reports from "@/pages/Reports"
import DoctorProfile from "@/pages/DoctorProfile"
import Settings from "@/pages/Settings"
import Support from "@/pages/Support"
import NotFound from "@/pages/NotFound"

export default function App() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/visits" element={<RequireRole roles={["doctor"]}><Visits /></RequireRole>} />
            <Route path="/visits/:id" element={<RequireRole roles={["doctor"]}><VisitDetail /></RequireRole>} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<RequireRole roles={["doctor"]}><Reports /></RequireRole>} />
            <Route path="/doctor" element={<DoctorProfile />} />
            <Route path="/settings" element={<RequireRole roles={["doctor"]}><Settings /></RequireRole>} />
            <Route path="/support" element={<Support />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  )
}
