import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Stethoscope, CalendarDays, BarChart3, Plus } from "lucide-react"
import { login } from "@/api/auth"
import { useAuthStore } from "@/stores/authStore"
import { apiMessage } from "@/lib/axios"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [showPw, setShowPw] = useState(false)
  const [shake, setShake] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { remember: true } })

  async function onSubmit(values: FormData) {
    try {
      const res = await login(values.username, values.password)
      setSession({ user: res.user, access: res.access_token, refresh: res.refresh_token })
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`)
      navigate("/dashboard")
    } catch (err) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      toast.error(apiMessage(err, "Invalid credentials"))
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT brand panel */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={patternStyle} />
        <PulseRings />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-heading text-2xl font-bold">Clinica</span>
        </div>

        <div className="relative">
          <motion.h2
            initial={brandInit}
            animate={brandAnim}
            className="font-heading text-4xl font-bold leading-tight"
          >
            Your clinic,<br />perfectly managed.
          </motion.h2>
          <p className="mt-4 max-w-md text-brand-100/80">
            A premium platform for patients, appointments, billing, and insightful reports — all in one place.
          </p>
        </div>

        <div className="relative flex gap-3">
          <FeatureChip icon={<UserIcon className="h-4 w-4" />} label="Patients" />
          <FeatureChip icon={<CalendarDays className="h-4 w-4" />} label="Appointments" />
          <FeatureChip icon={<BarChart3 className="h-4 w-4" />} label="Reports" />
        </div>
      </div>

      {/* RIGHT form panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-[45%] dark:bg-gray-900">
        <motion.div
          initial={brandInit}
          animate={brandAnim}
          className={shake ? "w-full max-w-sm animate-shake" : "w-full max-w-sm"}
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold">Clinica</span>
          </div>

          <h1 className="font-heading text-[28px] font-bold text-gray-900 dark:text-gray-100">Welcome back 👋</h1>
          <p className="mt-1 text-ink-secondary">Sign in to your clinic dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="doctor" {...register("username")} />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400" {...register("remember")} />
              Remember me
            </label>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Demo: doctor / Doctor@123 · reception / Reception@123
          </p>
        </motion.div>
      </div>
    </div>
  )
}

const brandInit = { opacity: 0, y: 16 }
const brandAnim = { opacity: 1, y: 0 }
const patternStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M18 6h4v8h8v4h-8v8h-4v-8h-8v-4h8z' fill='%23ffffff'/%3E%3C/svg%3E\")",
  backgroundSize: "40px 40px",
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm backdrop-blur">
      <span className="text-brand-300">{icon}</span>
      {label}
    </div>
  )
}

function PulseRings() {
  const ring = "absolute rounded-full border border-brand-400/20"
  const r1 = { width: 400, height: 400, right: -120, top: 80 }
  const r2 = { width: 280, height: 280, right: -40, top: 140 }
  return (
    <>
      <motion.div
        className={ring}
        style={r1}
        animate={pulseAnim}
        transition={pulseT}
      />
      <motion.div className={ring} style={r2} animate={pulseAnim} transition={pulseT2} />
    </>
  )
}
const pulseAnim = { scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }
const pulseT = { duration: 6, repeat: Infinity, ease: "easeInOut" as const }
const pulseT2 = { duration: 8, repeat: Infinity, ease: "easeInOut" as const }
