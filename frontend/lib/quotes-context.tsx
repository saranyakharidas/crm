'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
export type DocumentType = 'quote' | 'invoice'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number   // percentage 0-100
  taxRate: number    // percentage 0-100
}

export interface Quote {
  id: string
  number: string      // e.g. QUO-2025-0001
  type: 'quote'
  status: QuoteStatus
  title: string
  dealId?: string
  dealTitle?: string
  accountName: string
  contactName: string
  contactEmail: string
  lineItems: LineItem[]
  notes: string
  terms: string
  validUntil: string
  currency: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  viewedAt?: string
  respondedAt?: string
}

export interface Invoice {
  id: string
  number: string      // e.g. INV-2025-0001
  type: 'invoice'
  status: InvoiceStatus
  title: string
  quoteId?: string    // linked quote if converted
  dealId?: string
  dealTitle?: string
  accountName: string
  contactName: string
  contactEmail: string
  lineItems: LineItem[]
  notes: string
  terms: string
  dueDate: string
  currency: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  paidAt?: string
}

export type QuoteOrInvoice = Quote | Invoice

// ─── Calculation helpers ──────────────────────────────────────────────────────
export function calcLineItem(item: LineItem) {
  const gross = item.quantity * item.unitPrice
  const discountAmt = gross * (item.discount / 100)
  const afterDiscount = gross - discountAmt
  const taxAmt = afterDiscount * (item.taxRate / 100)
  return { gross, discountAmt, afterDiscount, taxAmt, total: afterDiscount + taxAmt }
}

export function calcTotals(items: LineItem[]) {
  const calcs = items.map(calcLineItem)
  const subtotal = calcs.reduce((s, c) => s + c.gross, 0)
  const totalDiscount = calcs.reduce((s, c) => s + c.discountAmt, 0)
  const totalTax = calcs.reduce((s, c) => s + c.taxAmt, 0)
  const total = calcs.reduce((s, c) => s + c.total, 0)
  return { subtotal, totalDiscount, totalTax, total }
}

// ─── Seed data ─────────────────────────────────────────────────────────────────
const now = Date.now()
const d = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString()
const future = (days: number) => new Date(now + days * 86400000).toISOString()

const SEED_LINE_ITEMS: LineItem[][] = [
  [
    { id: 'li-1', description: 'CRM Platform License (Annual)', quantity: 1, unitPrice: 12000, discount: 10, taxRate: 0 },
    { id: 'li-2', description: 'Onboarding & Implementation', quantity: 1, unitPrice: 3500, discount: 0, taxRate: 0 },
    { id: 'li-3', description: 'Premium Support (12 months)', quantity: 1, unitPrice: 2400, discount: 0, taxRate: 0 },
  ],
  [
    { id: 'li-4', description: 'Enterprise Seats (50 users)', quantity: 50, unitPrice: 49, discount: 15, taxRate: 8 },
    { id: 'li-5', description: 'API Access Add-on', quantity: 1, unitPrice: 1200, discount: 0, taxRate: 8 },
  ],
  [
    { id: 'li-6', description: 'Professional Services - Data Migration', quantity: 20, unitPrice: 250, discount: 0, taxRate: 0 },
    { id: 'li-7', description: 'Custom Dashboard Development', quantity: 1, unitPrice: 4500, discount: 5, taxRate: 0 },
  ],
  [
    { id: 'li-8', description: 'Starter Plan (12 months)', quantity: 1, unitPrice: 4800, discount: 0, taxRate: 0 },
    { id: 'li-9', description: 'Training Workshop (2 days)', quantity: 2, unitPrice: 800, discount: 0, taxRate: 0 },
  ],
]

