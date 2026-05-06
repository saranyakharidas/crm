'use client'

import { useState } from 'react'
import { useActivities, type Activity, type ActivityType } from '@/lib/activity-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone, Mail, Users, StickyNote, CheckSquare,
  TrendingUp, UserPlus, FileText, MessageCircle,
  Plus, MoreHorizontal, Trash2, Clock, ArrowRight,
  ChevronDown, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'

// ─── Config ────────────────────────────────────────────────────────────────────
export const ACTIVITY_CONFIG: Record<ActivityType, {
  label:     string
  icon:      React.ReactNode
  color:     string        // icon container bg + text
  dotColor:  string        // timeline dot
  logLabel?: string        // label in "Log activity" dropdown (omit system types)
}> = {
  call:            { label: 'Call',          icon: <Phone className="h-3.5 w-3.5" />,         color: 'bg-blue-500/10 text-blue-400',    dotColor: 'bg-blue-400',    logLabel: 'Log call' },
  email:           { label: 'Email',         icon: <Mail className="h-3.5 w-3.5" />,           color: 'bg-indigo-500/10 text-indigo-400', dotColor: 'bg-indigo-400',  logLabel: 'Log email' },
  meeting:         { label: 'Meeting',       icon: <Users className="h-3.5 w-3.5" />,          color: 'bg-violet-500/10 text-violet-400', dotColor: 'bg-violet-400',  logLabel: 'Log meeting' },
  note:            { label: 'Note',          icon: <StickyNote className="h-3.5 w-3.5" />,     color: 'bg-amber-500/10 text-amber-400',   dotColor: 'bg-amber-400',   logLabel: 'Add note' },
  task:            { label: 'Task',          icon: <CheckSquare className="h-3.5 w-3.5" />,    color: 'bg-emerald-500/10 text-emerald-400',dotColor: 'bg-emerald-400', logLabel: 'Log task' },
  deal_stage:      { label: 'Stage change',  icon: <TrendingUp className="h-3.5 w-3.5" />,     color: 'bg-green-500/10 text-green-400',   dotColor: 'bg-green-400' },
  deal_created:    { label: 'Deal created',  icon: <TrendingUp className="h-3.5 w-3.5" />,     color: 'bg-primary/10 text-primary',       dotColor: 'bg-primary' },
  contact_created: { label: 'Created',       icon: <UserPlus className="h-3.5 w-3.5" />,       color: 'bg-cyan-500/10 text-cyan-400',     dotColor: 'bg-cyan-400' },
  document:        { label: 'Document',      icon: <FileText className="h-3.5 w-3.5" />,       color: 'bg-orange-500/10 text-orange-400', dotColor: 'bg-orange-400',  logLabel: 'Log document' },
  whatsapp:        { label: 'WhatsApp',      icon: <MessageCircle className="h-3.5 w-3.5" />,  color: 'bg-green-500/10 text-green-400',   dotColor: 'bg-green-500',   logLabel: 'Log WhatsApp' },
}

const LOGGABLE_TYPES = (Object.keys(ACTIVITY_CONFIG) as ActivityType[]).filter(
  t => ACTIVITY_CONFIG[t].logLabel
)

// ─── Date group label ──────────────────────────────────────────────────────────
function groupLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d))  return format(d, 'EEEE')
  return format(d, 'MMMM d, yyyy')
}

