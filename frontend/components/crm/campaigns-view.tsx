'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  useCampaigns,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
  type CampaignMetrics,
} from '@/lib/campaigns-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
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
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Megaphone, Mail, MessageSquare, Radio, CalendarDays, Video,
  Plus, Search, MoreHorizontal, Edit, Trash2, Copy, Play, Pause,
  Send, Eye, MousePointerClick, UserMinus, AlertCircle,
  TrendingUp, DollarSign, Users, CheckCircle2, Clock,
  Target, Filter, BarChart3, ArrowUpRight, Sparkles, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, formatDistanceToNow, isPast } from 'date-fns'

// ─── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<CampaignType, { label: string; icon: React.ReactNode; color: string }> = {
  email:   { label: 'Email',   icon: <Mail className="h-4 w-4" />,          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  sms:     { label: 'SMS',     icon: <MessageSquare className="h-4 w-4" />,  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  social:  { label: 'Social',  icon: <Radio className="h-4 w-4" />,          color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  ads:     { label: 'Ads',     icon: <Target className="h-4 w-4" />,         color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  event:   { label: 'Event',   icon: <CalendarDays className="h-4 w-4" />,   color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  webinar: { label: 'Webinar', icon: <Video className="h-4 w-4" />,          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string; dot: string }> = {
  draft:     { label: 'Draft',     className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      dot: 'bg-blue-400' },
  active:    { label: 'Active',    className: 'bg-green-500/10 text-green-400 border-green-500/20',    dot: 'bg-green-400' },
  paused:    { label: 'Paused',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    dot: 'bg-amber-400' },
  completed: { label: 'Completed', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20',          dot: 'bg-red-400' },
}

const SEGMENTS = [
  'All Contacts', 'New Leads', 'Qualified Leads', 'Active Customers',
  'Churned Accounts', 'Key Accounts', 'SMB Decision Makers', 'General Audience',
  'Qualified Leads + Customers',
]

const CHART_COLORS = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' },
  labelStyle: { color: '#f3f4f6' },
}

// ─── Metric helpers ────────────────────────────────────────────────────────────
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100) }
function fmtNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Campaign Form Dialog ──────────────────────────────────────────────────────
function CampaignFormDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Campaign | null }) {
  const { addCampaign, updateCampaign } = useCampaigns()

  const blank = {
    name: '', description: '', type: 'email' as CampaignType, status: 'draft' as CampaignStatus,
    tags: '', targetSegment: 'All Contacts', audienceSize: '', startDate: '',
    endDate: '', budget: '', ownedBy: '', emailSubject: '', emailPreheader: '', emailBody: '',
  }

  const [f, setF] = useState({ ...blank })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open && editing) {
      setF({
        name: editing.name, description: editing.description, type: editing.type,
        status: editing.status, tags: editing.tags.join(', '),
        targetSegment: editing.targetSegment, audienceSize: String(editing.audienceSize),
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate?.slice(0, 10) ?? '',
        budget: String(editing.budget), ownedBy: editing.ownedBy,
        emailSubject: editing.email?.subject ?? '',
        emailPreheader: editing.email?.preheader ?? '',
        emailBody: editing.email?.body ?? '',
      })
    } else if (open) setF({ ...blank })
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) { toast.error('Name is required'); return }
    if (!f.startDate) { toast.error('Start date is required'); return }

    const payload = {
      name: f.name.trim(), description: f.description.trim(),
      type: f.type, status: f.status,
      tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
      targetSegment: f.targetSegment,
      audienceSize: parseInt(f.audienceSize) || 0,
      startDate: new Date(f.startDate).toISOString(),
      endDate: f.endDate ? new Date(f.endDate).toISOString() : undefined,
      budget: parseFloat(f.budget) || 0,
      spent: editing?.spent ?? 0,
      ownedBy: f.ownedBy.trim() || 'Unassigned',
      ...(f.type === 'email' ? {
        email: { subject: f.emailSubject, preheader: f.emailPreheader, body: f.emailBody },
      } : {}),
    }

    if (editing) {
      updateCampaign(editing.id, payload)
      toast.success('Campaign updated')
    } else {
      addCampaign(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update this campaign.' : 'Create a new marketing campaign.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Campaign name *</Label>
              <Input placeholder="e.g. Q3 Product Launch" value={f.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={f.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONFIG) as CampaignType[]).map(t => (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">{TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as CampaignStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Target segment</Label>
              <Select value={f.targetSegment} onValueChange={v => set('targetSegment', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Audience size</Label>
              <Input type="number" min={0} placeholder="1000" value={f.audienceSize} onChange={e => set('audienceSize', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Start date *</Label>
              <Input type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>End date</Label>
              <Input type="date" value={f.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Budget ($)</Label>
              <Input type="number" min={0} placeholder="5000" value={f.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Owner</Label>
              <Input placeholder="Sarah Johnson" value={f.ownedBy} onChange={e => set('ownedBy', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input placeholder="Launch, Enterprise, Q2" value={f.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What is this campaign about?" value={f.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>

          {/* Email-specific fields */}
          {f.type === 'email' && (
            <div className="rounded-lg border border-border/60 p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Email content</p>
              <div className="grid gap-2">
                <Label>Subject line</Label>
                <Input placeholder="Your subject here..." value={f.emailSubject} onChange={e => set('emailSubject', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Preheader</Label>
                <Input placeholder="Short preview text..." value={f.emailPreheader} onChange={e => set('emailPreheader', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Body / template notes</Label>
                <Textarea placeholder="Hi {{first_name}}, ..." value={f.emailBody} onChange={e => set('emailBody', e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create campaign'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Campaign Detail Sheet ─────────────────────────────────────────────────────
function CampaignDetailSheet({
  campaign, open, onOpenChange, onEdit,
}: { campaign: Campaign | null; open: boolean; onOpenChange: (o: boolean) => void; onEdit: (c: Campaign) => void }) {
  const { launchCampaign, pauseCampaign, updateCampaign } = useCampaigns()
  if (!campaign) return null

  const m = campaign.metrics
  const openRate  = pct(m.opened,    m.delivered)
  const clickRate = pct(m.clicked,   m.opened)
  const convRate  = pct(m.converted, m.clicked)
  const roi = campaign.spent > 0 ? ((m.converted * 500 - campaign.spent) / campaign.spent * 100).toFixed(0) : '—'

  const funnelData = [
    { name: 'Sent',       value: m.sent,      fill: '#6366f1' },
    { name: 'Delivered',  value: m.delivered, fill: '#22d3ee' },
    { name: 'Opened',     value: m.opened,    fill: '#22c55e' },
    { name: 'Clicked',    value: m.clicked,   fill: '#f59e0b' },
    { name: 'Converted',  value: m.converted, fill: '#8b5cf6' },
  ]

  const typeCfg   = TYPE_CONFIG[campaign.type]
  const statusCfg = STATUS_CONFIG[campaign.status]
  const budgetPct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:w-[580px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{campaign.name}</SheetTitle>
          <SheetDescription>Campaign details</SheetDescription>
        </SheetHeader>

        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', typeCfg.color)}>
                  {typeCfg.icon} {typeCfg.label}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="text-xl font-bold leading-tight">{campaign.name}</h2>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onEdit(campaign) }}>
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {campaign.status === 'draft' && (
              <Button size="sm" onClick={() => { launchCampaign(campaign.id); onOpenChange(false) }}>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Launch
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => { pauseCampaign(campaign.id); onOpenChange(false) }}>
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm" onClick={() => { launchCampaign(campaign.id); onOpenChange(false) }}>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
              </Button>
            )}
            {['active','paused'].includes(campaign.status) && (
              <Button size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400"
                onClick={() => { updateCampaign(campaign.id, { status: 'completed' }); onOpenChange(false) }}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Complete
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Open rate',  value: `${openRate}%`,  sub: `${fmtNum(m.opened)} opens`,    color: 'text-emerald-400' },
              { label: 'Click rate', value: `${clickRate}%`, sub: `${fmtNum(m.clicked)} clicks`,  color: 'text-amber-400'   },
              { label: 'Conversions', value: m.converted,   sub: `${convRate}% of clicks`,        color: 'text-violet-400'  },
            ].map(k => (
              <Card key={k.label} className="border-border/60">
                <CardContent className="p-3 text-center">
                  <p className={cn('text-xl font-bold', k.color)}>{k.value}</p>
                  <p className="text-xs font-medium mt-0.5">{k.label}</p>
                  <p className="text-[11px] text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funnel chart */}
          {m.sent > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Funnel</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), 'Count']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Budget</p>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium">{fmtMoney(campaign.spent)} / {fmtMoney(campaign.budget)}</span>
            </div>
            <Progress value={budgetPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{budgetPct}% used</span>
              <span>{fmtMoney(Math.max(0, campaign.budget - campaign.spent))} remaining</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segment</span>
                <span className="font-medium">{campaign.targetSegment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audience size</span>
                <span className="font-medium">{campaign.audienceSize.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start date</span>
                <span className="font-medium">{format(new Date(campaign.startDate), 'MMM d, yyyy')}</span>
              </div>
              {campaign.endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End date</span>
                  <span className="font-medium">{format(new Date(campaign.endDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{campaign.ownedBy}</span>
              </div>
            </div>
          </div>

          {/* Email content */}
          {campaign.email && (
            <div className="rounded-lg border border-border/60 p-4 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium">{campaign.email.subject}</p>
              <p className="text-xs text-muted-foreground">{campaign.email.preheader}</p>
            </div>
          )}

          {/* Tags */}
          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {campaign.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
            </div>
          )}

          {/* Delivery stats */}
          {m.sent > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Delivery</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'Delivered',    value: m.delivered,    sub: `${pct(m.delivered, m.sent)}% delivery rate` },
                  { label: 'Bounced',      value: m.bounced,      sub: `${pct(m.bounced, m.sent)}% bounce rate` },
                  { label: 'Unsubscribed', value: m.unsubscribed, sub: `${pct(m.unsubscribed, m.delivered)}% unsub rate` },
                  { label: 'Est. ROI',     value: `${roi}%`,      sub: 'based on $500/conversion' },
                ].map(s => (
                  <div key={s.label} className="rounded-md border border-border/60 px-3 py-2">
                    <p className="font-semibold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground/70">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })} ·
            Updated {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Campaign Card (grid view) ─────────────────────────────────────────────────
function CampaignCard({ campaign, onView, onEdit, onDelete }: {
  campaign: Campaign; onView: () => void; onEdit: () => void; onDelete: () => void
}) {
  const { launchCampaign, pauseCampaign, duplicateCampaign } = useCampaigns()
  const typeCfg   = TYPE_CONFIG[campaign.type]
  const statusCfg = STATUS_CONFIG[campaign.status]
  const m = campaign.metrics
  const openRate  = pct(m.opened, m.delivered)
  const clickRate = pct(m.clicked, m.opened)
  const budgetPct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0

  return (
    <Card className="group hover:border-border/80 transition-colors cursor-pointer flex flex-col" onClick={onView}>
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium shrink-0', typeCfg.color)}>
              {typeCfg.icon} {typeCfg.label}
            </span>
            <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium shrink-0', statusCfg.className)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onView() }}><Eye className="mr-2 h-4 w-4" /> View details</DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit() }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); duplicateCampaign(campaign.id) }}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
              {campaign.status === 'draft' && <DropdownMenuItem onClick={e => { e.stopPropagation(); launchCampaign(campaign.id) }}><Play className="mr-2 h-4 w-4" /> Launch</DropdownMenuItem>}
              {campaign.status === 'active' && <DropdownMenuItem onClick={e => { e.stopPropagation(); pauseCampaign(campaign.id) }}><Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <p className="font-semibold text-sm line-clamp-1">{campaign.name}</p>
          {campaign.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{campaign.description}</p>
          )}
        </div>

        {/* Metrics mini row */}
        {m.sent > 0 ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Open', value: `${openRate}%` },
              { label: 'Click', value: `${clickRate}%` },
              { label: 'Conv.', value: m.converted },
            ].map(s => (
              <div key={s.label} className="rounded bg-muted/40 py-1.5">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded bg-muted/40 py-2 text-center text-xs text-muted-foreground">
            No data yet
          </div>
        )}

        {/* Budget bar */}
        {campaign.budget > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Budget</span>
              <span>{fmtMoney(campaign.spent)} / {fmtMoney(campaign.budget)}</span>
            </div>
            <Progress value={budgetPct} className="h-1.5" />
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground mt-auto pt-1">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {campaign.audienceSize.toLocaleString()}
          </span>
          <span>{format(new Date(campaign.startDate), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function CampaignsView() {
  const {
    campaigns,
    deleteCampaign,
    duplicateCampaign,
    launchCampaign,
    pauseCampaign,
    isLoading,
    error,
    refreshCampaigns,
  } = useCampaigns()
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode,     setViewMode]     = useState<'grid' | 'table'>('grid')
  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<Campaign | null>(null)
  const [detailCamp,   setDetailCamp]   = useState<Campaign | null>(null)
  const [detailOpen,   setDetailOpen]   = useState(false)

  const filtered = useMemo(() =>
    campaigns.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      const matchType   = typeFilter   === 'all' || c.type   === typeFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchType && matchStatus
    }), [campaigns, search, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const active    = campaigns.filter(c => c.status === 'active').length
    const totalSent = campaigns.reduce((s, c) => s + c.metrics.sent, 0)
    const totalConv = campaigns.reduce((s, c) => s + c.metrics.converted, 0)
    const totalSpent= campaigns.reduce((s, c) => s + c.spent, 0)
    return { active, totalSent, totalConv, totalSpent }
  }, [campaigns])

  // Overview bar chart data
  const overviewData = useMemo(() =>
    campaigns
      .filter(c => c.metrics.sent > 0)
      .slice(0, 6)
      .map(c => ({
        name: c.name.slice(0, 18) + (c.name.length > 18 ? '…' : ''),
        Opens: c.metrics.opened,
        Clicks: c.metrics.clicked,
        Conversions: c.metrics.converted,
      }))
  , [campaigns])

  const openDetail = (c: Campaign) => { setDetailCamp(c); setDetailOpen(true) }
  const openEdit   = (c: Campaign) => { setEditing(c); setFormOpen(true) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">Plan, launch, and track your marketing campaigns.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active Campaigns', value: stats.active,                   accent: 'text-green-400' },
          { label: 'Total Sent',       value: fmtNum(stats.totalSent),         accent: 'text-primary'   },
          { label: 'Conversions',      value: stats.totalConv.toLocaleString(),accent: 'text-violet-400'},
          { label: 'Total Spend',      value: fmtMoney(stats.totalSpent),      accent: 'text-amber-400' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('text-3xl font-bold mt-1', s.accent)}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading campaigns from the backend...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Could not load campaigns</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshCampaigns()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overview chart */}
      {overviewData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campaign Performance Overview</CardTitle>
            <CardDescription>Opens, clicks, and conversions across active campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overviewData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="Opens"       fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="Clicks"      fill="#22d3ee" radius={[4,4,0,0]} />
                <Bar dataKey="Conversions" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(TYPE_CONFIG) as CampaignType[]).map(t => (
                <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_CONFIG) as CampaignStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center rounded-md border bg-card">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-r-none">
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="rounded-l-none">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No campaigns found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or create a new campaign.</p>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="mr-2 h-4 w-4" /> New Campaign</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => (
              <CampaignCard
                key={c.id} campaign={c}
                onView={() => openDetail(c)}
                onEdit={() => openEdit(c)}
                onDelete={() => deleteCampaign(c.id)}
              />
            ))}
          </div>
        )
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Open %</TableHead>
                <TableHead className="text-right">Click %</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No campaigns found.</TableCell></TableRow>
              ) : filtered.map(c => {
                const m = c.metrics
                const typeCfg   = TYPE_CONFIG[c.type]
                const statusCfg = STATUS_CONFIG[c.status]
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(c)}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.targetSegment}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', typeCfg.color)}>
                        {typeCfg.icon} {typeCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{pct(m.opened, m.delivered)}%</TableCell>
                    <TableCell className="text-right text-sm">{pct(m.clicked, m.opened)}%</TableCell>
                    <TableCell className="text-right text-sm font-medium">{m.converted}</TableCell>
                    <TableCell className="text-right text-sm">{c.spent > 0 ? fmtMoney(c.spent) : '—'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(c)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateCampaign(c.id)}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                          {c.status === 'draft' && <DropdownMenuItem onClick={() => launchCampaign(c.id)}><Play className="mr-2 h-4 w-4" /> Launch</DropdownMenuItem>}
                          {c.status === 'active' && <DropdownMenuItem onClick={() => pauseCampaign(c.id)}><Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteCampaign(c.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail sheet */}
      <CampaignDetailSheet
        campaign={detailCamp} open={detailOpen} onOpenChange={setDetailOpen} onEdit={openEdit}
      />

      {/* Form dialog */}
      <CampaignFormDialog
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setEditing(null) }}
        editing={editing}
      />
    </div>
  )
}
