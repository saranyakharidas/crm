'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import {
  addDays, addWeeks, addMonths, addYears,
  format, isBefore, isAfter,
} from 'date-fns'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurrenceStatus    = 'active' | 'paused' | 'completed' | 'draft'
export type TaskPriority        = 'low' | 'medium' | 'high' | 'urgent'

export interface RecurringTask {
  id:          string
  title:       string
  description: string
  priority:    TaskPriority
  assignedTo:  string
  // Recurrence config
  frequency:   RecurrenceFrequency
  interval:    number          // every N frequencies (e.g. every 2 weeks)
  daysOfWeek?: number[]        // 0=Sun … 6=Sat (for weekly)
  dayOfMonth?: number          // 1-31 (for monthly/quarterly)
  // Lifecycle
  status:      RecurrenceStatus
  startDate:   string
  endDate?:    string          // optional end, otherwise indefinite
  maxOccurrences?: number
  occurrenceCount: number      // how many tasks spawned so far
  nextRunAt:   string          // ISO date of next spawn
  lastRunAt?:  string
  // Task template extras
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ts  = () => new Date().toISOString()
const d   = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()
const fd  = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

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

// ─── Seed ──────────────────────────────────────────────────────────────────────
function seedTask(overrides: Partial<RecurringTask> & Pick<RecurringTask, 'id' | 'title' | 'frequency'>): RecurringTask {
  const freq = overrides.frequency
  const startDate = overrides.startDate ?? d(90)
  const nextRun = calcNextRun(freq, overrides.interval ?? 1, new Date()).toISOString()
  return {
    description: '',
    priority: 'medium',
    assignedTo: 'Sarah Johnson',
    interval: 1,
    status: 'active',
    startDate,
    occurrenceCount: 0,
    nextRunAt: nextRun,
    tags: [],
    createdAt: d(90),
    updatedAt: d(1),
    ...overrides,
  }
}

export const SEED_RECURRING_TASKS: RecurringTask[] = [
  seedTask({
    id: 'rt-1', title: 'Weekly pipeline review',
    description: 'Review all open deals, update probabilities, identify blockers, and set priorities for the week.',
    frequency: 'weekly', interval: 1, priority: 'high',
    assignedTo: 'Sarah Johnson',
    daysOfWeek: [1], // Monday
    occurrenceCount: 24,
    lastRunAt: d(7),
    nextRunAt: fd(0),
    estimatedMinutes: 60,
    tags: ['Pipeline', 'Review'],
    startDate: d(180),
  }),
  seedTask({
    id: 'rt-2', title: 'Follow up with new leads',
    description: 'Reach out to all leads created in the past 48 hours that haven\'t been contacted yet.',
    frequency: 'daily', interval: 1, priority: 'urgent',
    assignedTo: 'Michael Chen',
    occurrenceCount: 60,
    lastRunAt: d(1),
    nextRunAt: fd(1),
    estimatedMinutes: 30,
    tags: ['Leads', 'Outreach'],
    startDate: d(60),
  }),
  seedTask({
    id: 'rt-3', title: 'Monthly performance report',
    description: 'Generate and share the monthly sales performance report with the leadership team.',
    frequency: 'monthly', interval: 1, priority: 'high',
    assignedTo: 'Sarah Johnson',
    dayOfMonth: 1,
    occurrenceCount: 6,
    lastRunAt: d(28),
    nextRunAt: fd(3),
    estimatedMinutes: 90,
    tags: ['Reporting', 'Management'],
    startDate: d(180),
  }),
  seedTask({
    id: 'rt-4', title: 'Customer check-in calls',
    description: 'Schedule and conduct check-in calls with key accounts. Review satisfaction and identify expansion opportunities.',
    frequency: 'biweekly', interval: 1, priority: 'medium',
    assignedTo: 'Sarah Johnson',
    occurrenceCount: 12,
    lastRunAt: d(14),
    nextRunAt: fd(7),
    estimatedMinutes: 120,
    tags: ['Customer Success', 'Retention'],
    startDate: d(180),
  }),
  seedTask({
    id: 'rt-5', title: 'CRM data hygiene audit',
    description: 'Audit duplicate contacts, missing fields, stale leads, and incorrect stage assignments.',
    frequency: 'monthly', interval: 1, priority: 'medium',
    assignedTo: 'Michael Chen',
    dayOfMonth: 15,
    occurrenceCount: 3,
    lastRunAt: d(15),
    nextRunAt: fd(15),
    estimatedMinutes: 45,
    tags: ['Data', 'Admin'],
    startDate: d(90),
  }),
  seedTask({
    id: 'rt-6', title: 'Quarterly business review prep',
    description: 'Prepare QBR deck: revenue vs target, pipeline health, forecast, key wins, blockers, and Q+1 goals.',
    frequency: 'quarterly', interval: 1, priority: 'high',
    assignedTo: 'Sarah Johnson',
    occurrenceCount: 2,
    lastRunAt: d(85),
    nextRunAt: fd(5),
    estimatedMinutes: 240,
    tags: ['QBR', 'Management', 'Reporting'],
    startDate: d(270),
  }),
  seedTask({
    id: 'rt-7', title: 'Team 1:1 meetings',
    description: 'Weekly 1:1 meetings with each team member to discuss pipeline, blockers, coaching, and wellbeing.',
    frequency: 'weekly', interval: 1, priority: 'medium',
    assignedTo: 'Sarah Johnson',
    daysOfWeek: [3], // Wednesday
    occurrenceCount: 24,
    lastRunAt: d(7),
    nextRunAt: fd(2),
    estimatedMinutes: 60,
    tags: ['Team', 'Management'],
    startDate: d(180),
    status: 'active',
  }),
  seedTask({
    id: 'rt-8', title: 'Invoice collection follow-up',
    description: 'Follow up on all overdue invoices. Send reminders and escalate if > 30 days past due.',
    frequency: 'weekly', interval: 1, priority: 'high',
    assignedTo: 'Michael Chen',
    daysOfWeek: [5], // Friday
    occurrenceCount: 8,
    lastRunAt: d(7),
    nextRunAt: fd(2),
    estimatedMinutes: 30,
    tags: ['Finance', 'Collections'],
    startDate: d(60),
    status: 'paused',
  }),
]

// Seed spawn log
export const SEED_SPAWNED_TASKS: SpawnedTask[] = [
  { id: 'sp-1', recurringTaskId: 'rt-1', title: 'Weekly pipeline review',    dueDate: d(7),  status: 'completed', completedAt: d(6)  },
  { id: 'sp-2', recurringTaskId: 'rt-2', title: 'Follow up with new leads',  dueDate: d(1),  status: 'completed', completedAt: d(1)  },
  { id: 'sp-3', recurringTaskId: 'rt-2', title: 'Follow up with new leads',  dueDate: d(2),  status: 'completed', completedAt: d(2)  },
  { id: 'sp-4', recurringTaskId: 'rt-7', title: 'Team 1:1 meetings',         dueDate: d(7),  status: 'completed', completedAt: d(7)  },
  { id: 'sp-5', recurringTaskId: 'rt-4', title: 'Customer check-in calls',   dueDate: d(14), status: 'completed', completedAt: d(13) },
  { id: 'sp-6', recurringTaskId: 'rt-5', title: 'CRM data hygiene audit',    dueDate: d(15), status: 'completed', completedAt: d(14) },
  { id: 'sp-7', recurringTaskId: 'rt-3', title: 'Monthly performance report',dueDate: d(28), status: 'completed', completedAt: d(27) },
  { id: 'sp-8', recurringTaskId: 'rt-1', title: 'Weekly pipeline review',    dueDate: fd(0), status: 'todo'      },
  { id: 'sp-9', recurringTaskId: 'rt-6', title: 'Quarterly business review prep', dueDate: fd(5), status: 'todo' },
]

// ─── Context ───────────────────────────────────────────────────────────────────
interface RecurringTasksContextValue {
  recurringTasks: RecurringTask[]
  spawnedTasks:   SpawnedTask[]
  addRecurringTask:    (t: Omit<RecurringTask, 'id' | 'createdAt' | 'updatedAt' | 'occurrenceCount' | 'nextRunAt'>) => void
  updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => void
  deleteRecurringTask: (id: string) => void
  togglePause:         (id: string) => void
  runNow:              (id: string) => void
  completeSpawn:       (spawnId: string) => void
  skipSpawn:           (spawnId: string) => void
}

const RecurringTasksContext = createContext<RecurringTasksContextValue | null>(null)

export function RecurringTasksProvider({ children }: { children: ReactNode }) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>(SEED_RECURRING_TASKS)
  const [spawnedTasks,   setSpawnedTasks]   = useState<SpawnedTask[]>(SEED_SPAWNED_TASKS)