export const SEED_QUOTES: Quote[] = [
  {
    id: 'quo-1', number: 'QUO-2025-0001', type: 'quote', status: 'accepted',
    title: 'CRM Platform — Acme Corporation', dealId: undefined, dealTitle: 'Acme Corp — Enterprise',
    accountName: 'Acme Corporation', contactName: 'James Miller', contactEmail: 'james@acme.com',
    lineItems: SEED_LINE_ITEMS[0], notes: 'Thank you for your continued partnership.',
    terms: 'Payment due within 30 days of invoice.', validUntil: future(15), currency: 'USD',
    createdAt: d(25), updatedAt: d(8), sentAt: d(22), viewedAt: d(20), respondedAt: d(8),
  },
  {
    id: 'quo-2', number: 'QUO-2025-0002', type: 'quote', status: 'sent',
    title: 'Enterprise Seats — Globex Corp', dealTitle: 'Globex Expansion',
    accountName: 'Globex Corp', contactName: 'Laura Chen', contactEmail: 'laura@globex.com',
    lineItems: SEED_LINE_ITEMS[1], notes: 'Pricing valid for 30 days.',
    terms: 'Net 30. Early payment discount available.', validUntil: future(20), currency: 'USD',
    createdAt: d(10), updatedAt: d(10), sentAt: d(10), currency: 'USD',
  },
  {
    id: 'quo-3', number: 'QUO-2025-0003', type: 'quote', status: 'draft',
    title: 'Professional Services — Initech', dealTitle: 'Initech Digital Transform',
    accountName: 'Initech Solutions', contactName: 'Tom Baker', contactEmail: 'tom@initech.io',
    lineItems: SEED_LINE_ITEMS[2], notes: '',
    terms: 'Net 15.', validUntil: future(30), currency: 'USD',
    createdAt: d(3), updatedAt: d(1),
  },
  {
    id: 'quo-4', number: 'QUO-2025-0004', type: 'quote', status: 'declined',
    title: 'Starter Plan — Pinnacle Retail', dealTitle: 'Pinnacle Initial',
    accountName: 'Pinnacle Retail Group', contactName: 'Emma Davis', contactEmail: 'emma@pinnacleretail.com',
    lineItems: SEED_LINE_ITEMS[3], notes: 'Happy to discuss alternative packages.',
    terms: 'Net 30.', validUntil: future(-5), currency: 'USD',
    createdAt: d(40), updatedAt: d(30), sentAt: d(38), viewedAt: d(36), respondedAt: d(30),
  },
]

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1', number: 'INV-2025-0001', type: 'invoice', status: 'paid',
    title: 'CRM Platform — Acme Corporation', quoteId: 'quo-1',
    accountName: 'Acme Corporation', contactName: 'James Miller', contactEmail: 'james@acme.com',
    lineItems: SEED_LINE_ITEMS[0], notes: 'Thank you for your payment!',
    terms: 'Payment due within 30 days.', dueDate: d(0), currency: 'USD',
    createdAt: d(8), updatedAt: d(2), sentAt: d(7), paidAt: d(2),
  },
  {
    id: 'inv-2', number: 'INV-2025-0002', type: 'invoice', status: 'sent',
    title: 'Enterprise Seats Q1 — Globex Corp',
    accountName: 'Globex Corp', contactName: 'Laura Chen', contactEmail: 'laura@globex.com',
    lineItems: SEED_LINE_ITEMS[1], notes: '',
    terms: 'Net 30.', dueDate: future(18), currency: 'USD',
    createdAt: d(5), updatedAt: d(5), sentAt: d(5),
  },
  {
    id: 'inv-3', number: 'INV-2025-0003', type: 'invoice', status: 'overdue',
    title: 'Professional Services — Umbrella Health',
    accountName: 'Umbrella Health', contactName: 'Dr. Susan Park', contactEmail: 'susan@umbrella-health.com',
    lineItems: SEED_LINE_ITEMS[2], notes: 'Please arrange payment at your earliest convenience.',
    terms: 'Net 30.', dueDate: d(15), currency: 'USD',
    createdAt: d(45), updatedAt: d(15), sentAt: d(44),
  },
  {
    id: 'inv-4', number: 'INV-2025-0004', type: 'invoice', status: 'draft',
    title: 'Annual Renewal — Meridian Education',
    accountName: 'Meridian Education', contactName: 'Prof. Alan Turing', contactEmail: 'alan@meridian.edu',
    lineItems: SEED_LINE_ITEMS[3], notes: 'Annual renewal for academic year 2025–26.',
    terms: 'Net 45.', dueDate: future(45), currency: 'USD',
    createdAt: d(1), updatedAt: d(1),
  },
]

