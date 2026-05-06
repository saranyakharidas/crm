'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken, TOKEN_STORAGE_KEY } from '@/lib/auth'

export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold_call' | 'event' | 'other'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  source: LeadSource
  status: LeadStatus
  score: number
  assignedTo: string
  notes: string
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

type LeadPayload = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>

interface ApiLead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  source: LeadSource
  status: LeadStatus
  score: number
  assigned_to: string
  notes: string
  created_at: string
  updated_at: string
  last_activity_at: string
}

interface LeadsContextValue {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  refreshLeads: () => Promise<void>
  addLead: (lead: LeadPayload) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  getLead: (id: string) => Lead | undefined
}

const LeadsContext = createContext<LeadsContextValue | null>(null)

function mapApiLead(lead: ApiLead): Lead {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    position: lead.position,
    source: lead.source,
    status: lead.status,
    score: lead.score,
    assignedTo: lead.assigned_to,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    lastActivityAt: lead.last_activity_at,
  }
}

function mapLeadPayload(lead: LeadPayload | Partial<Lead>) {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    position: lead.position,
    source: lead.source,
    status: lead.status,
    score: lead.score,
    assigned_to: lead.assignedTo,
    notes: lead.notes,
    last_activity_at: lead.lastActivityAt,
  }
}

function getAccessToken() {
  return getStoredAccessToken()
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  if (!token) {
    throw new Error(`No auth token found. Please sign in again to restore "${TOKEN_STORAGE_KEY}".`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`

    try {
      const data = await response.json()
      if (typeof data?.detail === 'string') {
        detail = data.detail
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      clearStoredAccessToken()
      const nextPath = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
      detail = 'Your session expired. Please sign in again.'
    }

    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshLeads = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiRequest<ApiLead[]>('/leads')
      setLeads(data.map(mapApiLead))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leads'
      setError(message)
      setLeads([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshLeads()
  }, [refreshLeads])

  const addLead = useCallback(async (lead: LeadPayload) => {
    try {
      const data = await apiRequest<ApiLead>('/leads', {
        method: 'POST',
        body: JSON.stringify(mapLeadPayload(lead)),
      })

      const newLead = mapApiLead(data)
      setLeads(prev => [newLead, ...prev])
      toast.success(`Lead "${lead.name}" created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead'
      toast.error(message)
      throw err
    }
  }, [])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const data = await apiRequest<ApiLead>(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapLeadPayload(updates)),
      })

      const updatedLead = mapApiLead(data)
      setLeads(prev => prev.map(lead => (lead.id === id ? updatedLead : lead)))
      toast.success('Lead updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteLead = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/leads/${id}`, {
        method: 'DELETE',
      })

      setLeads(prev => prev.filter(lead => lead.id !== id))
      toast.success('Lead deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lead'
      toast.error(message)
      throw err
    }
  }, [])

  const getLead = useCallback(
    (id: string) => leads.find(lead => lead.id === id),
    [leads],
  )

  return (
    <LeadsContext.Provider
      value={{
        leads,
        isLoading,
        error,
        refreshLeads,
        addLead,
        updateLead,
        deleteLead,
        getLead,
      }}
    >
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const ctx = useContext(LeadsContext)
  if (!ctx) throw new Error('useLeads must be used inside LeadsProvider')
  return ctx
}
