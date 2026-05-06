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
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken } from '@/lib/auth'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deferred'

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string | null
  priority: TaskPriority
  status: TaskStatus
  relatedType: string | null
  relatedId: string | null
  createdAt: string
  updatedAt: string
}

type TaskPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

interface ApiTask {
  id: string
  title: string
  description: string
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  related_type: string | null
  related_id: string | null
  created_at: string
  updated_at: string
}

interface TasksContextValue {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  refreshTasks: () => Promise<void>
  addTask: (task: TaskPayload) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskStatus: (id: string) => Promise<void>
}

const TasksContext = createContext<TasksContextValue | null>(null)

function mapApiTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.due_date,
    priority: task.priority,
    status: task.status,
    relatedType: task.related_type,
    relatedId: task.related_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }
}

function mapTaskPayload(task: TaskPayload | Partial<Task>) {
  return {
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    priority: task.priority,
    status: task.status,
    related_type: task.relatedType,
    related_id: task.relatedId,
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

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiRequest<ApiTask[]>('/tasks')
      setTasks(data.map(mapApiTask))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  const addTask = useCallback(async (task: TaskPayload) => {
    try {
      const data = await apiRequest<ApiTask>('/tasks', {
        method: 'POST',
        body: JSON.stringify(mapTaskPayload(task)),
      })
      setTasks(prev => [mapApiTask(data), ...prev])
      toast.success(`Task "${task.title}" created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const data = await apiRequest<ApiTask>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapTaskPayload(updates)),
      })
      setTasks(prev => prev.map(t => (t.id === id ? mapApiTask(data) : t)))
      toast.success('Task updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const toggleTaskStatus = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const data = await apiRequest<ApiTask>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      setTasks(prev => prev.map(t => (t.id === id ? mapApiTask(data) : t)))
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task reopened')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task status')
    }
  }, [tasks])

  const deleteTask = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [])

  return (
    <TasksContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider')
  return ctx
}
