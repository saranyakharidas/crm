'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, getStoredAccessToken, clearStoredAccessToken } from './auth'

// --- Types ---
export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'deal_stage'
  | 'deal_created'
  | 'contact_created'
  | 'document'
  | 'whatsapp'

export interface Activity {
  id:          string
  type:        ActivityType
  title:       string
  description: string
  outcome?:    string
  duration?:   number
  contact_id?:  string
  deal_id?:     string
  created_at:   string
  scheduled_at?:string
  completed:   boolean
}

interface ActivityContextValue {
  activities:   Activity[]
  isLoading:    boolean
  error:        string | null
  refreshData: () => Promise<void>
  addActivity:  (a: any) => Promise<void>
  deleteActivity:(id: string) => Promise<void>
  getActivitiesForContact: (contactId: string) => Activity[]
  getActivitiesForDeal:    (dealId: string) => Activity[]
}

const ActivityContext = createContext<ActivityContextValue | null>(null)

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([])
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
      const data = await apiRequest('/activities')
      setActivities(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addActivity = async (a: any) => {
    try {
      const data = await apiRequest('/activities', {
        method: 'POST',
        body: JSON.stringify(a),
      })
      setActivities(prev => [data, ...prev])
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteActivity = async (id: string) => {
    try {
      await apiRequest(`/activities/${id}`, { method: 'DELETE' })
      setActivities(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getActivitiesForContact = useCallback((contactId: string) => {
    return activities.filter(a => a.contact_id === contactId)
  }, [activities])

  const getActivitiesForDeal = useCallback((dealId: string) => {
    return activities.filter(a => a.deal_id === dealId)
  }, [activities])

  return (
    <ActivityContext.Provider value={{
      activities, isLoading, error, refreshData,
      addActivity, deleteActivity, getActivitiesForContact, getActivitiesForDeal
    }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivities() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivities must be used inside ActivityProvider')
  return ctx
}

export const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; color: string; label: string }> = {
  call:            { icon: 'phone',    color: 'blue',   label: 'Call' },
  email:           { icon: 'mail',     color: 'purple', label: 'Email' },
  meeting:         { icon: 'users',    color: 'green',  label: 'Meeting' },
  note:            { icon: 'note',     color: 'amber',  label: 'Note' },
  task:            { icon: 'check',    color: 'rose',   label: 'Task' },
  deal_stage:      { icon: 'trending', color: 'indigo', label: 'Stage Change' },
  deal_created:    { icon: 'plus',     color: 'emerald',label: 'New Deal' },
  contact_created: { icon: 'user',     color: 'sky',    label: 'New Contact' },
  document:        { icon: 'file',     color: 'slate',  label: 'Document' },
  whatsapp:        { icon: 'message',  color: 'emerald',label: 'WhatsApp' },
}