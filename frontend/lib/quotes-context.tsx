'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, getStoredAccessToken, TOKEN_STORAGE_KEY, clearStoredAccessToken } from './auth'

// --- Types ---
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
export type DocumentType = 'quote' | 'invoice'
export type QuoteOrInvoice = Quote | Invoice

export interface LineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
}

export function calcLineItem(item: LineItem) {
  const subtotal = item.quantity * item.unit_price
  const discountAmount = subtotal * (item.discount / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (item.tax_rate / 100)
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: afterDiscount + taxAmount
  }
}

export function calcTotals(items: LineItem[]) {
  return items.reduce((acc, item) => {
    const calculated = calcLineItem(item)
    return {
      subtotal: acc.subtotal + calculated.subtotal,
      discount: acc.discount + calculated.discountAmount,
      tax: acc.tax + calculated.taxAmount,
      total: acc.total + calculated.total
    }
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 })
}

export interface Quote {
  id: string
  number: string
  title: string
  status: QuoteStatus
  deal_id?: string
  account_name: string
  contact_name: string
  contact_email: string
  line_items: LineItem[]
  notes: string
  terms: string
  valid_until: string
  currency: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  number: string
  title: string
  status: InvoiceStatus
  quote_id?: string
  deal_id?: string
  account_name: string
  contact_name: string
  contact_email: string
  line_items: LineItem[]
  notes: string
  terms: string
  due_date: string
  currency: string
  created_at: string
  updated_at: string
}

// --- Context ---
interface QuotesContextValue {
  quotes: Quote[]
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  addQuote: (q: Omit<Quote, 'id' | 'number' | 'created_at' | 'updated_at'>) => Promise<void>
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  addInvoice: (inv: Omit<Invoice, 'id' | 'number' | 'created_at' | 'updated_at'>) => Promise<void>
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
}

const QuotesContext = createContext<QuotesContextValue | null>(null)

export function QuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = getStoredAccessToken()
    if (!token) throw new Error('No auth token')

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredAccessToken()
        window.location.assign('/login')
      }
      throw new Error(`API error: ${response.statusText}`)
    }
    if (response.status === 204) return null
    return response.json()
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [qData, iData] = await Promise.all([
        apiRequest('/quotes'),
        apiRequest('/invoices')
      ])
      setQuotes(qData)
      setInvoices(iData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addQuote = async (q: any) => {
    try {
      const data = await apiRequest('/quotes', {
        method: 'POST',
        body: JSON.stringify(q),
      })
      setQuotes(prev => [data, ...prev])
      toast.success('Quote created')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const updateQuote = async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setQuotes(prev => prev.map(q => q.id === id ? data : q))
      toast.success('Quote updated')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteQuote = async (id: string) => {
    try {
      await apiRequest(`/quotes/${id}`, { method: 'DELETE' })
      setQuotes(prev => prev.filter(q => q.id !== id))
      toast.success('Quote deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const addInvoice = async (inv: any) => {
    try {
      const data = await apiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(inv),
      })
      setInvoices(prev => [data, ...prev])
      toast.success('Invoice created')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const updateInvoice = async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setInvoices(prev => prev.map(i => i.id === id ? data : i))
      toast.success('Invoice updated')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      await apiRequest(`/invoices/${id}`, { method: 'DELETE' })
      setInvoices(prev => prev.filter(i => i.id !== id))
      toast.success('Invoice deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <QuotesContext.Provider value={{
      quotes, invoices, isLoading, error, refreshData,
      addQuote, updateQuote, deleteQuote,
      addInvoice, updateInvoice, deleteInvoice
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