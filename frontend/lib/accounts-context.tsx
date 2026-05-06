'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken, TOKEN_STORAGE_KEY } from '@/lib/auth'

export type AccountIndustry =
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'retail'
  | 'manufacturing'
  | 'education'
  | 'real_estate'
  | 'consulting'
  | 'media'
  | 'other'

export type AccountType = 'prospect' | 'customer' | 'partner' | 'vendor' | 'churned'

export interface Account {
  id: string
  name: string
  domain: string
  industry: AccountIndustry
  type: AccountType
  employees: number
  annualRevenue: number
  phone: string
  email: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  description: string
  tags: string[]
  contactIds: string[]
  dealIds: string[]
  ownedBy: string
  createdAt: string
  updatedAt: string
}

type AccountPayload = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>

interface ApiAccount {
  id: string
  name: string
  domain: string
  industry: AccountIndustry
  type: AccountType
  employees: number
  annual_revenue: number
  phone: string
  email: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  description: string
  tags: string[]
  contact_ids: string[]
  deal_ids: string[]
  owned_by: string
  created_at: string
  updated_at: string
}

interface AccountsContextValue {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  refreshAccounts: () => Promise<void>
  addAccount: (account: AccountPayload) => Promise<void>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  getAccount: (id: string) => Account | undefined
}

const AccountsContext = createContext<AccountsContextValue | null>(null)

function mapApiAccount(account: ApiAccount): Account {
  return {
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    type: account.type,
    employees: account.employees,
    annualRevenue: Number(account.annual_revenue ?? 0),
    phone: account.phone,
    email: account.email,
    website: account.website,
    address: account.address,
    description: account.description,
    tags: account.tags ?? [],
    contactIds: account.contact_ids ?? [],
    dealIds: account.deal_ids ?? [],
    ownedBy: account.owned_by,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  }
}

function mapAccountPayload(account: AccountPayload | Partial<Account>) {
  return {
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    type: account.type,
    employees: account.employees,
    annual_revenue: account.annualRevenue,
    phone: account.phone,
    email: account.email,
    website: account.website,
    address: account.address,
    description: account.description,
    tags: account.tags,
    contact_ids: account.contactIds,
    deal_ids: account.dealIds,
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
      // Ignore JSON parsing errors and use the fallback message.
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

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiRequest<ApiAccount[]>('/accounts')
      setAccounts(data.map(mapApiAccount))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load accounts'
      setError(message)
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshAccounts()
  }, [refreshAccounts])

  const addAccount = useCallback(async (account: AccountPayload) => {
    try {
      const data = await apiRequest<ApiAccount>('/accounts', {
        method: 'POST',
        body: JSON.stringify(mapAccountPayload(account)),
      })

      const newAccount = mapApiAccount(data)
      setAccounts(prev => [newAccount, ...prev])
      toast.success(`Account "${account.name}" created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      toast.error(message)
      throw err
    }
  }, [])

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      const data = await apiRequest<ApiAccount>(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapAccountPayload(updates)),
      })

      const updatedAccount = mapApiAccount(data)
      setAccounts(prev => prev.map(account => account.id === id ? updatedAccount : account))
      toast.success('Account updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update account'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/accounts/${id}`, {
        method: 'DELETE',
      })

      setAccounts(prev => prev.filter(account => account.id !== id))
      toast.success('Account deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      toast.error(message)
      throw err
    }
  }, [])

  const getAccount = useCallback(
    (id: string) => accounts.find(account => account.id === id),
    [accounts],
  )

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        isLoading,
        error,
        refreshAccounts,
        addAccount,
        updateAccount,
        deleteAccount,
        getAccount,
      }}
    >
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts() {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccounts must be used inside AccountsProvider')
  return ctx
}
