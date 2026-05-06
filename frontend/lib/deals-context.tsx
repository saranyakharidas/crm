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

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  expectedCloseDate: string | null
  actualCloseDate: string | null
  notes: string
  contactId: string | null
  createdAt: string
  updatedAt: string
}

type DealPayload = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>

interface ApiDeal {
  id: string
  title: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  notes: string
  contact_id: string | null
  created_at: string
  updated_at: string
}

interface DealsContextValue {
  deals: Deal[]
  isLoading: boolean
  error: string | null
  refreshDeals: () => Promise<void>
  addDeal: (deal: DealPayload) => Promise<void>
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>
  deleteDeal: (id: string) => Promise<void>
  moveDealStage: (id: string, stage: DealStage) => Promise<void>
}

const DealsContext = createContext<DealsContextValue | null>(null)

const probabilityMap: Record<DealStage, number> = {
  'lead': 10,
  'qualified': 25,
  'proposal': 50,
  'negotiation': 75,
  'closed-won': 100,
  'closed-lost': 0,
}

function mapApiDeal(deal: ApiDeal): Deal {
  return {
    id: deal.id,
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    stage: deal.stage,
    probability: deal.probability,
    expectedCloseDate: deal.expected_close_date,
    actualCloseDate: deal.actual_close_date,
    notes: deal.notes,
    contactId: deal.contact_id,
    createdAt: deal.created_at,
    updatedAt: deal.updated_at,
  }
}

function mapDealPayload(deal: DealPayload | Partial<Deal>) {
  return {
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    stage: deal.stage,
    probability: deal.probability,
    expected_close_date: deal.expectedCloseDate,
    actual_close_date: deal.actualCloseDate,
    notes: deal.notes,
    contact_id: deal.contactId,
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAccessToken()
  if (!token) throw new Error(`No auth token found.`)

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
      if (typeof data?.detail === 'string') detail = data.detail
    } catch {}

    if (response.status === 401 && typeof window !== 'undefined') {
      clearStoredAccessToken()
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)
    }
    throw new Error(detail)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshDeals = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiRequest<ApiDeal[]>('/deals')
      setDeals(data.map(mapApiDeal))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals')
      setDeals([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshDeals()
  }, [refreshDeals])

  const addDeal = useCallback(async (deal: DealPayload) => {
    try {
      const data = await apiRequest<ApiDeal>('/deals', {
        method: 'POST',
        body: JSON.stringify(mapDealPayload(deal)),
      })
      setDeals(prev => [mapApiDeal(data), ...prev])
      toast.success(`Deal "${deal.title}" created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deal')
      throw err
    }
  }, [])

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    try {
      const data = await apiRequest<ApiDeal>(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapDealPayload(updates)),
      })
      const updatedDeal = mapApiDeal(data)
      setDeals(prev => prev.map(d => (d.id === id ? updatedDeal : d)))
      toast.success('Deal updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update deal')
      throw err
    }
  }, [])

  const moveDealStage = useCallback(async (id: string, stage: DealStage) => {
    try {
      const probability = probabilityMap[stage]
      const updates: Partial<Deal> = { 
        stage, 
        probability,
        ...(stage === 'closed-won' || stage === 'closed-lost' ? { actualCloseDate: new Date().toISOString() } : {})
      }
      
      const data = await apiRequest<ApiDeal>(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapDealPayload(updates)),
      })
      const updatedDeal = mapApiDeal(data)
      setDeals(prev => prev.map(d => (d.id === id ? updatedDeal : d)))
      toast.success(`Deal moved to ${stage}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move deal')
      throw err
    }
  }, [])

  const deleteDeal = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/deals/${id}`, { method: 'DELETE' })
      setDeals(prev => prev.filter(d => d.id !== id))
      toast.success('Deal deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete deal')
      throw err
    }
  }, [])

  return (
    <DealsContext.Provider
      value={{
        deals,
        isLoading,
        error,
        refreshDeals,
        addDeal,
        updateDeal,
        deleteDeal,
        moveDealStage,
      }}
    >
      {children}
    </DealsContext.Provider>
  )
}

export function useDeals() {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used inside DealsProvider')
  return ctx
}