// ─── Context ───────────────────────────────────────────────────────────────────
interface QuotesContextValue {
  quotes: Quote[]
  invoices: Invoice[]
  addQuote: (q: Omit<Quote, 'id' | 'number' | 'type' | 'createdAt' | 'updatedAt'>) => Quote
  updateQuote: (id: string, updates: Partial<Quote>) => void
  deleteQuote: (id: string) => void
  addInvoice: (inv: Omit<Invoice, 'id' | 'number' | 'type' | 'createdAt' | 'updatedAt'>) => Invoice
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  convertQuoteToInvoice: (quoteId: string) => Invoice
}

const QuotesContext = createContext<QuotesContextValue | null>(null)

let quoteSeq = SEED_QUOTES.length + 1
let invoiceSeq = SEED_INVOICES.length + 1

export function QuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>(SEED_QUOTES)
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES)

  const addQuote = useCallback((q: Omit<Quote, 'id' | 'number' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const num = String(quoteSeq++).padStart(4, '0')
    const newQuote: Quote = {
      ...q,
      id: `quo-${Date.now()}`,
      number: `QUO-${new Date().getFullYear()}-${num}`,
      type: 'quote',
      createdAt: now,
      updatedAt: now,
    }
    setQuotes(prev => [newQuote, ...prev])
    toast.success(`Quote ${newQuote.number} created`)
    return newQuote
  }, [])

  const updateQuote = useCallback((id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q))
  }, [])

  const deleteQuote = useCallback((id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id))
    toast.success('Quote deleted')
  }, [])

  const addInvoice = useCallback((inv: Omit<Invoice, 'id' | 'number' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const num = String(invoiceSeq++).padStart(4, '0')
    const newInvoice: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      number: `INV-${new Date().getFullYear()}-${num}`,
      type: 'invoice',
      createdAt: now,
      updatedAt: now,
    }
    setInvoices(prev => [newInvoice, ...prev])
    toast.success(`Invoice ${newInvoice.number} created`)
    return newInvoice
  }, [])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i))
  }, [])

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id))
    toast.success('Invoice deleted')
  }, [])

  const convertQuoteToInvoice = useCallback((quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId)
    if (!quote) throw new Error('Quote not found')
    const now = new Date().toISOString()
    const num = String(invoiceSeq++).padStart(4, '0')
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `INV-${new Date().getFullYear()}-${num}`,
      type: 'invoice',
      status: 'draft',
      title: quote.title,
      quoteId: quote.id,
      dealId: quote.dealId,
      dealTitle: quote.dealTitle,
      accountName: quote.accountName,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      lineItems: quote.lineItems.map(li => ({ ...li, id: `li-${Date.now()}-${Math.random()}` })),
      notes: quote.notes,
      terms: quote.terms,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      currency: quote.currency,
      createdAt: now,
      updatedAt: now,
    }
    setInvoices(prev => [invoice, ...prev])
    updateQuote(quoteId, { status: 'accepted' })
    toast.success(`Invoice ${invoice.number} created from ${quote.number}`)
    return invoice
  }, [quotes, updateQuote])

  return (
    <QuotesContext.Provider value={{
      quotes, invoices,
      addQuote, updateQuote, deleteQuote,
      addInvoice, updateInvoice, deleteInvoice,
      convertQuoteToInvoice,
    }}>
      {children}
    </QuotesContext.Provider>
  )
}

export function useQuotes() {
  const ctx = useContext(QuotesContext)
  if (!ctx) throw new Error('useQuotes must be used inside QuotesProvider')
  return ctx
}