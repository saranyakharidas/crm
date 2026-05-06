'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  useQuotes,
  calcTotals,
  calcLineItem,
  type Quote,
  type Invoice,
  type QuoteOrInvoice,
  type QuoteStatus,
  type InvoiceStatus,
  type LineItem,
} from '@/lib/quotes-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Receipt,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Eye,
  Download,
  Copy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Building2,
  User,
  X,
  GripVertical,
  ChevronDown,
  Printer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow, format, isPast } from 'date-fns'

// ─── Status config ─────────────────────────────────────────────────────────────
const QUOTE_STATUS: Record<QuoteStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   icon: <FileText className="h-3 w-3" /> },
  sent:     { label: 'Sent',     className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      icon: <Send className="h-3 w-3" /> },
  viewed:   { label: 'Viewed',   className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',icon: <Eye className="h-3 w-3" /> },
  accepted: { label: 'Accepted', className: 'bg-green-500/10 text-green-400 border-green-500/20',   icon: <CheckCircle2 className="h-3 w-3" /> },
  declined: { label: 'Declined', className: 'bg-red-500/10 text-red-400 border-red-500/20',         icon: <XCircle className="h-3 w-3" /> },
  expired:  { label: 'Expired',  className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   icon: <Clock className="h-3 w-3" /> },
}

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   icon: <FileText className="h-3 w-3" /> },
  sent:      { label: 'Sent',      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      icon: <Send className="h-3 w-3" /> },
  viewed:    { label: 'Viewed',    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',icon: <Eye className="h-3 w-3" /> },
  paid:      { label: 'Paid',      className: 'bg-green-500/10 text-green-400 border-green-500/20',   icon: <CheckCircle2 className="h-3 w-3" /> },
  overdue:   { label: 'Overdue',   className: 'bg-red-500/10 text-red-400 border-red-500/20',         icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   icon: <XCircle className="h-3 w-3" /> },
}

function StatusBadge({ doc }: { doc: QuoteOrInvoice }) {
  const cfg = doc.type === 'quote'
    ? QUOTE_STATUS[doc.status as QuoteStatus]
    : INVOICE_STATUS[doc.status as InvoiceStatus]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', cfg.className)}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
}