// ─── Log Activity Dialog ───────────────────────────────────────────────────────
function LogActivityDialog({
  open, onOpenChange, contactId, contactName, dealId, dealTitle,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  contactId?:   string
  contactName?: string
  dealId?:      string
  dealTitle?:   string
}) {
  const { addActivity } = useActivities()
  const [type,        setType]        = useState<ActivityType>('call')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [outcome,     setOutcome]     = useState('')
  const [duration,    setDuration]    = useState('')

  const handleOpen = (o: boolean) => {
    if (o) { setType('call'); setTitle(''); setDescription(''); setOutcome(''); setDuration('') }
    onOpenChange(o)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }

    addActivity({
      type,
      title:       title.trim(),
      description: description.trim(),
      outcome:     outcome.trim() || undefined,
      duration:    duration ? parseInt(duration) : undefined,
      contactId,
      contactName,
      dealId,
      dealTitle,
      createdBy:   'Sarah Johnson',
      completed:   true,
    })
    toast.success(`${ACTIVITY_CONFIG[type].label} logged`)
    onOpenChange(false)
  }

  const cfg = ACTIVITY_CONFIG[type]

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>Record an interaction with this contact or deal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Activity type</Label>
            <Select value={type} onValueChange={v => setType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGGABLE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-2">
                      <span className={cn('flex h-5 w-5 items-center justify-center rounded', ACTIVITY_CONFIG[t].color)}>
                        {ACTIVITY_CONFIG[t].icon}
                      </span>
                      {ACTIVITY_CONFIG[t].logLabel}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Title *</Label>
            <Input
              placeholder={type === 'call' ? 'e.g. Discovery call with James' : type === 'note' ? 'e.g. Follow-up reminder' : 'Activity title'}
              value={title} onChange={e => setTitle(e.target.value)} required
            />
          </div>

          <div className="grid gap-2">
            <Label>Notes / Description</Label>
            <Textarea placeholder="What happened? Key takeaways..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          {(type === 'call' || type === 'meeting') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    {['Positive', 'Neutral', 'No answer', 'Follow-up needed', 'Qualified', 'Not interested'].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Duration (min)</Label>
                <Input type="number" min={1} placeholder="30" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Log activity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Single Activity Item ──────────────────────────────────────────────────────
function ActivityItem({ activity, showEntity = false }: { activity: Activity; showEntity?: boolean }) {
  const { deleteActivity } = useActivities()
  const cfg = ACTIVITY_CONFIG[activity.type]

  return (
    <div className="flex gap-3 group">
      {/* Icon */}
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5', cfg.color)}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium leading-tight">{activity.title}</p>
              {activity.outcome && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{activity.outcome}</Badge>
              )}
              {activity.duration && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{activity.duration}m
                </span>
              )}
            </div>

            {/* Entity links */}
            {showEntity && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {activity.contactName && (
                  <span className="text-xs text-primary">{activity.contactName}</span>
                )}
                {activity.contactName && activity.dealTitle && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
                {activity.dealTitle && (
                  <span className="text-xs text-muted-foreground">{activity.dealTitle}</span>
                )}
              </div>
            )}

            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
            )}

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
              <span className="text-[11px] text-muted-foreground/50">·</span>
              <span className="text-[11px] text-muted-foreground/70">{activity.createdBy}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => { deleteActivity(activity.id); toast.success('Activity deleted') }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// ─── Main Timeline Component ───────────────────────────────────────────────────
interface ActivityTimelineProps {
  // Pass one or both to scope the timeline
  contactId?:   string
  contactName?: string
  dealId?:      string
  dealTitle?:   string
  // Visual mode
  maxHeight?:   string   // e.g. "400px" — if set, scrollable
  showEntityLinks?: boolean
}

export function ActivityTimeline({
  contactId, contactName, dealId, dealTitle,
  maxHeight, showEntityLinks = false,
}: ActivityTimelineProps) {
  const { getActivitiesForContact, getActivitiesForDeal, activities } = useActivities()
  const [logOpen,      setLogOpen]      = useState(false)
  const [typeFilter,   setTypeFilter]   = useState<string>('all')
  const [showAll,      setShowAll]      = useState(false)
  const INITIAL_COUNT = 8

  // Resolve activities
  let items: Activity[]
  if (contactId || contactName) {
    items = getActivitiesForContact(contactId ?? '', contactName)
  } else if (dealId || dealTitle) {
    items = getActivitiesForDeal(dealId ?? '', dealTitle)
  } else {
    items = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Filter by type
  const filtered = typeFilter === 'all' ? items : items.filter(a => a.type === typeFilter)
  const visible  = showAll ? filtered : filtered.slice(0, INITIAL_COUNT)

  // Group by date label
  const groups: { label: string; items: Activity[] }[] = []
  visible.forEach(act => {
    const label = groupLabel(act.createdAt)
    const last  = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(act)
    } else {
      groups.push({ label, items: [act] })
    }
  })

  // Count per type for filter badges
  const typeCounts = items.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">Activity</span>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 text-xs w-32 gap-1">
              <Filter className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(typeCounts) as ActivityType[]).map(t => (
                <SelectItem key={t} value={t}>
                  <div className="flex items-center gap-2">
                    {ACTIVITY_CONFIG[t].icon}
                    {ACTIVITY_CONFIG[t].label}
                    <span className="text-muted-foreground">({typeCounts[t]})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLogOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Log activity
        </Button>
      </div>

      {/* Timeline */}
      <div
        className={cn('relative', maxHeight && 'overflow-y-auto pr-1')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No activities yet.</p>
            <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setLogOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Log the first one
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border/60" />

            <div className="space-y-0">
              {groups.map(group => (
                <div key={group.label}>
                  {/* Date group label */}
                  <div className="relative flex items-center gap-3 mb-2 mt-1">
                    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background border border-border/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="ml-9 space-y-0">
                    {group.items.map(act => (
                      <ActivityItem key={act.id} activity={act} showEntity={showEntityLinks} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show more */}
        {!showAll && filtered.length > INITIAL_COUNT && (
          <Button
            variant="ghost" size="sm"
            className="w-full text-xs text-muted-foreground mt-2"
            onClick={() => setShowAll(true)}
          >
            <ChevronDown className="mr-1 h-3.5 w-3.5" />
            Show {filtered.length - INITIAL_COUNT} more
          </Button>
        )}
      </div>

      {/* Log dialog */}
      <LogActivityDialog
        open={logOpen} onOpenChange={setLogOpen}
        contactId={contactId} contactName={contactName}
        dealId={dealId} dealTitle={dealTitle}
      />
    </div>
  )
}