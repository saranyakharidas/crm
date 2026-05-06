'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, getStoredAccessToken, clearStoredAccessToken } from './auth'
import {
  addDays, addWeeks, addMonths, addYears,
  format,
} from 'date-fns'

// --- Types ---
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurrenceStatus    = 'active' | 'paused' | 'completed' | 'draft'
export type TaskPriority        = 'low' | 'medium' | 'high' | 'urgent'

// --- Helpers ---
export function calcNextRun(freq: RecurrenceFrequency, interval: number, from: Date = new Date()): Date {
  const n = interval || 1
  switch (freq) {
    case 'daily':     return addDays(from, n)
    case 'weekly':    return addWeeks(from, n)
    case 'biweekly':  return addWeeks(from, 2 * n)
    case 'monthly':   return addMonths(from, n)
    case 'quarterly': return addMonths(from, 3 * n)
    case 'yearly':    return addYears(from, n)
    default:          return addWeeks(from, n)
  }
}

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  biweekly:  'Every 2 weeks',
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  yearly:    'Yearly',
}

export const FREQUENCY_INTERVALS: Record<RecurrenceFrequency, string> = {
  daily:     'days',
  weekly:    'weeks',
  biweekly:  'weeks',
  monthly:   'months',
  quarterly: 'quarters',
  yearly:    'years',
}



export interface RecurringTask {
  id:          string
  title:       string
  description: string
  priority:    TaskPriority
  assignedTo:  string
  frequency:   RecurrenceFrequency
  interval:    number
  daysOfWeek?: number[]
  dayOfMonth?: number
  status:      RecurrenceStatus
  startDate:   string
  endDate?:    string
  maxOccurrences?: number
  occurrenceCount: number
  nextRunAt:   string
  lastRunAt?:  string
  estimatedMinutes?: number
  tags:        string[]
  relatedTo?:  string
  relatedType?: 'contact' | 'deal'
  createdAt:   string
  updatedAt:   string
}

export interface SpawnedTask {
  id:              string
  recurringTaskId: string
  title:           string
  dueDate:         string
  completedAt?:    string
  status:          'todo' | 'completed' | 'skipped'
}

interface RecurringTasksContextValue {
  recurringTasks: RecurringTask[]
  spawnedTasks:   SpawnedTask[]
  isLoading:      boolean
  error:          string | null
  refreshData: () => Promise<void>
  addRecurringTask:    (t: any) => Promise<void>
  updateRecurringTask: (id: string, updates: any) => Promise<void>
  deleteRecurringTask: (id: string) => Promise<void>
  togglePause:         (id: string) => Promise<void>
  runNow:              (id: string) => Promise<void>
  completeSpawn:       (spawnId: string) => Promise<void>
  skipSpawn:           (spawnId: string) => Promise<void>
}

const RecurringTasksContext = createContext<RecurringTasksContextValue | null>(null)

export function RecurringTasksProvider({ children }: { children: ReactNode }) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [spawnedTasks, setSpawnedTasks] = useState<SpawnedTask[]>([])
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
      const data = await apiRequest('/recurring-tasks')
      setRecurringTasks(data)
      const allSpawned = data.flatMap((t: any) => t.spawned_tasks || [])
      setSpawnedTasks(allSpawned)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addRecurringTask = async (t: any) => {
    try {
      const data = await apiRequest('/recurring-tasks', {
        method: 'POST',
        body: JSON.stringify(t),
      })
      setRecurringTasks(prev => [data, ...prev])
      toast.success('Recurring task created')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const updateRecurringTask = async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/recurring-tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setRecurringTasks(prev => prev.map(t => t.id === id ? data : t))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteRecurringTask = async (id: string) => {
    try {
      await apiRequest(`/recurring-tasks/${id}`, { method: 'DELETE' })
      setRecurringTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Recurring task deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const togglePause = async (id: string) => {
    const task = recurringTasks.find(t => t.id === id)
    if (!task) return
    const nextStatus = task.status === 'active' ? 'paused' : 'active'
    await updateRecurringTask(id, { status: nextStatus })
    toast.success(nextStatus === 'active' ? 'Task resumed' : 'Task paused')
  }

  const runNow = async (id: string) => {
    try {
      await apiRequest(`/recurring-tasks/${id}/run`, { method: 'POST' })
      toast.success('Task spawned')
      await refreshData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const completeSpawn = async (spawnId: string) => {
    try {
      await apiRequest(`/recurring-tasks/spawned/${spawnId}/complete`, { method: 'POST' })
      toast.success('Task marked complete')
      await refreshData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const skipSpawn = async (spawnId: string) => {
    // Skipping not implemented in backend yet, just for UI
    toast.success('Task skipped')
  }

  return (
    <RecurringTasksContext.Provider value={{
      recurringTasks, spawnedTasks, isLoading, error, refreshData,
      addRecurringTask, updateRecurringTask, deleteRecurringTask,
      togglePause, runNow, completeSpawn, skipSpawn
    }}>
      {children}
    </RecurringTasksContext.Provider>
  )
}

export function useRecurringTasks() {
  const ctx = useContext(RecurringTasksContext)
  if (!ctx) throw new Error('useRecurringTasks must be used inside RecurringTasksProvider')
  return ctx
}