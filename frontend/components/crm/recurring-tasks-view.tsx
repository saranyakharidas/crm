'use client'

import { useState, useMemo } from 'react'
import {
  useRecurringTasks,
  type RecurringTask, type RecurrenceFrequency, type RecurrenceStatus, type TaskPriority,
  FREQUENCY_LABELS, calcNextRun,
} from '@/lib/recurring-tasks-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RefreshCw, Plus, MoreHorizontal, Edit, Trash2, Play, Pause,
  Clock, Calendar, CheckCircle2, AlertTriangle, SkipForward,
  Search, Repeat, ListTodo, History, Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  format, formatDistanceToNow, differenceInDays,
  isToday, isTomorrow, isPast, addDays,
} from 'date-fns'

// ─── Config ────────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  low:    { label: 'Low',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   dot: 'bg-slate-400'  },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      dot: 'bg-blue-400'   },
  high:   { label: 'High',   color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-400 border-red-500/20',         dot: 'bg-red-400'    },
}

const STATUS_CFG: Record<RecurrenceStatus, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400'  },
  paused:    { label: 'Paused',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400'  },
  completed: { label: 'Completed', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',dot:'bg-indigo-400'},
  draft:     { label: 'Draft',     color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400'  },
}

const FREQ_COLORS: Record<RecurrenceFrequency, string> = {
  daily:     'bg-red-500/10 text-red-400',
  weekly:    'bg-blue-500/10 text-blue-400',
  biweekly:  'bg-indigo-500/10 text-indigo-400',
  monthly:   'bg-violet-500/10 text-violet-400',
  quarterly: 'bg-amber-500/10 text-amber-400',
  yearly:    'bg-emerald-500/10 text-emerald-400',
}

const REPS = ['Sarah Johnson', 'Michael Chen', 'Alex Rivera', 'Jordan Kim', 'Priya Singh']

function nextRunLabel(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr)
  if (isPast(date))     return { label: 'Overdue',   urgent: true  }
  if (isToday(date))    return { label: 'Today',     urgent: true  }
  if (isTomorrow(date)) return { label: 'Tomorrow',  urgent: false }
  const days = differenceInDays(date, new Date())
  return { label: `In ${days}d`, urgent: days <= 3 }
}

// ─── Recurring Task Form ───────────────────────────────────────────────────────
function RecurringTaskFormDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: RecurringTask | null }) {
  const { addRecurringTask, updateRecurringTask } = useRecurringTasks()

  const blank = {
    title: '', description: '', priority: 'medium' as TaskPriority,
    assignedTo: 'Sarah Johnson', frequency: 'weekly' as RecurrenceFrequency,
    interval: '1', startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '', maxOccurrences: '', estimatedMinutes: '', tags: '',
    status: 'active' as RecurrenceStatus,
  }
  const [f, setF] = useState({ ...blank })
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  const handleOpen = (o: boolean) => {
    if (o && editing) {
      setF({
        title: editing.title, description: editing.description,
        priority: editing.priority, assignedTo: editing.assignedTo,
        frequency: editing.frequency, interval: String(editing.interval),
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate?.slice(0, 10) ?? '',
        maxOccurrences: editing.maxOccurrences ? String(editing.maxOccurrences) : '',
        estimatedMinutes: editing.estimatedMinutes ? String(editing.estimatedMinutes) : '',
        tags: editing.tags.join(', '),
        status: editing.status,
      })
    } else if (o) setF({ ...blank })
    onOpenChange(o)
  }

  // Preview next 3 run dates
  const previewDates = useMemo(() => {
    try {
      const start = new Date(f.startDate)
      const freq  = f.frequency
      const n     = parseInt(f.interval) || 1
      const dates = []
      let cur = calcNextRun(freq, n, start)
      for (let i = 0; i < 3; i++) {
        dates.push(cur)
        cur = calcNextRun(freq, n, cur)
      }
      return dates
    } catch { return [] }
  }, [f.frequency, f.interval, f.startDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.title.trim()) { toast.error('Title is required'); return }

    const payload = {
      title: f.title.trim(), description: f.description.trim(),
      priority: f.priority, assignedTo: f.assignedTo,
      frequency: f.frequency, interval: parseInt(f.interval) || 1,
      status: f.status,
      startDate: new Date(f.startDate).toISOString(),
      endDate: f.endDate ? new Date(f.endDate).toISOString() : undefined,
      maxOccurrences: f.maxOccurrences ? parseInt(f.maxOccurrences) : undefined,
      estimatedMinutes: f.estimatedMinutes ? parseInt(f.estimatedMinutes) : undefined,
      tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
    }

    if (editing) {
      updateRecurringTask(editing.id, payload)
      toast.success('Recurring task updated')
    } else {
      addRecurringTask(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Recurring Task' : 'New Recurring Task'}</DialogTitle>
          <DialogDescription>Set up a task that auto-generates on a schedule.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. Weekly pipeline review" value={f.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={f.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CFG) as TaskPriority[]).map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_CFG[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assigned to</Label>
              <Select value={f.assignedTo} onValueChange={v => set('assignedTo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence */}
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select value={f.frequency} onValueChange={v => set('frequency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map(freq => (
                    <SelectItem key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Repeat every</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={1} max={52} className="w-20" value={f.interval} onChange={e => set('interval', e.target.value)} />
                <span className="text-sm text-muted-foreground">
                  {f.frequency === 'daily' ? 'days' : f.frequency === 'yearly' ? 'years' : f.frequency.includes('month') || f.frequency === 'quarterly' ? 'months' : 'weeks'}
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Start date</Label>
              <Input type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>End date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={f.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Max occurrences <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="number" min={1} placeholder="Unlimited" value={f.maxOccurrences} onChange={e => set('maxOccurrences', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Est. duration (min)</Label>
              <Input type="number" min={1} placeholder="30" value={f.estimatedMinutes} onChange={e => set('estimatedMinutes', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input placeholder="Pipeline, Review" value={f.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What should happen each time this task runs?" value={f.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next scheduled runs</p>
              <div className="flex gap-3 flex-wrap">
                {previewDates.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 text-xs font-medium">
                    <Calendar className="h-3 w-3 text-primary" />
                    {format(d, 'EEE, MMM d')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create recurring task'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Recurring Task Card ───────────────────────────────────────────────────────
function RecurringTaskCard({ task, onEdit }: { task: RecurringTask; onEdit: (t: RecurringTask) => void }) {
  const { togglePause, deleteRecurringTask, runNow } = useRecurringTasks()
  const priCfg  = PRIORITY_CFG[task.priority]
  const stsCfg  = STATUS_CFG[task.status]
  const { label: nextLabel, urgent } = nextRunLabel(task.nextRunAt)

  return (
    <Card className={cn('group transition-colors', task.status === 'paused' && 'opacity-60')}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', stsCfg.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', stsCfg.dot)} />
                    {stsCfg.label}
                  </span>
                  <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', FREQ_COLORS[task.frequency])}>
                    <Repeat className="h-3 w-3" />
                    {FREQUENCY_LABELS[task.frequency]}
                  </span>
                  <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', priCfg.color)}>
                    {priCfg.label}
                  </span>
                </div>
                <p className="font-semibold text-sm leading-tight">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={task.status === 'active'} onCheckedChange={() => togglePause(task.id)} className="scale-75" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    {task.status === 'active' && (
                      <DropdownMenuItem onClick={() => runNow(task.id)}><Play className="mr-2 h-4 w-4" /> Run now</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteRecurringTask(task.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next: <span className={cn('font-medium ml-0.5', urgent ? 'text-amber-400' : 'text-foreground')}>{nextLabel}</span>
              </span>
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {task.estimatedMinutes}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {task.occurrenceCount} runs
              </span>
              <span>{task.assignedTo}</span>
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.map(t => <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">{t}</Badge>)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Upcoming Task Row ─────────────────────────────────────────────────────────
function UpcomingRow({ spawn, parentTask }: { spawn: any; parentTask?: RecurringTask }) {
  const { completeSpawn, skipSpawn } = useRecurringTasks()
  const dueDate = new Date(spawn.dueDate)
  const overdue = isPast(dueDate) && spawn.status === 'todo'
  const today   = isToday(dueDate)

  return (
    <TableRow className={cn(overdue && 'bg-red-500/5')}>
      <TableCell>
        <p className="text-sm font-medium">{spawn.title}</p>
        {parentTask && <p className="text-xs text-muted-foreground">{FREQUENCY_LABELS[parentTask.frequency]}</p>}
      </TableCell>
      <TableCell>
        {parentTask && (
          <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', PRIORITY_CFG[parentTask.priority].color)}>
            {PRIORITY_CFG[parentTask.priority].label}
          </span>
        )}
      </TableCell>
      <TableCell>
        <span className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
          overdue ? 'bg-red-500/10 text-red-400' :
          today   ? 'bg-amber-500/10 text-amber-400' :
                    'bg-muted text-muted-foreground'
        )}>
          {overdue && <AlertTriangle className="h-3 w-3" />}
          {format(dueDate, 'MMM d, yyyy')}
        </span>
      </TableCell>
      <TableCell>
        <span className={cn(
          'inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize',
          spawn.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          spawn.status === 'skipped'   ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                         'bg-blue-500/10 text-blue-400 border-blue-500/20'
        )}>
          {spawn.status}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {spawn.status === 'todo' && (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => completeSpawn(spawn.id)}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-400" /> Done
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => skipSpawn(spawn.id)}>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {spawn.status === 'completed' && spawn.completedAt && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(spawn.completedAt), { addSuffix: true })}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

// ─── Main View ─────────────────────────────────────────────────────────────────
export function RecurringTasksView() {
  const { recurringTasks, spawnedTasks } = useRecurringTasks()
  const [formOpen, setFormOpen] = useState(false)
  const [editing,  setEditing]  = useState<RecurringTask | null>(null)
  const [search,   setSearch]   = useState('')
  const [freqFilter, setFreqFilter] = useState('all')

  const filtered = useMemo(() =>
    recurringTasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(search.toLowerCase())
      const matchFreq = freqFilter === 'all' || t.frequency === freqFilter
      return matchSearch && matchFreq
    }).sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime())
  , [recurringTasks, search, freqFilter])

  const stats = useMemo(() => ({
    active:   recurringTasks.filter(t => t.status === 'active').length,
    paused:   recurringTasks.filter(t => t.status === 'paused').length,
    dueToday: spawnedTasks.filter(s => s.status === 'todo' && isToday(new Date(s.dueDate))).length,
    totalRuns:recurringTasks.reduce((s, t) => s + t.occurrenceCount, 0),
  }), [recurringTasks, spawnedTasks])

  // Upcoming + history spawns
  const pendingSpawns = spawnedTasks.filter(s => s.status === 'todo')
  const historySpawns = spawnedTasks.filter(s => s.status !== 'todo')
  const getParent = (id: string) => recurringTasks.find(t => t.id === id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="h-7 w-7 text-primary" />
            Recurring Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Tasks that automatically generate on a schedule.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> New Recurring Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active Schedules', value: stats.active,    accent: 'text-green-400'   },
          { label: 'Paused',           value: stats.paused,    accent: 'text-amber-400'   },
          { label: 'Due Today',        value: stats.dueToday,  accent: stats.dueToday > 0 ? 'text-red-400' : '' },
          { label: 'Total Task Runs',  value: stats.totalRuns, accent: 'text-primary'     },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('text-3xl font-bold mt-1', s.accent)}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules" className="gap-2">
            <Repeat className="h-4 w-4" /> Schedules
            <Badge variant="secondary" className="ml-1 text-xs">{recurringTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <ListTodo className="h-4 w-4" /> Pending
            <Badge variant={pendingSpawns.length > 0 ? 'destructive' : 'secondary'} className="ml-1 text-xs">
              {pendingSpawns.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> History
            <Badge variant="secondary" className="ml-1 text-xs">{historySpawns.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Schedules */}
        <TabsContent value="schedules" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
            </div>
            <Select value={freqFilter} onValueChange={setFreqFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All frequencies" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All frequencies</SelectItem>
                {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map(f => (
                  <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold mb-1">No recurring tasks yet</p>
              <p className="text-muted-foreground text-sm mb-4">Create your first recurring task to auto-schedule work.</p>
              <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> New Recurring Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(t => (
                <RecurringTaskCard key={t.id} task={t} onEdit={t => { setEditing(t); setFormOpen(true) }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending spawned tasks */}
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSpawns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No pending tasks — you're all caught up!
                  </TableCell></TableRow>
                ) : pendingSpawns.map(s => (
                  <UpcomingRow key={s.id} spawn={s} parentTask={getParent(s.recurringTaskId)} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historySpawns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No history yet.</TableCell></TableRow>
                ) : historySpawns.map(s => (
                  <UpcomingRow key={s.id} spawn={s} parentTask={getParent(s.recurringTaskId)} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <RecurringTaskFormDialog
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setEditing(null) }}
        editing={editing}
      />
    </div>
  )
}