function uid() { return `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

function blankLineItem(): LineItem {
  return { id: uid(), description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }
}

// ─── Line Item Editor ──────────────────────────────────────────────────────────
function LineItemEditor({ items, onChange }: { items: LineItem[]; onChange: (items: LineItem[]) => void }) {
  const setItem = (idx: number, patch: Partial<LineItem>) =>
    onChange(items.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const totals = calcTotals(items)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[35%]">Description</TableHead>
              <TableHead className="w-16 text-right">Qty</TableHead>
              <TableHead className="w-28 text-right">Unit Price</TableHead>
              <TableHead className="w-20 text-right">Disc %</TableHead>
              <TableHead className="w-20 text-right">Tax %</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const { total } = calcLineItem(item)
              return (
                <TableRow key={item.id}>
                  <TableCell className="py-2">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={e => setItem(idx, { description: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number" min={0}
                      value={item.quantity}
                      onChange={e => setItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm text-right w-16"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number" min={0} step="0.01"
                      value={item.unitPrice}
                      onChange={e => setItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm text-right"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number" min={0} max={100}
                      value={item.discount}
                      onChange={e => setItem(idx, { discount: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm text-right w-20"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number" min={0} max={100}
                      value={item.taxRate}
                      onChange={e => setItem(idx, { taxRate: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm text-right w-20"
                    />
                  </TableCell>
                  <TableCell className="py-2 text-right font-medium text-sm">
                    {fmtCurrency(total)}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => onChange(items.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" size="sm" onClick={() => onChange([...items, blankLineItem()])}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add line item
      </Button>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{fmtCurrency(totals.subtotal)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Discount</span>
              <span>- {fmtCurrency(totals.totalDiscount)}</span>
            </div>
          )}
          {totals.totalTax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{fmtCurrency(totals.totalTax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{fmtCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Document Preview Sheet ────────────────────────────────────────────────────
function DocumentPreview({
  doc,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  doc: QuoteOrInvoice | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onEdit: (doc: QuoteOrInvoice) => void
  onDelete: (id: string, type: 'quote' | 'invoice') => void
}) {
  const { updateQuote, updateInvoice, convertQuoteToInvoice } = useQuotes()
  if (!doc) return null

  const totals = calcTotals(doc.lineItems)
  const isQuote = doc.type === 'quote'
  const dateLabel = isQuote ? 'Valid until' : 'Due date'
  const dateValue = isQuote ? (doc as Quote).validUntil : (doc as Invoice).dueDate
  const isOverdue = !isQuote && (doc as Invoice).status !== 'paid' && isPast(new Date(dateValue))

  const markAs = (status: string) => {
    const now = new Date().toISOString()
    if (isQuote) {
      updateQuote(doc.id, { status: status as QuoteStatus, respondedAt: now })
    } else {
      updateInvoice(doc.id, {
        status: status as InvoiceStatus,
        ...(status === 'sent' ? { sentAt: now } : {}),
        ...(status === 'paid' ? { paidAt: now } : {}),
      })
    }
    toast.success(`Marked as ${status}`)
  }

  const handleConvert = () => {
    convertQuoteToInvoice(doc.id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[680px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{doc.number}</SheetTitle>
          <SheetDescription>Document preview for {doc.number}</SheetDescription>
        </SheetHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <StatusBadge doc={doc} />
            <span className="text-sm font-medium text-muted-foreground">{doc.number}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isQuote && (doc as Quote).status === 'accepted' && (
              <Button size="sm" variant="outline" onClick={handleConvert}>
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Convert to Invoice
              </Button>
            )}
            {isQuote && (doc as Quote).status === 'draft' && (
              <Button size="sm" onClick={() => markAs('sent')}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send Quote
              </Button>
            )}
            {!isQuote && (doc as Invoice).status === 'draft' && (
              <Button size="sm" onClick={() => markAs('sent')}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send Invoice
              </Button>
            )}
            {!isQuote && ['sent','viewed','overdue'].includes(doc.status) && (
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={() => markAs('paid')}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Paid
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onOpenChange(false); onEdit(doc) }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('Download simulated')}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('Printed')}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </DropdownMenuItem>
                {isQuote && (
                  <>
                    {(doc as Quote).status === 'sent' && (
                      <>
                        <DropdownMenuItem onClick={() => markAs('accepted')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark accepted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markAs('declined')}>
                          <XCircle className="mr-2 h-4 w-4" /> Mark declined
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { onDelete(doc.id, doc.type); onOpenChange(false) }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Document body */}
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {isQuote ? <FileText className="h-4 w-4 text-primary" /> : <Receipt className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xl font-bold text-primary">{doc.number}</span>
              </div>
              <h2 className="text-lg font-semibold mt-1">{doc.title}</h2>
              {doc.dealTitle && (
                <p className="text-sm text-muted-foreground">Deal: {doc.dealTitle}</p>
              )}
            </div>
            <div className="text-right text-sm space-y-0.5">
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</p>
              <p className={cn('mt-2 text-muted-foreground')}>{dateLabel}</p>
              <p className={cn('font-medium', isOverdue && 'text-red-400')}>
                {format(new Date(dateValue), 'MMM d, yyyy')}
                {isOverdue && ' (Overdue)'}
              </p>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To</p>
              <p className="font-semibold">{doc.accountName}</p>
              <p className="text-sm text-muted-foreground">{doc.contactName}</p>
              <p className="text-sm text-muted-foreground">{doc.contactEmail}</p>
            </div>
            {doc.type === 'invoice' && (doc as Invoice).quoteId && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From Quote</p>
                <p className="text-sm font-medium text-primary">
                  {/* Would link to quote in a real app */}
                  {(doc as Invoice).quoteId}
                </p>
              </div>
            )}
          </div>

          {/* Line items (read-only) */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-16">Qty</TableHead>
                  <TableHead className="text-right w-28">Unit Price</TableHead>
                  <TableHead className="text-right w-20">Disc</TableHead>
                  <TableHead className="text-right w-20">Tax</TableHead>
                  <TableHead className="text-right w-28">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc.lineItems.map(item => {
                  const { total, discountAmt } = calcLineItem(item)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description || <span className="text-muted-foreground italic">No description</span>}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.discount > 0 ? `${item.discount}%` : '—'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.taxRate > 0 ? `${item.taxRate}%` : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtCurrency(total)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{fmtCurrency(totals.subtotal)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>− {fmtCurrency(totals.totalDiscount)}</span>
                </div>
              )}
              {totals.totalTax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{fmtCurrency(totals.totalTax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{fmtCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes / Terms */}
          {(doc.notes || doc.terms) && (
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
              {doc.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-muted-foreground">{doc.notes}</p>
                </div>
              )}
              {doc.terms && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Terms</p>
                  <p className="text-sm text-muted-foreground">{doc.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Document Form Dialog ──────────────────────────────────────────────────────
type FormMode = { type: 'quote'; editing?: Quote } | { type: 'invoice'; editing?: Invoice }

function DocumentFormDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: FormMode
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { addQuote, updateQuote, addInvoice, updateInvoice } = useQuotes()
  const isQuote = mode.type === 'quote'
  const editing = mode.editing

  const [title, setTitle] = useState(editing?.title ?? '')
  const [accountName, setAccountName] = useState(editing?.accountName ?? '')
  const [contactName, setContactName] = useState(editing?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(editing?.contactEmail ?? '')
  const [dealTitle, setDealTitle] = useState(editing?.dealTitle ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [terms, setTerms] = useState(editing?.terms ?? 'Net 30.')
  const [dateField, setDateField] = useState(
    editing
      ? isQuote ? (editing as Quote).validUntil.slice(0, 10) : (editing as Invoice).dueDate.slice(0, 10)
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  )
  const [lineItems, setLineItems] = useState<LineItem[]>(editing?.lineItems ?? [blankLineItem()])

  const handleOpen = (o: boolean) => {
    if (o) {
      setTitle(editing?.title ?? '')
      setAccountName(editing?.accountName ?? '')
      setContactName(editing?.contactName ?? '')
      setContactEmail(editing?.contactEmail ?? '')
      setDealTitle(editing?.dealTitle ?? '')
      setNotes(editing?.notes ?? '')
      setTerms(editing?.terms ?? 'Net 30.')
      setDateField(
        editing
          ? isQuote ? (editing as Quote).validUntil.slice(0, 10) : (editing as Invoice).dueDate.slice(0, 10)
          : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
      )
      setLineItems(editing?.lineItems ?? [blankLineItem()])
    }
    onOpenChange(o)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!accountName.trim()) { toast.error('Account name is required'); return }
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return }

    const base = {
      title: title.trim(),
      accountName: accountName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      dealTitle: dealTitle.trim() || undefined,
      notes: notes.trim(),
      terms: terms.trim(),
      lineItems,
      currency: 'USD',
    }

    if (isQuote) {
      const payload = { ...base, status: (editing as Quote)?.status ?? 'draft' as QuoteStatus, validUntil: new Date(dateField).toISOString() }
      editing ? updateQuote(editing.id, payload) : addQuote(payload)
    } else {
      const payload = { ...base, status: (editing as Invoice)?.status ?? 'draft' as InvoiceStatus, dueDate: new Date(dateField).toISOString() }
      editing ? updateInvoice(editing.id, payload) : addInvoice(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'New'} {isQuote ? 'Quote' : 'Invoice'}</DialogTitle>
          <DialogDescription>{isQuote ? 'Create a quote to send to a prospect or customer.' : 'Create an invoice for billing.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. CRM Platform — Acme Corp Q2" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Account / Company *</Label>
              <Input placeholder="Acme Corporation" value={accountName} onChange={e => setAccountName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Deal</Label>
              <Input placeholder="Deal name (optional)" value={dealTitle} onChange={e => setDealTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Contact name</Label>
              <Input placeholder="James Miller" value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Contact email</Label>
              <Input type="email" placeholder="james@acme.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{isQuote ? 'Valid until' : 'Due date'}</Label>
              <Input type="date" value={dateField} onChange={e => setDateField(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Line items</Label>
            <LineItemEditor items={lineItems} onChange={setLineItems} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes for the recipient..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Terms</Label>
              <Textarea placeholder="Payment terms..." value={terms} onChange={e => setTerms(e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : `Create ${isQuote ? 'Quote' : 'Invoice'}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Row component ─────────────────────────────────────────────────────────────
function DocRow({
  doc,
  onView,
  onEdit,
  onDelete,
}: {
  doc: QuoteOrInvoice
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { updateQuote, updateInvoice, convertQuoteToInvoice } = useQuotes()
  const totals = calcTotals(doc.lineItems)
  const isQuote = doc.type === 'quote'
  const dateValue = isQuote ? (doc as Quote).validUntil : (doc as Invoice).dueDate
  const isOverdue = !isQuote && (doc as Invoice).status !== 'paid' && isPast(new Date(dateValue))

  return (
    <TableRow className="cursor-pointer hover:bg-muted/30" onClick={onView}>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{doc.number}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{doc.title}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {doc.accountName}
        </div>
      </TableCell>
      <TableCell><StatusBadge doc={doc} /></TableCell>
      <TableCell className="font-semibold">{fmtCurrency(totals.total)}</TableCell>
      <TableCell>
        <span className={cn('text-sm', isOverdue && 'text-red-400 font-medium')}>
          {format(new Date(dateValue), 'MMM d, yyyy')}
          {isOverdue && ' ⚠'}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
      </TableCell>
      <TableCell onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            {isQuote && (doc as Quote).status === 'accepted' && (
              <DropdownMenuItem onClick={() => convertQuoteToInvoice(doc.id)}>
                <ArrowRight className="mr-2 h-4 w-4" /> Convert to Invoice
              </DropdownMenuItem>
            )}
            {isQuote && (doc as Quote).status === 'draft' && (
              <DropdownMenuItem onClick={() => { updateQuote(doc.id, { status: 'sent', sentAt: new Date().toISOString() }); toast.success('Quote marked as sent') }}>
                <Send className="mr-2 h-4 w-4" /> Mark sent
              </DropdownMenuItem>
            )}
            {!isQuote && ['sent','viewed','overdue'].includes(doc.status) && (
              <DropdownMenuItem onClick={() => { updateInvoice(doc.id, { status: 'paid', paidAt: new Date().toISOString() }); toast.success('Invoice marked as paid') }}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark paid
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function QuotesView() {
  const { quotes, invoices, deleteQuote, deleteInvoice } = useQuotes()
  const [tab, setTab] = useState<'quotes' | 'invoices'>('quotes')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewDoc, setPreviewDoc] = useState<QuoteOrInvoice | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>({ type: 'quote' })
  const [formOpen, setFormOpen] = useState(false)

  const filteredQuotes = useMemo(() =>
    quotes.filter(q => {
      const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.accountName.toLowerCase().includes(search.toLowerCase()) ||
        q.number.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || q.status === statusFilter
      return matchSearch && matchStatus
    }), [quotes, search, statusFilter])

  const filteredInvoices = useMemo(() =>
    invoices.filter(i => {
      const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.accountName.toLowerCase().includes(search.toLowerCase()) ||
        i.number.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || i.status === statusFilter
      return matchSearch && matchStatus
    }), [invoices, search, statusFilter])

  const invoiceStats = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + calcTotals(i.lineItems).total, 0)
    const outstanding = invoices.filter(i => !['paid','cancelled'].includes(i.status)).reduce((s, i) => s + calcTotals(i.lineItems).total, 0)
    const overdue = invoices.filter(i => i.status === 'overdue').length
    return { paid, outstanding, overdue }
  }, [invoices])

  const quoteStats = useMemo(() => {
    const accepted = quotes.filter(q => q.status === 'accepted').length
    const pending = quotes.filter(q => ['sent','viewed'].includes(q.status)).length
    const value = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + calcTotals(q.lineItems).total, 0)
    return { accepted, pending, value }
  }, [quotes])

  const openPreview = (doc: QuoteOrInvoice) => { setPreviewDoc(doc); setPreviewOpen(true) }
  const openEdit = (doc: QuoteOrInvoice) => {
    setFormMode(doc.type === 'quote' ? { type: 'quote', editing: doc as Quote } : { type: 'invoice', editing: doc as Invoice })
    setFormOpen(true)
  }
  const handleDelete = (id: string, type: 'quote' | 'invoice') => {
    type === 'quote' ? deleteQuote(id) : deleteInvoice(id)
  }

  const QUOTE_STATUSES = Object.keys(QUOTE_STATUS)
  const INVOICE_STATUSES = Object.keys(INVOICE_STATUS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Quotes & Invoices
          </h1>
          <p className="text-muted-foreground mt-1">Manage your quotes, invoices, and billing documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setFormMode({ type: 'quote' }); setFormOpen(true) }}>
            <FileText className="mr-2 h-4 w-4" /> New Quote
          </Button>
          <Button onClick={() => { setFormMode({ type: 'invoice' }); setFormOpen(true) }}>
            <Receipt className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Accepted Quotes', value: quoteStats.accepted, sub: `${quoteStats.pending} pending`, accent: 'text-green-500' },
          { label: 'Accepted Value', value: fmtCurrency(quoteStats.value), sub: 'from quotes', accent: 'text-primary' },
          { label: 'Revenue Collected', value: fmtCurrency(invoiceStats.paid), sub: 'paid invoices', accent: 'text-emerald-500' },
          { label: 'Outstanding', value: fmtCurrency(invoiceStats.outstanding), sub: `${invoiceStats.overdue} overdue`, accent: invoiceStats.overdue > 0 ? 'text-red-400' : 'text-foreground' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.accent)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => { setTab(v as any); setStatusFilter('all') }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="quotes" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Quotes
              <Badge variant="secondary" className="ml-1">{quotes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> Invoices
              <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(tab === 'quotes' ? QUOTE_STATUSES : INVOICE_STATUSES).map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="quotes" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No quotes found.</TableCell></TableRow>
                ) : filteredQuotes.map(q => (
                  <DocRow
                    key={q.id}
                    doc={q}
                    onView={() => openPreview(q)}
                    onEdit={() => openEdit(q)}
                    onDelete={() => handleDelete(q.id, 'quote')}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No invoices found.</TableCell></TableRow>
                ) : filteredInvoices.map(i => (
                  <DocRow
                    key={i.id}
                    doc={i}
                    onView={() => openPreview(i)}
                    onEdit={() => openEdit(i)}
                    onDelete={() => handleDelete(i.id, 'invoice')}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview sheet */}
      <DocumentPreview
        doc={previewDoc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* Form dialog */}
      <DocumentFormDialog
        mode={formMode}
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setFormMode({ type: tab === 'quotes' ? 'quote' : 'invoice' }) }}
      />
    </div>
  )
}