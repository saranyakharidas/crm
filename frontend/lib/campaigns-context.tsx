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

export type CampaignType = 'email' | 'sms' | 'social' | 'ads' | 'event' | 'webinar'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'

export interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
  unsubscribed: number
  bounced: number
}

export interface CampaignEmail {
  subject: string
  preheader: string
  body: string
}

export interface Campaign {
  id: string
  name: string
  description: string
  type: CampaignType
  status: CampaignStatus
  tags: string[]
  targetSegment: string
  audienceSize: number
  startDate: string
  endDate?: string
  scheduledAt?: string
  budget: number
  spent: number
  email?: CampaignEmail
  metrics: CampaignMetrics
  ownedBy: string
  createdAt: string
  updatedAt: string
}

type CampaignPayload = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'ownedBy'>

interface ApiCampaignEmail {
  subject: string
  preheader: string
  body: string
}

interface ApiCampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
  unsubscribed: number
  bounced: number
}

interface ApiCampaign {
  id: string
  name: string
  description: string
  type: CampaignType
  status: CampaignStatus
  tags: string[]
  target_segment: string
  audience_size: number
  start_date: string
  end_date?: string | null
  scheduled_at?: string | null
  budget: number
  spent: number
  email?: ApiCampaignEmail | null
  metrics: ApiCampaignMetrics
  owner_id: string
  owned_by: string
  created_at: string
  updated_at: string
}

interface CampaignsContextValue {
  campaigns: Campaign[]
  isLoading: boolean
  error: string | null
  refreshCampaigns: () => Promise<void>
  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics' | 'ownedBy'>) => Promise<void>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  duplicateCampaign: (id: string) => Promise<void>
  launchCampaign: (id: string) => Promise<void>
  pauseCampaign: (id: string) => Promise<void>
}

const CampaignsContext = createContext<CampaignsContextValue | null>(null)

const BLANK_METRICS: CampaignMetrics = {
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  converted: 0,
  unsubscribed: 0,
  bounced: 0,
}

function mapApiCampaign(campaign: ApiCampaign): Campaign {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    type: campaign.type,
    status: campaign.status,
    tags: campaign.tags ?? [],
    targetSegment: campaign.target_segment,
    audienceSize: campaign.audience_size,
    startDate: campaign.start_date,
    endDate: campaign.end_date ?? undefined,
    scheduledAt: campaign.scheduled_at ?? undefined,
    budget: Number(campaign.budget ?? 0),
    spent: Number(campaign.spent ?? 0),
    email: campaign.email ?? undefined,
    metrics: {
      sent: campaign.metrics?.sent ?? 0,
      delivered: campaign.metrics?.delivered ?? 0,
      opened: campaign.metrics?.opened ?? 0,
      clicked: campaign.metrics?.clicked ?? 0,
      converted: campaign.metrics?.converted ?? 0,
      unsubscribed: campaign.metrics?.unsubscribed ?? 0,
      bounced: campaign.metrics?.bounced ?? 0,
    },
    ownedBy: campaign.owned_by,
    createdAt: campaign.created_at,
    updatedAt: campaign.updated_at,
  }
}

function mapCampaignPayload(campaign: Partial<CampaignPayload> | Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'ownedBy'>) {
  return {
    name: campaign.name,
    description: campaign.description,
    type: campaign.type,
    status: campaign.status,
    tags: campaign.tags,
    target_segment: campaign.targetSegment,
    audience_size: campaign.audienceSize,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    scheduled_at: campaign.scheduledAt,
    budget: campaign.budget,
    spent: campaign.spent,
    email: campaign.email,
    metrics: campaign.metrics,
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

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiRequest<ApiCampaign[]>('/campaigns')
      setCampaigns(data.map(mapApiCampaign))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load campaigns'
      setError(message)
      setCampaigns([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCampaigns()
  }, [refreshCampaigns])

  const addCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics' | 'ownedBy'>) => {
    try {
      const payload = {
        ...campaign,
        metrics: { ...BLANK_METRICS },
        spent: 0,
      }
      const data = await apiRequest<ApiCampaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(mapCampaignPayload(payload)),
      })

      const newCampaign = mapApiCampaign(data)
      setCampaigns(prev => [newCampaign, ...prev])
      toast.success(`Campaign "${campaign.name}" created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign'
      toast.error(message)
      throw err
    }
  }, [])

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    try {
      const data = await apiRequest<ApiCampaign>(`/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapCampaignPayload(updates)),
      })

      const updatedCampaign = mapApiCampaign(data)
      setCampaigns(prev => prev.map(campaign => (campaign.id === id ? updatedCampaign : campaign)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update campaign'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/campaigns/${id}`, {
        method: 'DELETE',
      })
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
      toast.success('Campaign deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete campaign'
      toast.error(message)
      throw err
    }
  }, [])

  const duplicateCampaign = useCallback(async (id: string) => {
    const source = campaigns.find(campaign => campaign.id === id)
    if (!source) return

    try {
      const payload: CampaignPayload = {
        name: `${source.name} (copy)`,
        description: source.description,
        type: source.type,
        status: 'draft',
        tags: source.tags,
        targetSegment: source.targetSegment,
        audienceSize: source.audienceSize,
        startDate: source.startDate,
        endDate: source.endDate,
        scheduledAt: source.scheduledAt,
        budget: source.budget,
        spent: 0,
        email: source.email,
        metrics: { ...BLANK_METRICS },
      }

      const data = await apiRequest<ApiCampaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(mapCampaignPayload(payload)),
      })

      const newCampaign = mapApiCampaign(data)
      setCampaigns(prev => [newCampaign, ...prev])
      toast.success('Campaign duplicated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate campaign'
      toast.error(message)
      throw err
    }
  }, [campaigns])

  const launchCampaign = useCallback(async (id: string) => {
    const campaign = campaigns.find(item => item.id === id)
    if (!campaign) return

    await updateCampaign(id, {
      status: 'active',
      startDate: new Date().toISOString(),
    })
    toast.success('Campaign launched!')
  }, [campaigns, updateCampaign])

  const pauseCampaign = useCallback(async (id: string) => {
    await updateCampaign(id, { status: 'paused' })
    toast.success('Campaign paused')
  }, [updateCampaign])

  return (
    <CampaignsContext.Provider
      value={{
        campaigns,
        isLoading,
        error,
        refreshCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        duplicateCampaign,
        launchCampaign,
        pauseCampaign,
      }}
    >
      {children}
    </CampaignsContext.Provider>
  )
}

export function useCampaigns() {
  const ctx = useContext(CampaignsContext)
  if (!ctx) throw new Error('useCampaigns must be used inside CampaignsProvider')
  return ctx
}
