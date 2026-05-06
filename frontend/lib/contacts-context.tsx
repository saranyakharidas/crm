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

export type ContactStatus = 'active' | 'inactive'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  tags: string[]
  notes: string
  status: ContactStatus
  createdAt: string
  updatedAt: string
  lastContactedAt: string | null
}

type ContactPayload = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>

interface ApiContact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  position: string
  tags: string[]
  notes: string
  status: ContactStatus
  created_at: string
  updated_at: string
  last_contacted_at: string | null
}

interface ContactsContextValue {
  contacts: Contact[]
  isLoading: boolean
  error: string | null
  refreshContacts: () => Promise<void>
  addContact: (contact: ContactPayload) => Promise<void>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getContact: (id: string) => Contact | undefined
}

const ContactsContext = createContext<ContactsContextValue | null>(null)

function mapApiContact(contact: ApiContact): Contact {
  return {
    id: contact.id,
    firstName: contact.first_name,
    lastName: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    position: contact.position,
    tags: contact.tags,
    notes: contact.notes,
    status: contact.status,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
    lastContactedAt: contact.last_contacted_at,
  }
}

function mapContactPayload(contact: ContactPayload | Partial<Contact>) {
  return {
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    position: contact.position,
    tags: contact.tags,
    notes: contact.notes,
    status: contact.status,
    last_contacted_at: contact.lastContactedAt,
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error(`No auth token found. Please sign in again.`)
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

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshContacts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiRequest<ApiContact[]>('/contacts')
      setContacts(data.map(mapApiContact))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
      setContacts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshContacts()
  }, [refreshContacts])

  const addContact = useCallback(async (contact: ContactPayload) => {
    try {
      const data = await apiRequest<ApiContact>('/contacts', {
        method: 'POST',
        body: JSON.stringify(mapContactPayload(contact)),
      })
      const newContact = mapApiContact(data)
      setContacts(prev => [newContact, ...prev])
      toast.success(`Contact "${contact.firstName} ${contact.lastName}" created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create contact')
      throw err
    }
  }, [])

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      const data = await apiRequest<ApiContact>(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapContactPayload(updates)),
      })
      const updatedContact = mapApiContact(data)
      setContacts(prev => prev.map(c => (c.id === id ? updatedContact : c)))
      toast.success('Contact updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update contact')
      throw err
    }
  }, [])

  const deleteContact = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/contacts/${id}`, { method: 'DELETE' })
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Contact deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete contact')
      throw err
    }
  }, [])

  const getContact = useCallback((id: string) => contacts.find(c => c.id === id), [contacts])

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        isLoading,
        error,
        refreshContacts,
        addContact,
        updateContact,
        deleteContact,
        getContact,
      }}
    >
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts() {
  const ctx = useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts must be used inside ContactsProvider')
  return ctx
}
