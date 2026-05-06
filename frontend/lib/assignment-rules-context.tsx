'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  value: string   // e.g. "Sarah Johnson" | "qualified" | "VIP" | "80"
}

export interface AssignmentRule {
  id:          string
  name:        string
  description: string
  status:      RuleStatus
  priority:    number       // lower = runs first
  matchAll:    boolean      // true = AND, false = OR
  conditions:  RuleCondition[]
  actions:     RuleAction[]
  runCount:    number       // total leads this rule has acted on
  lastRunAt?:  string
  createdAt:   string
  updatedAt:   string
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
const now  = () => new Date().toISOString()
const d    = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()
let   _id  = 1
const uid  = () => `rc-${_id++}`

function cond(field: CondField, operator: CondOperator, value: string): RuleCondition {
  return { id: uid(), field, operator, value }
}
function action(type: ActionType, value: string): RuleAction {
  return { id: uid(), type, value }
}

// ─── Seed rules ────────────────────────────────────────────────────────────────
export const SEED_RULES: AssignmentRule[] = [
  {
    id: 'rule-1',
    name: 'High-Score Enterprise Leads → Sarah',
    description: 'Route high-scoring leads from large companies to the senior rep.',
    status: 'active',
    priority: 1,
    matchAll: true,
    conditions: [
      cond('score', 'greater_than', '75'),
      cond('source', 'not_equals', 'cold_call'),
    ],
    actions: [
      action('assign_to', 'Sarah Johnson'),
      action('set_status', 'qualified'),
      action('add_tag', 'High Value'),
    ],
    runCount: 47,
    lastRunAt: d(1),
    createdAt: d(60),
    updatedAt: d(5),
  },
  {
    id: 'rule-2',
    name: 'LinkedIn Leads → Michael',
    description: 'All LinkedIn-sourced leads go directly to Michael for social selling follow-up.',
    status: 'active',
    priority: 2,
    matchAll: false,
    conditions: [
      cond('source', 'equals', 'linkedin'),
    ],
    actions: [
      action('assign_to', 'Michael Chen'),
      action('add_tag', 'LinkedIn'),
      action('notify', 'Michael Chen'),
    ],
    runCount: 83,
    lastRunAt: d(0),
    createdAt: d(45),
    updatedAt: d(10),
  },
  {
    id: 'rule-3',
    name: 'Low-Score Leads → Nurture',
    description: 'Leads below 40 score are tagged for nurture sequences instead of direct outreach.',
    status: 'active',
    priority: 3,
    matchAll: true,
    conditions: [
      cond('score', 'less_than', '40'),
      cond('status', 'equals', 'new'),
    ],
    actions: [
      action('add_tag', 'Nurture'),
      action('set_status', 'contacted'),
      action('set_score', '35'),
    ],
    runCount: 31,
    lastRunAt: d(2),
    createdAt: d(40),
    updatedAt: d(7),
  },
  {
    id: 'rule-4',
    name: 'Referral Leads → Fast Track',
    description: 'Referrals are premium leads — fast-track them with high score and VIP tag.',
    status: 'active',
    priority: 4,
    matchAll: false,
    conditions: [
      cond('source', 'equals', 'referral'),
    ],
    actions: [
      action('assign_to', 'Sarah Johnson'),
      action('set_score', '85'),
      action('add_tag', 'VIP'),
      action('set_status', 'qualified'),
    ],
    runCount: 19,
    lastRunAt: d(3),
    createdAt: d(30),
    updatedAt: d(3),
  },
  {
    id: 'rule-5',
    name: 'Tech Industry → Specialist Queue',
    description: 'Technology sector leads routed to the tech-specialist rep.',
    status: 'inactive',
    priority: 5,
    matchAll: true,
    conditions: [
      cond('industry', 'equals', 'technology'),
      cond('score', 'greater_than', '50'),
    ],
    actions: [
      action('assign_to', 'Alex Rivera'),
      action('add_tag', 'Tech'),
    ],
    runCount: 0,
    createdAt: d(15),
    updatedAt: d(15),
  },
  {
    id: 'rule-6',
    name: 'Unqualified Leads → Archive',
    description: 'Mark leads with very low scores as unqualified after initial contact.',
    status: 'draft',
    priority: 6,
    matchAll: true,
    conditions: [
      cond('score', 'less_than', '20'),
      cond('status', 'equals', 'contacted'),
    ],
    actions: [
      action('set_status', 'unqualified'),
      action('add_tag', 'Archive'),
    ],
    runCount: 0,
    createdAt: d(5),
    updatedAt: d(5),
  },
]

// ─── Seed execution log ────────────────────────────────────────────────────────
export const SEED_EXECUTIONS: RuleExecution[] = [
  { id: 'ex-1', ruleId: 'rule-2', ruleName: 'LinkedIn Leads → Michael',        leadName: 'James Miller',    leadId: 'lead-1', actionsApplied: ['Assigned to Michael Chen', 'Tag added: LinkedIn', 'Notified Michael Chen'], timestamp: d(0) },
  { id: 'ex-2', ruleId: 'rule-1', ruleName: 'High-Score Enterprise Leads → Sarah', leadName: 'Laura Chen', leadId: 'lead-2', actionsApplied: ['Assigned to Sarah Johnson', 'Status → qualified', 'Tag added: High Value'],  timestamp: d(0) },
  { id: 'ex-3', ruleId: 'rule-4', ruleName: 'Referral Leads → Fast Track',     leadName: 'David Park',      leadId: 'lead-3', actionsApplied: ['Assigned to Sarah Johnson', 'Score set to 85', 'Tag added: VIP', 'Status → qualified'], timestamp: d(1) },
  { id: 'ex-4', ruleId: 'rule-3', ruleName: 'Low-Score Leads → Nurture',       leadName: 'Emma Wilson',     leadId: 'lead-4', actionsApplied: ['Tag added: Nurture', 'Status → contacted', 'Score set to 35'],              timestamp: d(1) },
  { id: 'ex-5', ruleId: 'rule-2', ruleName: 'LinkedIn Leads → Michael',        leadName: 'Carlos Santos',   leadId: 'lead-5', actionsApplied: ['Assigned to Michael Chen', 'Tag added: LinkedIn', 'Notified Michael Chen'], timestamp: d(2) },
  { id: 'ex-6', ruleId: 'rule-1', ruleName: 'High-Score Enterprise Leads → Sarah', leadName: 'Nina Patel', leadId: 'lead-6', actionsApplied: ['Assigned to Sarah Johnson', 'Status → qualified', 'Tag added: High Value'],  timestamp: d(2) },
  { id: 'ex-7', ruleId: 'rule-4', ruleName: 'Referral Leads → Fast Track',     leadName: 'Tom Bradley',     leadId: 'lead-7', actionsApplied: ['Assigned to Sarah Johnson', 'Score set to 85', 'Tag added: VIP'],           timestamp: d(3) },
  { id: 'ex-8', ruleId: 'rule-3', ruleName: 'Low-Score Leads → Nurture',       leadName: 'Aisha Okonkwo',   leadId: 'lead-8', actionsApplied: ['Tag added: Nurture', 'Status → contacted'],                                 timestamp: d(4) },
]

// ─── Context ───────────────────────────────────────────────────────────────────
interface AssignmentRulesContextValue {
  rules:       AssignmentRule[]
  executions:  RuleExecution[]
  addRule:    (r: Omit<AssignmentRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => void
  updateRule: (id: string, updates: Partial<AssignmentRule>) => void
  deleteRule: (id: string) => void
  duplicateRule: (id: string) => void
  toggleRule: (id: string) => void
  reorderRule: (id: string, direction: 'up' | 'down') => void
  simulateRun: (ruleId: string) => void
}

const AssignmentRulesContext = createContext<AssignmentRulesContextValue | null>(null)

export function AssignmentRulesProvider({ children }: { children: ReactNode }) {
  const [rules,      setRules]      = useState<AssignmentRule[]>(SEED_RULES)
  const [executions, setExecutions] = useState<RuleExecution[]>(SEED_EXECUTIONS)

  const addRule = useCallback((r: Omit<AssignmentRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => {
    const ts = now()
    setRules(prev => [...prev, { ...r, id: `rule-${Date.now()}`, runCount: 0, createdAt: ts, updatedAt: ts }])
    toast.success(`Rule "${r.name}" created`)
  }, [])

  const updateRule = useCallback((id: string, updates: Partial<AssignmentRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now() } : r))
  }, [])

  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    toast.success('Rule deleted')
  }, [])

  const duplicateRule = useCallback((id: string) => {
    setRules(prev => {
      const src = prev.find(r => r.id === id)
      if (!src) return prev
      const ts = now()
      const copy: AssignmentRule = {
        ...src,
        id:       `rule-${Date.now()}`,
        name:     `${src.name} (copy)`,
        status:   'draft',
        runCount: 0,
        priority: prev.length + 1,
        createdAt: ts,
        updatedAt: ts,
      }
      toast.success('Rule duplicated')
      return [...prev, copy]
    })
  }, [])

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r
      const next = r.status === 'active' ? 'inactive' : 'active'
      toast.success(`Rule ${next === 'active' ? 'activated' : 'deactivated'}`)
      return { ...r, status: next, updatedAt: now() }
    }))
  }, [])

  const reorderRule = useCallback((id: string, direction: 'up' | 'down') => {
    setRules(prev => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority)
      const idx = sorted.findIndex(r => r.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      const a = sorted[idx].priority
      const b = sorted[swapIdx].priority
      return prev.map(r => {
        if (r.id === sorted[idx].id)    return { ...r, priority: b, updatedAt: now() }
        if (r.id === sorted[swapIdx].id) return { ...r, priority: a, updatedAt: now() }
        return r
      })
    })
  }, [])

  const simulateRun = useCallback((ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    // Simulate matching 2-8 leads
    const matched = Math.floor(Math.random() * 6) + 2
    const ts = now()

    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, runCount: r.runCount + matched, lastRunAt: ts, updatedAt: ts } : r
    ))

    const newExecs: RuleExecution[] = Array.from({ length: Math.min(matched, 3) }, (_, i) => ({
      id:       `ex-${Date.now()}-${i}`,
      ruleId,
      ruleName: rule.name,
      leadName: ['Alex Turner', 'Maria Costa', 'Jin Park', 'Priya Singh'][i % 4],
      leadId:   `lead-sim-${i}`,
      actionsApplied: rule.actions.map(a => formatAction(a)),
      timestamp: ts,
    }))

    setExecutions(prev => [...newExecs, ...prev])
    toast.success(`Rule executed — ${matched} leads matched`)
  }, [rules])

  return (
    <AssignmentRulesContext.Provider value={{
      rules, executions,
      addRule, updateRule, deleteRule, duplicateRule,
      toggleRule, reorderRule, simulateRun,
    }}>
      {children}
    </AssignmentRulesContext.Provider>
  )
}

export function useAssignmentRules() {
  const ctx = useContext(AssignmentRulesContext)
  if (!ctx) throw new Error('useAssignmentRules must be inside AssignmentRulesProvider')
  return ctx
}

// ─── Helper ────────────────────────────────────────────────────────────────────
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