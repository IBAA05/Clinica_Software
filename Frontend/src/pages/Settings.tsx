import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Plus, Upload, Power } from "lucide-react"
import { settingsApi } from "@/api/misc"
import { changePassword } from "@/api/auth"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input, Select, Textarea } from "@/components/ui/Input"
import { Badge, StatusBadge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/lib/axios"

const TABS = ["Clinic Info", "Notifications", "Staff", "Security"] as const

export default function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Clinic Info")
  return (
    <Card>
      <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2 dark:border-gray-700">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-4 py-2 text-sm font-medium", tab === t ? "bg-brand-500 text-white" : "text-ink-secondary hover:bg-brand-50")}>{t}</button>
        ))}
      </div>
      <div className="p-5">
        {tab === "Clinic Info" && <ClinicTab />}
        {tab === "Notifications" && <NotificationsTab />}
        {tab === "Staff" && <StaffTab />}
        {tab === "Security" && <SecurityTab />}
      </div>
    </Card>
  )
}

const clinicSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  currency: z.string(),
  tax_rate: z.coerce.number().min(0).max(100),
})
type ClinicForm = z.infer<typeof clinicSchema>

function ClinicTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["settings", "clinic"], queryFn: settingsApi.getClinic })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema), defaultValues: { currency: "USD", tax_rate: 10 } })
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const save = useMutation({ mutationFn: (d: ClinicForm) => settingsApi.updateClinic(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "clinic"] }); toast.success("Settings saved") }, onError: (e) => toast.error(apiMessage(e)) })
  if (isLoading) return <Skeleton className="h-64 w-full" />
  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="max-w-2xl space-y-4">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-4 hover:border-brand-300">
        <Upload className="h-5 w-5 text-ink-muted" /> <span className="text-sm text-ink-secondary">Upload clinic logo</span>
        <input type="file" accept="image/*" className="hidden" />
      </label>
      <Input label="Clinic Name" required {...register("name")} error={errors.name?.message} />
      <Textarea label="Address" rows={2} {...register("address")} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone" {...register("phone")} />
        <Input label="Email" {...register("email")} error={errors.email?.message} />
      </div>
      <Input label="Website" {...register("website")} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Currency" {...register("currency")}>
          {["USD", "EUR", "GBP", "DZD", "AED", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Tax Rate (%)" type="number" {...register("tax_rate")} error={errors.tax_rate?.message} />
      </div>
      <Button type="submit" loading={save.isPending}>Save</Button>
    </form>
  )
}

function NotificationsTab() {
  const { data } = useQuery({ queryKey: ["settings", "notifications"], queryFn: settingsApi.getNotifications })
  const { register, handleSubmit, reset } = useForm<any>({ defaultValues: { smtp_host: "", smtp_port: 587, smtp_user: "", from_email: "", remind_1h: true, remind_24h: true } })
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const save = useMutation({ mutationFn: (d: any) => settingsApi.updateNotifications(d), onSuccess: () => toast.success("Saved"), onError: (e) => toast.error(apiMessage(e)) })
  const test = useMutation({ mutationFn: () => settingsApi.testEmail(), onSuccess: () => toast.success("Test email sent"), onError: (e) => toast.error(apiMessage(e)) })
  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="SMTP Host" {...register("smtp_host")} />
        <Input label="SMTP Port" type="number" {...register("smtp_port")} />
        <Input label="SMTP User" {...register("smtp_user")} />
        <Input label="SMTP Password" type="password" {...register("smtp_password")} />
      </div>
      <Input label="From Email" {...register("from_email")} />
      <div className="space-y-2">
        <p className="label">Appointment Reminders</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("remind_1h")} className="h-4 w-4 rounded text-brand-500 focus:ring-brand-400" /> 1 hour before</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("remind_24h")} className="h-4 w-4 rounded text-brand-500 focus:ring-brand-400" /> 24 hours before</label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>Save</Button>
        <Button type="button" variant="secondary" onClick={() => test.mutate()} loading={test.isPending}>Test Email</Button>
      </div>
    </form>
  )
}

function StaffTab() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ["settings", "staff"], queryFn: settingsApi.listStaff })
  const [open, setOpen] = useState(false)
  const staff = data ?? []
  const toggle = useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => settingsApi.setStaffActive(id, active), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", "staff"] }); toast.success("Updated") }, onError: (e) => toast.error(apiMessage(e)) })
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Staff</Button></div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-ink-muted"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr></thead>
        <tbody>
          {staff.map((s: any) => (
            <tr key={s.id} className="border-t border-gray-50 dark:border-gray-700">
              <td className="py-2 font-medium">{s.name}</td>
              <td className="py-2">{s.email}</td>
              <td className="py-2"><Badge className="bg-gray-100 capitalize text-gray-600">{s.role}</Badge></td>
              <td className="py-2"><StatusBadge active={s.is_active} /></td>
              <td className="py-2"><button onClick={() => toggle.mutate({ id: s.id, active: !s.is_active })} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"><Power className="h-3.5 w-3.5" /> {s.is_active ? "Deactivate" : "Reactivate"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddStaffModal open={open} onClose={() => setOpen(false)} onAdded={() => qc.invalidateQueries({ queryKey: ["settings", "staff"] })} />
    </div>
  )
}

const staffSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  temp_password: z.string().min(6, "Min 6 characters"),
  role: z.literal("receptionist"),
})
type StaffForm = z.infer<typeof staffSchema>

function AddStaffModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffForm>({ resolver: zodResolver(staffSchema), defaultValues: { role: "receptionist" } })
  useEffect(() => { if (open) reset({ role: "receptionist" }) }, [open, reset])
  const add = useMutation({ mutationFn: (d: StaffForm) => settingsApi.addStaff(d), onSuccess: () => { toast.success("Staff added"); onAdded(); onClose() }, onError: (e) => toast.error(apiMessage(e)) })
  return (
    <Modal open={open} onClose={onClose} title="Add Staff">
      <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-4">
        <Input label="Full Name" required {...register("name")} error={errors.name?.message} />
        <Input label="Email" required {...register("email")} error={errors.email?.message} />
        <Input label="Temporary Password" required {...register("temp_password")} error={errors.temp_password?.message} />
        <p className="text-xs text-ink-muted">Role: Receptionist</p>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={add.isPending}>Add</Button></div>
      </form>
    </Modal>
  )
}

const pwSchema = z.object({
  current_password: z.string().min(1, "Required"),
  new_password: z.string().min(8, "Min 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] })
type PwForm = z.infer<typeof pwSchema>

function SecurityTab() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwForm>({ resolver: zodResolver(pwSchema) })
  const save = useMutation({ mutationFn: (d: PwForm) => changePassword(d.current_password, d.new_password), onSuccess: () => { toast.success("Password updated"); reset() }, onError: (e) => toast.error(apiMessage(e)) })
  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="max-w-md space-y-4">
      <Input label="Current Password" type="password" required {...register("current_password")} error={errors.current_password?.message} />
      <Input label="New Password" type="password" required {...register("new_password")} error={errors.new_password?.message} />
      <Input label="Confirm Password" type="password" required {...register("confirm_password")} error={errors.confirm_password?.message} />
      <Button type="submit" loading={save.isPending}>Update Password</Button>
    </form>
  )
}
