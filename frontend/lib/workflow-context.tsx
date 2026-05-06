'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import type {
  Workflow,
  WorkflowExecution,
  WorkflowAction,
  WorkflowModule,
  TriggerType,
} from './workflow-types'

// ─── Seed data ─────────────────────────────────────────────────────────────────
const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Hot Lead Auto-Assign',
    description: 'Automatically assign high-scoring leads to the sales team and create a follow-up task.',
    status: 'active',
    module: 'leads',
    trigger: { type: 'score_threshold', module: 'leads', threshold: 80 },
    conditions: [
      { id: 'c1', field: 'status', operator: 'equals', value: 'new' },
    ],
    actions: [
      { id: 'a1', type: 'assign_owner', ownerName: 'Sarah Johnson' },
      { id: 'a2', type: 'create_task', taskTitle: 'Follow up with hot lead', taskPriority: 'high', taskDueDays: 1 },
      { id: 'a3', type: 'send_notification', notificationMessage: 'A new hot lead has been assigned to you.', notificationType: 'success' },
    ],
    executionCount: 47,
    lastExecutedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wf-2',
    name: 'Deal Stage: Proposal Alert',
    description: 'Notify team when a deal moves to the Proposal stage and create a proposal prep task.',
    status: 'active',
    module: 'deals',
    trigger: { type: 'stage_changed', module: 'deals', toValue: 'proposal' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'create_task', taskTitle: 'Prepare proposal document', taskPriority: 'high', taskDueDays: 2 },
      { id: 'a2', type: 'send_notification', notificationMessage: 'Deal has reached Proposal stage — prepare materials.', notificationType: 'info' },
    ],
    executionCount: 23,
    lastExecutedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wf-3',
    name: 'Urgent Ticket Escalation',
    description: 'Escalate urgent tickets to the manager and notify the team immediately.',
    status: 'active',
    module: 'tickets',
    trigger: { type: 'field_changed', module: 'tickets', field: 'priority', toValue: 'urgent' },
    conditions: [
      { id: 'c1', field: 'status', operator: 'not_equals', value: 'closed' },
    ],
    actions: [
      { id: 'a1', type: 'assign_owner', ownerName: 'Michael Chen' },
      { id: 'a2', type: 'send_notification', notificationMessage: 'Urgent ticket requires immediate attention!', notificationType: 'warning' },
    ],
    executionCount: 12,
    lastExecutedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wf-4',
    name: 'New Contact Welcome Task',
    description: 'Create a welcome call task whenever a new contact is added to the CRM.',
    status: 'inactive',
    module: 'contacts',
    trigger: { type: 'record_created', module: 'contacts' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'create_task', taskTitle: 'Welcome call with new contact', taskPriority: 'medium', taskDueDays: 3 },
    ],
    executionCount: 8,
    lastExecutedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wf-5',
    name: 'Deal Won Celebration',
    description: 'Notify the whole team and update records when a deal is closed-won.',
    status: 'draft',
    module: 'deals',
    trigger: { type: 'stage_changed', module: 'deals', toValue: 'closed-won' },
    conditions: [],
    actions: [
      { id: 'a1', type: 'send_notification', notificationMessage: '🎉 Deal closed! Great work team!', notificationType: 'success' },
      { id: 'a2', type: 'create_task', taskTitle: 'Send thank you note to client', taskPriority: 'medium', taskDueDays: 1 },
    ],
    executionCount: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const SEED_EXECUTIONS: WorkflowExecution[] = [
  { id: 'e1', workflowId: 'wf-1', workflowName: 'Hot Lead Auto-Assign', status: 'success', summary: 'Assigned to Sarah Johnson, task created', recordId: 'l-1', recordName: 'Acme Corp — John Smith', executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'e2', workflowId: 'wf-2', workflowName: 'Deal Stage: Proposal Alert', status: 'success', summary: 'Task created, notification sent', recordId: 'd-3', recordName: 'Enterprise License Deal', executedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'e3', workflowId: 'wf-1', workflowName: 'Hot Lead Auto-Assign', status: 'success', summary: 'Assigned to Sarah Johnson, task created', recordId: 'l-5', recordName: 'Globex Corp — Maria Lee', executedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString() },
  { id: 'e4', workflowId: 'wf-3', workflowName: 'Urgent Ticket Escalation', status: 'success', summary: 'Escalated to Michael Chen, team notified', recordId: 't-2', recordName: 'Ticket #1042 — Login issue', executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'e5', workflowId: 'wf-1', workflowName: 'Hot Lead Auto-Assign', status: 'skipped', summary: 'Conditions not met — lead already contacted', recordId: 'l-9', recordName: 'Initech — Bob Wallace', executedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'e6', workflowId: 'wf-2', workflowName: 'Deal Stage: Proposal Alert', status: 'success', summary: 'Task created, notification sent', recordId: 'd-7', recordName: 'Expansion Package Deal', executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'e7', workflowId: 'wf-4', workflowName: 'New Contact Welcome Task', status: 'failed', summary: 'Error: could not find assigned owner', recordId: 'c-12', recordName: 'Sandra Li', executedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
]

// ─── Context ───────────────────────────────────────────────────────────────────
interface WorkflowContextValue {
  workflows: Workflow[]
  executions: WorkflowExecution[]
  addWorkflow: (wf: Omit<Workflow, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>) => void
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  toggleWorkflowStatus: (id: string) => void
  testWorkflow: (id: string) => void
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(SEED_WORKFLOWS)
  const [executions, setExecutions] = useState<WorkflowExecution[]>(SEED_EXECUTIONS)

  const addWorkflow = useCallback(
    (wf: Omit<Workflow, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const newWf: Workflow = {
        ...wf,
        id: `wf-${Date.now()}`,
        executionCount: 0,
        createdAt: now,
        updatedAt: now,
      }
      setWorkflows((prev) => [newWf, ...prev])
      toast.success(`Workflow "${wf.name}" created`)
    },
    [],
  )

  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id ? { ...wf, ...updates, updatedAt: new Date().toISOString() } : wf,
      ),
    )
  }, [])

  const deleteWorkflow = useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((wf) => wf.id !== id))
    toast.success('Workflow deleted')
  }, [])

  const toggleWorkflowStatus = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id !== id) return wf
        const next = wf.status === 'active' ? 'inactive' : 'active'
        toast.success(`Workflow ${next === 'active' ? 'activated' : 'deactivated'}`)
        return { ...wf, status: next, updatedAt: new Date().toISOString() }
      }),
    )
  }, [])

  /** Simulates running a workflow and adds an execution log entry */
  const testWorkflow = useCallback(
    (id: string) => {
      const wf = workflows.find((w) => w.id === id)
      if (!wf) return

      const now = new Date().toISOString()
      const actionSummary = wf.actions
        .map((a: WorkflowAction) => {
          switch (a.type) {
            case 'create_task': return `task "${a.taskTitle}" created`
            case 'send_notification': return 'notification sent'
            case 'assign_owner': return `assigned to ${a.ownerName}`
            case 'update_field': return `${a.field} updated`
            case 'change_stage': return `stage changed to ${a.value}`
            case 'add_tag': return `tag "${a.tagValue}" added`
            default: return 'action executed'
          }
        })
        .join(', ')

      const execution: WorkflowExecution = {
        id: `e-${Date.now()}`,
        workflowId: wf.id,
        workflowName: wf.name,
        status: 'success',
        summary: `Test run — ${actionSummary}`,
        recordId: 'test-record',
        recordName: 'Test Record (manual trigger)',
        executedAt: now,
      }

      setExecutions((prev) => [execution, ...prev])
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, executionCount: w.executionCount + 1, lastExecutedAt: now, updatedAt: now }
            : w,
        ),
      )
      toast.success(`Workflow "${wf.name}" executed successfully`)
    },
    [workflows],
  )

  return (
    <WorkflowContext.Provider
      value={{ workflows, executions, addWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflowStatus, testWorkflow }}
    >
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflows() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflows must be used inside WorkflowProvider')
  return ctx
}