  const addRecurringTask = useCallback((t: Omit<RecurringTask, 'id' | 'createdAt' | 'updatedAt' | 'occurrenceCount' | 'nextRunAt'>) => {
    const now = ts()
    const nextRun = calcNextRun(t.frequency, t.interval, new Date(t.startDate)).toISOString()
    setRecurringTasks(prev => [{
      ...t, id: `rt-${Date.now()}`,
      occurrenceCount: 0, nextRunAt: nextRun,
      createdAt: now, updatedAt: now,
    }, ...prev])
    toast.success(`Recurring task "${t.title}" created`)
  }, [])

  const updateRecurringTask = useCallback((id: string, updates: Partial<RecurringTask>) => {
    setRecurringTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: ts() } : t))
  }, [])

  const deleteRecurringTask = useCallback((id: string) => {
    setRecurringTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Recurring task deleted')
  }, [])

  const togglePause = useCallback((id: string) => {
    setRecurringTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'active' ? 'paused' : 'active'
      toast.success(next === 'active' ? 'Task resumed' : 'Task paused')
      return { ...t, status: next, updatedAt: ts() }
    }))
  }, [])

  const runNow = useCallback((id: string) => {
    setRecurringTasks(prev => prev.map(t => {
      if (t.id !== id || t.status !== 'active') return t
      const now = new Date()
      const nextRun = calcNextRun(t.frequency, t.interval, now)
      const spawn: SpawnedTask = {
        id:              `sp-${Date.now()}`,
        recurringTaskId: id,
        title:           t.title,
        dueDate:         nextRun.toISOString(),
        status:          'todo',
      }
      setSpawnedTasks(s => [spawn, ...s])
      toast.success(`Task "${t.title}" spawned — due ${format(nextRun, 'MMM d')}`)
      return {
        ...t,
        occurrenceCount: t.occurrenceCount + 1,
        lastRunAt:       now.toISOString(),
        nextRunAt:       calcNextRun(t.frequency, t.interval, nextRun).toISOString(),
        updatedAt:       now.toISOString(),
      }
    }))
  }, [])

  const completeSpawn = useCallback((spawnId: string) => {
    setSpawnedTasks(prev => prev.map(s =>
      s.id === spawnId ? { ...s, status: 'completed', completedAt: ts() } : s
    ))
    toast.success('Task marked complete')
  }, [])

  const skipSpawn = useCallback((spawnId: string) => {
    setSpawnedTasks(prev => prev.map(s => s.id === spawnId ? { ...s, status: 'skipped' } : s))
    toast.success('Task skipped')
  }, [])

  return (
    <RecurringTasksContext.Provider value={{
      recurringTasks, spawnedTasks,
      addRecurringTask, updateRecurringTask, deleteRecurringTask,
      togglePause, runNow, completeSpawn, skipSpawn,
    }}>
      {children}
    </RecurringTasksContext.Provider>
  )
}

export function useRecurringTasks() {
  const ctx = useContext(RecurringTasksContext)
  if (!ctx) throw new Error('useRecurringTasks must be inside RecurringTasksProvider')
  return ctx
}