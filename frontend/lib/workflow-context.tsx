'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, getStoredAccessToken, clearStoredAccessToken } from './auth'
import type { Workflow, WorkflowExecution } from './workflow-types'

interface WorkflowContextValue {
  workflows: Workflow[]
  executions: WorkflowExecution[]
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  addWorkflow: (wf: any) => Promise<void>
  updateWorkflow: (id: string, updates: any) => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  toggleWorkflowStatus: (id: string) => Promise<void>
  testWorkflow: (id: string) => Promise<void>
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
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
      const data = await apiRequest('/workflows')
      setWorkflows(data)
      // Extract executions from all workflows
      const allExecutions = data.flatMap((wf: any) => wf.executions || [])
      setExecutions(allExecutions.sort((a: any, b: any) => 
        new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      ))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addWorkflow = async (wf: any) => {
    try {
      const data = await apiRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(wf),
      })
      setWorkflows(prev => [data, ...prev])
      toast.success('Workflow created')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const updateWorkflow = async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setWorkflows(prev => prev.map(w => w.id === id ? data : w))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteWorkflow = async (id: string) => {
    try {
      await apiRequest(`/workflows/${id}`, { method: 'DELETE' })
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Workflow deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleWorkflowStatus = async (id: string) => {
    const wf = workflows.find(w => w.id === id)
    if (!wf) return
    const newStatus = wf.status === 'active' ? 'inactive' : 'active'
    await updateWorkflow(id, { status: newStatus })
    toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
  }

  const testWorkflow = async (id: string) => {
    try {
      await apiRequest(`/workflows/${id}/execute?record_id=test&record_name=Manual+Test`, {
        method: 'POST',
      })
      toast.success('Test execution triggered')
      await refreshData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <WorkflowContext.Provider value={{
      workflows, executions, isLoading, error, refreshData,
      addWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflowStatus, testWorkflow
    }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflows() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflows must be used inside WorkflowProvider')
  return ctx
}