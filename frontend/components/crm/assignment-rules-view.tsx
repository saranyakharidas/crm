'use client'

import { useState, useMemo } from 'react'
import {
  useAssignmentRules,
  type AssignmentRule, type RuleCondition, type RuleAction,
  type CondField, type CondOperator, type ActionType, type RuleStatus,
  COND_FIELD_LABELS, COND_OPERATOR_LABELS, ACTION_LABELS, FIELD_VALUES,
  formatAction,
} from '@/lib/assignment-rules-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  GitBranch, Plus, MoreHorizontal, Edit, Trash2, Copy,
  Play, Pause, ChevronUp, ChevronDown, Zap, CheckCircle2,
  Clock, Users, Activity, X, ListFilter, History,
  AlertTriangle, TrendingUp, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

// ─── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RuleStatus, { label: string; className: string; dot: string }> = {
  active:   { label: 'Active',   className: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400'  },
  inactive: { label: 'Inactive', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400'  },
  draft:    { label: 'Draft',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400'  },
}

const REPS = ['Sarah Johnson', 'Michael Chen', 'Alex Rivera', 'Jordan Kim', 'Priya Singh']
const STATUS_VALUES = ['new', 'contacted', 'qualified', 'unqualified']

// ─── Condition row in builder ──────────────────────────────────────────────────
function ConditionRow({
  cond, index, onChange, onRemove,
}: { cond: RuleCondition; index: number; onChange: (c: RuleCondition) => void; onRemove: () => void }) {
  const fieldVals = FIELD_VALUES[cond.field as CondField]
  const isNumeric = cond.field === 'score'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>

      <Select value={cond.field} onValueChange={v => onChange({ ...cond, field: v as CondField, value: '' })}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(COND_FIELD_LABELS) as CondField[]).map(f => (
            <SelectItem key={f} value={f} className="text-xs">{COND_FIELD_LABELS[f]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={cond.operator} onValueChange={v => onChange({ ...cond, operator: v as CondOperator })}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(COND_OPERATOR_LABELS) as CondOperator[]).map(op => {
            if (isNumeric && (op === 'contains')) return null
            if (!isNumeric && (op === 'greater_than' || op === 'less_than')) return null
            return <SelectItem key={op} value={op} className="text-xs">{COND_OPERATOR_LABELS[op]}</SelectItem>
          })}
        </SelectContent>
      </Select>

      {fieldVals ? (
        <Select value={cond.value} onValueChange={v => onChange({ ...cond, value: v })}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {fieldVals.map(v => <SelectItem key={v} value={v} className="text-xs capitalize">{v}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="h-8 w-36 text-xs"
          type={isNumeric ? 'number' : 'text'}
          placeholder={isNumeric ? '0–100' : 'value…'}
          value={cond.value}
          onChange={e => onChange({ ...cond, value: e.target.value })}
        />
      )}

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── Action row in builder ─────────────────────────────────────────────────────
function ActionRow({
  action, index, onChange, onRemove,
}: { action: RuleAction; index: number; onChange: (a: RuleAction) => void; onRemove: () => void }) {
  const needsRep    = action.type === 'assign_to' || action.type === 'notify'
  const needsStatus = action.type === 'set_status'
  const needsScore  = action.type === 'set_score'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>

      <Select value={action.type} onValueChange={v => onChange({ ...action, type: v as ActionType, value: '' })}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(ACTION_LABELS) as ActionType[]).map(t => (
            <SelectItem key={t} value={t} className="text-xs">{ACTION_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsRep && (
        <Select value={action.value} onValueChange={v => onChange({ ...action, value: v })}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Select rep…" /></SelectTrigger>
          <SelectContent>
            {REPS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {needsStatus && (
        <Select value={action.value} onValueChange={v => onChange({ ...action, value: v })}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status…" /></SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {needsScore && (
        <Input
          className="h-8 w-24 text-xs"
          type="number" min={0} max={100}
          placeholder="0–100"
          value={action.value}
          onChange={e => onChange({ ...action, value: e.target.value })}
        />
      )}

      {!needsRep && !needsStatus && !needsScore && (
        <Input
          className="h-8 w-36 text-xs"
          placeholder="value…"
          value={action.value}
          onChange={e => onChange({ ...action, value: e.target.value })}
        />
      )}

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── Rule Form Dialog ──────────────────────────────────────────────────────────
function RuleFormDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: AssignmentRule | null }) {
  const { addRule, updateRule } = useAssignmentRules()
  let nextId = 1
  const uid = () => `new-${nextId++}`

  const blank = {
    name: '', description: '', status: 'draft' as RuleStatus,
    matchAll: true, priority: 99,
    conditions: [] as RuleCondition[],
    actions:    [] as RuleAction[],
  }

  const [f, setF] = useState({ ...blank })

  const handleOpen = (o: boolean) => {
    if (o && editing) {
      setF({
        name:       editing.name,
        description:editing.description,
        status:     editing.status,
        matchAll:   editing.matchAll,
        priority:   editing.priority,
        conditions: editing.conditions.map(c => ({ ...c })),
        actions:    editing.actions.map(a => ({ ...a })),
      })
    } else if (o) {
      setF({ ...blank })
    }
    onOpenChange(o)
  }

  const addCondition = () => setF(p => ({
    ...p, conditions: [...p.conditions, { id: uid(), field: 'source', operator: 'equals', value: '' }]
  }))

  const addAction = () => setF(p => ({
    ...p, actions: [...p.actions, { id: uid(), type: 'assign_to', value: '' }]
  }))

  const updateCond = (id: string, c: RuleCondition) => setF(p => ({
    ...p, conditions: p.conditions.map(x => x.id === id ? c : x)
  }))

  const removeCond = (id: string) => setF(p => ({
    ...p, conditions: p.conditions.filter(x => x.id !== id)
  }))

  const updateAct = (id: string, a: RuleAction) => setF(p => ({
    ...p, actions: p.actions.map(x => x.id === id ? a : x)
  }))

  const removeAct = (id: string) => setF(p => ({
    ...p, actions: p.actions.filter(x => x.id !== id)
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) { toast.error('Name is required'); return }
    if (f.conditions.length === 0) { toast.error('Add at least one condition'); return }
    if (f.actions.length === 0)    { toast.error('Add at least one action'); return }

    const payload = {
      name: f.name.trim(), description: f.description.trim(),
      status: f.status, matchAll: f.matchAll, priority: f.priority,
      conditions: f.conditions, actions: f.actions,
    }

    if (editing) {
      updateRule(editing.id, payload)
      toast.success('Rule updated')
    } else {
      addRule(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[660px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Rule' : 'New Assignment Rule'}</DialogTitle>
          <DialogDescription>
            Define conditions and actions for automatic lead assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Rule name *</Label>
              <Input placeholder="e.g. High-Score Leads → Sarah" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={v => setF(p => ({ ...p, status: v as RuleStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea placeholder="What does this rule do?" value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>

          {/* Conditions */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Conditions</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Match</span>
                <Select value={f.matchAll ? 'all' : 'any'} onValueChange={v => setF(p => ({ ...p, matchAll: v === 'all' }))}>
                  <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">ALL (AND)</SelectItem>
                    <SelectItem value="any" className="text-xs">ANY (OR)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">conditions</span>
              </div>
            </div>

            {f.conditions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No conditions yet — add one below.</p>
            )}

            <div className="space-y-2">
              {f.conditions.map((c, i) => (
                <ConditionRow key={c.id} cond={c} index={i}
                  onChange={nc => updateCond(c.id, nc)}
                  onRemove={() => removeCond(c.id)}
                />
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addCondition}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add condition
            </Button>
          </div>

          {/* Actions */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <p className="text-sm font-semibold">Actions</p>

            {f.actions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No actions yet — add one below.</p>
            )}

            <div className="space-y-2">
              {f.actions.map((a, i) => (
                <ActionRow key={a.id} action={a} index={i}
                  onChange={na => updateAct(a.id, na)}
                  onRemove={() => removeAct(a.id)}
                />
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addAction}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add action
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create rule'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Rule Card ─────────────────────────────────────────────────────────────────
function RuleCard({ rule, onEdit }: { rule: AssignmentRule; onEdit: (r: AssignmentRule) => void }) {
  const { toggleRule, deleteRule, duplicateRule, reorderRule, simulateRun } = useAssignmentRules()
  const cfg = STATUS_CFG[rule.status]

  return (
    <Card className={cn('group transition-colors', rule.status === 'inactive' && 'opacity-60')}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Priority badge + reorder */}
          <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => reorderRule(rule.id, 'up')}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rule.priority}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => reorderRule(rule.id, 'down')}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', cfg.className)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {rule.matchAll ? 'Match ALL' : 'Match ANY'}
                  </Badge>
                </div>
                <p className="font-semibold text-sm">{rule.name}</p>
                {rule.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rule.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={rule.status === 'active'}
                  onCheckedChange={() => toggleRule(rule.id)}
                  className="scale-75"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(rule)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateRule(rule.id)}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => simulateRun(rule.id)}><Play className="mr-2 h-4 w-4" /> Run now</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Conditions */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                IF {rule.matchAll ? 'ALL' : 'ANY'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rule.conditions.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-xs">
                    <span className="font-medium">{COND_FIELD_LABELS[c.field]}</span>
                    <span className="text-muted-foreground">{COND_OPERATOR_LABELS[c.operator]}</span>
                    <span className="font-medium capitalize">{c.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">THEN</p>
              <div className="flex flex-wrap gap-1.5">
                {rule.actions.map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    {formatAction(a)}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {rule.runCount} leads matched
              </span>
              {rule.lastRunAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last run {formatDistanceToNow(new Date(rule.lastRunAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main View ─────────────────────────────────────────────────────────────────
export function AssignmentRulesView() {
  const { rules, executions, simulateRun } = useAssignmentRules()
  const [formOpen, setFormOpen] = useState(false)
  const [editing,  setEditing]  = useState<AssignmentRule | null>(null)

  const sorted = [...rules].sort((a, b) => a.priority - b.priority)

  const stats = useMemo(() => ({
    active:     rules.filter(r => r.status === 'active').length,
    totalRuns:  rules.reduce((s, r) => s + r.runCount, 0),
    reps:       [...new Set(rules.flatMap(r => r.actions.filter(a => a.type === 'assign_to').map(a => a.value)))].length,
    draft:      rules.filter(r => r.status === 'draft').length,
  }), [rules])

  const openEdit = (r: AssignmentRule) => { setEditing(r); setFormOpen(true) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-primary" />
            Lead Assignment Rules
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatically route and enrich incoming leads based on conditions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const activeRules = rules.filter(r => r.status === 'active')
            if (activeRules.length === 0) { toast.error('No active rules to run'); return }
            activeRules.forEach(r => simulateRun(r.id))
          }}>
            <Play className="mr-2 h-4 w-4" /> Run all active
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> New Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active Rules',   value: stats.active,    accent: 'text-green-400',   icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: 'Total Matches',  value: stats.totalRuns, accent: 'text-primary',      icon: <Activity className="h-4 w-4" /> },
          { label: 'Reps Covered',   value: stats.reps,      accent: '',                  icon: <UserCheck className="h-4 w-4" /> },
          { label: 'Draft Rules',    value: stats.draft,     accent: 'text-amber-400',    icon: <AlertTriangle className="h-4 w-4" /> },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <span className="text-muted-foreground">{s.icon}</span>
            </div>
            <p className={cn('text-3xl font-bold', s.accent)}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules" className="gap-2">
            <ListFilter className="h-4 w-4" /> Rules <Badge variant="secondary" className="ml-1 text-xs">{rules.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <History className="h-4 w-4" /> Execution Log <Badge variant="secondary" className="ml-1 text-xs">{executions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Rules tab */}
        <TabsContent value="rules" className="mt-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No rules yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first assignment rule to auto-route leads.</p>
              <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> New Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(rule => (
                <RuleCard key={rule.id} rule={rule} onEdit={openEdit} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Execution log tab */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Actions applied</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No executions yet.</TableCell></TableRow>
                ) : executions.map(ex => (
                  <TableRow key={ex.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{ex.ruleName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{ex.leadName}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ex.actionsApplied.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 rounded bg-primary/10 text-primary px-1.5 py-0.5 text-xs">
                            <Zap className="h-2.5 w-2.5" />{a}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(ex.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      <RuleFormDialog
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setEditing(null) }}
        editing={editing}
      />
    </div>
  )
}