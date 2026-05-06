'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, getStoredAccessToken, clearStoredAccessToken } from './auth'

// --- Types ---
export type RuleStatus   = 'active' | 'inactive' | 'draft'
export type CondField    = 'source' | 'score' | 'company' | 'country' | 'industry' | 'position' | 'status'
export type CondOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
export type ActionType   = 'assign_to' | 'set_status' | 'add_tag' | 'set_score' | 'notify'

export interface RuleCondition {
  id:       string
  field:    CondField
  operator: CondOperator
  value:    string
}

export interface RuleAction {
  id:    string
  type:  ActionType
  value: string
}

export interface AssignmentRule {
  id:          string
  name:        string
  description: string
  status:      RuleStatus
  priority:    number
  match_all:   boolean
  conditions:  RuleCondition[]
  actions:     RuleAction[]
  run_count:    number
  last_run_at?:  string
  created_at:   string
  updated_at:   string
}

export interface RuleExecution {
  id:         string
  ruleId:     string
  ruleName:   string
  leadName:   string
  leadId:     string
  actionsApplied: string[]
  timestamp:  string
}

interface AssignmentRulesContextValue {
  rules:       AssignmentRule[]
  executions:  RuleExecution[]
  isLoading:   boolean
  error:       string | null
  refreshData: () => Promise<void>
  addRule:    (r: any) => Promise<void>
  updateRule: (id: string, updates: any) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  simulateRun: (ruleId: string) => Promise<void>
}

const AssignmentRulesContext = createContext<AssignmentRulesContextValue | null>(null)

export function AssignmentRulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [executions, setExecutions] = useState<RuleExecution[]>([])
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
      const data = await apiRequest('/workflows/rules')
      setRules(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addRule = async (r: any) => {
    try {
      const data = await apiRequest('/workflows/rules', {
        method: 'POST',
        body: JSON.stringify(r),
      })
      setRules(prev => [...prev, data])
      toast.success('Rule created')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const updateRule = async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/workflows/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setRules(prev => prev.map(r => r.id === id ? data : r))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteRule = async (id: string) => {
    try {
      await apiRequest(`/workflows/rules/${id}`, { method: 'DELETE' })
      setRules(prev => prev.filter(r => r.id !== id))
      toast.success('Rule deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return
    const nextStatus = rule.status === 'active' ? 'inactive' : 'active'
    await updateRule(id, { status: nextStatus })
    toast.success(`Rule ${nextStatus === 'active' ? 'activated' : 'deactivated'}`)
  }

  const simulateRun = async (ruleId: string) => {
    try {
      await apiRequest(`/workflows/rules/${ruleId}/simulate`, { method: 'POST' })
      toast.success('Rule simulation complete')
      await refreshData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <AssignmentRulesContext.Provider value={{
      rules, executions, isLoading, error, refreshData,
      addRule, updateRule, deleteRule, toggleRule, simulateRun
    }}>
      {children}
    </AssignmentRulesContext.Provider>
  )
}

export function useAssignmentRules() {
  const ctx = useContext(AssignmentRulesContext)
  if (!ctx) throw new Error('useAssignmentRules must be used inside AssignmentRulesProvider')
  return ctx
}

export function formatAction(a: RuleAction): string {
  switch (a.type) {
    case 'assign_to':  return `Assigned to ${a.value}`
    case 'set_status': return `Status → ${a.value}`
    case 'add_tag':    return `Tag added: ${a.value}`
    case 'set_score':  return `Score set to ${a.value}`
    case 'notify':     return `Notified ${a.value}`
    default:           return a.value
  }
}

export const COND_FIELD_LABELS: Record<CondField, string> = {
  source:   'Lead Source',
  score:    'Lead Score',
  company:  'Company',
  country:  'Country',
  industry: 'Industry',
  position: 'Job Title',
  status:   'Status',
}

export const COND_OPERATOR_LABELS: Record<CondOperator, string> = {
  equals:       'equals',
  not_equals:   'does not equal',
  contains:     'contains',
  greater_than: 'is greater than',
  less_than:    'is less than',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  assign_to:  'Assign to rep',
  set_status: 'Set status',
  add_tag:    'Add tag',
  set_score:  'Set score',
  notify:     'Notify rep',
}

export const FIELD_VALUES: Partial<Record<CondField, string[]>> = {
  source:   ['website', 'referral', 'linkedin', 'cold_call', 'event', 'other'],
  status:   ['new', 'contacted', 'qualified', 'unqualified'],
  industry: ['technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'education', 'other'],
}