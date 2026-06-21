import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { AlertTriangle, Plus, Printer, Trash2, Save, CheckCircle2, Search } from "lucide-react"
import { getVisit, updateVisit } from "@/api/visits"
import { searchICD } from "@/api/misc"
import { doctorApi, settingsApi } from "@/api/misc"
import { useDebounce } from "@/hooks/useDebounce"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, BloodTypeBadge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { generatePrescriptionPdf } from "@/lib/pdf"
import { formatDate, calcAge } from "@/lib/utils"
import { apiMessage } from "@/lib/axios"
import type { Prescription, Diagnosis } from "@/types"

const LAB_TESTS = ["CBC", "BMP", "LFT", "Lipid Panel", "X-Ray", "MRI", "CT Scan", "Ultrasound", "Urinalysis", "HbA1c"]

export default function VisitDetail() {
  const { id = "" } = useParams()
  const qc = useQueryClient()
  const { data: visit, isLoading } = useQuery({ queryKey: ["visit", id], queryFn: () => getVisit(id) })

  const [symptoms, setSymptoms] = useState("")
  const [notes, setNotes] = useState("")
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labs, setLabs] = useState<string[]>([])
  const [labOther, setLabOther] = useState("")
  const [nextVisit, setNextVisit] = useState("")
  const [icdQuery, setIcdQuery] = useState("")
  const icdTerm = useDebounce(icdQuery, 300)

  useEffect(() => {
    if (visit) {
      setSymptoms(visit.symptoms ?? "")
      setNotes(visit.clinical_notes ?? "")
      setDiagnoses(visit.diagnoses ?? [])
      setPrescriptions(visit.prescriptions ?? [])
      setLabs(visit.lab_requests ?? [])
      setNextVisit(visit.next_visit_date ?? "")
    }
  }, [visit])

  const icd = useQuery({
    queryKey: ["icd", icdTerm],
    queryFn: () => searchICD(icdTerm),
    enabled: icdTerm.length >= 2,
  })
  const doctor = useQuery({ queryKey: ["doctor", "me"], queryFn: doctorApi.profile })
  const clinic = useQuery({ queryKey: ["settings", "clinic"], queryFn: settingsApi.getClinic })

  const save = useMutation({
    mutationFn: (complete: boolean) =>
      updateVisit(id, {
        symptoms,
        clinical_notes: notes,
        diagnoses,
        prescriptions,
        lab_requests: labOther ? [...labs, labOther] : labs,
        next_visit_date: nextVisit || null,
        status: complete ? "completed" : "draft",
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["visit", id] }); toast.success("Visit saved") },
    onError: (e) => toast.error(apiMessage(e, "Could not save visit")),
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!visit) return <EmptyState title="Visit not found" />

  const allergies = visit.patient_allergies ?? []

  function addMed() {
    setPrescriptions((p) => [...p, { medication: "", dosage: "", frequency: "", duration: "", instructions: "" }])
  }
  function updateMed(i: number, key: keyof Prescription, value: string) {
    setPrescriptions((p) => p.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)))
  }
  function removeMed(i: number) {
    setPrescriptions((p) => p.filter((_, idx) => idx !== i))
  }
  function toggleLab(test: string) {
    setLabs((l) => (l.includes(test) ? l.filter((t) => t !== test) : [...l, test]))
  }
  function printPrescription() {
    generatePrescriptionPdf({
      clinic: { name: clinic.data?.name ?? "Clinica", address: clinic.data?.address, phone: clinic.data?.phone, email: clinic.data?.email },
      patient: { name: visit!.patient_name, dob: visit!.patient_dob, age: visit!.patient_dob ? calcAge(visit!.patient_dob) : undefined },
      doctor: { name: doctor.data?.name ?? "", specialty: doctor.data?.specialty, registration_no: doctor.data?.registration_no, signature: doctor.data?.signature_url },
      date: visit!.visit_date,
      medications: prescriptions.filter((m) => m.medication),
    })
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Patient banner */}
      <Card className="sticky top-16 z-10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg font-bold">{visit.patient_name}</span>
            {visit.patient_dob && <Badge className="bg-gray-100 text-gray-600">{calcAge(visit.patient_dob)} yrs</Badge>}
            <BloodTypeBadge type={visit.patient_blood_type} />
          </div>
          <Link to={`/patients/${visit.patient_id}`} className="text-sm font-medium text-brand-600 hover:underline">View Full Patient Profile</Link>
        </div>
        {allergies.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" /> <span className="font-semibold">ALLERGIES:</span> {allergies.join(", ")}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* LEFT clinical content */}
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader title="Symptoms" />
            <div className="p-4">
              <textarea className="input min-h-[80px]" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} onBlur={() => save.mutate(false)} placeholder="Patient-reported symptoms..." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Clinical Notes" subtitle="Auto-saved on blur" />
            <div className="p-4">
              <textarea className="input min-h-[120px]" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => save.mutate(false)} placeholder="Examination findings, assessment..." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Diagnosis (ICD-10)" />
            <div className="space-y-3 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Search ICD-10 code or description..." value={icdQuery} onChange={(e) => setIcdQuery(e.target.value)} />
                {(icd.data?.length ?? 0) > 0 && icdQuery && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-lg dark:bg-gray-800">
                    {icd.data!.map((d: any) => (
                      <li key={d.code}>
                        <button
                          type="button"
                          onClick={() => { setDiagnoses((arr) => arr.some((x) => x.code === d.code) ? arr : [...arr, { code: d.code, description: d.description }]); setIcdQuery("") }}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-brand-50 dark:hover:bg-gray-700"
                        >
                          <span className="text-sm font-semibold text-brand-700">{d.code}</span>
                          <span className="text-xs text-ink-secondary">{d.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-1">
                {diagnoses.map((d) => (
                  <div key={d.code} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700">
                    <span><Badge className="bg-brand-100 text-brand-700">{d.code}</Badge> <span className="ml-2 text-sm">{d.description}</span></span>
                    <button onClick={() => setDiagnoses((arr) => arr.filter((x) => x.code !== d.code))} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Prescriptions" action={<Button variant="secondary" onClick={printPrescription}><Printer className="h-4 w-4" /> Print PDF</Button>} />
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase text-ink-muted"><th className="pb-2">Medication</th><th className="pb-2">Dosage</th><th className="pb-2">Frequency</th><th className="pb-2">Duration</th><th className="pb-2">Instructions</th><th /></tr></thead>
                  <tbody>
                    {prescriptions.map((m, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-1"><input className="input py-1" value={m.medication} onChange={(e) => updateMed(i, "medication", e.target.value)} /></td>
                        <td className="py-1 pr-1"><input className="input py-1" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} /></td>
                        <td className="py-1 pr-1"><input className="input py-1" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} /></td>
                        <td className="py-1 pr-1"><input className="input py-1" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} /></td>
                        <td className="py-1 pr-1"><input className="input py-1" value={m.instructions ?? ""} onChange={(e) => updateMed(i, "instructions", e.target.value)} /></td>
                        <td><button onClick={() => removeMed(i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" onClick={addMed} className="mt-2"><Plus className="h-4 w-4" /> Add Medication</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Lab / Imaging Requests" />
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LAB_TESTS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={labs.includes(t)} onChange={() => toggleLab(t)} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400" />
                    {t}
                  </label>
                ))}
              </div>
              <input className="input mt-3" placeholder="Other test..." value={labOther} onChange={(e) => setLabOther(e.target.value)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Next Visit" />
            <div className="p-4">
              <input type="date" className="input" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
            </div>
          </Card>
        </div>

        {/* RIGHT summary */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Linked Appointment" />
            <div className="p-4 text-sm">
              {visit.appointment ? (
                <>
                  <p>{formatDate(visit.appointment.appointment_date)} · {visit.appointment.appointment_time}</p>
                  <p className="capitalize text-ink-secondary">{visit.appointment.type} · {visit.appointment.status}</p>
                </>
              ) : <p className="text-ink-muted">No linked appointment</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Patient Quick Info" />
            <div className="space-y-2 p-4 text-sm">
              {visit.patient_dob && <p><span className="text-ink-muted">DOB:</span> {formatDate(visit.patient_dob)}</p>}
              <p><span className="text-ink-muted">Blood Type:</span> {visit.patient_blood_type ?? "Unknown"}</p>
              <div>
                <p className="text-ink-muted">Allergies</p>
                <div className="mt-1 flex flex-wrap gap-1">{allergies.length ? allergies.map((a) => <Badge key={a} className="bg-red-50 text-red-600">{a}</Badge>) : <span className="text-ink-secondary">None</span>}</div>
              </div>
              <div>
                <p className="text-ink-muted">Chronic Conditions</p>
                <div className="mt-1 flex flex-wrap gap-1">{(visit.patient_conditions ?? []).map((c) => <Badge key={c} className="bg-amber-100 text-amber-700">{c}</Badge>)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-end gap-2 border-t border-gray-100 bg-white/90 px-6 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <Button variant="secondary" onClick={() => save.mutate(false)} loading={save.isPending}><Save className="h-4 w-4" /> Save Draft</Button>
        <Button onClick={() => save.mutate(true)} loading={save.isPending}><CheckCircle2 className="h-4 w-4" /> Save & Complete Visit</Button>
      </div>
    </div>
  )
}
