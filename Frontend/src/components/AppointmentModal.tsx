import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input, Select, Textarea } from "@/components/ui/Input"
import { useDebounce } from "@/hooks/useDebounce"
import { listPatients } from "@/api/patients"
import { createAppointment, getSlots } from "@/api/appointments"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/lib/axios"

const schema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  appointment_date: z.string().min(1, "Required"),
  appointment_time: z.string().min(1, "Pick a time slot"),
  type: z.enum(["consultation", "followup", "procedure", "checkup", "emergency"]),
  duration: z.number(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const DURATIONS = [15, 30, 45, 60]

export function AppointmentModal({
  open,
  onClose,
  presetDate,
  presetTime,
}: {
  open: boolean
  onClose: () => void
  presetDate?: string
  presetTime?: string
}) {
  const qc = useQueryClient()
  const [patientSearch, setPatientSearch] = useState("")
  const term = useDebounce(patientSearch, 300)
  const [selectedName, setSelectedName] = useState("")

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "consultation", duration: 30 },
  })

  useEffect(() => {
    if (open) {
      reset({ type: "consultation", duration: 30, appointment_date: presetDate ?? "", appointment_time: presetTime ?? "", patient_id: "" })
      setSelectedName("")
      setPatientSearch("")
    }
  }, [open, presetDate, presetTime, reset])

  const date = watch("appointment_date")
  const duration = watch("duration")
  const time = watch("appointment_time")

  const patientResults = useQuery({
    queryKey: ["appt", "patient-search", term],
    queryFn: () => listPatients({ search: term, limit: 6 }),
    enabled: open && term.length >= 1 && !selectedName,
  })
  const slots = useQuery({
    queryKey: ["slots", date],
    queryFn: () => getSlots(date),
    enabled: open && Boolean(date),
  })

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
      toast.success("Appointment scheduled")
      onClose()
    },
    onError: (e) => toast.error(apiMessage(e, "Could not create appointment")),
  })

  return (
    <Modal open={open} onClose={onClose} title="New Appointment">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Patient autocomplete */}
        <div className="relative">
          <label className="label">Patient</label>
          {selectedName ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
              <span className="text-sm font-medium text-brand-700">{selectedName}</span>
              <button type="button" onClick={() => { setSelectedName(""); setValue("patient_id", "") }} className="text-xs text-brand-600 hover:underline">Change</button>
            </div>
          ) : (
            <input className="input" placeholder="Search patient by name..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          )}
          {errors.patient_id && !selectedName && <p className="mt-1 text-xs text-red-600">{errors.patient_id.message}</p>}
          {!selectedName && (patientResults.data?.patients?.length ?? 0) > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-lg dark:bg-gray-800">
              {patientResults.data!.patients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => { setValue("patient_id", p.id); setSelectedName(p.full_name); setPatientSearch("") }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-brand-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium">{p.full_name}</span>
                    <span className="text-xs text-ink-secondary">{p.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" {...register("appointment_date")} error={errors.appointment_date?.message} />
          <Select label="Type" {...register("type")}>
            <option value="consultation">Consultation</option>
            <option value="followup">Follow-up</option>
            <option value="procedure">Procedure</option>
            <option value="checkup">Checkup</option>
            <option value="emergency">Emergency</option>
          </Select>
        </div>

        {/* Time slots */}
        <div>
          <label className="label">Available Slots</label>
          {!date ? (
            <p className="text-sm text-ink-muted">Pick a date to see slots.</p>
          ) : slots.isLoading ? (
            <p className="text-sm text-ink-muted">Loading slots...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(slots.data ?? []).map((s: any) => {
                const value = typeof s === "string" ? s : s.time
                const available = typeof s === "string" ? true : s.available !== false
                return (
                  <button
                    type="button"
                    key={value}
                    disabled={!available}
                    onClick={() => setValue("appointment_time", value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm tabular",
                      !available && "cursor-not-allowed text-gray-300 line-through",
                      time === value ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 hover:border-brand-300"
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          )}
          {errors.appointment_time && <p className="mt-1 text-xs text-red-600">{errors.appointment_time.message}</p>}
        </div>

        <div>
          <label className="label">Duration</label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setValue("duration", d)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  duration === d ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 hover:border-brand-300"
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Reason" rows={2} {...register("reason")} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>Save Appointment</Button>
        </div>
      </form>
    </Modal>
  )
}
