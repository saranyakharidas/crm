'use client'

import { useState, useMemo } from 'react'
import { useWorkflows } from '@/lib/workflow-context'
import type {
  Workflow,
  WorkflowStatus,
  WorkflowModule,
  TriggerType,
  ConditionOperator,
  ActionType,
  WorkflowCondition,
  WorkflowAction,
  WorkflowTrigger,
} from '@/lib/workflow-types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Zap,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  GitBranch,
  Filter,
  ArrowRight,
  Sparkles,
  Users,
  Bell,
  Tag,
  ListTodo,
  ToggleLeft,
  ToggleRight,
  CircleDot,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Label maps ───────────────────────────────────────────────────────────────
const MODULE_LABELS: Record<WorkflowModule, string> = {
  leads: 'Leads',
  deals: 'Deals',
  contacts: 'Contacts',
  tickets: 'Tickets',
  tasks: 'Tasks',
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  record_created: 'Record is created',
  record_updated: 'Record is updated',
  field_changed: 'Field value changes',
  stage_changed: 'Stage changes',
  score_threshold: 'Score exceeds threshold',
  time_delay: 'Time delay after creation',
}

const ACTION_LABELS: Record<ActionType, string> = {
  update_field: 'Update a field',
  create_task: 'Create a task',
  send_notification: 'Send notification',
  assign_owner: 'Assign owner',
  add_tag: 'Add tag',
  change_stage: 'Change stage',
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  update_field: <Edit className="h-3.5 w-3.5" />,
  create_task: <ListTodo className="h-3.5 w-3.5" />,
  send_notification: <Bell className="h-3.5 w-3.5" />,
  assign_owner: <Users className="h-3.5 w-3.5" />,
  add_tag: <Tag className="h-3.5 w-3.5" />,
  change_stage: <GitBranch className="h-3.5 w-3.5" />,
}

const STATUS_CONFIG: Record<WorkflowStatus, { label: string; className: string; dot: string }> = {
  active: {
    label: 'Active',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
    dot: 'bg-green-500',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dot: 'bg-slate-400',
  },
  draft: {
    label: 'Draft',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    dot: 'bg-yellow-500',
  },
}

