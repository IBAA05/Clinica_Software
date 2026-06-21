import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import {
  Search, Plus, Eye, Trash2, CreditCard, Send,
  DollarSign, Clock, AlertTriangle, CheckCircle2, Receipt,
} from "lucide-react"
import toast from "react-hot-toast"
import * as invoiceApi from "@/api/invoices"
import { apiMessage } from "@/lib/axios"
import { useDebounce } from "@/hooks/useDebounce"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import { SkeletonCards } from "@/components/ui/Skeleton"
import { Modal } from "@/components/ui/Modal"
import { formatDate } from "@/lib/utils"
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/types"

const col = createColumnHelper<Invoice>()

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function Billing() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [payModal, setPayModal] = useState<Invoice | null>(null)
  const term = useDebounce(search, 300)

  const params: invoiceApi.InvoiceListParams = {
    patient_name: term || undefined,
    status: statusFilter || undefined,
    payment_method: methodFilter || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceApi.listInvoices(params),
    staleTime: 60_000,
  })

  const invoices = data?.invoices ?? []
  const stats = data?.stats

  const deleteMut = useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice deleted") },
    onError: (e) => toast.error(apiMessage(e)),
  })

  const sendMut = useMutation({
    mutationFn: invoiceApi.sendInvoice,
    onSuccess: () => toast.success("Invoice sent"),
    onError: (e) => toast.error(apiMessage(e)),
  })

  const columns = useMemo(
    () => [
      col.accessor("invoice_ref", { header: "Ref #", cell: (c) => <span className="font-mono text-sm font-semibold">{c.getValue()}</span> }),
      col.accessor("patient_name", { header: "Patient", cell: (c) => c.getValue() ?? "—" }),
      col.accessor("total", { header: "Total", cell: (c) => <span className="font-heading font-bold tabular">{formatCurrency(c.getValue())}</span> }),
      col.accessor("amount_paid", { header: "Paid", cell: (c) => formatCurrency(c.getValue()) }),
      col.accessor("balance", { header: "Balance", cell: (c) => <span className={c.getValue() > 0 ? "text-red-600 font-semibold" : "text-emerald-600"}>{formatCurrency(c.getValue())}</span> }),
      col.accessor("status", { header: "Status", cell: (c) => <Badge className={STATUS_COLOR[c.getValue()]}>{c.getValue()}</Badge> }),
      col.accessor("issue_date", { header: "Date", cell: (c) => formatDate(c.getValue()) }),
      col.display({
        id: "actions",
        header: "Actions",
        cell: (c) => {
          const inv = c.row.original
          return (
            <div className="flex gap-1">
              <IconBtn title="View" onClick={() => setViewInvoice(inv)}><Eye className="h-4 w-4" /></IconBtn>
              {inv.status !== "paid" && <IconBtn title="Pay" onClick={() => setPayModal(inv)}><CreditCard className="h-4 w-4" /></IconBtn>}
              <IconBtn title="Send" onClick={() => sendMut.mutate(inv.id)}><Send className="h-4 w-4" /></IconBtn>
              <IconBtn title="Delete" onClick={() => { if (confirm("Delete this invoice?")) deleteMut.mutate(inv.id) }}><Trash2 className="h-4 w-4 text-red-500" /></IconBtn>
            </div>
          )
        },
      }),
    ],
    []
  )

  return (
    <div className="space-y-6">
      {/* Stat bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={<DollarSign className="h-4 w-4" />} label="Total Revenue" value={formatCurrency(stats?.total_revenue ?? 0)} color="brand" />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label="Collected" value={formatCurrency(stats?.collected ?? 0)} color="emerald" />
        <MiniStat icon={<Clock className="h-4 w-4" />} label="Pending" value={formatCurrency(stats?.pending ?? 0)} color="amber" />
        <MiniStat icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={formatCurrency(stats?.overdue ?? 0)} color="red" />
      </div>

      {/* Top bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient name..." className="input pl-9" />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="input w-auto" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <Button disabled><Plus className="h-4 w-4" /> New Invoice</Button>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <Card className="p-2">
          <DataTable columns={columns} data={invoices} emptyTitle="No invoices found" />
        </Card>
      )}

      {/* View Modal */}
      {viewInvoice && (
        <Modal open onClose={() => setViewInvoice(null)} title={`Invoice ${viewInvoice.invoice_ref}`}>
          <div className="space-y-3 text-sm">
            <Row label="Patient" value={viewInvoice.patient_name ?? "—"} />
            <Row label="Date" value={formatDate(viewInvoice.issue_date)} />
            <Row label="Due" value={formatDate(viewInvoice.due_date)} />
            <Row label="Status" value={<Badge className={STATUS_COLOR[viewInvoice.status]}>{viewInvoice.status}</Badge>} />
            <hr className="dark:border-gray-700" />
            {viewInvoice.items?.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.description} <span className="text-ink-muted">×{item.quantity}</span></span>
                <span className="font-semibold">{formatCurrency(item.total)}</span>
              </div>
            ))}
            <hr className="dark:border-gray-700" />
            <Row label="Subtotal" value={formatCurrency(viewInvoice.subtotal)} />
            {viewInvoice.discount > 0 && <Row label="Discount" value={`-${formatCurrency(viewInvoice.discount)}`} />}
            {viewInvoice.tax_amount > 0 && <Row label="Tax" value={formatCurrency(viewInvoice.tax_amount)} />}
            <Row label="Total" value={<span className="text-base font-bold">{formatCurrency(viewInvoice.total)}</span>} />
            <Row label="Paid" value={formatCurrency(viewInvoice.amount_paid)} />
            <Row label="Balance" value={<span className={viewInvoice.balance > 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>{formatCurrency(viewInvoice.balance)}</span>} />
          </div>
        </Modal>
      )}

      {/* Pay Modal */}
      {payModal && <PayDialog invoice={payModal} onClose={() => setPayModal(null)} />}
    </div>
  )
}

/* ── Pay Dialog ─────────────────────────────────────────────────────── */
function PayDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState(invoice.balance.toString())
  const [method, setMethod] = useState<PaymentMethod>("cash")

  const payMut = useMutation({
    mutationFn: () =>
      invoiceApi.payInvoice(invoice.id, {
        amount_paid: parseFloat(amount),
        payment_method: method,
        paid_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Payment recorded"); onClose() },
    onError: (e) => toast.error(apiMessage(e)),
  })

  return (
    <Modal open onClose={onClose} title={`Pay Invoice ${invoice.invoice_ref}`}>
      <div className="space-y-4">
        <div>
          <label className="label">Amount (balance: {formatCurrency(invoice.balance)})</label>
          <input type="number" step="0.01" max={invoice.balance} value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => payMut.mutate()} disabled={payMut.isPending}>
            <Receipt className="h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(v)
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg = `bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{icon}</span>
      <div>
        <p className="font-heading text-xl font-bold tabular">{value}</p>
        <p className="text-xs text-ink-secondary">{label}</p>
      </div>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-secondary">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-700">
      {children}
    </button>
  )
}
