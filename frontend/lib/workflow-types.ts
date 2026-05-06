// ─── Workflow & Automation Types ──────────────────────────────────────────────

export type WorkflowStatus = 'active' | 'inactive' | 'draft'
export type WorkflowModule = 'leads' | 'deals' | 'contacts' | 'tickets' | 'tasks'

// ── Trigger ───────────────────────────────────────────────────────────────────
export type TriggerType =
  | 'record_created'
  | 'record_updated'
  | 'field_changed'
  | 'stage_changed'
  | 'score_threshold'
  | 'time_delay'

export interface WorkflowTrigger {
  type: TriggerType
  module: WorkflowModule
  /** For field_changed: which field */
  field?: string
  /** For field_changed / stage_changed: old value */
  fromValue?: string
  /** For field_changed / stage_changed: new value */
  toValue?: string
  /** For score_threshold: numeric threshold */
  threshold?: number
  /** For time_delay: minutes after creation */
  delayMinutes?: number
}

// ── Condition ─────────────────────────────────────────────────────────────────
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'

export interface WorkflowCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: string
}

// ── Action ────────────────────────────────────────────────────────────────────
export type ActionType =
  | 'update_field'
  | 'create_task'
  | 'send_notification'
  | 'assign_owner'
  | 'add_tag'
  | 'change_stage'

export interface WorkflowAction {
  id: string
  type: ActionType
  /** Target field for update_field / change_stage */
  field?: string
  /** New value for update_field / change_stage */
  value?: string
  /** Task title for create_task */
  taskTitle?: string
  /** Task priority for create_task */
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent'
  /** Due in N days for create_task */
  taskDueDays?: number
  /** Notification message for send_notification */
  notificationMessage?: string
  /** Notification type for send_notification */
  notificationType?: 'info' | 'success' | 'warning'
  /** Owner name for assign_owner */
  ownerName?: string
  /** Tag value for add_tag */
  tagValue?: string
}

// ── Workflow ───────────────────────────────────────────────────────────────────
export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  module: WorkflowModule
  trigger: WorkflowTrigger
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  /** Total times this workflow has fired */
  executionCount: number
  /** Last time it fired (ISO string) */
  lastExecutedAt?: string
  createdAt: string
  updatedAt: string
}

// ── Execution Log ─────────────────────────────────────────────────────────────
export type ExecutionStatus = 'success' | 'failed' | 'skipped'

export interface WorkflowExecution {
  id: string
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  /** Human-readable summary of what happened */
  summary: string
  /** Record that triggered the workflow */
  recordId: string
  recordName: string
  executedAt: string
}