const MODULE_COLORS: Record<WorkflowModule, string> = {
  leads: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  deals: 'bg-green-500/10 text-green-400 border-green-500/20',
  contacts: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  tickets: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  tasks: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getTriggerSummary(trigger: WorkflowTrigger): string {
  switch (trigger.type) {
    case 'record_created': return `${MODULE_LABELS[trigger.module]} record is created`
    case 'record_updated': return `${MODULE_LABELS[trigger.module]} record is updated`
    case 'field_changed':
      return trigger.toValue
        ? `${trigger.field} changes to "${trigger.toValue}"`
        : `${trigger.field ?? 'field'} value changes`
    case 'stage_changed':
      return trigger.toValue
        ? `Stage moves to "${trigger.toValue}"`
        : 'Stage changes'
    case 'score_threshold':
      return `Score exceeds ${trigger.threshold ?? 80}`
    case 'time_delay':
      return `${trigger.delayMinutes ?? 60} min after creation`
    default:
      return 'Trigger set'
  }
}

function getActionSummary(action: WorkflowAction): string {
  switch (action.type) {
    case 'create_task': return `Create task: "${action.taskTitle ?? 'New Task'}"`
    case 'send_notification': return action.notificationMessage ?? 'Send notification'
    case 'assign_owner': return `Assign to ${action.ownerName ?? 'owner'}`
    case 'update_field': return `Set ${action.field ?? 'field'} to "${action.value ?? ''}"`
    case 'change_stage': return `Move to stage "${action.value ?? ''}"`
    case 'add_tag': return `Add tag: "${action.tagValue ?? ''}"`
    default: return 'Execute action'
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn('text-3xl font-bold mt-1', accent)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Workflow Card ────────────────────────────────────────────────────────────
interface WorkflowCardProps {
  workflow: Workflow
  onEdit: (wf: Workflow) => void
}

function WorkflowCard({ workflow, onEdit }: WorkflowCardProps) {
  const { toggleWorkflowStatus, deleteWorkflow, testWorkflow } = useWorkflows()
  const status = STATUS_CONFIG[workflow.status]
  const isActive = workflow.status === 'active'

  return (
    <Card className="group hover:border-border/80 transition-colors">
      <CardContent className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{workflow.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{workflow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', status.className)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(workflow)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit workflow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWorkflow(workflow.id)}>
                  <Play className="mr-2 h-4 w-4" /> Test run
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleWorkflowStatus(workflow.id)}>
                  {isActive
                    ? <><Pause className="mr-2 h-4 w-4" /> Deactivate</>
                    : <><Play className="mr-2 h-4 w-4" /> Activate</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteWorkflow(workflow.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Module badge */}
        <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium mb-3', MODULE_COLORS[workflow.module])}>
          {MODULE_LABELS[workflow.module]}
        </span>

        {/* Trigger → Actions flow */}
        <div className="rounded-lg bg-muted/40 p-3 space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs font-medium">When: <span className="text-muted-foreground font-normal">{getTriggerSummary(workflow.trigger)}</span></p>
          </div>
          {workflow.conditions.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
              <p className="text-xs font-medium">{workflow.conditions.length} condition{workflow.conditions.length > 1 ? 's' : ''} <span className="text-muted-foreground font-normal">must match</span></p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Zap className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            <div className="text-xs font-medium">
              Then: <span className="text-muted-foreground font-normal">{workflow.actions.map(a => ACTION_LABELS[a.type]).join(' · ')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            {workflow.executionCount} executions
          </span>
          <span>
            {workflow.lastExecutedAt
              ? `Last run ${formatDistanceToNow(new Date(workflow.lastExecutedAt), { addSuffix: true })}`
              : 'Never run'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── New/Edit Workflow Dialog ─────────────────────────────────────────────────
function newCondition(): WorkflowCondition {
  return { id: `c-${Date.now()}-${Math.random()}`, field: 'status', operator: 'equals', value: '' }
}

function newAction(): WorkflowAction {
  return { id: `a-${Date.now()}-${Math.random()}`, type: 'send_notification', notificationMessage: '', notificationType: 'info' }
}

interface WorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Workflow | null
}

function WorkflowDialog({ open, onOpenChange, editing }: WorkflowDialogProps) {
  const { addWorkflow, updateWorkflow } = useWorkflows()

  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [module, setModule] = useState<WorkflowModule>(editing?.module ?? 'leads')
  const [triggerType, setTriggerType] = useState<TriggerType>(editing?.trigger.type ?? 'record_created')
  const [triggerToValue, setTriggerToValue] = useState(editing?.trigger.toValue ?? '')
  const [triggerField, setTriggerField] = useState(editing?.trigger.field ?? '')
  const [triggerThreshold, setTriggerThreshold] = useState(String(editing?.trigger.threshold ?? 80))
  const [conditions, setConditions] = useState<WorkflowCondition[]>(editing?.conditions ?? [])
  const [actions, setActions] = useState<WorkflowAction[]>(editing?.actions ?? [newAction()])
  const [step, setStep] = useState<'trigger' | 'conditions' | 'actions'>('trigger')

  // Reset when dialog opens
  const resetForm = () => {
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setModule(editing?.module ?? 'leads')
    setTriggerType(editing?.trigger.type ?? 'record_created')
    setTriggerToValue(editing?.trigger.toValue ?? '')
    setTriggerField(editing?.trigger.field ?? '')
    setTriggerThreshold(String(editing?.trigger.threshold ?? 80))
    setConditions(editing?.conditions ?? [])
    setActions(editing?.actions ?? [newAction()])
    setStep('trigger')
  }

  const handleOpenChange = (o: boolean) => {
    if (o) resetForm()
    onOpenChange(o)
  }

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Workflow name is required'); return }
    if (actions.length === 0) { toast.error('Add at least one action'); return }

    const trigger: WorkflowTrigger = {
      type: triggerType,
      module,
      ...(triggerType === 'field_changed' || triggerType === 'stage_changed' ? { field: triggerField, toValue: triggerToValue } : {}),
      ...(triggerType === 'score_threshold' ? { threshold: parseInt(triggerThreshold) } : {}),
    }

    const payload = { name, description, module, status: 'draft' as const, trigger, conditions, actions }

    if (editing) {
      updateWorkflow(editing.id, payload)
      toast.success('Workflow updated')
    } else {
      addWorkflow(payload)
    }
    onOpenChange(false)
  }

  const updateCondition = (idx: number, patch: Partial<WorkflowCondition>) =>
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))

  const updateAction = (idx: number, patch: Partial<WorkflowAction>) =>
    setActions(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update this automation rule.' : 'Set up a trigger, conditions, and actions to automate your CRM.'}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 mb-2">
          {(['trigger', 'conditions', 'actions'] as const).map((s, idx) => (
            <div key={s} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  step === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{idx + 1}.</span> {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
              {idx < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {/* ── Step: Trigger ── */}
          {step === 'trigger' && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Workflow name</Label>
                <Input placeholder="e.g. Hot Lead Auto-Assign" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea placeholder="What does this workflow do?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Module</Label>
                  <Select value={module} onValueChange={v => setModule(v as WorkflowModule)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MODULE_LABELS) as WorkflowModule[]).map(m => (
                        <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Trigger</Label>
                  <Select value={triggerType} onValueChange={v => setTriggerType(v as TriggerType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                        <SelectItem key={t} value={t}>{TRIGGER_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(triggerType === 'field_changed' || triggerType === 'stage_changed') && (
                <div className="grid grid-cols-2 gap-4">
                  {triggerType === 'field_changed' && (
                    <div className="grid gap-2">
                      <Label>Field name</Label>
                      <Input placeholder="e.g. status, priority" value={triggerField} onChange={e => setTriggerField(e.target.value)} />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>New value</Label>
                    <Input placeholder="e.g. qualified, urgent" value={triggerToValue} onChange={e => setTriggerToValue(e.target.value)} />
                  </div>
                </div>
              )}
              {triggerType === 'score_threshold' && (
                <div className="grid gap-2">
                  <Label>Score threshold</Label>
                  <Input type="number" min={0} max={100} value={triggerThreshold} onChange={e => setTriggerThreshold(e.target.value)} />
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setStep('conditions')}>Next: Conditions <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── Step: Conditions ── */}
          {step === 'conditions' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Conditions are optional. All conditions must be true for the workflow to run.</p>
              {conditions.map((cond, idx) => (
                <div key={cond.id} className="flex gap-2 items-end rounded-lg border border-border/60 p-3">
                  <div className="grid gap-1.5 flex-1">
                    <Label className="text-xs">Field</Label>
                    <Input
                      placeholder="e.g. status"
                      value={cond.field}
                      onChange={e => updateCondition(idx, { field: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5 w-36">
                    <Label className="text-xs">Operator</Label>
                    <Select value={cond.operator} onValueChange={v => updateCondition(idx, { operator: v as ConditionOperator })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['equals','not_equals','contains','greater_than','less_than','is_empty','is_not_empty'] as ConditionOperator[]).map(op => (
                          <SelectItem key={op} value={op}>{op.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!['is_empty','is_not_empty'].includes(cond.operator) && (
                    <div className="grid gap-1.5 flex-1">
                      <Label className="text-xs">Value</Label>
                      <Input
                        placeholder="Value"
                        value={cond.value}
                        onChange={e => updateCondition(idx, { value: e.target.value })}
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConditions(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive mb-0.5"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setConditions(prev => [...prev, newCondition()])}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add condition
              </Button>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('trigger')}>Back</Button>
                <Button onClick={() => setStep('actions')}>Next: Actions <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── Step: Actions ── */}
          {step === 'actions' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Actions execute in order when the trigger fires and all conditions match.</p>
              {actions.map((action, idx) => (
                <div key={action.id} className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                      <Label>Action</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setActions(prev => prev.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={action.type} onValueChange={v => updateAction(idx, { type: v as ActionType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACTION_LABELS) as ActionType[]).map(t => (
                        <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Action-specific fields */}
                  {action.type === 'create_task' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 grid gap-1.5">
                        <Label className="text-xs">Task title</Label>
                        <Input placeholder="e.g. Follow up with lead" value={action.taskTitle ?? ''} onChange={e => updateAction(idx, { taskTitle: e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Priority</Label>
                        <Select value={action.taskPriority ?? 'medium'} onValueChange={v => updateAction(idx, { taskPriority: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Due in (days)</Label>
                        <Input type="number" min={0} value={action.taskDueDays ?? 1} onChange={e => updateAction(idx, { taskDueDays: parseInt(e.target.value) })} />
                      </div>
                    </div>
                  )}
                  {action.type === 'send_notification' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 grid gap-1.5">
                        <Label className="text-xs">Message</Label>
                        <Input placeholder="Notification message" value={action.notificationMessage ?? ''} onChange={e => updateAction(idx, { notificationMessage: e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select value={action.notificationType ?? 'info'} onValueChange={v => updateAction(idx, { notificationType: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['info','success','warning'].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {action.type === 'assign_owner' && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Assign to</Label>
                      <Input placeholder="e.g. Sarah Johnson" value={action.ownerName ?? ''} onChange={e => updateAction(idx, { ownerName: e.target.value })} />
                    </div>
                  )}
                  {(action.type === 'update_field' || action.type === 'change_stage') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">{action.type === 'change_stage' ? 'New stage' : 'Field name'}</Label>
                        <Input
                          placeholder={action.type === 'change_stage' ? 'e.g. qualified' : 'e.g. status'}
                          value={action.type === 'change_stage' ? (action.value ?? '') : (action.field ?? '')}
                          onChange={e => updateAction(idx, action.type === 'change_stage' ? { value: e.target.value } : { field: e.target.value })}
                        />
                      </div>
                      {action.type === 'update_field' && (
                        <div className="grid gap-1.5">
                          <Label className="text-xs">New value</Label>
                          <Input placeholder="New value" value={action.value ?? ''} onChange={e => updateAction(idx, { value: e.target.value })} />
                        </div>
                      )}
                    </div>
                  )}
                  {action.type === 'add_tag' && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Tag value</Label>
                      <Input placeholder="e.g. high-priority" value={action.tagValue ?? ''} onChange={e => updateAction(idx, { tagValue: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setActions(prev => [...prev, newAction()])}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add action
              </Button>
              <div className="flex justify-between pt-1">
                <Button variant="outline" onClick={() => setStep('conditions')}>Back</Button>
                <Button onClick={handleSubmit}>
                  {editing ? 'Save changes' : 'Create workflow'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function WorkflowsView() {
  const { workflows, executions } = useWorkflows()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [activeTab, setActiveTab] = useState<'workflows' | 'log'>('workflows')

  const filtered = useMemo(() => {
    return workflows.filter(wf => {
      const matchSearch = wf.name.toLowerCase().includes(search.toLowerCase()) ||
        wf.description.toLowerCase().includes(search.toLowerCase())
      const matchModule = moduleFilter === 'all' || wf.module === moduleFilter
      const matchStatus = statusFilter === 'all' || wf.status === statusFilter
      return matchSearch && matchModule && matchStatus
    })
  }, [workflows, search, moduleFilter, statusFilter])

  const stats = useMemo(() => ({
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    successRate: executions.length
      ? Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)
      : 0,
  }), [workflows, executions])

  const handleEdit = (wf: Workflow) => {
    setEditingWorkflow(wf)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            Workflows & Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate repetitive tasks with rule-based triggers and actions.
          </p>
        </div>
        <Button onClick={() => { setEditingWorkflow(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Workflows" value={stats.total} sub="All modules" />
        <StatCard label="Active" value={stats.active} sub="Running now" accent="text-green-500" />
        <StatCard label="Total Executions" value={stats.totalRuns.toLocaleString()} sub="All time" accent="text-primary" />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} sub="Last 50 runs" accent={stats.successRate >= 90 ? 'text-green-500' : 'text-yellow-500'} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="workflows" className="gap-2">
              <GitBranch className="h-4 w-4" /> Workflows
              <Badge variant="secondary" className="ml-1">{workflows.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-2">
              <Activity className="h-4 w-4" /> Execution Log
              <Badge variant="secondary" className="ml-1">{executions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          {activeTab === 'workflows' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 w-52"
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {(Object.keys(MODULE_LABELS) as WorkflowModule[]).map(m => (
                    <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Workflows tab ── */}
        <TabsContent value="workflows" className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Zap className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No workflows found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {search || moduleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Create your first automation to get started.'}
              </p>
              {!search && moduleFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => { setEditingWorkflow(null); setDialogOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" /> Create Workflow
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(wf => (
                <WorkflowCard key={wf.id} workflow={wf} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Execution Log tab ── */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {executions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No executions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {executions.map(exec => (
                    <div key={exec.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="shrink-0">
                        {exec.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {exec.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
                        {exec.status === 'skipped' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{exec.workflowName}</p>
                          <span className={cn(
                            'inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium',
                            exec.status === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            exec.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          )}>
                            {exec.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {exec.recordName} · {exec.summary}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(exec.executedAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <WorkflowDialog
        open={dialogOpen}
        onOpenChange={o => { setDialogOpen(o); if (!o) setEditingWorkflow(null) }}
        editing={editingWorkflow}
      />
    </div>
  )
}