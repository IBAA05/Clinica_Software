import { LifeBuoy, Mail, Phone, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/Card"

export default function Support() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <LifeBuoy className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-2xl font-bold">How can we help?</h2>
        <p className="mt-2 text-ink-secondary">Our team is here to support your clinic around the clock.</p>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <Mail className="mx-auto h-6 w-6 text-brand-600" />
          <p className="mt-2 font-semibold">Email</p>
          <p className="text-sm text-ink-secondary">support@clinica.app</p>
        </Card>
        <Card className="p-5 text-center">
          <Phone className="mx-auto h-6 w-6 text-brand-600" />
          <p className="mt-2 font-semibold">Phone</p>
          <p className="text-sm text-ink-secondary">+1 (800) 555-0199</p>
        </Card>
        <Card className="p-5 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-brand-600" />
          <p className="mt-2 font-semibold">Docs</p>
          <p className="text-sm text-ink-secondary">docs.clinica.app</p>
        </Card>
      </div>
    </div>
  )
}
