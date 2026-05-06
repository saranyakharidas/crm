'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken, TOKEN_STORAGE_KEY } from '@/lib/auth'

export interface DashboardStat {
  value: number
  change: number
}

export interface DashboardStats {
  total_accounts: DashboardStat
  active_campaigns: DashboardStat
  total_leads: DashboardStat
  total_products: DashboardStat
}

export interface DashboardMonthlyActivityPoint {
  month: string
  accounts: number
  leads: number
  campaigns: number
  products: number
}

export interface DashboardLeadSourcePoint {
  source: string
  count: number
  percentage: number
}

export interface DashboardRecentCampaign {
  id: string
  name: string
  type: string
  status: string
  target_segment: string
  budget: number
  spent: number
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
    unsubscribed: number
    bounced: number
  }
  start_date: string
  updated_at: string
}

export interface DashboardHotLead {
  id: string
  name: string
  company: string
  email: string
  score: number
  source: string
  status: string
}

export interface DashboardRecentAccount {
  id: string
  name: string
  industry: string
  type: string
  annual_revenue: number
  updated_at: string
}

export interface DashboardTopProduct {
  id: string
  name: string
  code: string
  category: string
  pricing_model: string
  base_price: number
  status: string
}

export interface DashboardSummary {
  stats: DashboardStats
  monthly_activity: DashboardMonthlyActivityPoint[]
  lead_sources: DashboardLeadSourcePoint[]
  campaign_performance: DashboardRecentCampaign[]
  hot_leads: DashboardHotLead[]
  recent_accounts: DashboardRecentAccount[]
  top_products: DashboardTopProduct[]
}

interface DashboardContextValue {
  summary: DashboardSummary | null
  isLoading: boolean
  error: string | null
  refreshSummary: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

function getAccessToken() {
  return getStoredAccessToken()
}

async function apiRequest<T>(path: string): Promise<T> {
  const token = getAccessToken()
  if (!token) {
    throw new Error(`No auth token found. Please sign in again to restore "${TOKEN_STORAGE_KEY}".`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
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
      // Ignore JSON parse errors.
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      clearStoredAccessToken()
      const nextPath = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
      detail = 'Your session expired. Please sign in again.'
    }

    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSummary = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiRequest<DashboardSummary>('/dashboard/summary')
      setSummary(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(message)
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSummary()
  }, [refreshSummary])

  return (
    <DashboardContext.Provider value={{ summary, isLoading, error, refreshSummary }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
