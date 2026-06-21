import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Drawer } from "@/components/ui/Drawer"
import { Button } from "@/components/ui/Button"
import { Input, Select, Textarea } from "@/components/ui/Input"
import { TagInput } from "@/components/ui/TagInput"
import { createPatient, updatePatient } from "@/api/patients"
import { apiMessage } from "@/lib/axios"
import type { Patient } from "@/types"

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  national_id: z.string().min(1, "Required"),
  address: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronic_conditions: z.array(z.string()).optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const BLOOD = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function PatientFormDrawer({
  open,
  onClose,
  patient,
}: {
  open: boolean
  onClose: () => void
  patient?: Patient | null
}) {
  const qc = useQueryClient()
  const editing = Boolean(patient)
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: "male", allergies: [], chronic_conditions: [] },
  })

  useEffect(() => {
    if (open) {
      reset(
        patient
          ? {
              first_name: patient.first_name,
              last_name: patient.last_name,
              date_of_birth: patient.date_of_birth,
              gender: patient.gender,
              phone: patient.phone,
              email: patient.email ?? "",
              national_id: patient.national_id,
              address: patient.address ?? "",
              blood_type: patient.blood_type ?? "",
              allergies: patient.allergies ?? [],
              chronic_conditions: patient.chronic_conditions ?? [],
              insurance_provider: patient.insurance_provider ?? "",
              insurance_number: patient.insurance_number ?? "",
              emergency_contact_name: patient.emergency_contact_name ?? "",
              emergency_contact_phone: patient.emergency_contact_phone ?? "",
              notes: patient.notes ?? "",
            }
          : { gender: "male", allergies: [], chronic_conditions: [] }
      )
    }
  }, [open, patient, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => (editing ? updatePatient(patient!.id, data) : createPatient(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] })
      toast.success(editing ? "Patient updated" : "Patient registered")
      onClose()
    },
    onError: (e) => toast.error(apiMessage(e, "Could not save patient")),
  })

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSubmit((d) => mutation.mutate(d))} loading={isSubmitting || mutation.isPending}>
        {editing ? "Save Changes" : "Register Patient"}
      </Button>
    </div>
  )

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit Patient" : "Register Patient"} footer={footer}>
      <form className="space-y-5">
        <Section title="Personal Info">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" required {...register("first_name")} error={errors.first_name?.message} />
            <Input label="Last Name" required {...register("last_name")} error={errors.last_name?.message} />
            <Input label="Date of Birth" type="date" required {...register("date_of_birth")} error={errors.date_of_birth?.message} />
            <Select label="Gender" required {...register("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Phone" required {...register("phone")} error={errors.phone?.message} />
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
            <Input label="National ID" required {...register("national_id")} error={errors.national_id?.message} />
            <Input label="Address" {...register("address")} />
          </div>
        </Section>

        <Section title="Medical Info">
          <Select label="Blood Type" {...register("blood_type")}>
            {BLOOD.map((b) => (
              <option key={b} value={b}>{b || "Unknown"}</option>
            ))}
          </Select>
          <Controller
            control={control}
            name="allergies"
            render={({ field }) => (
              <TagInput label="Allergies" value={field.value ?? []} onChange={field.onChange} placeholder="Type and press Enter" />
            )}
          />
          <Controller
            control={control}
            name="chronic_conditions"
            render={({ field }) => (
              <TagInput label="Chronic Conditions" value={field.value ?? []} onChange={field.onChange} placeholder="Type and press Enter" />
            )}
          />
        </Section>

        <Section title="Insurance & Emergency">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Insurance Provider" {...register("insurance_provider")} />
            <Input label="Insurance Number" {...register("insurance_number")} />
            <Input label="Emergency Contact" {...register("emergency_contact_name")} />
            <Input label="Emergency Phone" {...register("emergency_contact_phone")} />
          </div>
          <Textarea label="Notes" rows={3} {...register("notes")} />
        </Section>
      </form>
    </Drawer>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-gray-100 pb-5 last:border-0 dark:border-gray-700">
      <p className="text-sm font-semibold text-brand-700">{title}</p>
      {children}
    </div>
  )
}
